
create table employees (
  employee_id      text primary key,
  organisation_id  text not null,
  branch_id        text,
  department_id    text
);

create table participations (
  participation_id text primary key,
  employee_id      text not null,
  programme_id     text not null
);

create table screenings (
  screening_id          text primary key,
  participation_id      text not null,
  programme_service_id  text,
  practitioner_id       text,
  status                text not null,
  screened_at           text not null
);

create table risk_assessments (
  risk_assessment_id text primary key,
  screening_id        text not null,
  risk_level           text not null,
  requires_referral    integer not null   -- 1 = true, 0 = false
);

create table referrals (
  referral_id         text primary key,
  risk_assessment_id  text not null,
  status               text not null
);

create table measurements (
  measurement_id     text primary key,
  screening_id       text not null,
  metric_code        text not null,
  numeric_value      real,
  validation_status  text
);

create table follow_ups (
  follow_up_id  text primary key,
  referral_id   text not null,
  outcome       text
);

-- ---------------------------------------------------------------------
-- Test data: Org A (6 employees, incl. a duplicate screening and two
-- excluded-status screenings) + Org B (2 employees, isolation control)
-- ---------------------------------------------------------------------
insert into employees values
 ('emp-a1','org-a',NULL,NULL),
 ('emp-a2','org-a',NULL,NULL),
 ('emp-a3','org-a',NULL,NULL),
 ('emp-a4','org-a',NULL,NULL),
 ('emp-a5','org-a',NULL,NULL),
 ('emp-a6','org-a',NULL,NULL),
 ('emp-b1','org-b',NULL,NULL),
 ('emp-b2','org-b',NULL,NULL);

insert into participations values
 ('part-a1','emp-a1','prog-a'),
 ('part-a2','emp-a2','prog-a'),
 ('part-a3','emp-a3','prog-a'),
 ('part-a4','emp-a4','prog-a'),
 ('part-a5','emp-a5','prog-a'),
 ('part-a6','emp-a6','prog-a'),
 ('part-b1','emp-b1','prog-b'),
 ('part-b2','emp-b2','prog-b');

insert into screenings (screening_id, participation_id, programme_service_id, status, screened_at) values
 ('scr-a1','part-a1','ps-a','completed','2026-09-01 09:00:00'),
 ('scr-a1-dup','part-a1','ps-a','completed','2026-09-01 09:02:00'),  -- duplicate test
 ('scr-a2','part-a2','ps-a','completed','2026-09-01 09:05:00'),
 ('scr-a2b','part-a2','ps-a','pending','2026-09-01 10:00:00'),       -- excluded-status test
 ('scr-a3','part-a3','ps-a','completed','2026-09-01 09:10:00'),
 ('scr-a3b','part-a3','ps-a','invalidated','2026-09-01 10:05:00'),   -- excluded-status test
 ('scr-a4','part-a4','ps-a','completed','2026-09-01 09:15:00'),
 ('scr-a5','part-a5','ps-a','completed','2026-09-01 09:20:00'),      -- missing-referral test
 ('scr-a6','part-a6','ps-a','completed','2026-09-01 09:25:00'),      -- out-of-range measurement test
 ('scr-b1','part-b1','ps-b','completed','2026-09-01 09:00:00'),
 ('scr-b2','part-b2','ps-b','completed','2026-09-01 09:05:00');

insert into measurements values
 ('m-a1','scr-a1','systolic_bp',118,'valid'),
 ('m-a1-dup','scr-a1-dup','systolic_bp',118,'valid'),
 ('m-a2','scr-a2','systolic_bp',145,'valid'),
 ('m-a3','scr-a3','systolic_bp',150,'valid'),
 ('m-a4','scr-a4','systolic_bp',160,'valid'),
 ('m-a5','scr-a5','systolic_bp',NULL,'invalid'),   -- empty-data test
 ('m-a6','scr-a6','systolic_bp',999,'invalid'),    -- out-of-range test
 ('m-b1','scr-b1','systolic_bp',158,'valid'),
 ('m-b2','scr-b2','systolic_bp',132,'valid');

insert into risk_assessments values
 ('ra-a1','scr-a1','low',0),
 ('ra-a2','scr-a2','moderate',0),
 ('ra-a3','scr-a3','high',1),
 ('ra-a4','scr-a4','critical',1),
 ('ra-a5','scr-a5','high',1),
 ('ra-a6','scr-a6','low',0),
 ('ra-b1','scr-b1','high',1),
 ('ra-b2','scr-b2','high',1);

insert into referrals values
 ('ref-a3','ra-a3','completed'),
 ('ref-a4','ra-a4','scheduled'),
 -- ra-a5's required referral intentionally missing (known-exception test)
 ('ref-b1','ra-b1','completed'),
 ('ref-b2','ra-b2','completed');

insert into follow_ups values
 ('fu-1','ref-a3','completed'),
 ('fu-2','ref-b1','completed'),
 ('fu-3','ref-b2','completed');
 -- ref-a4 (scheduled) intentionally has no follow-up -> should be "open"
