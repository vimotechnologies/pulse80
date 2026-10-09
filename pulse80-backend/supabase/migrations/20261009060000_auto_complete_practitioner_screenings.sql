-- Complete practitioner screening captures only after their results have been persisted.
DO $migration$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO definition
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='capture_screening_with_result';
  IF definition IS NULL OR position('  return screening_id;' in definition)=0 THEN
    RAISE EXCEPTION 'Unexpected capture_screening_with_result definition';
  END IF;
  definition := replace(definition,'  return screening_id;', E'  update public.screenings set status = \'Completed\' where id = screening_id;\n  return screening_id;');
  EXECUTE definition;

  SELECT pg_get_functiondef(p.oid) INTO definition
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='resubmit_screening_with_result';
  IF definition IS NULL OR position('  return p_screening_id;' in definition)=0 THEN
    RAISE EXCEPTION 'Unexpected resubmit_screening_with_result definition';
  END IF;
  definition := replace(definition,'  return p_screening_id;', E'  update public.screenings set status = \'Completed\' where id = p_screening_id;\n  return p_screening_id;');
  EXECUTE definition;
END
$migration$;
