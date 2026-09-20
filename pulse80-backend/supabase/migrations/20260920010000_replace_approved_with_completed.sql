begin;

alter table public.screenings
  drop constraint if exists screenings_status_check;

alter table public.screenings
  drop constraint if exists screenings_review_state_check;

update public.screenings
set status = 'Completed'
where status = 'Approved';

alter table public.screenings
  add constraint screenings_status_check
  check (
    status in (
      'Draft',
      'Under Review',
      'Approved',
      'Completed',
      'Needs Correction'
    )
  );

alter table public.screenings
  add constraint screenings_review_state_check
  check (
    (
      status in ('Approved', 'Completed', 'Needs Correction')
      and reviewed_at is not null
    )
    or status in ('Draft', 'Under Review')
  );

create or replace function public.review_screening_with_errors(
  p_screening_id uuid,
  p_reviewer_id uuid,
  p_status text,
  p_review_note text,
  p_errors jsonb,
  p_reviewed_at timestamptz
)
returns uuid
language plpgsql
set search_path = ''
as $$
begin
  if p_status not in ('Completed', 'Needs Correction') then
    raise exception 'Invalid review status.';
  end if;

  if p_status = 'Needs Correction' and jsonb_array_length(p_errors) = 0 then
    raise exception 'At least one correction error is required.';
  end if;

  update public.screenings
  set
    status = p_status,
    review_note = p_review_note,
    reviewed_by = p_reviewer_id,
    reviewed_at = p_reviewed_at
  where id = p_screening_id
    and status = 'Under Review';

  if not found then
    raise exception 'Screening is not awaiting review.';
  end if;

  update public.screening_correction_errors
  set resolved_at = p_reviewed_at
  where screening_id = p_screening_id
    and resolved_at is null;

  if p_status = 'Needs Correction' then
    insert into public.screening_correction_errors (
      screening_id,
      field_name,
      message,
      returned_at
    )
    select
      p_screening_id,
      item->>'field',
      item->>'message',
      p_reviewed_at
    from jsonb_array_elements(p_errors) item;
  end if;

  return p_screening_id;
end;
$$;

commit;