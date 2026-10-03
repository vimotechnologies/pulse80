import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const migrationDir = new URL('../supabase/migrations/', import.meta.url);
const migrationFile = (await readdir(migrationDir)).find(name => name.endsWith('_repair_screening_relationships.sql'));
const migration = await readFile(new URL(migrationFile, migrationDir), 'utf8');

async function setup(existingRequirements = false) {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create table organisations(id uuid primary key default gen_random_uuid());
    create table employees(id uuid primary key default gen_random_uuid(), organisation_id uuid not null references organisations);
    create table services(id uuid primary key default gen_random_uuid(), code text unique, name text unique, active boolean default true);
    create table programmes(id uuid primary key default gen_random_uuid(), organisation_id uuid references organisations, name text, service_names text[] default '{}');
    create table activations(id uuid primary key default gen_random_uuid(), organisation_id uuid references organisations, programme_id uuid references programmes, title text, location text, starts_at timestamptz, ends_at timestamptz, service_names text[] default '{}');
    create table programme_services(id uuid primary key default gen_random_uuid(), programme_id uuid references programmes, service_id uuid references services, unique(programme_id,service_id));
    create table programme_participants(id uuid primary key default gen_random_uuid(), programme_id uuid references programmes, employee_id uuid references employees, eligibility_status text default 'Eligible', registration_status text default 'Registered', unique(programme_id,employee_id));
    create table practitioner_assignments(id uuid primary key default gen_random_uuid(), practitioner_user_id uuid, organisation_id uuid references organisations, programme_name text, activity_name text, service_name text, role_name text, location text, starts_at timestamptz, ends_at timestamptz, status text, activation_id uuid references activations, service_id uuid references services);
    create table practitioner_assignment_services(id uuid primary key default gen_random_uuid(), practitioner_assignment_id uuid references practitioner_assignments, service_name text, service_code text, service_id uuid references services);
    create table practitioner_assignment_alerts(id uuid primary key default gen_random_uuid(), practitioner_assignment_id uuid, practitioner_user_id uuid, change_type text, message text, urgent boolean, created_at timestamptz default now(), read_at timestamptz);
    create table screenings(id uuid primary key default gen_random_uuid(), organisation_id uuid references organisations, activation_id uuid references activations, assignment_id uuid references practitioner_assignments, practitioner_user_id uuid, participant_reference text, programme_participant_id uuid references programme_participants, service_id uuid references services, status text);
    create function public.save_practitioner_assignment(uuid,uuid,uuid,text,text,text,text[],text,text,timestamptz,timestamptz,text) returns uuid language sql as 'select gen_random_uuid()';
    grant all on all tables in schema public to service_role;
  `);
  if (existingRequirements) await db.exec(`create table programme_participant_services(id uuid primary key default gen_random_uuid(), programme_participant_id uuid not null references programme_participants, programme_service_id uuid not null references programme_services, created_at timestamptz default now(), unique(programme_participant_id,programme_service_id));`);
  const insert = async (table, values = {}) => {
    const keys = Object.keys(values);
    const sql = keys.length ? `(${keys.join(',')}) values (${keys.map((_, i) => '$'+(i+1)).join(',')})` : 'default values';
    return (await db.query(`insert into ${table} ${sql} returning id`, Object.values(values))).rows[0].id;
  };
  return { db, insert };
}

for (const existingRequirements of [false, true]) test(`repair preserves legacy rows; requirements table ${existingRequirements ? 'already exists' : 'missing'}`, async () => {
  const { db, insert } = await setup(existingRequirements);
  try {
    const org = await insert('organisations');
    const service = await insert('services', {code:'BP',name:'Blood Pressure Screening'});
    const p = await insert('programmes', {organisation_id:org,name:'Programme',service_names:['BP','Blood pressure']});
    const event = {organisation_id:org,programme_id:p,title:'Day',location:'HQ',starts_at:'2026-10-04T08:00Z',ends_at:'2026-10-04T10:00Z',service_names:['BP']};
    const activation = await insert('activations', event);
    const base = {organisation_id:org,programme_name:'Programme',activity_name:'Day',location:'HQ',starts_at:event.starts_at,ends_at:event.ends_at,service_name:'BP'};
    const exact = await insert('practitioner_assignments', base);
    const mismatch = await insert('practitioner_assignments', {...base,activity_name:'Different',service_name:'Blood pressure'});
    const legacy = await insert('screenings', {organisation_id:org,assignment_id:mismatch,participant_reference:'UNAPPROVED',status:'Completed'});
    const before = (await db.query('select * from screenings')).rows;
    await db.exec(migration);
    assert.deepEqual((await db.query('select * from screenings')).rows, before);
    assert.deepEqual((await db.query('select activation_id,service_id from practitioner_assignments where id=$1',[exact])).rows[0],{activation_id:activation,service_id:service});
    assert.deepEqual((await db.query('select activation_id,service_id from practitioner_assignments where id=$1',[mismatch])).rows[0],{activation_id:null,service_id:null});
    assert.equal((await db.query('select count(*)::int n from programme_services')).rows[0].n,1);
    assert.equal((await db.query('select count(*)::int n from programme_participant_services')).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int n from programme_participants')).rows[0].n,0);
    // Reapplying repairs, including a pre-existing code column and trigger, is harmless.
    await db.exec(migration);
    assert.equal((await db.query('select count(*)::int n from screenings where id=$1',[legacy])).rows[0].n,1);
    const security=(await db.query("select has_table_privilege('authenticated','programme_participant_services','select') readable,relrowsecurity from pg_class where oid='programme_participant_services'::regclass")).rows[0];
    assert.deepEqual(security,{readable:false,relrowsecurity:true});
    assert.equal((await db.query("select has_function_privilege('service_role','save_practitioner_assignment(uuid,uuid,uuid,text,text,text,text[],text,text,timestamptz,timestamptz,text)','execute') allowed")).rows[0].allowed,false);
  } finally { await db.close(); }
});

test('approved roster, multiple services, assignments, corrections and tenant-safe analytics', async () => {
  const {db,insert} = await setup();
  try {
    await db.exec(migration);
    const org=await insert('organisations'), otherOrg=await insert('organisations');
    const services=[]; for(const code of ['BP','BMI','GLUCOSE']) services.push(await insert('services',{code,name:code+' screening'}));
    const programme=await insert('programmes',{organisation_id:org,name:'Wellness',service_names:['BP','BMI','GLUCOSE']});
    const otherProgramme=await insert('programmes',{organisation_id:otherOrg,name:'Wellness',service_names:['BP']});
    const sameOrgProgramme=await insert('programmes',{organisation_id:org,name:'Second',service_names:['BP']});
    await assert.rejects(insert('programmes',{organisation_id:org,name:'Invalid',service_names:['Blood pressure']}),/exact catalogue/);
    const event=await insert('activations',{organisation_id:org,programme_id:programme,title:'Day',location:'HQ',starts_at:'2026-10-04T08:00Z',ends_at:'2026-10-04T16:00Z',service_names:['BP','BMI','GLUCOSE']});
    const otherEvent=await insert('activations',{organisation_id:otherOrg,programme_id:otherProgramme,title:'Day',location:'HQ',starts_at:'2026-10-04T08:00Z',ends_at:'2026-10-04T16:00Z',service_names:['BP']});
    const user='00000000-0000-4000-8000-000000000001';
    const saveAssignment=async (eventId=event, ids=services.slice(0,2), organisation=org, assignmentId=null) => (await db.query(
      'select save_linked_practitioner_assignment($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) id',
      [assignmentId,user,organisation,'Ignored','Ignored','Ignored',['Ignored'],'Nurse','Ignored','2026-10-04T08:00Z','2026-10-04T12:00Z','Confirmed',eventId,ids])).rows[0].id;
    const assignment=await saveAssignment();
    const linked=(await db.query('select activation_id,service_id,programme_name,activity_name,location from practitioner_assignments where id=$1',[assignment])).rows[0];
    assert.deepEqual(linked,{activation_id:event,service_id:services[0],programme_name:'Wellness',activity_name:'Day',location:'HQ'});
    assert.equal((await db.query('select count(*)::int n from practitioner_assignment_services where practitioner_assignment_id=$1 and service_id is not null',[assignment])).rows[0].n,2);
    await assert.rejects(saveAssignment(otherEvent),/selected organisation/);
    await assert.rejects(saveAssignment(event,['00000000-0000-4000-8000-000000000099']),/configured/);
    await assert.rejects(insert('practitioner_assignments',{organisation_id:org,service_id:services[0]}),/Assignments require/);
    const roster=async (p,e,code,ids) => (await db.query('select save_programme_participant($1,$2,$3,$4,$5,$6) id',[p,e,code,ids,'Eligible','Registered'])).rows[0].id;
    const employees=[];for(let i=0;i<3;i++)employees.push(await insert('employees',{organisation_id:org}));
    const a=await roster(programme,employees[0],'CODE-A',services.slice(0,2));
    const b=await roster(programme,employees[1],'CODE-B',services.slice(0,2));
    await roster(programme,employees[2],'CODE-C',[]);
    const otherEmployee=await insert('employees',{organisation_id:otherOrg});
    const otherParticipant=await roster(otherProgramme,otherEmployee,'CODE-A',[services[0]]);
    await roster(sameOrgProgramme,employees[0],'OTHER-PROGRAMME',[services[0]]);
    await assert.rejects(roster(programme,otherEmployee,'BAD',[services[0]]),/same organisation/);
    await assert.rejects(roster(programme,employees[1],'CODE-A',[services[0]]),/duplicate key/);
    await assert.rejects(db.query('update programme_participants set programme_id=$1 where id=$2',[sameOrgProgramme,b]),/Cannot move/);
    await assert.rejects(db.query('update employees set organisation_id=$1 where id=$2',[otherOrg,employees[0]]),/Cannot move/);
    const otherService=(await db.query('select id from programme_services where programme_id=$1',[otherProgramme])).rows[0].id;
    await assert.rejects(insert('programme_participant_services',{programme_participant_id:a,programme_service_id:otherService}),/participant programme/);
    const capture=(code,service,status='Completed',extra={})=>insert('screenings',{organisation_id:org,activation_id:event,assignment_id:assignment,practitioner_user_id:user,participant_reference:code,service_id:service,status,...extra});
    const first=await capture('CODE-A',services[0]); await capture('CODE-A',services[1]); await capture('CODE-A',services[0]);
    await capture('CODE-B',services[0],'Under Review');await capture('CODE-B',services[1],'Needs Correction');await capture('CODE-B',services[0],'Draft');
    assert.equal((await db.query('select programme_participant_id from screenings where id=$1',[first])).rows[0].programme_participant_id,a);
    await assert.rejects(capture('UNKNOWN',services[0]),/not registered/);
    await assert.rejects(capture('OTHER-PROGRAMME',services[0]),/not registered/);
    await assert.rejects(capture('CODE-A',services[2]),/not part of the selected assignment/);
    await assert.rejects(capture('CODE-A',null),/Choose a service/);
    await assert.rejects(capture('CODE-A',services[0],'Completed',{organisation_id:otherOrg}),/assignment must belong/);
    await assert.rejects(capture('CODE-A',services[0],'Completed',{programme_participant_id:otherParticipant}),/does not match/);
    await assert.rejects(capture('CODE-A',services[0],'Completed',{activation_id:otherEvent}),/assignment must belong/);
    await assert.rejects(saveAssignment(otherEvent,[services[0]],otherOrg,assignment),/Cannot change/);
    await assert.rejects(db.query('update programme_participants set screening_reference=$1 where id=$2',['REPLACED',a]),/cannot change/);
    const completion=(await db.query('select * from analytics_screening_completion where organisation_id=$1',[org])).rows[0];
    assert.equal(Number(completion.expected_required_screenings),5);assert.equal(Number(completion.completed_required_screenings),2);assert.equal(Number(completion.screening_completion_rate),40);
    const participation=(await db.query('select * from analytics_screening_participation where organisation_id=$1',[org])).rows[0];
    assert.equal(Number(participation.screened_participant_count),1);assert.equal(Number(participation.eligible_participant_count),4);
    assert.equal(Number((await db.query('select screened_participant_count from analytics_screening_participation where organisation_id=$1',[otherOrg])).rows[0].screened_participant_count),0);
    assert.equal((await db.query("select count(*)::int n from screenings where status='Completed'")).rows[0].n,3);
    await db.query('update screenings set participant_reference=$1 where id=$2',['CODE-B',first]);
    assert.equal((await db.query('select programme_participant_id from screenings where id=$1',[first])).rows[0].programme_participant_id,b);
    await assert.rejects(db.query('update programmes set service_names=$1 where id=$2',[['BP'],programme]),/Cannot remove/);
  } finally {await db.close();}
});

test('backfill links only approved codes and unique exact events; ambiguous matches stay unresolved', async () => {
  const {db,insert}=await setup(true);
  try {
    await db.exec('alter table programme_participants add column screening_reference text');
    const org=await insert('organisations');
    const service=await insert('services',{code:'BP',name:'Blood Pressure Screening'});
    const programme=await insert('programmes',{organisation_id:org,name:'Programme',service_names:['BP']});
    const eventData={organisation_id:org,programme_id:programme,title:'Exact day',location:'HQ',starts_at:'2026-10-04T08:00Z',ends_at:'2026-10-04T16:00Z',service_names:['BP']};
    const event=await insert('activations',eventData);
    const user='00000000-0000-4000-8000-000000000001';
    const assignmentData={practitioner_user_id:user,organisation_id:org,programme_name:'Programme',activity_name:'Exact day',location:'HQ',starts_at:eventData.starts_at,ends_at:eventData.ends_at,service_name:'BP'};
    const assignment=await insert('practitioner_assignments',assignmentData);
    const employee=await insert('employees',{organisation_id:org});
    const participant=await insert('programme_participants',{programme_id:programme,employee_id:employee,screening_reference:'APPROVED'});
    const data={organisation_id:org,assignment_id:assignment,practitioner_user_id:user,participant_reference:'APPROVED',status:'Completed'};
    const exact=await insert('screenings',data);
    const unknown=await insert('screenings',{...data,participant_reference:'UNKNOWN'});
    await insert('activations',{...eventData,title:'Ambiguous'});await insert('activations',{...eventData,title:'Ambiguous'});
    const ambiguousAssignment=await insert('practitioner_assignments',{...assignmentData,activity_name:'Ambiguous'});
    // A name matching one catalogue row and another row's code is ambiguous.
    await insert('services',{code:'AMBIGUOUS',name:'First service'});await insert('services',{code:'OTHER',name:'Ambiguous'});
    const ambiguousService=await insert('practitioner_assignments',{...assignmentData,activity_name:'Unmatched',service_name:'Ambiguous'});
    await db.exec(migration);
    assert.deepEqual((await db.query('select programme_participant_id,activation_id,service_id,status from screenings where id=$1',[exact])).rows[0],{programme_participant_id:participant,activation_id:event,service_id:service,status:'Completed'});
    assert.deepEqual((await db.query('select programme_participant_id,activation_id,service_id,status from screenings where id=$1',[unknown])).rows[0],{programme_participant_id:null,activation_id:null,service_id:null,status:'Completed'});
    assert.equal((await db.query('select activation_id from practitioner_assignments where id=$1',[ambiguousAssignment])).rows[0].activation_id,null);
    assert.equal((await db.query('select service_id from practitioner_assignments where id=$1',[ambiguousService])).rows[0].service_id,null);
    assert.equal((await db.query('select count(*)::int n from screenings')).rows[0].n,2);
    assert.equal((await db.query('select count(*)::int n from programme_participant_services')).rows[0].n,0);
    await db.exec('set role authenticated');
    await assert.rejects(db.query('select save_programme_participant($1,$2,$3,$4,$5,$6)',[programme,employee,'APPROVED',[service],'Eligible','Registered']),/permission denied/);
    await db.exec('reset role');
    await db.exec('set role service_role');
    await db.query('select save_programme_participant($1,$2,$3,$4,$5,$6)',[programme,employee,'APPROVED',[service],'Eligible','Registered']);
    await db.exec('reset role');
  } finally {await db.close();}
});

test('roster GraphQL mutation validates input, requires platform permission and forwards explicit requirements', async () => {
  const {makeExecutableSchema}=await import('@graphql-tools/schema');
  const {graphql}=await import('graphql');
  const {programmeTypeDefs}=await import('../dist/modules/programmes/programme.schema.js');
  const {programmeResolvers}=await import('../dist/modules/programmes/programme.resolver.js');
  const schema=makeExecutableSchema({typeDefs:['type Query { _empty: Boolean } type Mutation { _empty: Boolean }',programmeTypeDefs],resolvers:programmeResolvers});
  const id='00000000-0000-4000-8000-000000000001';
  const calls=[];
  const client={rpc:async(name,args)=>{calls.push({name,args});return {data:id,error:null};}};
  const context={user:{id},supabase:client,adminSupabase:client,identity:{organisationId:null,organisationRole:null,platformRole:'super_admin'}};
  const input={programmeId:id,employeeId:id,screeningReference:' CODE-A ',requiredServiceIds:[id],eligibilityStatus:'Eligible',registrationStatus:'Registered'};
  const source='mutation($input: ProgrammeParticipantInput!) { saveProgrammeParticipant(input: $input) }';
  const result=await graphql({schema,source,variableValues:{input},contextValue:context});
  assert.equal(result.errors,undefined);assert.equal(result.data.saveProgrammeParticipant,id);
  assert.deepEqual(calls,[{name:'save_programme_participant',args:{p_programme_id:id,p_employee_id:id,p_screening_reference:'CODE-A',p_service_ids:[id],p_eligibility_status:'Eligible',p_registration_status:'Registered'}}]);
  const denied=await graphql({schema,source,variableValues:{input},contextValue:{...context,identity:{organisationId:id,organisationRole:'hr',platformRole:null}}});
  assert.equal(denied.errors[0].extensions.code,'FORBIDDEN');
  const invalid=await graphql({schema,source,variableValues:{input:{...input,screeningReference:' '}},contextValue:context});
  assert.equal(invalid.errors[0].extensions.code,'BAD_USER_INPUT');assert.equal(calls.length,1);
});
