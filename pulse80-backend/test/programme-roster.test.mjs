import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';
import { rosterResolvers } from '../dist/modules/programme-roster/roster.resolver.js';
import { rosterTypeDefs } from '../dist/modules/programme-roster/roster.schema.js';
import { ScreeningService } from '../dist/modules/screenings/screening.service.js';
import { FlexibleScreeningService } from '../dist/modules/screenings/flexible-screening.service.js';

const migration = await readFile(new URL('../supabase/migrations/20261005103157_anonymous_programme_roster.sql', import.meta.url), 'utf8');
const schema = makeExecutableSchema({ typeDefs: ['type Query { _empty: Boolean } type Mutation { _empty: Boolean }', rosterTypeDefs], resolvers: rosterResolvers });
const user = '00000000-0000-4000-8000-000000000001';

async function setup() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create table organisations(id uuid primary key default gen_random_uuid());
    create table employees(id uuid primary key default gen_random_uuid(),organisation_id uuid not null references organisations);
    create table programmes(id uuid primary key default gen_random_uuid(),organisation_id uuid not null references organisations,name text default 'Programme',service_names text[] default '{}');
    create table activations(id uuid primary key default gen_random_uuid(),organisation_id uuid not null references organisations,programme_id uuid not null references programmes,service_names text[] default '{}',title text default 'Day',location text default 'HQ',starts_at timestamptz default '2026-10-05 08:00Z',ends_at timestamptz default '2026-10-05 18:00Z');
    create table services(id uuid primary key default gen_random_uuid(),name text,code text,active boolean default true);
    create table programme_services(id uuid primary key default gen_random_uuid(),programme_id uuid references programmes,service_id uuid references services);
    create table programme_participants(id uuid primary key default gen_random_uuid(),programme_id uuid not null references programmes,employee_id uuid not null references employees on delete cascade,eligibility_status text not null default 'Eligible' check(eligibility_status in ('Eligible','Not Eligible')),registration_status text not null default 'Registered' check(registration_status in ('Registered','Invited','Declined','Withdrawn')),updated_at timestamptz not null default now(),unique(programme_id,employee_id));
    create table practitioner_assignments(id uuid primary key default gen_random_uuid(),organisation_id uuid references organisations,activation_id uuid references activations,practitioner_user_id uuid,status text,service_id uuid references services,programme_name text,activity_name text,service_name text,role_name text,location text,starts_at timestamptz,ends_at timestamptz);
    create table practitioner_assignment_services(id uuid primary key default gen_random_uuid(),practitioner_assignment_id uuid references practitioner_assignments,service_id uuid references services,service_name text,service_code text);
    create table practitioner_assignment_alerts(id uuid primary key default gen_random_uuid(),practitioner_assignment_id uuid,practitioner_user_id uuid,change_type text,message text,urgent boolean,changed_at timestamptz default now(),acknowledged_at timestamptz);
    create table screenings(id uuid primary key default gen_random_uuid(),organisation_id uuid not null references organisations,activation_id uuid references activations,assignment_id uuid not null references practitioner_assignments,practitioner_user_id uuid,participant_reference text not null,programme_participant_id uuid references programme_participants on delete restrict,service_id uuid references services,status text,department text,consent_confirmed boolean,practitioner_note text,submitted_at timestamptz,reviewed_by uuid,reviewed_at timestamptz,review_note text);
    create table screening_results(screening_id uuid primary key references screenings on delete cascade,systolic_mmhg numeric,diastolic_mmhg numeric,glucose_mmol_l numeric,cholesterol_mmol_l numeric,height_cm numeric,weight_kg numeric,bmi numeric,risk_level text,escalation_required boolean);
    create table screening_correction_errors(id uuid primary key default gen_random_uuid(),screening_id uuid references screenings,resolved_at timestamptz);
    create table service_result_fields(id uuid primary key default gen_random_uuid(),service_id uuid references services,code text,label text,data_type text,unit text,required boolean default true,options jsonb,min_value numeric,max_value numeric,display_order int default 0,active boolean default true);
    create table screening_result_values(id uuid primary key default gen_random_uuid(),screening_id uuid references screenings on delete cascade,service_result_field_id uuid references service_result_fields,value_number numeric,value_text text,value_boolean boolean,value_code text);
    create table screening_outcomes(screening_id uuid primary key references screenings on delete cascade,outcome_summary text,referral_required boolean,escalation_required boolean,reporting_risk_category text);
    grant all on all tables in schema public to service_role;
    grant all on programme_participants to public,anon,authenticated;
  `);
  async function insert(table, values = {}) {
    const keys = Object.keys(values);
    return (await db.query(`insert into ${table} ${keys.length ? `(${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')})` : 'default values'} returning *`,Object.values(values))).rows[0];
  }
  const org = (await insert('organisations')).id, otherOrg = (await insert('organisations')).id;
  const programme = (await insert('programmes',{organisation_id:org,service_names:['BP']})).id;
  const otherProgramme = (await insert('programmes',{organisation_id:otherOrg})).id;
  const sameOrgProgramme = (await insert('programmes',{organisation_id:org})).id;
  const activation = (await insert('activations',{organisation_id:org,programme_id:programme,service_names:['BP']})).id;
  const otherActivation = (await insert('activations',{organisation_id:otherOrg,programme_id:otherProgramme})).id;
  const serviceId = (await insert('services',{name:'Blood pressure',code:'BP'})).id;
  const assignment = (await insert('practitioner_assignments',{organisation_id:org,activation_id:activation,practitioner_user_id:user,status:'Confirmed',service_id:serviceId})).id;
  const field = (await insert('service_result_fields',{service_id:serviceId,code:'systolic',label:'Systolic',data_type:'number'})).id;
  const legacy = await insert('screenings',{organisation_id:org,activation_id:activation,assignment_id:assignment,practitioner_user_id:user,participant_reference:'LEGACY',status:'Completed'});
  const historicalAssignment=await insert('practitioner_assignments',{organisation_id:org,practitioner_user_id:user,status:'Confirmed'});
  await db.exec(migration);
  const entry = (code, overrides={}) => ({screening_reference:code,eligibility_status:'Eligible',registration_status:'Registered',...overrides});
  const importRows = async (rows,p=programme,o=org) => (await db.query('select import_programme_roster($1,$2,$3::jsonb) ids',[p,o,JSON.stringify(rows)])).rows[0].ids;
  const resolve = async(code,a=assignment,u=user) => (await db.query('select resolve_programme_screening_participant($1,$2,$3) id',[a,u,code])).rows[0].id;
  const capture = (code, overrides={}) => insert('screenings',{organisation_id:org,activation_id:activation,assignment_id:assignment,practitioner_user_id:user,participant_reference:code,status:'Under Review',...overrides});
  return {historicalAssignment,db,insert,org,otherOrg,programme,otherProgramme,sameOrgProgramme,activation,otherActivation,serviceId,assignment,field,legacy,entry,importRows,resolve,capture};
}

// The only simulated boundary is PostgREST transport; writes run real SQL in an
// isolated in-memory PostgreSQL database. No production URLs or credentials.
function clientFor(fixture) {
  const {db,insert}=fixture;
  return createClient('https://test.supabase.co','test-key',{realtime:{transport:WebSocket},auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
    const url=new URL(String(input)), table=url.pathname.split('/').pop(), method=init?.method??'GET';
    const body=init?.body ? JSON.parse(init.body) : null;
    try {
      if(url.pathname.includes('/rpc/')) {
        const args=Object.values(body);
        const names=Object.keys(body);
        const sql=`select to_jsonb(public.${table}(${names.map((name,i)=>`${name} => $${i+1}`).join(',')})) result`;
        return Response.json((await db.query(sql,args.map(value=>Array.isArray(value)?JSON.stringify(value):value))).rows[0].result);
      }
      if(method==='POST') {
        const rows=[]; for(const value of Array.isArray(body)?body:[body]) rows.push(await insert(table,value));
        return Response.json(Array.isArray(body)?rows:rows[0]);
      }
      const filters=[],params=[];
      for(const [key,value] of url.searchParams) {
        if(['select','order','offset','limit'].includes(key))continue;
        if(value.startsWith('eq.')) {params.push(key==='active' ? value.slice(3)==='true' : value.slice(3));filters.push(`${key}=$${params.length}`);}
        else if(value==='not.is.null')filters.push(`${key} is not null`);
        else if(value.startsWith('in.(')) {params.push(value.slice(4,-1).split(','));filters.push(`${key}=any($${params.length}::text[])`);}
        else if(value.startsWith('lt.')) {params.push(Number(value.slice(3)));filters.push(`${key}<$${params.length}`);}
        else throw new Error('Unsupported test filter '+key+'='+value);
      }
      const where=filters.length?' where '+filters.join(' and '):'';
      if(method==='PATCH') {
        const keys=Object.keys(body), values=Object.values(body);
        const update=(await db.query(`update ${table} set ${keys.map((key,i)=>`${key}=$${params.length+i+1}`).join(',')}${where} returning *`,[...params,...values])).rows;
        return Response.json(update);
      }
      if(method==='DELETE') {await db.query(`delete from ${table}${where}`,params);return new Response(null,{status:204});}
      const all=(await db.query(`select * from ${table}${where}`,params)).rows;
      const offset=Number(url.searchParams.get('offset')??0),limit=Number(url.searchParams.get('limit')??1000);
      const rows=all.slice(offset,offset+limit);
      const accept=new Headers(init?.headers).get('accept')??'';
      return Response.json(accept.includes('vnd.pgrst.object') ? (rows[0]??null) : rows,{headers:{'content-range':`${offset}-${offset+rows.length-1}/${all.length}`}});
    } catch(error) {return Response.json({message:error.message,code:error.code??'P0001'},{status:400});}
  }}});
}
const input = code => ({screeningReference:code,eligibilityStatus:'Eligible',registrationStatus:'Registered'});

test('anonymous roster, uniqueness, atomic import, optional employee and tenant separation',async()=>{
  const f=await setup(); try {
    const [participant]=await f.importRows([f.entry('CODE-A'),f.entry('CODE-B')]);
    assert.equal((await f.db.query('select employee_id from programme_participants where id=$1',[participant])).rows[0].employee_id,null);
    assert.equal((await f.db.query('select count(*)::int n from employees')).rows[0].n,0);
    assert.equal(await f.resolve(' CODE-A '),participant);
    await assert.rejects(f.importRows([f.entry('CODE-C'),f.entry('CODE-A')]),/duplicate key/);
    assert.equal((await f.db.query("select count(*)::int n from programme_participants where screening_reference='CODE-C'")).rows[0].n,0);
    await assert.rejects(f.importRows([f.entry('DUP'),f.entry('DUP')]),/duplicate key/);
    await f.importRows([f.entry('CODE-A')],f.otherProgramme,f.otherOrg);
    await f.importRows([f.entry('CODE-A'),f.entry('OTHER-ONLY')],f.sameOrgProgramme);
    await assert.rejects(f.resolve('OTHER-ONLY'),/invalid or ambiguous/);
    await assert.rejects(f.resolve('UNKNOWN'),/invalid or ambiguous/);
    await assert.rejects(f.resolve('code-a'),/invalid or ambiguous/);
    await assert.rejects(f.importRows([f.entry('TENANT')],f.otherProgramme,f.org),/unavailable/);
    const employee=(await f.insert('employees',{organisation_id:f.org})).id;
    await f.importRows([f.entry('EMPLOYEE',{employee_id:employee})]);
    const wrongEmployee=(await f.insert('employees',{organisation_id:f.otherOrg})).id;
    await assert.rejects(f.importRows([f.entry('BAD',{employee_id:wrongEmployee})]),/same organisation/);
    await assert.rejects(f.importRows([f.entry('NAME',{name:'Not allowed'})]),/unsupported columns/);
    await assert.rejects(f.importRows([f.entry('STATUS',{registration_status:'Unknown'})]),/Invalid participant status/);
    for(const statuses of [{eligibility_status:'Not Eligible'},{registration_status:'Invited'},{registration_status:'Declined'},{registration_status:'Withdrawn'}]) {
      const code=JSON.stringify(statuses);await f.importRows([f.entry(code,statuses)]);
      await assert.rejects(f.resolve(code),/Eligible and Registered/);
    }
    assert.equal((await f.db.query("select has_function_privilege('authenticated','import_programme_roster(uuid,uuid,jsonb)','execute') allowed")).rows[0].allowed,false);
    await f.db.exec('set role service_role');
    await f.importRows([f.entry('SERVICE-ROLE')]);await f.db.exec('reset role');
  } finally {await f.db.close();}
});

test('screening trigger links exact programme codes, preserves history and rejects forged identity',async()=>{
  const f=await setup();try {
    const before=(await f.db.query('select * from screenings where id=$1',[f.legacy.id])).rows[0];
    assert.deepEqual(before,f.legacy);
    const [participant]=await f.importRows([f.entry('CODE-A')]);
    const first=await f.capture('CODE-A');const second=await f.capture('CODE-A');
    assert.equal(first.programme_participant_id,participant);assert.equal(second.programme_participant_id,participant);
    await assert.rejects(f.capture('UNKNOWN'),/invalid or ambiguous/);
    await assert.rejects(f.db.query('update programmes set organisation_id=$1 where id=$2',[f.otherOrg,f.programme]),/Cannot move a programme/);
    await assert.rejects(f.db.query('update activations set programme_id=$1 where id=$2',[f.sameOrgProgramme,f.activation]),/Cannot move an activation/);
    await assert.rejects(f.capture('CODE-A',{organisation_id:f.otherOrg}),/same organisation and activation/);
    await assert.rejects(f.capture('CODE-A',{activation_id:f.otherActivation}),/same organisation and activation/);
    await assert.rejects(f.capture('CODE-A',{practitioner_user_id:f.otherOrg}),/assignment must belong/);
    const [other]=await f.importRows([f.entry('CODE-A')],f.otherProgramme,f.otherOrg);
    await assert.rejects(f.capture('CODE-A',{programme_participant_id:other}),/does not match/);
    await assert.rejects(f.db.query('update screenings set participant_reference=$1 where id=$2',['CODE-A',f.legacy.id]),/Historical unlinked/);
    await f.db.query('update screenings set status=$1 where id=$2',['Completed',first.id]);
    await assert.rejects(f.db.query('update programme_participants set screening_reference=$1 where id=$2',['REASSIGNED',participant]),/cannot be changed/);
    await f.db.exec(migration); // repeat install never backfills history
    assert.deepEqual((await f.db.query('select * from screenings where id=$1',[f.legacy.id])).rows[0],f.legacy);
    // Even a damaged database lacking the unique index must not silently pick a match.
    await f.db.exec('drop index programme_participants_screening_reference_key');
    await f.importRows([f.entry('CODE-A')]);
    await assert.rejects(f.resolve('CODE-A'),/invalid or ambiguous/);
  } finally {await f.db.close();}
});

test('GraphQL roster operations accept no names, import atomically, update statuses and enforce context',async()=>{
  const f=await setup();try {
    const db=clientFor(f);
    const context={user:{id:user},supabase:db,adminSupabase:db,identity:{organisationId:f.org,organisationRole:'hr',platformRole:null}};
    const call=(source,variables={},ctx=context)=>graphql({schema,source,variableValues:variables,contextValue:ctx});
    const create='mutation($programmeId:ID!,$input:RosterParticipantInput!){createProgrammeParticipant(programmeId:$programmeId,input:$input)}';
    const created=await call(create,{programmeId:f.programme,input:input('ANON')});
    assert.equal(created.errors,undefined);
    const imported=await call('mutation($programmeId:ID!,$rows:[RosterParticipantInput!]!){importProgrammeParticipants(programmeId:$programmeId,rows:$rows)}',{programmeId:f.programme,rows:[input('IMPORTED-A'),input('IMPORTED-B')]});
    assert.equal(imported.errors,undefined);assert.equal(imported.data.importProgrammeParticipants.length,2);
    const duplicate=await call(create,{programmeId:f.programme,input:input('ANON')});
    assert.equal(duplicate.errors[0].extensions.code,'BAD_USER_INPUT');
    const listed=await call('query($programmeId:ID!){programmeRoster(programmeId:$programmeId){total participants{id employeeId screeningReference}}}',{programmeId:f.programme});
    assert.equal(listed.errors,undefined);assert.equal(listed.data.programmeRoster.total,3);
    assert.ok(listed.data.programmeRoster.participants.every(row=>row.employeeId===null));
    const status=await call('mutation($programmeId:ID!,$id:ID!,$input:ParticipantStatusInput!){updateProgrammeParticipantStatus(programmeId:$programmeId,id:$id,input:$input){registrationStatus}}',{programmeId:f.programme,id:created.data.createProgrammeParticipant,input:{eligibilityStatus:'Eligible',registrationStatus:'Withdrawn'}});
    assert.equal(status.errors,undefined);assert.equal(status.data.updateProgrammeParticipantStatus.registrationStatus,'Withdrawn');
    const denied=await call(create,{programmeId:f.otherProgramme,input:input('CROSS-TENANT')});
    assert.equal(denied.errors[0].extensions.code,'FORBIDDEN');
    const noPermission=await call(create,{programmeId:f.programme,input:input('DENIED')},{...context,identity:{...context.identity,organisationRole:'practitioner'}});
    assert.equal(noPermission.errors[0].extensions.code,'FORBIDDEN');
    const anon=await call(create,{programmeId:f.programme,input:input('DENIED')},{...context,user:null});
    assert.equal(anon.errors[0].extensions.code,'UNAUTHENTICATED');
    const admin=await call(create,{programmeId:f.otherProgramme,input:input('ADMIN')},{...context,identity:{organisationId:null,organisationRole:null,platformRole:'super_admin'}});
    assert.equal(admin.errors,undefined);
    const unknownFields=await call(create,{programmeId:f.programme,input:{...input('PERSON'),name:'Not accepted'}});
    assert.ok(unknownFields.errors);
  } finally {await f.db.close();}
});

test('legacy and flexible capture services resolve and persist the same anonymous participant',async()=>{
  const f=await setup();try {
    const [participant]=await f.importRows([f.entry('CAPTURE')]);
    const db=clientFor(f),legacy=new ScreeningService(db),flexible=new FlexibleScreeningService(db);
    const input={assignmentId:f.assignment,participantReference:'CAPTURE',department:null,consentConfirmed:true,practitionerNote:null,systolicMmhg:120,diastolicMmhg:80,glucoseMmolL:null,cholesterolMmolL:null,heightCm:null,weightKg:null};
    const one=await legacy.capture(user,input);
    const two=await flexible.capture(user,{assignmentId:f.assignment,serviceId:f.serviceId,participantReference:'CAPTURE',consentConfirmed:true,values:[{fieldId:f.field,valueNumber:120}]});
    const three=await legacy.capture(user,input);
    const rows=(await f.db.query('select programme_participant_id from screenings where id=any($1::uuid[])',[[one.id,two,three.id]])).rows;
    assert.equal(rows.length,3);assert.ok(rows.every(row=>row.programme_participant_id===participant));
    await assert.rejects(legacy.capture(user,{...input,participantReference:'INVALID'}),/invalid or ambiguous/);
    await assert.rejects(flexible.capture(user,{assignmentId:f.assignment,serviceId:f.serviceId,participantReference:'INVALID',consentConfirmed:true,values:[{fieldId:f.field,valueNumber:120}]}),/invalid or ambiguous/);
    assert.equal((await f.db.query('select count(*)::int n from screenings')).rows[0].n,4); // three new plus untouched historical row
  } finally {await f.db.close();}
});


test('release privileges, forward assignment RPC, explicit service rules and unchanged history',async()=>{
  const f=await setup();try {
    for(const role of ['anon','authenticated']) {
      for(const privilege of ['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) {
        assert.equal((await f.db.query("select has_table_privilege($1,'programme_participants',$2) allowed",[role,privilege])).rows[0].allowed,false);
      }
      await f.db.exec(`set role ${role}`);
      for(const sql of ['delete from programme_participants',"update programme_participants set eligibility_status='Eligible'",'truncate programme_participants cascade','insert into programme_participants default values']) await assert.rejects(f.db.exec(sql),/permission denied/);
      await f.db.exec('reset role');
    }
    await f.db.exec('set role service_role');
    const [id]=await f.importRows([f.entry('READY')]);
    await f.db.query("update programme_participants set updated_at='2000-01-01' where id=$1",[id]);
    await f.db.query('select set_programme_roster_status($1,$2,$3,$4,$5)',[f.programme,f.org,id,'Eligible','Registered']);
    assert.ok(new Date((await f.db.query('select updated_at from programme_participants where id=$1',[id])).rows[0].updated_at).getFullYear()>2000);
    const args=[null,user,f.org,'Ignored','Ignored','Ignored',['Ignored'],'Nurse','Ignored','2026-10-05T09:00Z','2026-10-05T10:00Z','Confirmed',f.activation,[f.serviceId]];
    const save=(overrides={})=>f.db.query('select save_linked_practitioner_assignment('+args.map((_,i)=>'$'+(i+1)).join(',')+') id',Object.assign([...args],overrides));
    await assert.rejects(save({12:null}),/activation/);
    await assert.rejects(f.insert('practitioner_assignments',{organisation_id:f.org,practitioner_user_id:user,status:'Confirmed',service_id:f.serviceId}),/activation/);
    await assert.rejects(f.insert('practitioner_assignments',{organisation_id:f.org,activation_id:f.otherActivation,practitioner_user_id:user,status:'Confirmed',service_id:f.serviceId}),/organisation/);
    await f.importRows([f.entry('WRONG-PROGRAMME')],f.sameOrgProgramme);
    await assert.rejects(f.capture('WRONG-PROGRAMME'),/invalid or ambiguous/);
    await assert.rejects(save({12:f.otherActivation}),/organisation/);
    await assert.rejects(save({13:[f.otherOrg]}),/services configured/);
    const assignment=(await save()).rows[0].id;
    const linked=(await f.db.query('select pa.*,a.programme_id from practitioner_assignments pa join activations a on a.id=pa.activation_id where pa.id=$1',[assignment])).rows[0];
    assert.equal(linked.programme_id,f.programme);assert.equal(linked.programme_name,'Programme');assert.equal(linked.service_id,f.serviceId);
    const screen=await f.capture('READY',{assignment_id:assignment});assert.equal(screen.programme_participant_id,id);
    await assert.rejects(save({0:f.historicalAssignment.id}),/Historical unlinked/);
    await f.db.exec('reset role');
    const wrongService=(await f.insert('services',{name:'Other service',code:'OTHER'})).id;
    await f.db.query("update programmes set service_names=array['OTHER'] where id=$1",[f.sameOrgProgramme]);
    await assert.rejects(save({13:[wrongService]}),/services configured/);
    // Activation allows OTHER but the selected programme does not.
    await f.db.query("update activations set service_names=array['BP','OTHER'] where id=$1",[f.activation]);
    await assert.rejects(save({13:[wrongService]}),/services configured/);
    await f.db.query('update services set active=false where id=$1',[f.serviceId]);
    await assert.rejects(f.capture('READY'),/service configured/);
    await f.db.query('update services set active=true where id=$1',[f.serviceId]);
    await assert.rejects(f.capture('READY',{service_id:wrongService}),/not part/);
    // Catalogue helper presence must never change validation.
    await f.db.exec("create function exact_service_id(text) returns uuid language sql as $$ select null::uuid $$");
    assert.equal((await f.capture('READY')).programme_participant_id,id);
    await f.db.query("update activations set service_names=array['OTHER'] where id=$1",[f.activation]);
    await assert.rejects(f.capture('READY'),/service configured/);
    await assert.rejects(save(),/services configured/);
    assert.deepEqual((await f.db.query('select * from practitioner_assignments where id=$1',[f.historicalAssignment.id])).rows[0],f.historicalAssignment);
    assert.deepEqual((await f.db.query('select * from screenings where id=$1',[f.legacy.id])).rows[0],f.legacy);
    assert.equal((await f.db.query('select count(*)::int n from programme_services')).rows[0].n,0);
    await f.db.exec('set role service_role');
    const [removable]=await f.importRows([f.entry('REMOVE')]);
    await f.db.query('delete from programme_participants where id=$1',[removable]);
    await f.db.exec('reset role');
  } finally {await f.db.close();}
});


test('assignment service picker works without programme-service backfill and excludes ambiguous/foreign services',async()=>{
  const {ProgrammeService}=await import('../dist/modules/programmes/programme.service.js');
  const catalogue=[{id:'bp',code:'BP',name:'Blood pressure',active:true},{id:'other',code:'OTHER',name:'Other',active:true},{id:'off',code:'OFF',name:'Inactive',active:false},{id:'ambiguous',code:'AMB',name:'Ambiguous',active:true},{id:'collision',code:'X',name:'AMB',active:false}];
  const service=new ProgrammeService({from(table){assert.equal(table,'services');return {select:async()=>({data:catalogue,error:null})};}});
  service.listActivations=async()=>[{id:'event',organisation_id:'org',service_names:[' bp ','OTHER','OFF','AMB'],programmes:{name:'Programme',organisation_id:'org',service_names:['Blood pressure','OFF','AMB']}},{id:'foreign',organisation_id:'org',service_names:['BP'],programmes:{organisation_id:'other',service_names:['BP']}}];
  const events=await service.assignmentActivations();
  assert.deepEqual(events[0].services.map(s=>s.id),['bp']);assert.deepEqual(events[1].services,[]);
});
