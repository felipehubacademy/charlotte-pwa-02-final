-- Rate limiting per user for /api/assistant calls
-- Tracks hourly and daily message counts to prevent OpenAI cost explosions

create table if not exists charlotte_rate_limits (
  user_id        uuid        primary key references auth.users(id) on delete cascade,
  -- Hourly window
  hour_count     int         not null default 0,
  hour_window    timestamptz not null default now(),
  -- Daily window
  day_count      int         not null default 0,
  day_date       date        not null default current_date,
  updated_at     timestamptz not null default now()
);

-- RLS: users can only read their own row; inserts/updates done by service role
alter table charlotte_rate_limits enable row level security;

create policy "Users read own rate limit"
  on charlotte_rate_limits for select
  using (auth.uid() = user_id);

-- Service role bypasses RLS by default — no extra policy needed for server writes

-- Index for cleanup jobs (optional, future)
create index if not exists charlotte_rate_limits_day_date_idx
  on charlotte_rate_limits (day_date);
