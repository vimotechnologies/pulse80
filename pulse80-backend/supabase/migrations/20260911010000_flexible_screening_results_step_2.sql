-- Step 2: service-specific screening result definitions and values.
-- The legacy screening_results table remains in place during the application transition.

create table public.service_result_fields (
 id uuid primary key default gen_random_uuid(), service_id uuid not null references public.services(id) on delete cascade,
 code text not null, label text not null, data_type text not null check(data_type in ('number','text','boolean','select')),
 unit text, required boolean not null default false, options jsonb, min_value numeric, max_value numeric,
 display_order integer not null default 0, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(service_id,code), check(min_value is null or max_value is null or min_value<=max_value), check(data_type='select' or options is null)
);
create index service_result_fields_service_idx on public.service_result_fields(service_id,display_order);
alter table public.service_result_fields enable row level security; grant select on public.service_result_fields to authenticated; grant all on public.service_result_fields to service_role;
create policy "Authenticated users can read active service result fields" on public.service_result_fields for select to authenticated using(active=true);

create table public.screening_result_values (
 id uuid primary key default gen_random_uuid(), screening_id uuid not null references public.screenings(id) on delete cascade,
 service_result_field_id uuid not null references public.service_result_fields(id) on delete restrict,
 value_number numeric, value_text text, value_boolean boolean, value_code text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(screening_id,service_result_field_id), check(num_nonnulls(value_number,value_text,value_boolean,value_code)=1)
);
create index screening_result_values_screening_idx on public.screening_result_values(screening_id); create index screening_result_values_field_idx on public.screening_result_values(service_result_field_id);
alter table public.screening_result_values enable row level security; grant select on public.screening_result_values to authenticated; grant all on public.screening_result_values to service_role;
create policy "Platform staff can read screening result values" on public.screening_result_values for select to authenticated using(public.is_platform_staff());
create policy "Practitioners can read own screening result values" on public.screening_result_values for select to authenticated using(exists(select 1 from public.screenings s where s.id=screening_result_values.screening_id and s.practitioner_user_id=auth.uid()));

