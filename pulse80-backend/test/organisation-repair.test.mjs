import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const migration = await readFile(new URL('../supabase/migrations/20261004120000_repair_organisation_contacts_and_locations.sql', import.meta.url), 'utf8');
const permissionsMigration = await readFile(new URL('../supabase/migrations/20261004130000_grant_organisation_rpc_update.sql', import.meta.url), 'utf8');

async function setup(applyMigration = true) {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create table public.organisations (
      id uuid primary key default gen_random_uuid(), name text, slug text, industry text, country text,
      primary_location text, region text, workforce_size integer, package_name text,
      contract_start date, contract_end date, status text, custom_package_notes text
    );
    create table public.organisation_contacts (
      id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
      full_name text not null, role_label text not null, email text not null, phone text,
      preferred_method text not null, is_primary boolean not null default false, notes text
    );
    create unique index organisation_contacts_one_primary_idx on public.organisation_contacts(organisation_id) where is_primary;
    grant all on all tables in schema public to service_role;
  `);
  if (applyMigration) {
    await db.exec(migration);
    await db.exec(permissionsMigration);
  }
  return db;
}

test('migration moves urban labels out of Botswana district values', async () => {
  const db = await setup(false);
  try {
    const legacy = [
      ['Francistown', 'North-East'], ['Gaborone', 'South-East'], ['Jwaneng', 'Southern'],
      ['Lobatse', 'South-East'], ['Selebi-Phikwe', 'Central'], ['Sowa Town', 'Central'],
    ];
    for (const [region] of legacy) await db.query('insert into organisations(country,region,primary_location) values (\'Botswana\',$1,$1)', [region]);
    await db.exec(migration);
    for (const [region, expected] of legacy) {
      const actual = (await db.query('select region from organisations where primary_location=$1', [region])).rows[0].region;
      assert.equal(actual, expected);
    }
    await db.exec(migration);
    assert.equal((await db.query("select region from organisations where primary_location='Gaborone'")).rows[0].region, 'South-East');
  } finally {
    await db.close();
  }
});

test('organization and contact changes save atomically and maintain one primary contact', async () => {
  const db = await setup();
  try {
    const { rows: [org] } = await db.query("insert into organisations(name,country,region,primary_location) values ('Before','Botswana','South-East','Gaborone') returning id");
    const { rows: [contact] } = await db.query("insert into organisation_contacts(organisation_id,full_name,role_label,email,preferred_method,is_primary) values ($1,'First Contact','HR','first@example.com','Email',true) returning id", [org.id]);
    const save = (fields, contacts) => db.query('select save_admin_organisation($1,$2::jsonb,$3::jsonb)', [org.id, JSON.stringify(fields), contacts === null ? null : JSON.stringify(contacts)]);
    await save({ name: 'Updated' }, [
      { id: contact.id, name: 'Primary Contact', role_label: 'HR Lead', email: 'primary@example.com', method: 'Email', primary: true },
      { name: 'Second Contact', role_label: 'Operations', email: 'second@example.com', method: 'Phone', primary: false },
    ]);
    assert.equal((await db.query('select name from organisations where id=$1', [org.id])).rows[0].name, 'Updated');
    assert.deepEqual((await db.query('select full_name,is_primary from organisation_contacts where organisation_id=$1 order by full_name', [org.id])).rows, [
      { full_name: 'Primary Contact', is_primary: true },
      { full_name: 'Second Contact', is_primary: false },
    ]);

    await assert.rejects(save({ name: 'Must Roll Back' }, [
      { id: contact.id, name: 'First', role_label: 'HR', email: 'first@example.com', method: 'Email', primary: false },
    ]), /Exactly one primary contact/);
    assert.equal((await db.query('select name from organisations where id=$1', [org.id])).rows[0].name, 'Updated');
    await db.exec('set role service_role');
    await save({ name: 'Service Role Update' }, [
      { id: contact.id, name: 'Primary Contact', role_label: 'HR Lead', email: 'primary@example.com', method: 'Email', primary: true },
      { name: 'Second Contact', role_label: 'Operations', email: 'second@example.com', method: 'Phone', primary: false },
    ]);
    await db.exec('reset role');
    assert.equal((await db.query('select name from organisations where id=$1', [org.id])).rows[0].name, 'Service Role Update');
    assert.equal((await db.query("select has_function_privilege('authenticated','save_admin_organisation(uuid,jsonb,jsonb)','execute') allowed")).rows[0].allowed, false);
    assert.equal((await db.query("select has_table_privilege('service_role','organisations','update') allowed")).rows[0].allowed, true);
  } finally {
    await db.close();
  }
});