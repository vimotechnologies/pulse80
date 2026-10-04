import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';
import { dashboardTypeDefs } from '../dist/modules/dashboard/dashboard.schema.js';
import { dashboardResolvers } from '../dist/modules/dashboard/dashboard.resolver.js';

// Real PostgreSQL engine, isolated in memory. Only the REST transport is simulated.
test('anonymous capture code -> PostgreSQL views -> GraphQL dashboard', async () => {
 const db = new PGlite();
 try {
 await db.exec(`
 create role anon; create role authenticated; create role service_role;
 create table organisations(id uuid primary key default gen_random_uuid(), workforce_size int default 3, wellness_risk_score int default 0);
 create table employees(id uuid primary key default gen_random_uuid(), organisation_id uuid references organisations);
 create table programmes(id uuid primary key default gen_random_uuid(), organisation_id uuid references organisations);
 create table activations(id uuid primary key default gen_random_uuid(), organisation_id uuid references organisations, programme_id uuid references programmes);
 create table programme_participants(id uuid primary key default gen_random_uuid(), programme_id uuid references programmes, employee_id uuid references employees, eligibility_status text default 'Eligible', registration_status text default 'Registered');
 create table programme_services(id uuid primary key default gen_random_uuid(), programme_id uuid references programmes, service_id uuid);
 create table programme_participant_services(programme_participant_id uuid references programme_participants, programme_service_id uuid references programme_services);
 create table practitioner_assignments(id uuid primary key default gen_random_uuid(), organisation_id uuid references organisations, activation_id uuid references activations, practitioner_user_id uuid, service_id uuid);
 create table screenings(id uuid primary key default gen_random_uuid(), organisation_id uuid references organisations, activation_id uuid references activations, assignment_id uuid references practitioner_assignments, practitioner_user_id uuid, participant_reference text, programme_participant_id uuid references programme_participants, service_id uuid, status text);
 `);
 for(const name of ['20260928012624_pul316_screening_analytics_views.sql','20260928035527_link_screenings_by_programme_code.sql']) await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
 const insert=async(table,values={})=>{const keys=Object.keys(values);const q=keys.length?`(${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')})`:'default values';return (await db.query(`insert into ${table} ${q} returning id`,Object.values(values))).rows[0].id;};
 const org=await insert('organisations'), otherOrg=await insert('organisations');
 const programme=await insert('programmes',{organisation_id:org});
 const activation=await insert('activations',{organisation_id:org,programme_id:programme});
 const user='00000000-0000-4000-8000-000000000001';
 const services=['00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000012'];
 const ps=[];for(const service_id of services)ps.push(await insert('programme_services',{programme_id:programme,service_id}));
 const assignment=await insert('practitioner_assignments',{organisation_id:org,activation_id:activation,practitioner_user_id:user,service_id:services[0]});
 const participants=[];for(const code of ['CODE-A','CODE-B','CODE-C']){const employee=await insert('employees',{organisation_id:org});participants.push(await insert('programme_participants',{programme_id:programme,employee_id:employee,screening_reference:code}));}
 for(const [p,s] of [[0,0],[0,1],[0,2],[1,0],[1,1]])await db.query('insert into programme_participant_services values ($1,$2)',[participants[p],ps[s]]);
 const capture=(code,service,status='Completed',extra={})=>insert('screenings',{organisation_id:org,activation_id:activation,assignment_id:assignment,practitioner_user_id:user,participant_reference:code,service_id:service,status,...extra});
 const first=await capture('CODE-A',null); // legacy capture derives the assignment service
 await capture('CODE-A',services[1]);await capture('CODE-A',services[0]); // duplicate
 await capture('CODE-A',services[2],'Draft');await capture('CODE-B',services[0],'Needs Correction');await capture('CODE-B',services[1]);
 assert.equal((await db.query('select programme_participant_id from screenings where id=$1',[first])).rows[0].programme_participant_id,participants[0]);
 const participation=(await db.query('select * from analytics_screening_participation where organisation_id=$1',[org])).rows[0];
 const completion=(await db.query('select * from analytics_screening_completion where organisation_id=$1',[org])).rows[0];
 assert.equal(Number(participation.eligible_participant_count),3);assert.equal(Number(participation.screened_participant_count),2);assert.equal(Number(participation.screening_participation_rate_pct),66.67);
 assert.equal(Number(completion.expected_required_screenings),5);assert.equal(Number(completion.completed_required_screenings),3);assert.equal(Number(completion.screening_completion_rate),60);
 await assert.rejects(capture('UNKNOWN',services[0]),/not registered/);
 await assert.rejects(capture('CODE-A',services[0],'Completed',{organisation_id:otherOrg}),/assignment must belong/);
 await assert.rejects(capture('CODE-A',services[0],'Completed',{programme_participant_id:participants[1]}),/does not match/);
 await assert.rejects(capture('CODE-A','00000000-0000-4000-8000-000000000099'),/Choose a service/);
 await assert.rejects(insert('programme_participants',{programme_id:programme,employee_id:await insert('employees',{organisation_id:org}),screening_reference:'CODE-A'}),/duplicate key/);
 const transport=async(input)=>{
 const url=new URL(String(input)),table=url.pathname.split('/').pop();
 if(table==='activations')return new Response(null,{headers:{'content-range':'*/0'}});
 if(table==='screenings'){const r=await db.query("select count(*)::int as n from screenings where organisation_id=$1 and status='Completed'",[org]);return new Response(null,{headers:{'content-range':`*/${r.rows[0].n}`}});}
 if(table==='organisations')return Response.json((await db.query('select workforce_size,wellness_risk_score from organisations where id=$1',[org])).rows[0]);
 assert.ok(['analytics_screening_participation','analytics_screening_completion'].includes(table));
 assert.equal(url.searchParams.get('organisation_id'),'eq.'+org);
 const rows=(await db.query(`select * from ${table} where organisation_id=$1`,[org])).rows;
 return Response.json(rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,k==='organisation_id'?v:Number(v)]))));
 };
 const client=createClient('https://test.supabase.co','test-key',{realtime:{transport:WebSocket},auth:{persistSession:false},global:{fetch:transport}});
 const schema=makeExecutableSchema({typeDefs:['type Query { _empty: Boolean }',dashboardTypeDefs],resolvers:dashboardResolvers});
 const source='{organisationDashboardStats{screeningParticipation screeningCompletionRate participantsScreened eligibleParticipants expectedRequiredScreenings completedRequiredScreenings}}';
 const ctx={user:{id:user},supabase:client,adminSupabase:client,identity:{organisationId:org,organisationRole:'hr',platformRole:null}};
 const response=await graphql({schema,source,contextValue:ctx});assert.equal(response.errors,undefined);
 assert.deepEqual(JSON.parse(JSON.stringify(response.data.organisationDashboardStats)),{screeningParticipation:66.67,screeningCompletionRate:60,participantsScreened:2,eligibleParticipants:3,expectedRequiredScreenings:5,completedRequiredScreenings:3});
 const denied=await graphql({schema,source,contextValue:{...ctx,user:null}});assert.equal(denied.errors[0].extensions.code,'UNAUTHENTICATED');
 // Corrections resolve the new anonymous code again, rather than retaining the old link.
 await db.query('update screenings set participant_reference=$1 where id=$2',['CODE-C',first]);
 assert.equal((await db.query('select programme_participant_id from screenings where id=$1',[first])).rows[0].programme_participant_id,participants[2]);
 const empty=(await db.query('select * from analytics_screening_completion where organisation_id=$1',[otherOrg])).rows[0];assert.equal(Number(empty.screening_completion_rate),0);
 } finally {await db.close();}
});
