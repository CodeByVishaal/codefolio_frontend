# DevPulse — Frontend Phase F-3 Documentation
## Sessions + Journal — Complete Line-by-Line Reference

> Every file, every function, every decision in Phase F-3 explained.
> Written for TypeScript beginners continuing from F-2.

---

## Table of Contents

1. [What F-3 Adds Over F-2](#what-f-3-adds-over-f-2)
2. [New TypeScript Concepts in F-3](#new-typescript-concepts-in-f-3)
3. [src/types/sessions.ts](#srctypessessionsts)
4. [src/lib/api/sessions.ts](#srclibapissessionsts)
5. [src/lib/api/journal.ts](#srclibapijournalts)
6. [src/hooks/useSessions.ts](#srchooksusesessionsts)
7. [src/hooks/useJournal.ts](#srchooksusejournalts)
8. [src/components/sessions/SessionFormModal.tsx](#srccomponentssessionssessionformmodaltsx)
9. [src/components/sessions/SessionCard.tsx](#srccomponentssessionssessioncardtsx)
10. [src/components/journal/JournalFormModal.tsx](#srccomponentsjournaljournalformmodaltsx)
11. [src/components/journal/JournalCard.tsx](#srccomponentsjournaljournalcardtsx)
12. [src/pages/Sessions.tsx](#srcpagessessionstsx)
13. [src/pages/Journal.tsx](#srcpagesjournaltsx)
14. [src/App.tsx — Changes Only](#srcapptsx--changes-only)
15. [Architectural Decisions Explained](#architectural-decisions-explained)
16. [Data Flow Diagrams](#data-flow-diagrams)

---

## What F-3 Adds Over F-2

| Concern | F-2 approach | F-3 approach |
|---|---|---|
| Status values | String literal unions, statusConfig lookup | Same pattern — no status for sessions; `is_public` boolean for journal |
| Tags | Stored in backend, normalised `|| []` | Same normalisation; journal tags auto-lowercased on write |
| Data fetching | Single resource per hook | `useSessions` fetches list + summary in **parallel** with `Promise.all` |
| Duration storage | N/A | Stored as integer minutes; form splits into hours + minutes inputs |
| Filter data source | Static filter values | Journal tag filter built **dynamically** from actual data using `useMemo` |
| `project.title` | Correctly used in F-2 | Carried forward — project dropdowns in sessions use `p.title` |
| Defensive normalisation | `tags: p.tags || []` | Same pattern for sessions notes, journal tags |
| Summary stats | Dashboard placeholders | `SessionSummary` type + live stats strip on Sessions page |

---

## New TypeScript Concepts in F-3

---

### `Promise.all` — Parallel Async Calls

```typescript
const [sessionData, summaryData] = await Promise.all([
  sessionsApi.list(),
  sessionsApi.summary(),
]);
```

`Promise.all` takes an array of Promises and returns a single Promise that resolves when **all** of them complete. The results come back in the same order as the inputs.

**Why parallel?** If you wrote:
```typescript
const sessionData = await sessionsApi.list();      // wait ~100ms
const summaryData = await sessionsApi.summary();   // wait ~100ms after
```
Total wait: ~200ms. Sequential.

With `Promise.all`, both requests fire simultaneously:
```
Request A: [────────────] 100ms
Request B: [────────────] 100ms
Total:      [────────────] 100ms
```
Total wait: ~100ms. Twice as fast.

The result is **array destructuring** — `[sessionData, summaryData]` unpacks the resolved values in order. `sessionData` gets the result of `sessionsApi.list()` and `summaryData` gets the result of `sessionsApi.summary()`.

---

### `useMemo` — Computed Values That Don't Recalculate on Every Render

```typescript
const allTags = useMemo(() => {
  const tagSet = new Set<string>();
  entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}, [entries]);
```

`useMemo(fn, deps)` runs `fn` and caches the result. It only recalculates when values in `deps` change. Since `entries` is only updated when the journal data loads or changes, `allTags` is only recomputed when entries actually change — not on every keystroke, hover, or other re-render trigger.

Without `useMemo`: collecting all tags would loop through every entry and every tag on **every single render**. With large data sets this becomes a performance problem.

`Set<string>` — a JavaScript `Set` automatically deduplicates values. If three entries all have the tag `'react'`, the Set only stores one `'react'`. `Array.from(tagSet)` converts it back to an array so we can call `.sort()`.

---

### `Math.floor` and `%` — Breaking Down Minutes

```typescript
const h = Math.floor(session.duration_mins / 60);
const m = session.duration_mins % 60;
```

The backend stores duration as total integer minutes (e.g. `90`). The form shows separate hours and minutes fields.

`Math.floor(90 / 60)` → `Math.floor(1.5)` → `1` (drop the decimal, always round down).

`90 % 60` → `30` (the remainder after dividing by 60).

So 90 minutes → 1 hour, 30 minutes.

The reverse — converting back to total minutes for the API call:
```typescript
const totalMins = parseInt(hours || '0', 10) * 60 + parseInt(minutes || '0', 10);
```
1 hour + 30 minutes = `1 * 60 + 30` = `90`.

---

### `new Date().toISOString().split('T')[0]` — Today's Date as a String

```typescript
setSessionDate(new Date().toISOString().split('T')[0]);
```

`new Date()` — current moment.
`.toISOString()` → `"2024-06-15T10:30:00.000Z"` — full ISO 8601 string.
`.split('T')` → `["2024-06-15", "10:30:00.000Z"]` — splits on the `T` separator.
`[0]` → `"2024-06-15"` — take just the date portion.

The backend's `session_date` field expects this exact format — date only, no time.

---

### `Set<string>` — Deduplication Without Manual Checking

```typescript
const tagSet = new Set<string>();
entries.forEach(e => e.tags.forEach(t => tagSet.add(t)));
```

A `Set` is a collection that stores each value at most once. Adding `'react'` ten times still results in one `'react'` in the Set. This is more efficient than manually checking `if (!array.includes(tag))` before pushing.

`Set<string>` — the generic type annotation tells TypeScript this Set holds strings.

---

### Inline Checkbox Without shadcn

```tsx
<div
  role="checkbox"
  aria-checked={isPublic}
  onClick={() => setIsPublic(!isPublic)}
  className={`h-4 w-4 rounded border cursor-pointer ${
    isPublic ? 'bg-primary border-primary' : 'border-border'
  }`}
>
  {isPublic && <svg>...checkmark path...</svg>}
</div>
```

The journal form uses a manually built checkbox instead of shadcn's `<Checkbox>` component. The `role="checkbox"` and `aria-checked` attributes maintain accessibility — screen readers announce this as a checkbox. `!isPublic` flips the boolean value each click.

---

## src/types/sessions.ts

One file holds types for **both** sessions and journal entries. They're related domain concepts — developer activity tracking — so keeping them together is cleaner than two tiny files.

```typescript
export interface CodingSession {
  id:            number;
  user_id:       number;
  project_id:    number | null;
  duration_mins: number;
  session_date:  string;
  notes:         string | null;
  created_at:    string;
}
```

`project_id: number | null` — a session doesn't require a linked project. `null` means "no project associated". This is different from optional (`?`) — the field is always present in the API response, but its value can be `null`.

`duration_mins: number` — always an integer (the backend's `Integer` column type). Never a float. We convert to hours/minutes for display only.

`session_date: string` — format `"2024-06-15"`. A date-only string with no time or timezone. Always append `'T00:00:00'` when constructing a `Date` object for display.

`notes: string | null` — optional free-text. The backend returns `null` if the user didn't provide notes.

```typescript
export interface SessionCreateInput {
  duration_mins: number;
  session_date:  string;
  project_id?:   number | null;
  notes?:        string;
}
```

`project_id?: number | null` — doubly flexible. The `?` means the field can be omitted entirely. `number | null` means if you do include it, you can explicitly send `null` to clear it.

```typescript
export interface SessionSummary {
  total_mins:     number;
  total_hours:    number;
  total_sessions: number;
  per_project: {
    project_id:     number | null;
    total_mins:     number;
    total_sessions: number;
  }[];
}
```

`SessionSummary` is the shape returned by `GET /sessions/summary`. The `per_project` property is an **inline array type** — an array of objects with the three properties defined right there. Each object represents one project's aggregate stats.

`per_project: { ... }[]` is equivalent to writing:
```typescript
type ProjectBreakdown = { project_id: number | null; total_mins: number; total_sessions: number; };
per_project: ProjectBreakdown[];
```

```typescript
export interface JournalEntry {
  id:         number;
  user_id:    number;
  title:      string;
  body:       string;
  tags:       string[];
  is_public:  boolean;
  created_at: string;
  updated_at: string;
}
```

`body: string` — required, never null. The entry content.

`is_public: boolean` — controls whether this entry appears on the user's public profile. The backend stores this; we toggle it with the checkbox in `JournalFormModal`.

`updated_at: string` — we display `updated_at` (not `created_at`) on cards. If you edit an entry, its card shows when it was last modified — more useful than when it was first written.

```typescript
export interface JournalCreateInput {
  title:      string;
  body:       string;
  tags?:      string[];
  is_public?: boolean;
}

export interface JournalUpdateInput {
  title?:     string;
  body?:      string;
  tags?:      string[];
  is_public?: boolean;
}
```

Create requires `title` and `body` (the minimum viable entry). Update makes everything optional — you can update only the visibility flag without touching the content.

---

## src/lib/api/sessions.ts

```typescript
export const sessionsApi = {

  list: async (params?: {
    project_id?: number;
    date_from?:  string;
    date_to?:    string;
  }): Promise<CodingSession[]> => {
    const res = await api.get<CodingSession[]>('/sessions', { params });
    return res.data;
  },
```

`params?: { ... }` — the entire params argument is optional (the `?` after `params`). If you call `sessionsApi.list()` with no arguments, Axios sends `GET /sessions` with no query string. If you call `sessionsApi.list({ project_id: 3 })`, Axios appends it as `GET /sessions?project_id=3`.

`{ params }` as the second argument to `api.get` — Axios accepts a config object as the second argument. The `params` property tells Axios to serialise the object as URL query parameters. Axios handles the encoding automatically.

```typescript
  summary: async (params?: {
    date_from?: string;
    date_to?:   string;
  }): Promise<SessionSummary> => {
    const res = await api.get<SessionSummary>('/sessions/summary', { params });
    return res.data;
  },
```

`/sessions/summary` — this endpoint is declared **before** `/:id` in the backend router. This is deliberate — FastAPI matches routes top to bottom. If `/:id` were first, `summary` would be treated as the `:id` parameter and the wrong handler would run. The backend's route ordering (`/summary` before `/{session_id}`) is what makes this work.

```typescript
  create: async (data: SessionCreateInput): Promise<CodingSession> => {
    const res = await api.post<CodingSession>('/sessions', data);
    return res.data;
  },

  update: async (id: number, data: SessionUpdateInput): Promise<CodingSession> => {
    const res = await api.patch<CodingSession>(`/sessions/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },
```

Sessions use flat URLs (not nested under projects). Creating a session doesn't require a project ID in the URL — it's an optional field in the request body.

---

## src/lib/api/journal.ts

```typescript
export const journalApi = {

  list: async (params?: {
    tag?:       string;
    is_public?: boolean;
  }): Promise<JournalEntry[]> => {
    const res = await api.get<JournalEntry[]>('/journal', { params });
    return res.data;
  },
```

The backend supports server-side filtering by `tag` and `is_public`. We don't use these query params in the current implementation — we fetch all entries and filter client-side (same pattern as Tasks). This means we could add server-side filtering later without changing the API layer.

```typescript
  get: async (id: number): Promise<JournalEntry> => {
    const res = await api.get<JournalEntry>(`/journal/${id}`);
    return res.data;
  },
```

Journal has a `get` function (single entry by ID) that sessions don't. This is because journal entries might eventually have a full detail page. Sessions don't need one — the card shows all relevant information.

```typescript
  create: async (data: JournalCreateInput): Promise<JournalEntry> => {
    const res = await api.post<JournalEntry>('/journal', data);
    return res.data;
  },

  update: async (id: number, data: JournalUpdateInput): Promise<JournalEntry> => {
    const res = await api.patch<JournalEntry>(`/journal/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/journal/${id}`);
  },
```

Journal CRUD follows the same pattern as projects — flat URLs, PATCH for partial updates.

---

## src/hooks/useSessions.ts

The most interesting hook in F-3 because it manages two interdependent pieces of state: the sessions list and the summary. When you add or delete a session, the summary totals must update too.

```typescript
interface UseSessionsReturn {
  sessions:      CodingSession[];
  summary:       SessionSummary | null;
  isLoading:     boolean;
  error:         string | null;
  createSession: (data: SessionCreateInput) => Promise<CodingSession>;
  updateSession: (id: number, data: SessionUpdateInput) => Promise<CodingSession>;
  deleteSession: (id: number) => Promise<void>;
  refresh:       () => void;
}
```

`summary: SessionSummary | null` — starts as `null` before the first fetch. Components that use summary data check `summary && summary.total_sessions > 0` before rendering stats.

```typescript
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sessionData, summaryData] = await Promise.all([
        sessionsApi.list(),
        sessionsApi.summary(),
      ]);
```

**`Promise.all` for parallel fetching** — both requests fire at the same moment. The hook waits for both to complete before updating state. This is better than two sequential awaits because:
- Both requests are independent — neither depends on the other's result
- The user sees a single loading state, not two sequential spinners
- Total wait time is the slower of the two requests, not the sum

Array destructuring: `const [sessionData, summaryData] = await Promise.all([...])` — the results arrive in the same order as the input array. `sessionData` is the sessions list; `summaryData` is the summary object.

```typescript
      const normalized = sessionData.map((s) => ({
        ...s,
        notes: s.notes || null,
      }));
```

Defensive normalisation — same pattern as `useProjects` with `tags: p.tags || []`. If the backend somehow returns `undefined` for `notes` instead of `null`, this normalises it. We `|| null` instead of `|| []` because `notes` is a string or null, not an array.

```typescript
  const createSession = async (data: SessionCreateInput): Promise<CodingSession> => {
    const newSession = await sessionsApi.create(data);
    setSessions((prev) => [newSession, ...prev]);
    sessionsApi.summary().then(setSummary).catch(() => null);
    return newSession;
  };
```

**The summary refresh after mutation** — after creating a session, the total hours, total sessions, and average all change. We can't just update them locally (we'd have to recalculate totals from scratch). Instead we fire a background `summary()` call and update state when it resolves.

`sessionsApi.summary().then(setSummary).catch(() => null)` — this is a **fire-and-forget** pattern:
- `.then(setSummary)` — when the summary arrives, update state
- `.catch(() => null)` — if it fails, silently ignore (the stats might be slightly stale, but the user can see the updated sessions list)
- No `await` — we don't block the function on this. The session is added to the list immediately; the summary updates a moment later.

```typescript
  const deleteSession = async (id: number): Promise<void> => {
    const previous = sessions;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await sessionsApi.delete(id);
      sessionsApi.summary().then(setSummary).catch(() => null);
    } catch (err) {
      setSessions(previous);
      throw err;
    }
  };
```

Summary refresh is inside the `try` block — only fires after the delete is confirmed. If the delete fails and rolls back, we don't refresh the summary (the data didn't actually change).

---

## src/hooks/useJournal.ts

```typescript
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await journalApi.list();
      const normalized = data.map((e) => ({
        ...e,
        tags: e.tags || [],
      }));
      setEntries(normalized);
```

`e.tags || []` — same defensive pattern as `useProjects`. The backend stores tags as a PostgreSQL ARRAY. If a journal entry was created before tags were implemented, the backend might return `null`. This ensures every entry's `tags` is always a real array.

```typescript
  const createEntry = async (data: JournalCreateInput): Promise<JournalEntry> => {
    const newEntry = await journalApi.create(data);
    const normalized = { ...newEntry, tags: newEntry.tags || [] };
    setEntries((prev) => [normalized, ...prev]);
    return normalized;
  };
```

We normalise the **returned** entry too — not just the initial list fetch. If the newly created entry has `tags: null` from the backend, we fix it before adding to state. This prevents the card from crashing when it tries to render `entry.tags.map(...)`.

```typescript
  const updateEntry = async (id: number, data: JournalUpdateInput): Promise<JournalEntry> => {
    const updated = await journalApi.update(id, data);
    const normalized = { ...updated, tags: updated.tags || [] };
    setEntries((prev) => prev.map((e) => (e.id === id ? normalized : e)));
    return normalized;
  };
```

Same normalisation on update. The updated entry from the backend replaces the old one in the array. Every mutation path normalises — create, update, and fetch all go through the same `|| []` guard.

---

## src/components/sessions/SessionFormModal.tsx

The most interesting modal in F-3 — it converts between the backend's "total minutes" storage and a user-friendly "hours + minutes" input.

```typescript
  const [hours,       setHours]       = useState('0');
  const [minutes,     setMinutes]     = useState('30');
  const [sessionDate, setSessionDate] = useState('');
  const [projectId,   setProjectId]   = useState<string>('none');
  const [notes,       setNotes]       = useState('');
```

`hours` and `minutes` as separate state variables (not one `duration` variable) — this lets the user tab between them naturally and edit each independently.

`useState('30')` not `useState(30)` — the input `value` must be a string to avoid React warnings about controlled/uncontrolled inputs. `type="number"` inputs still bind to string state in React.

`projectId: 'none'` — the string `'none'` is the sentinel value meaning "no project linked". When submitting, we check `projectId !== 'none'` before converting to an integer.

```typescript
  useEffect(() => {
    if (open) {
      if (session) {
        const h = Math.floor(session.duration_mins / 60);
        const m = session.duration_mins % 60;
        setHours(String(h));
        setMinutes(String(m));
        setSessionDate(session.session_date);
        setProjectId(session.project_id ? String(session.project_id) : 'none');
        setNotes(session.notes || '');
      } else {
        setHours('0');
        setMinutes('30');
        setSessionDate(new Date().toISOString().split('T')[0]);
        setProjectId('none');
        setNotes('');
      }
      setError('');
    }
  }, [session, open]);
```

**Create mode defaults:**
- `'0'` hours, `'30'` minutes — 30 minutes is a reasonable default for a coding session
- `new Date().toISOString().split('T')[0]` — today's date. Most sessions are logged on the day they happen.
- `'none'` — no project pre-selected

**Edit mode:** Converts the stored `duration_mins` back to hours + minutes using `Math.floor` and `%`. The user sees "1h 30m" rather than "90 minutes".

```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalMins = parseInt(hours || '0', 10) * 60 + parseInt(minutes || '0', 10);

    if (totalMins <= 0) {
      setError('Session duration must be greater than 0 minutes.');
      return;
    }
```

`hours || '0'` — if the user clears the hours field entirely, `hours` becomes `''`. `parseInt('', 10)` returns `NaN`. `'' || '0'` → `'0'`, so `parseInt('0', 10)` → `0`. This prevents `NaN` from propagating into `totalMins`.

`if (totalMins <= 0)` — catches the case where the user types `0` in both fields. A zero-duration session is meaningless.

```typescript
    const payload = {
      duration_mins: totalMins,
      session_date:  sessionDate,
      project_id:    projectId !== 'none' ? parseInt(projectId, 10) : null,
      notes:         notes.trim() || undefined,
    };
```

`projectId !== 'none' ? parseInt(projectId, 10) : null` — if "No project" was selected, send `null`. The backend stores `null` for `project_id` when no project is linked.

`notes.trim() || undefined` — if notes is empty or only whitespace, send `undefined` rather than `''`. With PATCH semantics, `undefined` means "don't touch this field". An empty string `''` would overwrite existing notes with blank content.

```typescript
        <span className="ml-auto text-xs text-muted-foreground">
          = {(parseInt(hours || '0', 10) * 60 + parseInt(minutes || '0', 10))} mins total
        </span>
```

A live preview that recalculates as the user types. Since `hours` and `minutes` are React state, the component re-renders on every keystroke, and this expression always shows the current total. No extra state or effect needed — it's a derived value computed from existing state.

---

## src/components/sessions/SessionCard.tsx

```typescript
function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
```

A **pure utility function** defined outside the component — it doesn't need access to props or state, so it doesn't belong inside the component body. Defined once, usable anywhere.

`if (mins < 60) return '${mins}m'` — under an hour: "45m".

`m === 0 ? '${h}h' : '${h}h ${m}m'` — exactly on the hour: "2h". Otherwise: "1h 30m". This avoids the ugly "1h 0m" when minutes are zero.

```typescript
  const displayDate = new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
```

`session_date + 'T00:00:00'` — same timezone fix as in `TaskCard`. `"2024-06-15"` parsed as UTC can display as June 14th in some timezones. Appending `'T00:00:00'` forces local-timezone interpretation.

Result: "Jun 15, 2024" — includes the year, appropriate since sessions are historical records.

```typescript
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Clock size={16} className="text-primary" />
              </div>
```

A teal clock icon in a teal-tinted rounded square. This is the **primary visual anchor** of the session card — duration and timing are the most important data points for a coding session record.

```typescript
          {session.notes && (
            <p className="mt-3 text-xs text-muted-foreground line-clamp-2 pl-[52px]">
              {session.notes}
            </p>
          )}
```

`pl-[52px]` — arbitrary Tailwind value. 52px = 40px icon width + 12px gap. This aligns the notes text under the text column (not under the icon), maintaining visual grouping. `line-clamp-2` limits to two lines with an ellipsis.

---

## src/components/journal/JournalFormModal.tsx

```typescript
  const [isPublic, setIsPublic] = useState(false);
```

Starts as `false` — private by default. Users must explicitly choose to make an entry public. This is the safer default — opt-in public, not opt-out.

```typescript
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
```

`.toLowerCase()` on each tag — the backend stores tags lowercase (from its validator). If the user types "React, TypeScript", we normalise to `['react', 'typescript']` before sending. This ensures tag-based filtering works correctly — the backend's `ARRAY contains` query is case-sensitive.

```typescript
      <Textarea
        id="journal-body"
        rows={8}
        className="resize-none font-mono text-sm leading-relaxed"
      />
```

`font-mono` on the body textarea — journal entries often contain code snippets, command line output, or technical notes. Monospace font makes these more readable inline without needing code blocks.

`rows={8}` — taller than the project description textarea (3 rows). Journal entries are long-form writing.

```typescript
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              role="checkbox"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
```

`select-none` — prevents the text label from being selected/highlighted when the user clicks rapidly. Without this, quickly clicking the toggle would highlight the label text.

`role="checkbox"` and `aria-checked={isPublic}` — ARIA attributes for accessibility. Screen readers announce this as "Make this entry public, checkbox, checked/unchecked". Without these, screen readers would see a `div` and announce nothing useful.

```typescript
              className={`h-4 w-4 shrink-0 rounded border transition-colors cursor-pointer ${
                isPublic
                  ? 'bg-primary border-primary'
                  : 'border-border bg-transparent'
              }`}
```

Template literal with a ternary inside — combines static classes with conditional classes. When checked: teal background and border. When unchecked: transparent background, border only.

```typescript
            {isPublic && (
              <svg viewBox="0 0 10 10" className="w-full h-full p-0.5 text-primary-foreground">
                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5"
                  fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
```

An inline SVG checkmark. `stroke="currentColor"` means it inherits the text colour from the parent — since the parent has `text-primary-foreground` (dark colour on teal background), the checkmark adapts automatically. `fill="none"` prevents the path from filling with black — it's a stroke-only checkmark.

The path `d="M1.5 5L4 7.5L8.5 2.5"` draws: start at (1.5, 5), line to (4, 7.5) — the left leg of the check, line to (8.5, 2.5) — the right leg going up. This creates a classic ✓ shape in a 10×10 coordinate space.

---

## src/components/journal/JournalCard.tsx

```typescript
  const displayDate = new Date(entry.updated_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
```

`updated_at` not `created_at` — we show when the entry was last edited, not when it was first written. If you wrote an entry a month ago but edited it today, the card shows today's date. This is more useful context for a developer reviewing their journal.

```typescript
                {entry.is_public
                  ? <><Globe  size={10} /> Public</>
                  : <><Lock   size={10} /> Private</>
                }
```

`<>` is a **React Fragment** — a wrapper that renders no DOM element. Used here to group the icon and text without adding a `<span>` or `<div>`. Fragments are useful when you need to return multiple elements but don't want extra DOM nodes.

`Globe` for public, `Lock` for private — icons that communicate the visibility state at a glance. Coloured differently: teal for public (visibility is a feature), muted grey for private (neutral default).

```typescript
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-mono">
            {entry.body}
```

`line-clamp-3` — three lines of body preview. More than `TaskCard`'s 2 lines because journal entries contain more meaningful content worth previewing.

`font-mono` — matches the textarea styling. The card preview looks consistent with the editing experience.

---

## src/pages/Sessions.tsx

```typescript
  const { sessions, summary, isLoading, error, createSession, updateSession, deleteSession } = useSessions();
  const { projects } = useProjects();
```

Two hooks in one page — `useSessions` owns session data, `useProjects` provides the project list for the session form's project selector and for the `projectMap` lookup on cards.

```typescript
  const projectMap = projects.reduce<Record<number, string>>((acc, p) => {
    acc[p.id] = p.title;
    return acc;
  }, {});
```

Same `reduce` pattern as `Tasks.tsx`. Correctly uses `p.title` — the actual backend field name.

```typescript
      {summary && summary.total_sessions > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total hours</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {summary.total_hours}
                <span className="ml-1 text-sm font-normal text-muted-foreground">h</span>
              </p>
            </CardContent>
          </Card>
```

`summary && summary.total_sessions > 0` — two guards before rendering:
1. `summary` — don't render if summary is still `null` (initial load hasn't completed)
2. `summary.total_sessions > 0` — don't render the stats strip if there are no sessions. Showing "0h, 0 sessions" to a new user is uninformative clutter.

`summary.total_hours` — this value comes directly from the backend. The backend computes `round(total_mins / 60, 1)` in Python — one decimal place. We display it as-is.

```typescript
          <Card className="col-span-2 sm:col-span-1">
```

`col-span-2 sm:col-span-1` — the "Avg per session" card spans 2 columns on mobile (so the first two cards sit side by side on their own row, and this card fills the next row). On `sm:` and above, it collapses to 1 column and all three cards sit in a row.

```typescript
              {Math.round(summary.total_mins / summary.total_sessions)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">min</span>
```

`Math.round(summary.total_mins / summary.total_sessions)` — average session length in minutes. Calculated client-side from the summary totals. `Math.round` rounds to the nearest integer — "47 min" is more readable than "46.7 min".

```typescript
          {session.project_id ? projectMap[session.project_id] : undefined}
```

`session.project_id ? projectMap[session.project_id] : undefined` — if the session has a linked project, look up its name. If not, pass `undefined` to `SessionCard`'s `projectName` prop. The card only renders the project section when `projectName` is defined.

---

## src/pages/Journal.tsx

```typescript
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [entries]);
```

**Dynamic filter values from actual data** — unlike Tasks.tsx where status and priority options are static constants, journal tags are user-defined. You don't know in advance what tags exist. This `useMemo` collects every unique tag from every entry and makes them available as filter options.

`entries.forEach(...)` — outer loop over entries.
`e.tags.forEach(...)` — inner loop over each entry's tags.
`tagSet.add(t)` — adds to the Set (automatically deduplicates).
`Array.from(tagSet).sort()` — converts to array and sorts alphabetically so the dropdown is predictable.

`useMemo([entries])` — only recalculates when `entries` changes. Filtering entries (which changes `filteredEntries` but not `entries`) doesn't trigger recalculation.

```typescript
  const filteredEntries = entries
    .filter((e) => filterTag === 'all' || e.tags.includes(filterTag))
    .filter((e) => {
      if (filterVis === 'public')  return e.is_public;
      if (filterVis === 'private') return !e.is_public;
      return true;
    });
```

**Two filter strategies:**

For tags: `e.tags.includes(filterTag)` — `Array.includes()` checks if the specific tag string exists anywhere in the tags array. Case-sensitive — which is fine because we lowercase tags on write and store them lowercase.

For visibility: a multi-branch conditional using `if/return`:
- `'public'` → only entries where `is_public === true`
- `'private'` → only entries where `is_public === false` (the `!` negates)
- Default → `return true` (all entries pass)

```typescript
          {filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'}
```

"1 entry" vs "3 entries" — the irregular plural for "entry". The ternary inserts either `'y'` or `'ies'` after `entr`.

```typescript
        {allTags.length > 0 && (
          <Select value={filterTag} onValueChange={setFilterTag}>
```

The tag filter dropdown only appears when there are actual tags to filter by. If no entry has any tags, showing an empty filter dropdown is confusing. This guard hides it entirely until there's something useful to show.

---

## src/App.tsx — Changes Only

```typescript
import { Sessions } from '@/pages/Sessions';
import { Journal }  from '@/pages/Journal';

// Replace Placeholder routes:
<Route path="/sessions" element={<Sessions />} />
<Route path="/journal"  element={<Journal  />} />
```

The only two changes. All other routes remain identical to F-2.

---

## Architectural Decisions Explained

### Why sessions and journal types share one file

Both `CodingSession` and `JournalEntry` are developer activity records. They're closely related conceptually and both live in the same backend phase. One file with a clear internal structure (`// ── Coding Session` / `// ── Journal Entry`) is cleaner than two tiny files with one interface each.

### Why `useSessions` fetches list and summary in parallel

The sessions page shows both the list of sessions and aggregate stats simultaneously. Fetching them sequentially would mean:
1. Fetch sessions (~80ms) → then fetch summary (~40ms)
2. Total loading time: ~120ms

With `Promise.all`:
1. Fetch sessions and summary simultaneously
2. Total loading time: ~80ms (whichever is slower)

More importantly, there's only one loading state and one moment when the page transitions from skeleton to content — no awkward "stats appear first, then sessions appear" flash.

### Why the summary refreshes after every mutation (but not the list)

After creating a session, we already have the new session object from the API response — we can add it to the list locally without re-fetching. But the summary (total hours, total sessions, average) requires recalculation across all sessions. Recomputing that client-side would duplicate backend logic. It's cleaner to ask the backend to recalculate and return the new summary.

The summary refresh is fire-and-forget (no `await`) — the session appears in the list instantly, and the stats update a moment later. Users don't notice the tiny lag.

### Why journal tags are lowercased on write

The backend stores tags lowercase. If you create an entry with tags `["React", "TypeScript"]`, the backend normalises them to `["react", "typescript"]`. If the frontend sent mixed-case tags, the `includes` filter would fail — `e.tags.includes('React')` would be `false` for `['react']`.

By lowercasing in `JournalFormModal` before sending, the data in our local state matches what the backend returns. No synchronisation issues.

### Why journal uses `updated_at` for display, sessions use `session_date`

Sessions are historical records tied to a specific workday. The `session_date` field is what matters — "I coded for 2 hours on June 15th". The `created_at` timestamp of when the record was logged is irrelevant.

Journal entries are living documents. You might write an entry, then edit it a week later with new insights. Showing `updated_at` communicates "this is when you last touched this entry" — more useful context for reviewing your journal.

---

## Data Flow Diagrams

### Sessions Page Load (Parallel Fetch)

```
User navigates to /sessions
        │
        ▼
Sessions.tsx renders
  useSessions() called
    sessions = []
    summary  = null
    isLoading = true
        │
        ▼
useEffect fires → fetchAll() runs
        │
        ├─── sessionsApi.list()    ──┐  Both fire simultaneously
        └─── sessionsApi.summary() ──┘
                                    │
                              Both resolve
                                    │
                                    ▼
        [sessionData, summaryData] = await Promise.all([...])
        normalized = sessionData.map(s => ({ ...s, notes: s.notes || null }))
        setSessions(normalized)
        setSummary(summaryData)
        setIsLoading(false)
                                    │
                                    ▼
        React re-renders:
          Summary strip appears (total_hours, total_sessions, avg)
          SessionCard renders for each session
          Each card: projectMap[session.project_id] → project name
```

### Log Session (Create + Summary Refresh)

```
User clicks "Log session"
        │
        ▼
SessionFormModal opens
  useEffect: setSessionDate(today), setHours('0'), setMinutes('30')
        │
User fills in: 1 hr 30 min, today, linked to "Portfolio"
Clicks "Log session"
        │
        ▼
handleSubmit:
  totalMins = 1 * 60 + 30 = 90
  payload = {
    duration_mins: 90,
    session_date: "2024-06-15",
    project_id: 2,
    notes: undefined
  }
        │
        ▼
createSession(payload) in useSessions
  await sessionsApi.create(payload)
    → POST /sessions  body: { duration_mins: 90, ... }
        │
FastAPI returns new CodingSession JSON
        │
        ▼
setSessions(prev => [newSession, ...prev])
  ← SESSION APPEARS AT TOP OF LIST IMMEDIATELY
        │
        ▼  (background, no await)
sessionsApi.summary().then(setSummary)
  → GET /sessions/summary
  FastAPI recalculates totals
  → { total_hours: 3.5, total_sessions: 5, ... }
  setSummary(newSummary)
  ← STATS STRIP UPDATES
        │
        ▼
onClose() → modal closes
```

### Journal Tag Filter (Dynamic + useMemo)

```
Entries loaded: [
  { title: "Day 1", tags: ["react", "hooks"] },
  { title: "Day 2", tags: ["typescript", "react"] },
  { title: "Day 3", tags: ["fastapi"] },
]
        │
        ▼
useMemo runs (because entries changed):
  tagSet = new Set()
  "react" added, "hooks" added, "typescript" added, "react" (dup → ignored), "fastapi" added
  tagSet = { "react", "hooks", "typescript", "fastapi" }
  Array.from(tagSet).sort() = ["fastapi", "hooks", "react", "typescript"]
        │
        ▼
Tag filter dropdown shows: All tags | fastapi | hooks | react | typescript
        │
User selects "react"
  setFilterTag("react")
        │
        ▼  (no API call — client-side only)
filteredEntries = entries.filter(e => e.tags.includes("react"))
  → [Day 1, Day 2]  (Day 3 has no "react" tag)
        │
        ▼
Grid re-renders: 2 journal cards visible
Count shows: "2 entries (filtered)"
```

---

*End of Phase F-3 Documentation*
*Phase F-4 will cover: Analytics dashboard + Public Profile pages*
