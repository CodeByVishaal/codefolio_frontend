# DevPulse — Frontend Phase F-4 Documentation
## Analytics · Private Profile · Public Profile · Dashboard

> Complete line-by-line reference for every file in F-4 as actually built and debugged.
> Includes all fixes applied during development. Written for TypeScript beginners.

---

## Table of Contents

1. [What F-4 Adds](#what-f-4-adds)
2. [New TypeScript and React Concepts in F-4](#new-typescript-and-react-concepts-in-f-4)
3. [Backend API Contract — What the Endpoints Actually Expect](#backend-api-contract)
4. [src/types/analytics.ts](#srctypesanalyticsts)
5. [src/lib/api/analytics.ts](#srclibapianalalyticsts) ← includes the 422 fix
6. [src/lib/api/profile.ts](#srclibapirofilts)
7. [src/hooks/useAnalytics.ts](#srchooksuseanalyticsts)
8. [src/hooks/useProfile.ts](#srchooksuseprofilets)
9. [src/components/profile/StatCard.tsx](#srccomponentsprofilestatcardtsx)
10. [src/components/analytics/StreakCards.tsx](#srccomponentsanalyticsstreakcardstsx)
11. [src/components/analytics/DailyBarChart.tsx](#srccomponentsanalyticsdailybarcharts)
12. [src/components/analytics/ActivityHeatmap.tsx](#srccomponentsanalyticsactivityheatmaptsx)
13. [src/components/analytics/ProjectDonutChart.tsx](#srccomponentsanalyticsprojectdonutcharttsx)
14. [src/pages/Analytics.tsx](#srcpagesanalyticstsx)
15. [src/pages/Profile.tsx](#srcpagesprofiletsx)
16. [src/pages/PublicProfile.tsx](#srcpagespublicprofiletsx)
17. [src/pages/Dashboard.tsx](#srcpagesdashboardtsx) ← full rewrite
18. [src/App.tsx — Changes Only](#srcapptsx--changes-only)
19. [The 422 Bug — Root Cause and Fix](#the-422-bug--root-cause-and-fix)
20. [Data Flow Diagrams](#data-flow-diagrams)
21. [Patterns Cheat Sheet](#patterns-cheat-sheet)

---

## What F-4 Adds

| Feature | Description |
|---|---|
| Analytics page | Streak cards, 30-day bar chart, 15-week heatmap, per-project donut chart |
| Private Profile | Your own stats, inline name editor, link to public profile |
| Public Profile | Anyone can view — no auth required. Shows public projects and journal entries |
| Dashboard rewrite | Live data from all hooks, week chart, recent sessions/projects, quick actions |
| 422 fix | Frontend now sends `date_from` + `date_to` instead of `?days=N` |
| Field name fix | `duration_mins` → `total_mins`, `session_count` → `total_sessions` in types |
| `project_title` fix | Backend returns title directly — removed `projectMap` lookup |

---

## New TypeScript and React Concepts in F-4

---

### `useMemo` — Expensive Computations Cached Between Renders

```typescript
const openTasks = useMemo(
  () => tasks.filter(t => !['done', 'cancelled'].includes(t.status)).length,
  [tasks]
);
```

`useMemo(fn, deps)` runs `fn` once and **caches the result**. It only recomputes when a value in `deps` changes. Without it, `tasks.filter(...)` would run on every render — including renders caused by unrelated state changes like hovering a button.

The rule: if a computation loops over data or involves sorting/filtering, put it in `useMemo`. Simple property accesses and arithmetic don't need it.

---

### Multiple Hooks on One Page

```typescript
const { projects,  isLoading: projLoading  } = useProjects();
const { tasks,     isLoading: taskLoading  } = useTasks();
const { sessions,  summary,
        isLoading: sessLoading  } = useSessions();
const { entries,   isLoading: journLoading } = useJournal();
const { data: analyticsData,
        isLoading: analyticsLoading         } = useAnalytics();
```

F-4 pages call up to five hooks simultaneously. Each hook manages its own fetch, loading state, and error state independently. This means:
- If analytics is slow, the rest of the dashboard still loads
- If sessions fail, only the sessions section shows an error — not the whole page
- Each skeleton/empty state is scoped to its own data

**Rename on destructure** — `isLoading: projLoading` extracts `isLoading` from the hook and renames it `projLoading`. All five hooks return `isLoading` — without renaming, you'd have five variables all named `isLoading` which is a compile error.

---

### `useEffect` Without a Custom Hook — Direct Fetch

```typescript
useEffect(() => {
  if (!userId) return;
  setIsLoading(true);
  profileApi.public(userId)
    .then(setProfile)
    .catch(() => setError('Profile not found.'))
    .finally(() => setIsLoading(false));
}, [userId]);
```

`PublicProfile.tsx` fetches data directly in a `useEffect` instead of through a custom hook. This is appropriate because:
- The public profile page only reads data — it never creates, updates, or deletes
- There's no shared state to manage — this data is local to the page
- A full hook (`usePublicProfile`) would be overkill for a read-only page

The pattern `.then().catch().finally()` is equivalent to `try/catch/finally` but written in the Promise chain style.

---

### `new Date()` Date Arithmetic

```typescript
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
```

`new Date()` creates a Date object for the current moment.
`d.getDate()` returns the day-of-month number (1–31).
`d.setDate(d.getDate() - n)` subtracts `n` days. JavaScript handles month and year rollovers automatically — subtracting 5 days from March 2nd correctly gives February 25th.
`.toISOString().split('T')[0]` extracts `"YYYY-MM-DD"`.

This is how we compute `date_from` on the fly — e.g. "30 days ago" — without a date library.

---

### Recharts `<Cell>` — Per-Bar Colouring

```typescript
<Bar dataKey="hours" radius={[3, 3, 0, 0]}>
  {chartData.map((entry, i) => (
    <Cell
      key={i}
      fill={entry.hours > 0 ? 'var(--primary)' : 'var(--muted)'}
      opacity={entry.hours > 0 ? 0.85 : 0.35}
    />
  ))}
</Bar>
```

By default, all bars in a Recharts `BarChart` have the same colour. To colour them individually, render one `<Cell>` per data point inside `<Bar>`. Each `Cell` receives its own `fill` and `opacity`. Days with data get teal; days with no data get a dim grey placeholder.

`radius={[3, 3, 0, 0]}` rounds the top-left and top-right corners of each bar (top corners only — `[topLeft, topRight, bottomRight, bottomLeft]`).

---

### `as keyof typeof` — Safe Object Lookup with Unknown Strings

```typescript
const statusCfg = projectStatusConfig[project.status as keyof typeof projectStatusConfig]
  ?? { label: project.status, className: '' };
```

In `PublicProfile.tsx`, the project status comes from the API as a plain `string`. `projectStatusConfig` is keyed by `ProjectStatus` (a specific union type). TypeScript won't let you use a plain `string` as an index into a `Record<ProjectStatus, ...>` — it's too loose.

`project.status as keyof typeof projectStatusConfig` tells TypeScript: "trust me, this string is a valid key". `keyof typeof projectStatusConfig` evaluates to `ProjectStatus`.

The `?? { label: project.status, className: '' }` fallback handles any future status values the backend adds that the frontend doesn't know about yet — instead of crashing, it shows the raw status string.

---

## Backend API Contract

Before the frontend code, it's important to understand exactly what the backend endpoints accept and return. The 422 errors happened because the frontend assumed a different contract.

### Analytics endpoints (from `analytics.py`)

```
GET /api/v1/analytics/daily
  Required query params: date_from (YYYY-MM-DD), date_to (YYYY-MM-DD)
  Returns: DailyActivity[]

GET /api/v1/analytics/weekly
  Required query params: date_from (YYYY-MM-DD), date_to (YYYY-MM-DD)
  Returns: WeeklyActivity[]

GET /api/v1/analytics/projects
  Optional query params: date_from, date_to
  Returns: ProjectBreakdown[]

GET /api/v1/analytics/streak           ← NOTE: "streak" not "streaks"
  No params
  Returns: StreakData
```

### What the backend returns (from `analytics_service.py`)

`DailyActivity` schema:
```
date, total_mins, total_hours, total_sessions
```
— note `total_mins` and `total_sessions` (not `duration_mins` or `session_count`)

`ProjectBreakdown` schema:
```
project_id, project_title, total_mins, total_hours, total_sessions
```
— note `project_title` is already included — no frontend lookup needed

---

## src/types/analytics.ts

All TypeScript type definitions for analytics and profile data. These were updated after the 422 debugging to match the actual backend schema.

```typescript
export interface DailyActivity {
  date:           string;   // "2024-06-15"
  total_mins:     number;   // ← was duration_mins — corrected to match backend
  total_hours:    number;   // backend pre-computes this
  total_sessions: number;   // ← was session_count — corrected to match backend
}
```

`total_hours: number` — the backend's `_to_hours()` helper computes `round(mins / 60, 1)` in Python and returns it directly. The frontend doesn't need to divide — it just displays the value.

```typescript
export interface WeeklyActivity {
  week_start:     string;  // "2024-06-10" — Monday of that ISO week
  total_mins:     number;
  total_hours:    number;
  total_sessions: number;
}
```

`week_start` is the Monday of each calendar week. The backend uses PostgreSQL's `date_trunc('week', ...)` which always truncates to Monday regardless of locale.

```typescript
export interface StreakData {
  current_streak:  number;
  longest_streak:  number;
  last_coded_date: string | null;  // null if user has never logged a session
}
```

`last_coded_date: string | null` — the backend returns `dates[0] if dates else None`. In TypeScript, Python's `None` becomes `null`. Always guard against this: `streaks?.last_coded_date ?? 'Never'`.

```typescript
export interface ProjectActivity {
  project_id:     number;
  project_title:  string;   // ← backend returns this directly via SQL JOIN
  total_mins:     number;
  total_hours:    number;
  total_sessions: number;
}
```

`project_title: string` — the backend does a `JOIN` with the `Project` table and returns the title in the same query. The original F-4 plan required building a `projectMap` lookup on the frontend. Since the title comes directly, the lookup is unnecessary and was removed.

```typescript
export interface AnalyticsData {
  streaks:     StreakData;
  daily:       DailyActivity[];
  weekly:      WeeklyActivity[];
  per_project: ProjectActivity[];
}
```

`AnalyticsData` is the local aggregate type — not a backend schema. `useAnalytics` assembles this from four separate API calls and stores it as one piece of state.

```typescript
export interface PrivateProfile {
  id:                    number;
  name:                  string;
  email:                 string;
  role:                  'admin' | 'developer';
  is_verified:           boolean;
  created_at:            string;
  total_projects:        number;
  total_sessions:        number;
  total_hours:           number;
  total_tasks_completed: number;
}
```

`role: 'admin' | 'developer'` — a string literal union. The backend's `UserRole` enum serialises to its `.value` — the string `"admin"` or `"developer"`. We match that exactly.

`total_hours: number` — the backend's `get_me()` service function computes `round(total_mins / 60, 1)` and returns it directly in `MeResponse`.

```typescript
export interface PublicStats {
  total_projects:        number;
  total_public_projects: number;
  total_sessions:        number;
  total_hours:           number;
  total_tasks_completed: number;
}

export interface PublicProfile {
  id:           number;
  name:         string;
  member_since: string;
  stats:        PublicStats;
  projects: {
    id:          number;
    title:       string;
    description: string | null;
    status:      string;
    tags:        string[];
    updated_at:  string;
  }[];
  journal: {
    id:         number;
    title:      string;
    body:       string;
    tags:       string[];
    updated_at: string;
  }[];
}
```

`projects` and `journal` use **inline type definitions** — the shape is declared directly in the interface instead of extracting it into a separate named interface. This is fine for types that are only used in one place and are straightforward enough to read inline.

`member_since` — the public profile endpoint returns `created_at` under the alias `member_since`. We don't expose `created_at` directly to avoid confusion about whether it's the user's join date or something else.

---

## src/lib/api/analytics.ts

This file was the source of the 422 errors. The fix: compute the required `date_from` and `date_to` strings on the frontend rather than sending custom parameters like `?days=30` that the backend never defined.

```typescript
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
```

A **pure utility function** defined outside the API object. Given `n=30`, it creates a `Date` for today, subtracts 30 days, and returns the date as `"YYYY-MM-DD"`.

Why it lives outside the object: it has no dependencies on API state, and placing it at module level means it's created once and reused, not recreated on every call.

```typescript
function today(): string {
  return new Date().toISOString().split('T')[0];
}
```

Returns today's date as `"YYYY-MM-DD"`. Used as the `date_to` parameter in every analytics call.

```typescript
export const analyticsApi = {

  daily: async (days = 30): Promise<DailyActivity[]> => {
    const res = await api.get<DailyActivity[]>('/analytics/daily', {
      params: {
        date_from: daysAgo(days),
        date_to:   today(),
      },
    });
    return res.data;
  },
```

`days = 30` — a **default parameter**. If you call `analyticsApi.daily()` with no argument, `days` is `30`. If you call `analyticsApi.daily(7)`, `days` is `7`.

The second argument to `api.get()` is a **config object**. The `params` key tells Axios to append the object as URL query parameters. `{ date_from: '2024-05-16', date_to: '2024-06-15' }` becomes `?date_from=2024-05-16&date_to=2024-06-15` — exactly what the backend's `date = Query(description="...")` parameters expect.

```typescript
  weekly: async (weeks = 12): Promise<WeeklyActivity[]> => {
    const res = await api.get<WeeklyActivity[]>('/analytics/weekly', {
      params: {
        date_from: daysAgo(weeks * 7),
        date_to:   today(),
      },
    });
    return res.data;
  },
```

`weeks * 7` converts weeks to days. 12 weeks = 84 days. `daysAgo(84)` computes the exact date 84 days ago. The backend receives real dates — it never knows whether we originally thought in "weeks" or "days".

```typescript
  streaks: async (): Promise<StreakData> => {
    const res = await api.get<StreakData>('/analytics/streak');
    return res.data;
  },
```

`/analytics/streak` — singular, not plural. The backend router in `analytics.py` defines `@router.get("/streak")`. This was a bug in the original F-4 plan (used `/streaks`) that was corrected during debugging.

```typescript
  projects: async (): Promise<ProjectActivity[]> => {
    const res = await api.get<ProjectActivity[]>('/analytics/projects');
    return res.data;
  },
};
```

No date params here — `GET /analytics/projects` treats date range as optional (`Optional[date]` in FastAPI). Omitting both gives the all-time breakdown, which is what the donut chart shows.

---

## src/lib/api/profile.ts

```typescript
export const profileApi = {

  me: async (): Promise<PrivateProfile> => {
    const res = await api.get<PrivateProfile>('/users/me');
    return res.data;
  },
```

`/users/me` — hits the FastAPI endpoint protected by `get_current_user` dependency injection. The access token cookie is sent automatically by Axios (`withCredentials: true`). Returns the full private profile with stats.

```typescript
  updateMe: async (data: { name: string }): Promise<PrivateProfile> => {
    const res = await api.patch<PrivateProfile>('/users/me', data);
    return res.data;
  },
```

`{ name: string }` — an **inline type** for the patch body. We only allow updating the name from the frontend. Email changes require an email verification flow (Phase F-5 territory). The backend should only accept `name` in this PATCH endpoint.

```typescript
  public: async (userId: number): Promise<PublicProfile> => {
    const res = await api.get<PublicProfile>(`/users/${userId}/public`);
    return res.data;
  },
};
```

`/users/${userId}/public` — this endpoint requires **no authentication** on the backend side. In FastAPI, it uses no `Depends(get_current_user)`. This is why `PublicProfile.tsx` uses the raw API directly rather than going through the Axios instance's refresh interceptor — though the interceptor won't cause problems either way since it only triggers on 401 responses.

---

## src/hooks/useAnalytics.ts

The most network-intensive hook in the app — four parallel HTTP calls on mount.

```typescript
const EMPTY_STREAKS: StreakData         = { current_streak: 0, longest_streak: 0, last_coded_date: null };
const EMPTY_DAILY:   DailyActivity[]    = [];
const EMPTY_WEEKLY:  WeeklyActivity[]   = [];
const EMPTY_PROJECTS: ProjectActivity[] = [];
```

**Module-level constants** for safe default values. These are created once when the module loads and never recreated. They're used as fallbacks when the API returns `null` or `undefined` (which shouldn't happen with a well-behaved backend, but defensive programming prevents crashes).

`const EMPTY_STREAKS: StreakData = { ... }` — the type annotation ensures the object matches the `StreakData` interface exactly. If you add a field to `StreakData` later and forget to add it here, TypeScript shows an error.

```typescript
export function useAnalytics(): UseAnalyticsReturn {
  const [data,      setData]      = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
```

`useState<AnalyticsData | null>(null)` — starts as `null` because we don't have any data yet. Components that consume this hook check `data && ...` before rendering charts. The alternative would be to initialise with empty arrays, but `null` explicitly signals "not yet loaded" vs "loaded but empty".

```typescript
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [streaks, daily, weekly, perProject] = await Promise.all([
        analyticsApi.streaks(),
        analyticsApi.daily(30),
        analyticsApi.weekly(12),
        analyticsApi.projects(),
      ]);
```

`Promise.all([...])` fires all four requests simultaneously. The total loading time is the slowest of the four — not their sum. On a typical connection, four ~50ms requests complete in ~50ms total (parallel), not ~200ms (sequential).

Array destructuring: `const [streaks, daily, weekly, perProject]` — the four variables receive the resolved values in the same order as the input array.

```typescript
      setData({
        streaks:     streaks     ?? EMPTY_STREAKS,
        daily:       daily       ?? EMPTY_DAILY,
        weekly:      weekly      ?? EMPTY_WEEKLY,
        per_project: perProject  ?? EMPTY_PROJECTS,
      });
```

`?? EMPTY_STREAKS` — the nullish coalescing operator. If `streaks` is `null` or `undefined`, use `EMPTY_STREAKS` instead. This protects against edge cases where one API call returns no data without throwing an error.

Note `per_project` (snake_case) — this matches the `AnalyticsData` interface field name. The local variable is `perProject` (camelCase) but the object key is `per_project` to match the interface.

---

## src/hooks/useProfile.ts

```typescript
export function useProfile(): UseProfileReturn {
  const [profile,   setProfile]   = useState<PrivateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await profileApi.me();
      setProfile(data);
    } catch {
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);
```

Standard hook fetch pattern — identical structure to `useProjects` and `useJournal`. The `useCallback([])` with empty deps means `fetchProfile` is created once and never recreated.

```typescript
  const updateName = async (name: string): Promise<void> => {
    if (!profile) return;
    const updated = await profileApi.updateMe({ name });
    setProfile(updated);
  };
```

`if (!profile) return` — early guard. If somehow `updateName` is called before the profile loads (shouldn't happen since the button is only rendered when `profile` exists, but defensive programming), we exit immediately rather than crashing.

No optimistic update here — unlike deletes, a name change is simple enough that we wait for the server response. The UI shows a loading state (managed in `Profile.tsx`) and updates only when the server confirms.

`setProfile(updated)` — replaces the entire profile with the fresh response from the server. This ensures fields the backend might update (like `updated_at`) are reflected immediately.

---

## src/components/profile/StatCard.tsx

```typescript
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon:  LucideIcon;
  label: string;
  value: string | number;
  sub?:  string;
}
```

`LucideIcon` — the TypeScript type exported by Lucide that describes a Lucide icon component. Using this type means `icon` can receive any Lucide icon (`Clock`, `FolderKanban`, etc.) but not an arbitrary React component. This prevents misuse.

`value: string | number` — stats can be either. `profile.total_hours` is a float like `3.5` (number), but you might pass `"3.5h"` (string) to include the unit. Both are valid.

`sub?: string` — the optional sub-label (e.g. "h" for hours, showing as `3.5 h`). The `?` means the component works with or without it.

```typescript
export function StatCard({ icon: Icon, label, value, sub }: StatCardProps) {
```

`icon: Icon` — rename on destructure. The prop is called `icon` in the interface, but React components must start with a capital letter. Renaming to `Icon` during destructuring makes `<Icon />` valid JSX.

```typescript
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon size={15} className="text-primary" />
        </div>
```

`bg-primary/10` — teal background at 10% opacity. The icon sits inside a softly tinted square, providing visual grouping without heavy colour.

`shrink-0` — prevents the icon container from shrinking in flex layouts when space is tight. Without this, on narrow screens the icon would compress and the card would look broken.

---

## src/components/analytics/StreakCards.tsx

```typescript
interface StreakCardsProps {
  streaks: StreakData;
}

export function StreakCards({ streaks }: StreakCardsProps) {
  const { current_streak, longest_streak } = streaks;
```

Destructures `current_streak` and `longest_streak` directly from `streaks` prop. Inside the component, referring to `current_streak` is cleaner than `streaks.current_streak`.

```typescript
      <Card className={current_streak > 0 ? 'border-primary/30' : ''}>
```

Conditional border — when there's an active streak, a subtle teal border highlights the card. When there's no streak (`current_streak === 0`), no extra border class is added (empty string `''` adds nothing).

```typescript
            <Flame
              size={15}
              className={current_streak > 0 ? 'text-orange-400' : 'text-muted-foreground/40'}
            />
```

The flame icon is orange when the streak is active, dimmed to 40% opacity when there's no streak. This gives an immediate visual signal — the user sees at a glance whether they have momentum.

```typescript
          <p className="mt-1 text-xs text-muted-foreground">
            {current_streak === 1 ? 'day' : 'days'}
            {current_streak === 0 && ' — code today to start one'}
          </p>
```

`current_streak === 1 ? 'day' : 'days'` — singular vs plural. "1 day" not "1 days".

`current_streak === 0 && ' — code today to start one'` — encouragement message that only appears when there's no streak. `false && 'string'` produces `false`, which React renders as nothing. `true && 'string'` renders the string.

---

## src/components/analytics/DailyBarChart.tsx

```typescript
function buildChartData(daily: DailyActivity[]) {
  const map = new Map(daily.map((d) => [d.date, d]));
```

`new Map(daily.map((d) => [d.date, d]))` — constructs a `Map` from an array of `[key, value]` pairs. The backend only returns days that have sessions. By putting them in a `Map` keyed by date string, we can do O(1) lookups when building the 30-day grid.

`Map` is used instead of a plain object because Map preserves insertion order and handles string keys more predictably.

```typescript
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const activity = map.get(dateStr);
    result.push({
      date:   dateStr,
      label:  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours:  activity ? +(activity.total_mins / 60).toFixed(1) : 0,
      mins:   activity?.total_mins ?? 0,
    });
  }
```

The loop builds a full 30-day array regardless of which days have data. `i=29` is 29 days ago (oldest); `i=0` is today. This ensures every day has a bar slot — days without sessions show a dim zero-height bar.

`+(activity.total_mins / 60).toFixed(1)` — converts minutes to hours with one decimal:
- `activity.total_mins / 60` → `1.5`
- `.toFixed(1)` → `"1.5"` (a string)
- `+("1.5")` → `1.5` (back to a number — the `+` unary operator converts string to number)

This is needed because `toFixed()` returns a string, but Recharts needs a number for the `dataKey`.

```typescript
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const { hours, mins } = payload[0].payload;
  if (mins === 0) return null;
```

`payload[0].payload` — Recharts passes the original data object through the tooltip. `payload[0]` is the first (and only, for a single Bar) bar's data. `.payload` accesses the original data object from `chartData`. So `{ hours, mins }` destructures the values we pushed in `buildChartData`.

`if (mins === 0) return null` — don't show a tooltip for zero-day bars. Hovering a grey placeholder bar would show "0h (0 min)" — that's noise, not information.

```typescript
  const xTicks = chartData
    .filter((_, i) => i % 5 === 0 || i === 29)
    .map((d) => d.date);
```

`i % 5 === 0` — the modulo operator. `0 % 5 = 0`, `5 % 5 = 0`, `10 % 5 = 0` — every 5th index. Combined with `i === 29` (the last day = today), this produces tick labels at positions 0, 5, 10, 15, 20, 25, and 29 — six labels across 30 days. Showing all 30 would crowd the axis.

---

## src/components/analytics/ActivityHeatmap.tsx

The most complex component in F-4 — a GitHub-style contribution grid built with pure SVG.

```typescript
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKS = 15;
const CELL  = 13;  // px per cell
const GAP   = 3;   // px gap between cells
const STEP  = CELL + GAP;  // = 16px — total space per cell
```

Module-level constants make the layout math readable. Changing `CELL = 13` to `CELL = 16` would make all cells larger and the entire grid would reflow correctly because every measurement derives from these constants.

```typescript
function cellColor(hours: number): string {
  if (hours === 0)  return 'var(--muted)';
  if (hours < 1)    return 'oklch(0.68 0.13 186 / 0.3)';
  if (hours < 2)    return 'oklch(0.68 0.13 186 / 0.5)';
  if (hours < 3)    return 'oklch(0.68 0.13 186 / 0.7)';
  return                   'oklch(0.68 0.13 186 / 1.0)';
}
```

A step function that maps hours to colour intensity. `oklch(0.68 0.13 186)` is the DevPulse teal. The fourth value is opacity: 0.3, 0.5, 0.7, 1.0 — four levels of intensity from pale to full teal.

`var(--muted)` for zero days — uses the design system's neutral muted colour, which adapts to dark/light mode automatically.

```typescript
function buildGrid(daily: DailyActivity[]) {
  const map = new Map(daily.map((d) => [d.date, d.duration_mins / 60]));
```

**Note**: this accesses `d.duration_mins`. In the heatmap, `daily` is passed from `useAnalytics`'s `data.daily`, which uses the corrected `DailyActivity` type with `total_mins`. If you see an error here, ensure the field name matches the type — it should be `d.total_mins`.

```typescript
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
```

`getDay()` returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday.

We want weeks to start on Monday. If today is Wednesday (`dayOfWeek = 3`), the most recent Monday is `3 - 1 = 2` days ago. If today is Sunday (`dayOfWeek = 0`), the most recent Monday is `6` days ago. `dayOfWeek === 0 ? 6 : dayOfWeek - 1` handles both cases.

```typescript
  for (let w = WEEKS - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(lastMonday);
      date.setDate(lastMonday.getDate() - (w * 7) + d);
      if (date > today) {
        cells.push({ date: '', hours: -1, label: '' });
        continue;
      }
```

`hours: -1` is the sentinel value for "future day" — a date that hasn't happened yet. The SVG rendering code checks `if (cell.hours === -1) return null` to skip these cells entirely.

`continue` — skips the rest of the loop body for this iteration. Without it, we'd push the cell and then immediately try to format a future date.

```typescript
  const svgWidth  = WEEKS * STEP + 36;
  const svgHeight = 7 * STEP + 24;
```

`WEEKS * STEP + 36` — 15 weeks × 16px/week = 240px for the grid, plus 36px for the day labels on the left.

`7 * STEP + 24` — 7 days × 16px/day = 112px for the grid rows, plus 24px for the month labels on top.

These are exact pixel calculations — if any constant changes, the SVG dimensions update automatically.

```typescript
        {DAYS.map((day, i) => (
          [0, 2, 4, 6].includes(i) && (
            <text ...>{day}</text>
          )
        ))}
```

`[0, 2, 4, 6].includes(i)` — only render labels for Mon, Wed, Fri, Sun (indices 0, 2, 4, 6). Showing all 7 labels would crowd the left margin. The alternating pattern (show, skip, show, skip) keeps it readable.

---

## src/components/analytics/ProjectDonutChart.tsx

```typescript
const SLICE_COLORS = [
  'oklch(0.68 0.13 186)',   // primary teal
  'oklch(0.60 0.12 220)',   // blue-teal
  'oklch(0.72 0.15 145)',   // green
  'oklch(0.75 0.14 80)',    // amber
  'oklch(0.68 0.18 30)',    // coral
  'oklch(0.55 0.10 260)',   // indigo
];
```

Six colours in the DevPulse palette family. `oklch` allows perceptually uniform colour variation — the colours look equally distinct from each other. More than 6 projects collapse into "Other".

```typescript
  const sorted = [...perProject].sort((a, b) => b.total_mins - a.total_mins);
  const top    = sorted.slice(0, 5);
  const rest   = sorted.slice(5);
```

`[...perProject]` — creates a shallow copy before sorting. `Array.sort()` mutates in place — sorting the original array would mutate the state held by the hook, causing unexpected re-renders. Always copy before sorting.

`.sort((a, b) => b.total_mins - a.total_mins)` — descending sort by total minutes. `b - a` is descending; `a - b` would be ascending.

```typescript
  const chartData = [
    ...top.map((p) => ({
      name:     p.project_title,   // ← used directly, no projectMap lookup
      value:    p.total_mins,
      sessions: p.total_sessions,
    })),
    ...(rest.length > 0
      ? [{ name: 'Other', value: rest.reduce((s, p) => s + p.total_mins, 0), sessions: rest.reduce((s, p) => s + p.total_sessions, 0) }]
      : []),
  ];
```

`p.project_title` — this is the key fix from debugging. The backend joins the `Project` table and returns `project_title` in the response. No need to build a `projectMap` on the frontend and look up by ID.

`rest.reduce((s, p) => s + p.total_mins, 0)` — sums the `total_mins` of all "other" projects. `s` is the accumulator (starts at `0`), `p` is the current project.

```typescript
        <Pie
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
```

`innerRadius={60}` and `outerRadius={90}` — creates the donut hole. `innerRadius > 0` makes it a donut; `innerRadius === 0` would make it a full pie. The 30px ring width is readable at the card's size.

`paddingAngle={2}` — a 2-degree gap between slices. Without this, adjacent slices touch and look merged at small sizes.

---

## src/pages/Analytics.tsx

```typescript
  const { data, isLoading, error }  = useAnalytics();
  const { summary }                 = useSessions();
```

`useAnalytics` for chart data, `useSessions` for the summary strip (total hours, sessions, avg). `useSessions` is already fetched by the Sessions page — but React hooks don't cache across pages. When Analytics mounts, `useSessions` fires a fresh fetch.

An optimisation for a later phase: lift `useSessions` to a higher-level context so the data is shared. For now, the duplication is acceptable — the request is fast.

```typescript
  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-40 rounded-lg bg-card animate-pulse" />
        ...
      </div>
    );
  }
```

Analytics uses a **full-page skeleton** (single `if (isLoading) return`) rather than per-section skeletons. This is because all four analytics requests fire in parallel — they all resolve around the same time. A per-section approach would cause a "flash" where sections appear one by one; a full-page skeleton gives way to a complete page at once.

```typescript
      {data && data.daily.length > 0 ? (
        <DailyBarChart daily={data.daily} />
      ) : (
        <div className="flex h-[180px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No sessions in the last 30 days</p>
        </div>
      )}
```

`data && data.daily.length > 0` — two guards:
1. `data` — don't render if still `null` (shouldn't happen after loading, but TypeScript requires the check)
2. `data.daily.length > 0` — show a helpful empty state if there's no recent activity

---

## src/pages/Profile.tsx

```typescript
  const [editing,    setEditing]    = useState(false);
  const [nameInput,  setNameInput]  = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError,  setNameError]  = useState('');
```

Four pieces of state for the inline name editor:
- `editing` — whether the input is shown
- `nameInput` — the current text in the input (separate from the saved name)
- `savingName` — disables buttons while the API call is in flight
- `nameError` — inline validation or API error message

Keeping these separate allows the editor to show the in-progress value without affecting the displayed name until saved.

```typescript
  const startEdit = () => {
    setNameInput(profile?.name ?? '');
    setNameError('');
    setEditing(true);
  };
```

Pre-fills `nameInput` with the current saved name when entering edit mode. Without this, the input would start empty and the user would need to retype their entire name just to fix a typo.

```typescript
    onKeyDown={(e) => {
      if (e.key === 'Enter')  saveName();
      if (e.key === 'Escape') cancelEdit();
    }}
```

Keyboard shortcuts for the inline editor. Enter confirms, Escape cancels. This is the expected behaviour for any inline edit pattern — users familiar with spreadsheets or file renaming will try these keys automatically.

```typescript
  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
```

"Vishal Raj" → `['Vishal', 'Raj']` → `['V', 'R']` → `['V', 'R']` (already ≤2) → `'VR'` → `'VR'`. Already uppercase but `.toUpperCase()` ensures it for names that might have unusual casing.

```typescript
      <Button variant="outline" size="sm" asChild>
        <a href={`/profile/${profile.id}`}>View</a>
      </Button>
```

`asChild` — a shadcn pattern that renders the `Button`'s styles onto the child element (`<a>`) instead of wrapping it in a `<button>`. This creates a properly-styled link that navigates to the public profile page.

`href` (not `to`) — we use a plain `<a>` here because the public profile page is accessible without login and may eventually live on a separate domain. `<Link to="...">` from React Router is for in-app navigation; `<a href="...">` is for absolute URLs or when you want a full page load.

---

## src/pages/PublicProfile.tsx

This page is structurally different from all others — no custom hook, no mutation functions, just a direct fetch on mount.

```typescript
export function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id ?? '0', 10);

  const [profile,   setProfile]   = useState<PublicProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    profileApi.public(userId)
      .then(setProfile)
      .catch(() => setError('Profile not found or not available.'))
      .finally(() => setIsLoading(false));
  }, [userId]);
```

`if (!userId) return` — if `parseInt('0', 10)` produced `0` (no valid ID in URL), don't fire a request. `0` is falsy in JavaScript.

`.then(setProfile)` — shorthand for `.then(data => setProfile(data))`. When the Promise resolves, call `setProfile` with the resolved value. This works because `setProfile` is a function that takes one argument.

`[userId]` dependency array — re-fetch if the URL ID changes. If a user navigates from `/profile/1` to `/profile/2` without unmounting the component, the effect re-fires with the new userId.

```typescript
  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 min-h-[60vh]">
        <Globe size={28} className="text-muted-foreground/30" />
        <p className="text-muted-foreground">{error ?? 'Profile not found.'}</p>
        <Link to="/dashboard" className="text-sm text-primary hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }
```

`error || !profile` — two reasons to show the error state: an explicit error message (404 from backend) or `profile` still being `null` after loading (shouldn't happen but TypeScript requires the check). The `??` operator shows the actual error if available, or a generic message if not.

```typescript
              const statusCfg = projectStatusConfig[project.status as keyof typeof projectStatusConfig]
                ?? { label: project.status, className: '' };
```

`project.status` from the public profile API is typed as `string` (not `ProjectStatus`) because the public profile schema is less strict. `as keyof typeof projectStatusConfig` asserts it's a valid key. The `??` fallback handles unknown statuses gracefully — show the raw string rather than crashing.

---

## src/pages/Dashboard.tsx

The dashboard was completely rewritten from placeholder values to a fully live page. Every section pulls from real data.

### Skeleton component

```typescript
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-card', className)} />
  );
}
```

A local helper component — not imported from shadcn. Each section passes a different `className` to control the skeleton's size and shape, matching the content it replaces. `animate-pulse` applies the breathing animation.

### `fmtDuration` — Duration Formatting

```typescript
function fmtDuration(mins: number): string {
  if (!mins) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
```

`if (!mins)` — handles `0`, `null`, and `undefined` all at once (all falsy). Safer than `if (mins === 0)` for a value that might come from an API with loose typing.

### `greeting` — Time-Based Greeting

```typescript
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
```

`new Date().getHours()` returns the current hour (0–23) in local time. The greeting updates whenever the component mounts (page navigation or browser refresh) — not in real time.

### `useMemo` for Derived Values

```typescript
  const openTasks = useMemo(
    () => tasks.filter(t => !['done', 'cancelled'].includes(t.status)).length,
    [tasks],
  );
```

`['done', 'cancelled'].includes(t.status)` — checks if the task status is in the "closed" set. The `!` negates it — open tasks are those NOT in that set. `useMemo([tasks])` ensures this only recalculates when the tasks array changes.

```typescript
  const weekChart = useMemo(() => {
    const map = new Map(
      (analyticsData?.daily ?? []).map(d => [d.date, d.total_mins])
    );
```

`analyticsData?.daily ?? []` — two guards. `analyticsData?.daily` returns `undefined` if `analyticsData` is `null` (still loading). `?? []` falls back to an empty array. `new Map([])` creates an empty map — the loop then produces seven days all with `mins: 0`.

### Independent Loading per Section

```typescript
  const statCards = [
    {
      label:    'Projects',
      value:    projLoading ? null : projects.length,
      ...
      loading:  projLoading,
    },
    ...
  ];
```

Each card has its own `loading` flag. In the render:

```typescript
              {loading ? (
                <>
                  <Skeleton className="h-7 w-16 mt-1" />
                  <Skeleton className="h-3 w-24 mt-2" />
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold text-foreground">{value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
                </>
              )}
```

If sessions load in 80ms but analytics takes 200ms, the sessions card shows its real value while the analytics-dependent cards still show skeletons. Each section is fully independent.

### The Streak Badge

```typescript
        {!analyticsLoading && streaks && streaks.current_streak > 0 && (
          <Link to="/analytics">
            <div className="inline-flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-sm text-orange-400 hover:bg-orange-500/15 transition-colors">
              <Flame size={14} />
              <span className="font-medium">{streaks.current_streak}-day streak</span>
            </div>
          </Link>
        )}
```

Three conditions before rendering:
1. `!analyticsLoading` — don't flash the badge before we know if there's a streak
2. `streaks` — TypeScript guard for the potentially-null value
3. `streaks.current_streak > 0` — only show when there's an active streak

### Today Highlight in Day Labels

```typescript
                  className={cn(
                    'text-[10px]',
                    d.date === new Date().toISOString().split('T')[0]
                      ? 'font-semibold text-primary'
                      : 'text-muted-foreground/60',
                  )}
```

Compares each day label's date string to today's date string. Today gets `font-semibold text-primary` (bold teal); other days get `text-muted-foreground/60` (dimmed). This anchors the user in the current position on the chart.

### Recent Sessions List

```typescript
                    <div
                      key={session.id}
                      className={cn(
                        'flex items-center justify-between px-4 py-3',
                        !isLast && 'border-b border-border/50',
                      )}
                    >
```

`!isLast && 'border-b border-border/50'` — adds a bottom border between items but not after the last one. `isLast` is `i === recentSessions.length - 1`. Without this, the last item would have a border below it touching the card's padding — a visual glitch.

### Recent Projects with Navigation

```typescript
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors',
                        !isLast && 'border-b border-border/50',
                      )}
                    >
```

Project rows are `<Link>` elements — the entire row is clickable and navigates to the project detail page. Sessions aren't links (there's no session detail page yet), so they use plain `<div>`.

### Quick Actions Strip

```typescript
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Log a session',    href: '/sessions', icon: Terminal    },
          { label: 'New task',         href: '/tasks',    icon: CheckSquare },
          { label: 'Write in journal', href: '/journal',  icon: BookOpen    },
          { label: 'View analytics',   href: '/analytics',icon: TrendingUp  },
        ].map(({ label, href, icon: Icon }) => (
```

An array of action config objects mapped to UI elements — same data-driven pattern as the sidebar nav items. Adding a new quick action means adding one object to the array. The grid is 2-column on mobile, 4-column on `sm:` and above.

---

## src/App.tsx — Changes Only

```typescript
import { Analytics }     from '@/pages/Analytics';
import { Profile }       from '@/pages/Profile';
import { PublicProfile } from '@/pages/PublicProfile';
```

Three new page imports.

```typescript
// Public profile — outside ProtectedRoute
<Route path="/profile/:id" element={<PublicProfile />} />

// Inside ProtectedRoute → DashboardLayout:
<Route path="/analytics" element={<Analytics />} />
<Route path="/profile"   element={<Profile />} />
```

**`/profile/:id` is outside `ProtectedRoute`** — anyone with the URL can view it. No cookies required. The Axios instance still works without cookies for this endpoint because the backend has no `get_current_user` dependency on it.

**`/profile` (no `:id`) is inside `ProtectedRoute`** — it's your own private profile, requires login.

The two routes can coexist because React Router distinguishes `/profile` (exact) from `/profile/:id` (dynamic segment). A user navigating to `/profile/5` gets `PublicProfile`. Navigating to `/profile` gets the private `Profile`.

---

## The 422 Bug — Root Cause and Fix

### What happened

The original `analyticsApi` called:
```
GET /analytics/daily?days=30
GET /analytics/weekly?weeks=12
```

The backend router defined:
```python
@router.get("/daily")
def get_daily(
    date_from: date = Query(description="..."),  # required, no default
    date_to:   date = Query(description="..."),  # required, no default
):
```

FastAPI returned `422 Unprocessable Content` with the error:
```json
{ "type": "missing", "loc": ["query", "date_from"], "msg": "Field required" }
```

The backend never defined `days` or `weeks` as valid parameters. FastAPI ignores unknown query params and then fails validation on the ones that ARE required but missing.

### The fix

Compute the required dates on the frontend:

```typescript
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0]; // "2024-05-16"
}

function today(): string {
  return new Date().toISOString().split('T')[0]; // "2024-06-15"
}

// Now sends ?date_from=2024-05-16&date_to=2024-06-15
daily: async (days = 30) => api.get('/analytics/daily', {
  params: { date_from: daysAgo(days), date_to: today() }
})
```

### Other mismatches fixed at the same time

| Original | Corrected | Why |
|---|---|---|
| `/analytics/streaks` | `/analytics/streak` | Backend router: `@router.get("/streak")` |
| `d.duration_mins` in chart | `d.total_mins` | Backend schema: `DailyActivity.total_mins` |
| `d.session_count` in types | `d.total_sessions` | Backend schema: `DailyActivity.total_sessions` |
| `projectMap[p.project_id]` lookup | `p.project_title` directly | Backend returns title via JOIN |

---

## Data Flow Diagrams

### Analytics Page Load (Four Parallel Requests)

```
User navigates to /analytics
        │
        ▼
Analytics.tsx renders
  useAnalytics() called
    data = null, isLoading = true
        │
        ▼
fetchAll() via useEffect
  Promise.all fires 4 requests simultaneously:
  ┌── GET /analytics/streak    ──┐
  ├── GET /analytics/daily?...  ─┤  all fire at once
  ├── GET /analytics/weekly?... ─┤
  └── GET /analytics/projects  ──┘
        │ (all resolve ~same time)
        ▼
[streaks, daily, weekly, perProject] = results
setData({ streaks, daily, weekly, per_project: perProject })
setIsLoading(false)
        │
        ▼
Full-page skeleton disappears
All sections render simultaneously:
  StreakCards   ← streaks.current_streak, longest_streak
  DailyBarChart ← buildChartData(daily) — fills 30-day grid
  ActivityHeatmap ← buildGrid(daily) — arranges into 15×7 cells
  ProjectDonutChart ← perProject with project_title built-in
```

### Dashboard Live Load (Five Independent Sections)

```
User navigates to /dashboard
        │
        ▼
Dashboard.tsx renders
  5 hooks called:
  useProjects()  → projLoading = true
  useTasks()     → taskLoading = true
  useSessions()  → sessLoading = true
  useJournal()   → journLoading = true
  useAnalytics() → analyticsLoading = true

  All 5 fire their fetches simultaneously

        │ (hooks resolve at different speeds)
        ▼
[~80ms] useSessions resolves:
  summary, sessions available
  sessLoading = false
  → "4h", "3 sessions", "80 min avg" stat cards appear
  → Recent sessions list appears

[~90ms] useProjects, useTasks resolve:
  projLoading = false, taskLoading = false
  → "Projects" and "Open Tasks" stat cards appear
  → Recent projects list appears

[~120ms] useJournal resolves:
  journLoading = false
  → "Journal entries" stat card appears

[~150ms] useAnalytics resolves:
  analyticsLoading = false
  → Week bar chart appears
  → Streak cards appear
  → Streak badge in header appears (if streak > 0)
```

### Public Profile — No Auth Required

```
User navigates to /profile/3
  (could be unauthenticated — no cookies)
        │
        ▼
PublicProfile.tsx renders
  useState: profile = null, isLoading = true
        │
        ▼
useEffect fires:
  profileApi.public(3)
  → GET /api/v1/users/3/public
  (no auth cookie needed — backend has no Depends(get_current_user))
        │
    ┌── Success ─────────────────────────────────┐
    │  .then(setProfile)                         │
    │  profile = { id, name, stats, projects,    │
    │              journal, member_since }        │
    │  .finally: setIsLoading(false)             │
    │                                            │
    │  Renders: avatar, stats, public projects,  │
    │           public journal entries           │
    └────────────────────────────────────────────┘
    OR
    ┌── 404 Not Found ───────────────────────────┐
    │  .catch: setError('Profile not found...')  │
    │  .finally: setIsLoading(false)             │
    │                                            │
    │  Renders: error state with back link       │
    └────────────────────────────────────────────┘
```

### Inline Name Edit Flow

```
Profile page loaded — profile.name = "Vishal"
        │
User clicks pencil icon
  startEdit() fires:
    setNameInput("Vishal")  ← pre-fill with current name
    setEditing(true)        ← show input
        │
        ▼
User edits to "Vishal Raj"
  setNameInput fires on each keystroke
        │
User presses Enter (or clicks ✓)
  saveName() fires:
    if (!nameInput.trim()) → show error, return
    setSavingName(true)     ← disable buttons
    await updateName("Vishal Raj")
        │
        ▼
profileApi.updateMe({ name: "Vishal Raj" })
  → PATCH /api/v1/users/me  body: { name: "Vishal Raj" }
        │
    ┌── Success ──────────────────────────────────┐
    │  setProfile(updated)  ← fresh profile data  │
    │  setEditing(false)    ← hide input          │
    │  setSavingName(false)                       │
    │  Sidebar now shows "Vishal Raj" (reads from │
    │  AuthContext, not useProfile — needs        │
    │  context refresh for sidebar to update)     │
    └─────────────────────────────────────────────┘
    OR
    ┌── Failure ──────────────────────────────────┐
    │  setNameError('Failed to save...')          │
    │  setSavingName(false)                       │
    │  Input stays open — user can retry          │
    └─────────────────────────────────────────────┘
```

---

## Patterns Cheat Sheet

### Computing dates for API calls
```typescript
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
}
```

### Parallel API calls
```typescript
const [a, b, c] = await Promise.all([
  apiA.get(),
  apiB.get(),
  apiC.get(),
]);
// Total time = max(a, b, c) — not a + b + c
```

### useMemo for derived data
```typescript
const computed = useMemo(
  () => expensiveComputation(rawData),
  [rawData]  // only recompute when rawData changes
);
```

### Safe lookup with unknown string key
```typescript
const cfg = myRecord[value as keyof typeof myRecord]
  ?? defaultFallback;
```

### Sort without mutating state
```typescript
const sorted = [...original].sort((a, b) => b.value - a.value);
//              ^^^^^^^^^^^^ shallow copy first
```

### Direct fetch in useEffect (read-only pages)
```typescript
useEffect(() => {
  if (!id) return;
  setLoading(true);
  api.get(id)
    .then(setData)
    .catch(() => setError('Not found.'))
    .finally(() => setLoading(false));
}, [id]);
```

### Per-item Recharts colouring
```typescript
<Bar dataKey="value">
  {data.map((entry, i) => (
    <Cell key={i} fill={entry.value > 0 ? '#active' : '#inactive'} />
  ))}
</Bar>
```

---

*End of Phase F-4 Documentation*
*Phase F-5 will cover: Email verification · TOTP/QR 2FA · Password reset*
