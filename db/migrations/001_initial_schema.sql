create extension if not exists "uuid-ossp";

create table if not exists sources (
  id text primary key,
  name text not null,
  kind text not null,
  homepage_url text not null,
  reliability_score int not null check (reliability_score between 0 and 100),
  language text not null default 'en',
  country text not null default 'GLOBAL',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists raw_items (
  id text primary key,
  source_id text not null references sources(id),
  source_name text not null,
  title text not null,
  url text not null unique,
  summary text not null,
  published_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  author text,
  image_url text,
  content_hash text not null unique,
  signals jsonb not null default '{}'::jsonb
);

create table if not exists topics (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  category text not null,
  keywords text[] not null default '{}',
  status text not null default 'new',
  source_ids text[] not null default '{}',
  raw_item_ids text[] not null default '{}',
  trend_score int not null default 0,
  novelty_score int not null default 0,
  risk text not null default 'low',
  cooldown_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists topic_sources (
  topic_id text not null references topics(id) on delete cascade,
  raw_item_id text not null references raw_items(id) on delete cascade,
  source_id text not null references sources(id),
  confidence numeric(4,3) not null default 0.7,
  primary key (topic_id, raw_item_id)
);

create table if not exists fact_claims (
  id text primary key,
  topic_id text not null references topics(id) on delete cascade,
  claim text not null,
  source_raw_item_ids text[] not null,
  confidence numeric(4,3) not null,
  risk text not null default 'low',
  created_at timestamptz not null default now()
);

create table if not exists articles (
  id text primary key,
  topic_id text not null references topics(id),
  slug text not null unique,
  title text not null,
  meta_description text not null,
  dek text not null,
  content_markdown text not null,
  summary_bullets text[] not null default '{}',
  eli5_markdown text not null,
  social_pack jsonb not null default '{}'::jsonb,
  video_script text not null default '',
  image_prompt text not null default '',
  tags text[] not null default '{}',
  category text not null,
  author_name text not null,
  status text not null default 'draft',
  risk text not null default 'low',
  quality_score int not null default 0,
  sources jsonb not null default '[]'::jsonb,
  reading_minutes int not null default 1,
  hero_image_url text,
  canonical_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content_versions (
  id uuid primary key default uuid_generate_v4(),
  article_id text not null references articles(id) on delete cascade,
  title text not null,
  content_markdown text not null,
  change_reason text not null,
  created_by text not null default 'system',
  created_at timestamptz not null default now()
);

create table if not exists quality_reports (
  id text primary key,
  article_id text not null references articles(id) on delete cascade,
  topic_id text not null references topics(id) on delete cascade,
  score int not null check (score between 0 and 100),
  passed boolean not null,
  reasons text[] not null default '{}',
  checks jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists review_tasks (
  id text primary key,
  article_id text not null references articles(id) on delete cascade,
  topic_id text not null references topics(id) on delete cascade,
  title text not null,
  reason text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  created_at timestamptz not null default now()
);

create table if not exists media_assets (
  id text primary key,
  article_id text references articles(id) on delete set null,
  topic_id text references topics(id) on delete set null,
  kind text not null,
  prompt text not null,
  url text not null,
  provider text not null,
  attribution text not null,
  created_at timestamptz not null default now()
);

create table if not exists distribution_jobs (
  id text primary key,
  article_id text not null references articles(id) on delete cascade,
  channel text not null,
  payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null,
  status text not null default 'dry_run',
  utm_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists subscribers (
  id text primary key,
  email text not null unique,
  topics text[] not null default '{}',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id text primary key,
  actor text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create index if not exists idx_raw_items_published_at on raw_items(published_at desc);
create index if not exists idx_topics_status_score on topics(status, trend_score desc);
create index if not exists idx_articles_status_published on articles(status, published_at desc);
create index if not exists idx_quality_reports_article on quality_reports(article_id, created_at desc);
create index if not exists idx_review_tasks_status on review_tasks(status, priority, created_at);
create index if not exists idx_distribution_jobs_status_time on distribution_jobs(status, scheduled_for);
