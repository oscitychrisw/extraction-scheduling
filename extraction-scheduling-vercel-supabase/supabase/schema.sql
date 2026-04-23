create table public.employees (
  id uuid primary key,
  name text not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employee_competencies (
  employee_id uuid not null references public.employees(id) on delete cascade,
  competency_name text not null,
  primary key (employee_id, competency_name)
);

create table public.employee_shift_availability (
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_code text not null,
  primary key (employee_id, shift_code)
);

create table public.schedule_weeks (
  week_key text primary key,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.schedule_assignments (
  week_key text not null references public.schedule_weeks(week_key) on delete cascade,
  day_name text not null,
  shift_code text not null,
  slot_code text not null,
  employee_id uuid references public.employees(id),
  assigned_by text,
  assigned_at timestamptz,
  primary key (week_key, day_name, shift_code, slot_code)
);
