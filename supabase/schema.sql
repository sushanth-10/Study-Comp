create table if not exists users (
  id bigserial primary key,
  full_name text not null,
  email text unique not null,
  password_hash text not null default '',
  avatar_url text not null default '',
  provider text not null default 'local',
  timezone text not null default 'Asia/Calcutta',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists study_sessions (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  subject text not null,
  topic text not null,
  duration_minutes integer not null default 25,
  focus_score double precision not null default 75,
  productivity_score double precision not null default 70,
  fatigue_score double precision not null default 30,
  interruptions integer not null default 0,
  completed boolean not null default true,
  session_type text not null default 'study',
  started_at timestamptz not null default now(),
  ended_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quizzes (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  topic text not null,
  subject text not null default 'General',
  difficulty text not null default 'moderate',
  score double precision not null default 0,
  total_questions integer not null default 10,
  confidence_avg double precision not null default 0.7,
  response_time_avg double precision not null default 18,
  fatigue_indicator double precision not null default 0.25,
  weak_areas jsonb not null default '[]'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcards (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  subject text not null,
  topic text not null,
  front text not null,
  back text not null,
  mnemonic text not null default '',
  difficulty double precision not null default 0.4,
  mastery double precision not null default 0.5,
  next_review_on timestamptz not null default now(),
  interval_days integer not null default 1,
  recall_strength double precision not null default 0.5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcard_reviews (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  flashcard_id bigint not null references flashcards(id) on delete cascade,
  rating integer not null default 3,
  response_ms integer not null default 5000,
  was_correct boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moods (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  stress integer not null default 3,
  motivation integer not null default 4,
  fatigue integer not null default 3,
  confidence integer not null default 4,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notes (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  title text not null,
  subject text not null default 'General',
  content text not null,
  summary text not null default '',
  tags jsonb not null default '[]'::jsonb,
  bookmarked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists planners (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  exam_date date,
  available_hours double precision not null default 2,
  weak_topics jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  guidance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists adaptive_states (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  subject text not null default 'General',
  mastery_level double precision not null default 0.5,
  fatigue_level double precision not null default 0.3,
  confidence_level double precision not null default 0.6,
  learning_velocity double precision not null default 0.5,
  weak_topics jsonb not null default '[]'::jsonb,
  preferred_study_window text not null default 'morning',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists analytics (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  period text not null default 'weekly',
  accuracy double precision not null default 0,
  mastery_score double precision not null default 0,
  weekly_improvement double precision not null default 0,
  consistency_score double precision not null default 0,
  cognitive_engagement double precision not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists focus_logs (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  session_id bigint references study_sessions(id) on delete set null,
  uninterrupted_minutes double precision not null default 25,
  interruptions integer not null default 0,
  idle_seconds integer not null default 0,
  tab_switches integer not null default 0,
  focus_quality_score double precision not null default 75,
  cognitive_engagement_score double precision not null default 72,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists fatigue_logs (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  session_id bigint references study_sessions(id) on delete set null,
  fatigue_score double precision not null default 30,
  burnout_risk double precision not null default 20,
  frustration_index double precision not null default 18,
  recommended_action text not null default 'continue',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mastery_scores (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  subject text not null,
  topic text not null,
  mastery_score double precision not null default 0,
  confidence_score double precision not null default 0,
  revision_priority integer not null default 3,
  attempt_count integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists performance_metrics (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  subject text not null default 'General',
  topic text not null default 'General',
  accuracy double precision not null default 0,
  completion_rate double precision not null default 0,
  response_speed double precision not null default 0,
  confidence_trend double precision not null default 0,
  retry_frequency double precision not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recommendations (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  category text not null default 'study',
  recommended_topic text not null default '',
  reason text not null default '',
  recommended_session_length integer not null default 30,
  priority integer not null default 2,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists streaks (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  streak_type text not null default 'daily',
  current_value integer not null default 0,
  best_value integer not null default 0,
  milestone_label text not null default '',
  engagement_prediction double precision not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
