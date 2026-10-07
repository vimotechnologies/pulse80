import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { graphql } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { dashboardTypeDefs } from '../dist/modules/dashboard/dashboard.schema.js';
import { dashboardResolvers } from '../dist/modules/dashboard/dashboard.resolver.js';

test('flexible and legacy capture -> completion -> risk SQL -> scoped GraphQL', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create table screenings (id uuid primary key default gen_random_uuid(), organisation_id uuid not null,
        participant_reference text not null, service_id uuid, captured_at timestamptz default now(), status text);
      create table screening_results (screening_id uuid unique references screenings,
        systolic_mmhg numeric, diastolic_mmhg numeric, glucose_mmol_l numeric, cholesterol_mmol_l numeric,
        bmi numeric, height_cm numeric, weight_kg numeric);
      create table service_result_fields (id uuid primary key default gen_random_uuid(), service_id uuid, code text,
        unit text, data_type text, min_value numeric, max_value numeric);
      create table screening_result_values (screening_id uuid references screenings, service_result_field_id uuid references service_result_fields,
        value_number numeric, value_text text, value_boolean boolean, value_code text);
      insert into screenings(organisation_id, participant_reference, status) values
        ('00000000-0000-4000-8000-000000000001', 'HISTORIC-EMPTY', 'Completed');
    `);
    const migration = await readFile(new URL('../supabase/migrations/20261007011508_connect_flexible_risk_inputs_and_require_results.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    const orgA='00000000-0000-4000-8000-000000000001', orgB='00000000-0000-4000-8000-000000000002';
    const service='00000000-0000-4000-8000-000000000010', otherService='00000000-0000-4000-8000-000000000011';
    const capture = async (reference, org=orgA, date='2026-10-01') => (await db.query(
      "insert into screenings(organisation_id,participant_reference,service_id,captured_at,status) values($1,$2,$3,$4,'Under Review') returning id",
      [org,reference,service,date])).rows[0].id;
    const flexible = async (id, code, value, unit='mmHg', serviceId=service) => {
      const field=(await db.query("insert into service_result_fields(service_id,code,unit,data_type) values($1,$2,$3,'number') returning id",[serviceId,code,unit])).rows[0].id;
      await db.query('insert into screening_result_values(screening_id,service_result_field_id,value_number) values($1,$2,$3)',[id,field,value]);
    };
    const complete = id => db.query("update screenings set status='Completed' where id=$1",[id]);
    const empty=await capture('EMPTY');
    await assert.rejects(complete(empty),/without saved results/);
    await assert.rejects(db.query("insert into screenings(organisation_id,participant_reference,status) values($1,'DIRECT','Completed')",[orgA]),/without saved results/);
    const pending=await capture('PENDING'); await flexible(pending,'SYSTOLIC',180);
    const multi=await capture('MULTI'); await flexible(multi,'SYSTOLIC',165); await complete(multi);
    const newer=await capture('MULTI',orgA,'2026-10-02'); await flexible(newer,'GLUCOSE',4,'mmol/L'); await complete(newer);
    const moderate=await capture('MODERATE'); await flexible(moderate,'DIASTOLIC',90); await complete(moderate);
    const low=await capture('LOW'); await flexible(low,'SYSTOLIC',120); await complete(low);
    const bmi=await capture('BMI'); await flexible(bmi,'HEIGHT',170,'cm'); await flexible(bmi,'WEIGHT',110,'kg'); await complete(bmi);
    const unsupported=await capture('UNSUPPORTED');
    const textField=(await db.query("insert into service_result_fields(service_id,code,data_type) values($1,'DENTAL_FINDING','text') returning id",[service])).rows[0].id;
    await db.query('insert into screening_result_values(screening_id,service_result_field_id,value_text) values($1,$2,$3)',[unsupported,textField,'Recorded finding']); await complete(unsupported);
    const legacy=await capture('LEGACY'); await db.query('insert into screening_results(screening_id,cholesterol_mmol_l) values($1,6.2)',[legacy]); await complete(legacy);
    const wrongUnit=await capture('WRONG-UNIT'); await flexible(wrongUnit,'GLUCOSE',120,'mg/dL'); await complete(wrongUnit);
    const mismatch=await capture('MISMATCH'); await flexible(mismatch,'SYSTOLIC',180,'mmHg',otherService); await assert.rejects(complete(mismatch),/without saved results/);
    const b=await capture('MULTI',orgB); await flexible(b,'SYSTOLIC',120); await complete(b);
    const rows=(await db.query('select * from analytics_risk_metrics where organisation_id=$1',[orgA])).rows;
    const counts=Object.fromEntries(rows.map(r=>[r.risk_category,Number(r.participant_count)]));
    assert.deepEqual(counts,{Low:1,Moderate:1,High:3,'Not Calculated':3});
    assert.equal(Number(rows[0].total_participants),8);
    assert.equal(rows.reduce((sum,r)=>sum+Number(r.percentage),0),100);
    // A newer BP measurement replaces BP, while keeping the separately captured glucose.
    const repeat=await capture('MULTI',orgA,'2026-10-03'); await flexible(repeat,'SYSTOLIC',120); await complete(repeat);
    assert.equal(Number((await db.query("select participant_count from analytics_risk_metrics where organisation_id=$1 and risk_category='High'",[orgA])).rows[0].participant_count),2);
    const client=createClient('https://test.supabase.co','test-key',{ realtime:{transport:WebSocket},auth:{persistSession:false},global:{fetch:async input=>{
      const url=new URL(String(input)); assert.ok(url.pathname.endsWith('/analytics_risk_metrics'));
      const tenant=url.searchParams.get('organisation_id')?.slice(3);
      const offset=Number(url.searchParams.get('offset')??0);
      const result=await db.query(`select organisation_id,risk_category,participant_count from analytics_risk_metrics ${tenant?'where organisation_id=$1':''} order by organisation_id,risk_category offset ${offset} limit 1`,tenant?[tenant]:[]);
      return Response.json(result.rows.map(row=>({...row,participant_count:Number(row.participant_count)})));
    }}});
    const schema=makeExecutableSchema({typeDefs:['type Query { _empty: Boolean }',dashboardTypeDefs],resolvers:dashboardResolvers});
    const contextValue={user:{id:'user-a'},supabase:client,adminSupabase:client,identity:{organisationId:orgB,organisationRole:'client_admin',platformRole:null}};
    const result=await graphql({schema,contextValue,source:'{organisationRiskDistribution{riskCategory participantCount}}'});
    assert.equal(result.errors,undefined);
    assert.deepEqual(JSON.parse(JSON.stringify(result.data)).organisationRiskDistribution,[
      {riskCategory:'Low',participantCount:1},{riskCategory:'Moderate',participantCount:0},
      {riskCategory:'High',participantCount:0},{riskCategory:'Not Calculated',participantCount:0},
    ]);
    contextValue.identity.platformRole='super_admin';
    const admin=await graphql({schema,contextValue,source:'{adminRiskDistribution{riskCategory participantCount}}'});
    assert.equal(admin.errors,undefined);
    assert.equal(admin.data.adminRiskDistribution.reduce((sum,r)=>sum+r.participantCount,0),9);
  } finally { await db.close(); }
});