create table public.screening_outcomes (
 screening_id uuid primary key references public.screenings(id) on delete cascade, outcome_summary text, referral_required boolean not null default false,
 escalation_required boolean not null default false, reporting_risk_category text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.screening_outcomes enable row level security; grant select on public.screening_outcomes to authenticated; grant all on public.screening_outcomes to service_role;
create policy "Platform staff can read screening outcomes" on public.screening_outcomes for select to authenticated using(public.is_platform_staff());
create policy "Practitioners can read own screening outcomes" on public.screening_outcomes for select to authenticated using(exists(select 1 from public.screenings s where s.id=screening_outcomes.screening_id and s.practitioner_user_id=auth.uid()));

insert into public.service_result_fields(service_id,code,label,data_type,unit,required,min_value,max_value,display_order) select id,x.code,x.label,x.data_type,x.unit,x.required,x.minv,x.maxv,x.ord from public.services s join (values
 ('BP','SYSTOLIC','Systolic','number','mmHg',true,40::numeric,300::numeric,10),('BP','DIASTOLIC','Diastolic','number','mmHg',true,20,200,20),
 ('BMI','HEIGHT','Height','number','cm',true,50,260,10),('BMI','WEIGHT','Weight','number','kg',true,2,500,20),('BMI','BMI','BMI','number','kg/m²',false,5,100,30),
 ('GLUCOSE','GLUCOSE','Blood glucose','number','mmol/L',true,0.5,50,10),('CHOLESTEROL','CHOLESTEROL','Cholesterol','number','mmol/L',true,0.5,30,10)
) x(service_code,code,label,data_type,unit,required,minv,maxv,ord) on s.code=x.service_code;

insert into public.service_result_fields(service_id,code,label,data_type,required,options,display_order) select s.id,x.code,x.label,x.data_type,x.required,x.options,x.ord from public.services s join (values
 ('OPTICAL','LEFT_VISUAL_ACUITY','Left visual acuity','text',true,null::jsonb,10),('OPTICAL','RIGHT_VISUAL_ACUITY','Right visual acuity','text',true,null::jsonb,20),('OPTICAL','CORRECTIVE_LENSES','Corrective lenses','boolean',false,null::jsonb,30),('OPTICAL','EYE_CONCERN','Eye concern identified','boolean',false,null::jsonb,40),
 ('DENTAL','ORAL_HEALTH_STATUS','Oral health status','select',true,'["Good","Fair","Poor"]'::jsonb,10),('DENTAL','CAVITIES_IDENTIFIED','Cavities identified','boolean',false,null::jsonb,20),('DENTAL','TREATMENT_REQUIRED','Treatment required','boolean',false,null::jsonb,30),('DENTAL','URGENT_TREATMENT','Urgent treatment','boolean',false,null::jsonb,40),
 ('AUDIOLOGY','LEFT_HEARING_RESULT','Left ear hearing result','select',true,'["Within expected range","Possible hearing loss","Further assessment required"]'::jsonb,10),('AUDIOLOGY','RIGHT_HEARING_RESULT','Right ear hearing result','select',true,'["Within expected range","Possible hearing loss","Further assessment required"]'::jsonb,20),
 ('PODIATRY','FOOT_HEALTH_STATUS','Foot health status','select',true,'["No concern","Monitor","Treatment recommended"]'::jsonb,10),('PODIATRY','FOOT_CONCERN','Foot concern identified','boolean',false,null::jsonb,20),
 ('STRESS','ASSESSMENT_TOOL','Assessment tool','text',true,null::jsonb,10),('STRESS','SCORE','Assessment score','number',true,null::jsonb,20),('STRESS','CLASSIFICATION','Assessment classification','text',true,null::jsonb,30),('STRESS','SUPPORT_RECOMMENDED','Support recommended','boolean',false,null::jsonb,40),
 ('NUTRITION','NUTRITION_STATUS','Nutrition status','text',true,null::jsonb,10),('NUTRITION','NUTRITION_RISK','Nutrition risk identified','boolean',false,null::jsonb,20),
 ('PHYSIO','MSK_FINDING','Musculoskeletal finding','text',true,null::jsonb,10),('PHYSIO','PAIN_PRESENT','Pain present','boolean',false,null::jsonb,20),('PHYSIO','MOBILITY_CONCERN','Mobility concern identified','boolean',false,null::jsonb,30),
 ('MUSCULOSKELETAL_RISK','MSK_FINDING','Musculoskeletal finding','text',true,null::jsonb,10),('MUSCULOSKELETAL_RISK','PAIN_PRESENT','Pain present','boolean',false,null::jsonb,20),('MUSCULOSKELETAL_RISK','MOBILITY_CONCERN','Mobility concern identified','boolean',false,null::jsonb,30)
) x(service_code,code,label,data_type,required,options,ord) on s.code=x.service_code;

-- Existing sample records were labelled as musculoskeletal screenings but contain general-health measurements.
-- Preserve those values as legacy fields instead of misrepresenting them as musculoskeletal findings.
insert into public.service_result_fields(service_id,code,label,data_type,unit,display_order) select s.id,x.code,x.label,'number',x.unit,x.ord from public.services s join (values
 ('MUSCULOSKELETAL_RISK','LEGACY_SYSTOLIC','Legacy systolic','mmHg',900),('MUSCULOSKELETAL_RISK','LEGACY_DIASTOLIC','Legacy diastolic','mmHg',910),('MUSCULOSKELETAL_RISK','LEGACY_GLUCOSE','Legacy blood glucose','mmol/L',920),('MUSCULOSKELETAL_RISK','LEGACY_CHOLESTEROL','Legacy cholesterol','mmol/L',930),('MUSCULOSKELETAL_RISK','LEGACY_HEIGHT','Legacy height','cm',940),('MUSCULOSKELETAL_RISK','LEGACY_WEIGHT','Legacy weight','kg',950),('MUSCULOSKELETAL_RISK','LEGACY_BMI','Legacy BMI','kg/m²',960)
) x(service_code,code,label,unit,ord) on s.code=x.service_code;

insert into public.screening_result_values(screening_id,service_result_field_id,value_number)
select sr.screening_id,f.id,v.val from public.screening_results sr join public.screenings sc on sc.id=sr.screening_id join public.services svc on svc.id=sc.service_id and svc.code='MUSCULOSKELETAL_RISK'
cross join lateral (values ('LEGACY_SYSTOLIC',sr.systolic_mmhg::numeric),('LEGACY_DIASTOLIC',sr.diastolic_mmhg::numeric),('LEGACY_GLUCOSE',sr.glucose_mmol_l::numeric),('LEGACY_CHOLESTEROL',sr.cholesterol_mmol_l::numeric),('LEGACY_HEIGHT',sr.height_cm::numeric),('LEGACY_WEIGHT',sr.weight_kg::numeric),('LEGACY_BMI',sr.bmi::numeric)) v(code,val)
join public.service_result_fields f on f.service_id=svc.id and f.code=v.code where v.val is not null;
insert into public.screening_outcomes(screening_id,escalation_required,reporting_risk_category) select screening_id,escalation_required,risk_level from public.screening_results;