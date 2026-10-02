import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("portal record migration persists records and enforces constraints and client isolation", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated; create role service_role;
      create table auth.users(id uuid primary key);
      create table public.organisations(id uuid primary key);
      create table public.practitioner_profiles(user_id uuid primary key);
      insert into auth.users values ('00000000-0000-4000-8000-000000000001');
      insert into organisations values ('00000000-0000-4000-8000-000000000002'), ('00000000-0000-4000-8000-000000000003');
      insert into practitioner_profiles values ('00000000-0000-4000-8000-000000000001');`);
    await db.exec(await readFile(new URL("../supabase/migrations/20260930035954_portal_record_management.sql", import.meta.url), "utf8"));
    await db.exec(`insert into portal_records (kind, organisation_id, title, status, created_by, updated_by)
      values ('report','00000000-0000-4000-8000-000000000002','Quarterly report','Draft','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001');
      update portal_records set status='Published' where title='Quarterly report';`);
    assert.equal((await db.query("select status from portal_records")).rows[0].status, "Published");
    await assert.rejects(() => db.exec("update portal_records set amount=1"), /portal_record_amount/);
    await assert.rejects(() => db.exec("update portal_records set status='Paid'"), /portal_record_status/);
    await assert.rejects(() => db.exec("update portal_records set kind='payment',amount=10,status='Pending'"), /portal_record_recipient/);
    await db.exec(`insert into organisation_units(id,organisation_id,kind,name) values ('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000002','branch','Main branch');`);
    await assert.rejects(() => db.exec(`insert into organisation_units(organisation_id,parent_id,kind,name) values ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000004','department','Other tenant');`), /foreign key/);
    const grants = await db.query("select has_table_privilege('authenticated','portal_records','select') as readable, relrowsecurity from pg_class where oid='portal_records'::regclass");
    assert.equal(grants.rows[0].readable, false); assert.equal(grants.rows[0].relrowsecurity, true);
  } finally { await db.close(); }
});
