-- Allow the server to read the source tables used by the security-invoker views.
grant select on public.programme_participants, public.programme_participant_services to service_role;
