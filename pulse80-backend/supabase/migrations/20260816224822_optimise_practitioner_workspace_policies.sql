create index practitioner_assignments_organisation_idx
  on public.practitioner_assignments(organisation_id);

drop policy "Practitioners can read own professional profile" on public.practitioner_profiles;
drop policy "Platform staff can read practitioner profiles" on public.practitioner_profiles;
create policy "Authorised users can read practitioner profiles"
on public.practitioner_profiles for select to authenticated
using ((select auth.uid()) = user_id or public.is_platform_staff());

drop policy "Practitioners can read own capabilities" on public.practitioner_capabilities;
drop policy "Platform staff can read practitioner capabilities" on public.practitioner_capabilities;
create policy "Authorised users can read practitioner capabilities"
on public.practitioner_capabilities for select to authenticated
using ((select auth.uid()) = practitioner_user_id or public.is_platform_staff());

drop policy "Practitioners can read own assignments" on public.practitioner_assignments;
drop policy "Platform staff can read practitioner assignments" on public.practitioner_assignments;
create policy "Authorised users can read practitioner assignments"
on public.practitioner_assignments for select to authenticated
using ((select auth.uid()) = practitioner_user_id or public.is_platform_staff());

drop policy "Practitioners can read own documents" on public.practitioner_documents;
drop policy "Platform staff can read practitioner documents" on public.practitioner_documents;
create policy "Authorised users can read practitioner documents"
on public.practitioner_documents for select to authenticated
using ((select auth.uid()) = practitioner_user_id or public.is_platform_staff());
