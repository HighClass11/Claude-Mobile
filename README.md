# ShaneOS — CEO Operating System

ShaneOS is not a CRM. It's a personal CEO operating system for running Cepher
Wealth Group. Every screen answers one question: **what should Shane do next
to grow the business?** The dashboard, pipeline, appointments, and every
other view are ranked by the same priority engine, from Priority 1 (revenue
now) down to Priority 4 (CEO work) — see `src/lib/priority.ts`.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + hand-built shadcn/ui-style primitives (`src/components/ui`)
- Supabase (Postgres + Auth + Row-Level Security + Realtime)
- React Router, Framer Motion, lucide-react, date-fns

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com), then run the migration in
   `supabase/migrations/0001_init.sql` against it (SQL Editor, or the Supabase CLI:
   `supabase db push`). This creates every table, enum, and Row-Level Security
   policy — each user only ever sees their own data.

3. **Copy the env file and fill in your project's credentials** (Project Settings → API):

   ```bash
   cp .env.example .env
   ```

4. **(Optional) seed demo data.** Sign up a user through the app once, grab
   that user's `id` from the Supabase Auth dashboard, then run
   `supabase/seed.sql` with that id substituted for `:owner`.

5. **Run the app**

   ```bash
   npm run dev
   ```

## Deploying to Netlify

`netlify.toml` is already configured (`npm run build`, publish `dist`, SPA
redirect). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Netlify
environment variables and connect the repo — no other configuration needed.

## How the priority engine works

Every actionable record — a pipeline record, an appointment, a task, a
campaign responsibility, a CEO project, an idea — is normalized into a single
`WorkItem` shape (`src/lib/priority.ts`). WorkItems are ranked by one cascade
that mirrors the product spec:

```
Today's Appointment → Recommendation Today → Application Ready →
Client Waiting → Appointment Tomorrow → Lead Follow-up →
Campaign Task → CEO Project → Ideas
```

Every screen — the Home Dashboard's "Today's One Thing" and "Do This Next",
the Morning Brief, notifications — reads from this same ranked list instead
of inventing its own rules. A manual pin (`settings.pinned_one_thing_work_item_id`)
always overrides the automatic pick.

Pipeline records without a `next_action` are flagged red as incomplete
everywhere they appear (`needsNextAction` on `WorkItem`, the red badge on the
Pipeline page) — "nothing exists without a next action."

## Data model

See `supabase/migrations/0001_init.sql` for the full schema. Core entities:
`profiles`, `pipeline_records` (leads through clients — see the note in the
migration on why these aren't two separate tables), `tasks`, `appointments`,
`campaigns`, `projects`, `ideas`, `waiting_items`, `revenue_goals` /
`revenue_entries`, `daily_scorecards`, `settings`. Every table is owned by
`owner_user_id` and locked down with RLS so a user only ever sees their own
rows — the schema already supports multiple users, even though ShaneOS today
is single-tenant for Shane.

## Adding a future module (CampaignOS, ClientOS, AcademyOS, FamilyOS,
## FinanceOS, KnowledgeOS)

ShaneOS is deliberately structured so a new "OS" can plug in without
rebuilding the app:

- **Data**: add new tables in their own migration file
  (`supabase/migrations/000N_<module>.sql`), owned by `owner_user_id` with the
  same RLS pattern as every existing table.
- **Types & data access**: add domain types to `src/types/domain.ts` and a
  hook in `src/hooks/entities/index.ts` using the existing
  `useSupabaseTable<Row, Insert, Update>` generic — no new data-fetching
  pattern needed.
- **Priority integration**: if the module produces actionable work, add a
  `classify<Module>Item` function in `src/lib/priority.ts` and a new entry in
  `CATEGORY_ORDER` at the tier/rank that reflects its business priority. It
  will automatically show up in Today's One Thing, Do This Next, the
  dashboard feeds, and notifications — nothing else has to change.
- **UI**: add pages under `src/pages`, register routes in `src/App.tsx`, and
  add a nav entry in `src/components/layout/nav.ts`.
- **Notifications**: extend the narrow rule set in `src/lib/notifications.ts`
  only if the module has a genuinely urgent trigger — the design intent is to
  avoid notification overload, not add a channel per module.

## Design principles

Light theme, mobile-first, large cards, minimal text — an executive planner,
not a developer dashboard. Every element should reduce decision fatigue: if a
screen makes Shane think harder instead of making a decision easier, it
should be redesigned.
