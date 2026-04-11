# DevPulse — Frontend Phase F-2 Documentation
## Projects + Tasks — Based on Final Working Code

> Line-by-line reference for every file in F-2 as actually built and running.
> Written for TypeScript beginners. Every decision, every pattern, every quirk explained.

---

## Table of Contents

1. [New Concepts Introduced in F-2](#new-concepts-introduced-in-f-2)
2. [Architecture — The Three-Layer Rule](#architecture--the-three-layer-rule)
3. [src/types/projects.ts](#srctypesprojectsts)
4. [src/lib/api/projects.ts](#srclibapirojectsts)
5. [src/lib/api/tasks.ts](#srclibapitasksts)
6. [src/lib/statusConfig.ts](#srclibstatusconfigts)
7. [src/hooks/useProjects.ts](#srchooksuseprojectsts)  ← actual uploaded code
8. [src/hooks/useTasks.ts](#srchooksusetasksts)
9. [src/components/projects/ProjectCard.tsx](#srccomponentsprojectsprojectcardtsx)
10. [src/components/projects/ProjectFormModal.tsx](#srccomponentsprojectsprojectformmodaltsx)
11. [src/components/tasks/TaskCard.tsx](#srccomponentstaskstaskcardtsx)
12. [src/components/tasks/TaskFormModal.tsx](#srccomponentstaskstaskformmodaltsx)
13. [src/pages/Projects.tsx](#srcpagesprojectstsx) ← actual uploaded code
14. [src/pages/ProjectDetail.tsx](#srcpagesprojectdetailtsx) ← actual uploaded code
15. [src/pages/Tasks.tsx](#srcpagestaskstsx) ← actual uploaded code
16. [Critical Fix — The /api/tasks 404 Bug](#critical-fix--the-apitasks-404-bug)
17. [Data Flow Diagrams](#data-flow-diagrams)
18. [Patterns Cheat Sheet](#patterns-cheat-sheet)

---

## New Concepts Introduced in F-2

These TypeScript and React concepts appear throughout F-2 for the first time. Read them once before the file-by-file breakdown.

---

### `Record<K, V>` — Typed Object / Lookup Table

```typescript
const projectMap: Record<number, string> = {
  1: "Portfolio",
  2: "DevPulse"
};
```

`Record<K, V>` means "an object where every key is type K and every value is type V". You use it to build lookup tables — given a project ID (number), get back a project name (string). TypeScript will error if you try to assign a wrong type to either key or value.

---

### `useCallback` — Preventing Infinite Loops

```typescript
const fetchProjects = useCallback(async () => {
  // fetch logic
}, []);  // empty array = never recreate this function
```

Without `useCallback`, every render creates a brand new function. Since `useEffect` watches for changes in its dependency array, a new function reference would trigger `useEffect` on every render — causing an infinite loop. `useCallback` with `[]` memoises the function so it stays the same reference forever.

---

### Functional State Updates — `setState((prev) => ...)`

```typescript
// Safer in async contexts:
setProjects((prev) => [newProject, ...prev]);

// Risky — `projects` might be stale:
setProjects([newProject, ...projects]);
```

In async functions, the component might re-render between when the function started and when it finishes. If you reference `projects` directly, you might be reading a stale snapshot. The `(prev) =>` form always receives the **guaranteed latest** state from React.

---

### Optimistic Updates — Fast UI, Safe Rollback

```typescript
const previous = projects;                          // 1. snapshot
setProjects((prev) => prev.filter(p => p.id !== id)); // 2. remove immediately
try {
  await projectsApi.delete(id);                    // 3. fire API in background
} catch {
  setProjects(previous);                           // 4. rollback if failed
  throw err;
}
```

Remove from the UI before the API call completes. If it fails, restore. This makes the app feel instant.

---

### `as const` — Locking Array Types to Literals

```typescript
const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
] as const;
```

Without `as const`, TypeScript types `value` as `string`. With it, `value` is typed as `'planning'` exactly. This lets TypeScript verify you're only ever assigning valid status values.

---

### `mapStatusToAPI` — The Translation Function in useProjects

Your actual `useProjects.ts` contains a function called `mapStatusToAPI`. This was added because the backend's `ProjectStatus` enum values didn't align 1-to-1 with what the frontend originally sent. It translates frontend display values into backend-safe values before any create or update call.

```typescript
function mapStatusToAPI(status?: string) {
  if (!status) return 'planning';
  switch (status) {
    case 'active':    return 'in_progress';
    case 'planning':  return 'planning';
    case 'completed': return 'completed';
    case 'on_hold':   return 'on_hold';
    case 'archived':  return 'completed';
    default:          return 'planning';
  }
}
```

This is a **pure function** — given the same input it always returns the same output, no side effects. It lives outside the hook so it doesn't get recreated on every render.

---

### `project.title` — Not `project.name`

Your backend `Project` model uses the column name `title`. All your actual uploaded files (`Tasks.tsx`, `ProjectDetail.tsx`, `useProjects.ts`) correctly reference `p.title`. The original F-2 plan used `name` — your code fixed this. The type definition must use `title` to match.

---

## Architecture — The Three-Layer Rule

```
PAGES (Projects.tsx, ProjectDetail.tsx, Tasks.tsx)
  "What the user sees. Calls hooks, passes data to components."
         │
         ▼
HOOKS (useProjects.ts, useTasks.ts)
  "Owns state. Calls API layer. Exposes mutation functions."
         │
         ▼
API LAYER (lib/api/projects.ts, lib/api/tasks.ts)
  "Pure HTTP calls. No state. Returns typed data."
         │
         ▼  HTTP + cookies
FASTAPI BACKEND (localhost:8000)
```

**Why this matters in practice:**
- The API URL changes? Edit one file in `lib/api/`.
- Loading behaviour changes? Edit the hook.
- The card layout changes? Edit the component.
- Nothing bleeds across layers.

---

## src/types/projects.ts

This file is purely TypeScript — no code runs in the browser. It defines the shared vocabulary for what a `Project` and `Task` look like. Every other file imports from here.

```typescript
export type ProjectStatus =
  'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
```

A **string literal union**. `ProjectStatus` can only be one of these five exact strings. If you write `status: 'done'` anywhere a `ProjectStatus` is expected, TypeScript shows an error immediately — before the code even runs. This mirrors the backend's `ProjectStatus` enum exactly.

```typescript
export interface Project {
  id:          number;
  title:       string;    // ← "title" not "name" — matches the backend column
  description: string | null;
  status:      ProjectStatus;
  tags:        string[];
  owner_id:    number;
  created_at:  string;
  updated_at:  string;
}
```

`description: string | null` — the `| null` is essential. The backend can return `null` for optional fields. Without it, TypeScript would let you write `project.description.length` — which compiles fine but crashes at runtime when the value is `null`.

`tags: string[]` — an array of strings. Square brackets after a type means "array of that type". Written equivalently as `Array<string>`.

`created_at: string` — dates come back from the API as ISO 8601 strings like `"2024-06-15T10:30:00Z"`. JSON has no native date type. You convert with `new Date(project.created_at)` when you need to display or compare.

```typescript
export interface ProjectCreateInput {
  name:         string;
  description?: string;
  status?:      ProjectStatus;
  tags?:        string[];
}
```

The `?` after a property name makes it **optional** — the field can be omitted entirely. You can create a project with just a `name`. The backend sets sensible defaults for everything else.

```typescript
export interface ProjectUpdateInput {
  name?:        string;
  description?: string;
  status?:      ProjectStatus;
  tags?:        string[];
}
```

Every field optional — this is the PATCH contract. Send only the fields you want to change. The backend's `model_dump(exclude_unset=True)` ignores anything you don't send.

```typescript
export type TaskStatus   = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
```

Same pattern as `ProjectStatus` — exact string unions matching backend enums.

```typescript
export interface Task {
  id:           number;
  title:        string;
  description:  string | null;
  status:       TaskStatus;
  priority:     TaskPriority;
  due_date:     string | null;
  completed_at: string | null;
  project_id:   number;
  created_at:   string;
}
```

`due_date: string | null` — format is `"2024-06-15"` (date only, no time). We append `T00:00:00` before constructing a `Date` object to avoid timezone-related off-by-one-day bugs.

`completed_at: string | null` — the backend sets this automatically when `status` transitions to `'done'`. We never send this from the frontend.

`project_id: number` — every task belongs to a project. This ID is required for any task-related API call because tasks are nested under projects in the URL structure: `/projects/:projectId/tasks/:taskId`.

---

## src/lib/api/projects.ts

The only file that knows the backend's project URLs. Every function is pure — it takes inputs, fires an HTTP call, and returns typed data. No state lives here.

```typescript
import api from '@/lib/axios';
import type { Project, ProjectCreateInput, ProjectUpdateInput } from '@/types/projects';
```

`@/lib/axios` — imports the single configured Axios instance from F-1 which already has `withCredentials: true` (sends cookies) and the refresh-on-401 interceptor (silent token renewal).

`import type` — TypeScript-only import. These types are erased at compile time and add zero bytes to the JavaScript bundle.

```typescript
export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const res = await api.get<Project[]>('/projects');
    return res.data;
  },
```

`export const projectsApi = { ... }` — an object literal containing all project-related API functions. Callers import it as `import { projectsApi } from '@/lib/api/projects'` and call `projectsApi.list()`. This grouping keeps imports clean — one import, five functions.

`async (): Promise<Project[]>` — an async arrow function that takes no arguments and returns a Promise that resolves to an array of Projects.

`api.get<Project[]>('/projects')` — the `<Project[]>` generic tells TypeScript "the response body will be shaped like an array of Projects". Axios doesn't validate this at runtime — it's a compile-time hint for autocomplete and type checking.

`res.data` — Axios wraps every response in `{ data, status, headers, config }`. The actual JSON from the backend lives in `res.data`. We return just `res.data` so callers don't have to write `.data` everywhere.

```typescript
  get: async (id: number): Promise<Project> => {
    const res = await api.get<Project>(`/projects/${id}`);
    return res.data;
  },
```

`` `/projects/${id}` `` — template literal. Backtick syntax lets you embed variables (`${id}`) inside strings. For id=3 this produces `/projects/3`.

```typescript
  create: async (data: ProjectCreateInput): Promise<Project> => {
    const res = await api.post<Project>('/projects', data);
    return res.data;
  },
```

`api.post(url, data)` — the second argument is the request body. Axios automatically serialises it to JSON and sets `Content-Type: application/json`. The backend receives it, Pydantic validates it, and returns the full created object (including `id`, `created_at`, etc. that we didn't send).

```typescript
  update: async (id: number, data: ProjectUpdateInput): Promise<Project> => {
    const res = await api.patch<Project>(`/projects/${id}`, data);
    return res.data;
  },
```

`api.patch` not `api.put` — PATCH means "partial update". PUT means "replace the entire resource". We use PATCH because `ProjectUpdateInput` has all optional fields by design.

```typescript
  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
```

`Promise<void>` — delete returns nothing useful. We `await` it to let errors propagate, but there's no return value to capture.

---

## src/lib/api/tasks.ts

Tasks live under projects in the URL hierarchy — every task endpoint requires a `projectId`.

```typescript
export const tasksApi = {
  list: async (projectId: number): Promise<Task[]> => {
    const res = await api.get<Task[]>(`/projects/${projectId}/tasks`);
    return res.data;
  },
```

Tasks for project 3 live at `/projects/3/tasks`. This is called a **nested resource** pattern — tasks only exist in the context of a project.

```typescript
  listAll: async (): Promise<Task[]> => {
    const res = await api.get<Task[]>('/tasks');
    return res.data;
  },
```

A flat endpoint that returns all tasks across all of the user's projects. Used by the `/tasks` page. **This endpoint required a backend fix** — see the [Critical Fix section](#critical-fix--the-apitasks-404-bug) below.

```typescript
  create: async (projectId: number, data: TaskCreateInput): Promise<Task> => {
    const res = await api.post<Task>(`/projects/${projectId}/tasks`, data);
    return res.data;
  },
```

Creating a task requires the project ID in the URL (not the body). The backend extracts `projectId` from the URL and sets `task.project_id` automatically.

```typescript
  update: async (projectId: number, taskId: number, data: TaskUpdateInput): Promise<Task> => {
    const res = await api.patch<Task>(`/projects/${projectId}/tasks/${taskId}`, data);
    return res.data;
  },

  delete: async (projectId: number, taskId: number): Promise<void> => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  },
```

Both update and delete need **two IDs**. The URL `/projects/3/tasks/7` means "task 7 inside project 3". The backend uses both to verify the task actually belongs to that project — a security check that prevents cross-project task manipulation.

---

## src/lib/statusConfig.ts

A pure data file — no functions, no React, no HTTP. Just lookup tables mapping status/priority values to display labels and Tailwind class strings. Centralising here means one change updates every badge and filter across the entire app.

```typescript
export const projectStatusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  planning:  { label: 'Planning',  className: 'bg-blue-500/10   text-blue-400   border-blue-500/20'  },
  active:    { label: 'Active',    className: 'bg-teal-500/10   text-teal-400   border-teal-500/20'  },
  on_hold:   { label: 'On Hold',   className: 'bg-amber-500/10  text-amber-400  border-amber-500/20' },
  completed: { label: 'Completed', className: 'bg-green-500/10  text-green-400  border-green-500/20' },
  archived:  { label: 'Archived',  className: 'bg-zinc-500/10   text-zinc-400   border-zinc-500/20'  },
};
```

`Record<ProjectStatus, { label: string; className: string }>` — TypeScript enforces that every `ProjectStatus` value has an entry. If you add a new status to the union but forget to add it here, TypeScript shows an error: "missing key `'new_status'` in Record". Silent runtime bugs become compile-time errors.

Tailwind opacity modifier syntax: `bg-teal-500/10` means teal-500 background at 10% opacity. `border-teal-500/20` is teal-500 border at 20% opacity. This creates soft, coloured badge chips that don't overwhelm the dark UI.

```typescript
export const taskPriorityConfig: Record<TaskPriority, { label: string; className: string; dot: string }> = {
  low:    { label: 'Low',    className: 'bg-zinc-500/10  text-zinc-400',  dot: 'bg-zinc-400'  },
  medium: { label: 'Medium', className: 'bg-blue-500/10  text-blue-400',  dot: 'bg-blue-400'  },
  high:   { label: 'High',   className: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400' },
  urgent: { label: 'Urgent', className: 'bg-red-500/10   text-red-400',   dot: 'bg-red-400'   },
};
```

Priority config has an extra `dot` property — a solid coloured circle that appears at the top-left of every `TaskCard`. It gives users a colour-coded urgency signal without needing to read the badge text.

---

## src/hooks/useProjects.ts

This is the file you uploaded. It owns all project state and exposes the mutations that pages use. The key difference from the original plan is `mapStatusToAPI` — a translation function added to bridge the gap between what the frontend sends and what the backend expects.

```typescript
function mapStatusToAPI(status?: string) {
  if (!status) return 'planning';
  switch (status) {
    case 'active':    return 'in_progress';
    case 'planning':  return 'planning';
    case 'completed': return 'completed';
    case 'on_hold':   return 'on_hold';
    case 'archived':  return 'completed';
    default:          return 'planning';
  }
}
```

This function lives **outside** the `useProjects` function body. That's deliberate — if it were inside, React would recreate it on every render. Outside the hook, it's created once when the module loads and reused forever.

`switch (status)` — a multi-branch conditional. More readable than a chain of `if/else if` when you have many discrete cases. Each `case` matches one value and `return`s immediately (no `break` needed when returning).

`case 'active': return 'in_progress'` — this was a real mismatch. The frontend's `statusConfig.ts` uses `'active'` as the display identifier, but the backend enum might use `'in_progress'`. This mapping corrects it.

```typescript
export function useProjects(): UseProjectsReturn {
  const [projects,  setProjects]  = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
```

`useState<Project[]>([])` — state that holds an array of Projects, starting empty. TypeScript needs the `<Project[]>` generic here because it can't infer the type from an empty array alone.

`useState(true)` for `isLoading` — starts `true` because the fetch begins immediately on mount. Starting `false` would cause a flash of "No projects yet" before data arrives.

`useState<string | null>(null)` — error starts as `null` (no error). When something goes wrong, it becomes a string message.

```typescript
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectsApi.list();

      const normalized = data.map((p: any) => ({
        ...p,
        tags: p.tags || [],
      }));

      setProjects(normalized);
    } catch {
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);
```

`setError(null)` before each fetch — clears any previous error message so it doesn't persist after a successful retry.

`const data = await projectsApi.list()` — awaiting here pauses execution inside this `async` function until the HTTP response arrives. The browser's event loop is not blocked — other code runs freely while the request is in flight.

```typescript
      const normalized = data.map((p: any) => ({
        ...p,
        tags: p.tags || [],
      }));
```

**This is the defensive normalisation added in your working version.** The backend might return `tags: null` for projects created before tags were implemented. If `tags` is `null` and you later call `.map()` or `.length` on it, the app crashes. `p.tags || []` ensures it's always an array.

`data.map((p: any) => ...)` — the `any` type here is a pragmatic escape hatch. It tells TypeScript "don't type-check this". It's used sparingly here because the normalisation is happening before we've confirmed the shape matches our interface.

`...p` — the **spread operator** inside an object literal. It copies all properties from `p` into the new object. Then `tags: p.tags || []` **overwrites** just the `tags` property with the safe value.

```typescript
    } catch {
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
```

`catch` with no argument — valid TypeScript when you don't need to inspect the error. We always show the same generic message regardless of what failed.

`finally` — runs whether the `try` succeeded or `catch` handled an error. `setIsLoading(false)` must always execute — without `finally`, a failed fetch would leave the spinner spinning forever.

```typescript
  const createProject = async (data: ProjectCreateInput): Promise<Project> => {
    const newProject = await projectsApi.create({
      ...data,
      status: mapStatusToAPI(data.status),
    });
    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  };
```

`{ ...data, status: mapStatusToAPI(data.status) }` — spread `data` into a new object, then **override** just the `status` field with the mapped value. The rest of `data` (name, description, tags) passes through unchanged.

`setProjects((prev) => [newProject, ...prev])` — functional update form. Prepends the new project to the front of the list (newest first). Using `(prev) => ...` guarantees we're working with the latest state even if re-renders happened during the API call.

```typescript
  const updateProject = async (id: number, data: ProjectUpdateInput): Promise<Project> => {
    const updated = await projectsApi.update(id, {
      ...data,
      status: mapStatusToAPI(data.status),
    });
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? updated : p))
    );
    return updated;
  };
```

`prev.map((p) => (p.id === id ? updated : p))` — iterates the entire array. Every project where `id` doesn't match is returned unchanged (`p`). The one that matches is replaced with the fresh `updated` object from the server. This is the standard React **immutable update** pattern — never mutate the array directly.

```typescript
  const deleteProject = async (id: number): Promise<void> => {
    const previous = projects;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      await projectsApi.delete(id);
    } catch (err) {
      setProjects(previous);
      throw err;
    }
  };
```

**Optimistic delete — full walkthrough:**

1. `const previous = projects` — capture a snapshot of the current state. If anything goes wrong, this is the rollback target. Note: `previous` references the `projects` value at the moment this function was called, before any state changes.

2. `setProjects((prev) => prev.filter((p) => p.id !== id))` — removes the project from the UI immediately. `filter` returns a new array containing only elements where the callback returns `true`. `p.id !== id` is true for every project *except* the one being deleted.

3. `await projectsApi.delete(id)` — fires the actual HTTP DELETE request. The UI has already updated by now.

4. `catch (err) { setProjects(previous); throw err; }` — if the API fails (network error, 403, 500), restore the original state. `throw err` re-throws so the calling component (the delete confirmation dialog) can catch it and show an error.

---

## src/hooks/useTasks.ts

Same structural pattern as `useProjects` with one key difference: it can operate in two modes.

```typescript
interface UseTasksOptions {
  projectId?: number;
}

export function useTasks({ projectId }: UseTasksOptions = {}): UseTasksReturn {
```

`{ projectId }: UseTasksOptions = {}` — destructures the options object. The `= {}` default means you can call `useTasks()` with no arguments and it won't crash — `projectId` is just `undefined`.

When `projectId` is provided → fetch that project's tasks (used on `ProjectDetail` page).
When absent → fetch all tasks via `listAll` (used on `Tasks` page).

```typescript
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = projectId
        ? await tasksApi.list(projectId)
        : await tasksApi.listAll();
      setTasks(data);
    } catch {
      setError('Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);
```

`projectId ? tasksApi.list(projectId) : tasksApi.listAll()` — ternary that picks the right API call.

`[projectId]` in the `useCallback` dependencies — if `projectId` changes (navigating from `/projects/3` to `/projects/5`), `fetchTasks` is recreated and `useEffect` re-fires, loading the new project's tasks.

```typescript
  const deleteTask = async (pid: number, tid: number): Promise<void> => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== tid));
    try {
      await tasksApi.delete(pid, tid);
    } catch (err) {
      setTasks(previous);
      throw err;
    }
  };
```

Task delete needs two IDs — the project ID (`pid`) for the URL structure and the task ID (`tid`) to identify which task to remove. The optimistic pattern is identical to `deleteProject`.

---

## src/components/projects/ProjectCard.tsx

A self-contained card that displays one project and manages its own delete confirmation state internally.

```typescript
interface ProjectCardProps {
  project:  Project;
  onEdit:   (project: Project) => void;
  onDelete: (id: number) => Promise<void>;
}
```

`onDelete: (id: number) => Promise<void>` — an async callback. The card `await`s it to know when the delete finishes, enabling the loading state (`isDeleting`) and the dialog close to fire at the right moment.

```typescript
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [isDeleting,  setIsDeleting]  = useState(false);
```

Both pieces of state are local to the card. Each card independently manages its own confirmation dialog — ten cards open ten independent dialogs.

```typescript
  const statusCfg = projectStatusConfig[project.status];
```

`project.status` is a `ProjectStatus` value like `'active'`. Using it as the key into `projectStatusConfig` (a `Record<ProjectStatus, ...>`) returns `{ label: 'Active', className: 'bg-teal-500/10 ...' }`. TypeScript guarantees this lookup is always valid.

```typescript
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(project.id);
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };
```

`finally` here ensures the dialog always closes and the loading state always resets — even if `onDelete` throws (which it does on API failure, because the hook re-throws after rollback). Without `finally`, a failed delete would leave the dialog frozen with disabled buttons permanently.

```typescript
onClick={(e) => e.stopPropagation()}
```

The entire card is clickable (navigates to project detail). The three-dot menu button is inside the card. Without `stopPropagation()`, clicking the button would fire both the button's click AND the card's click — opening the menu AND navigating away simultaneously. `e.stopPropagation()` stops the event from bubbling up to the card's handler.

```typescript
className="group flex flex-col ..."
```

```typescript
className="opacity-0 group-hover:opacity-100 transition-opacity"
```

`group` on the card parent tells Tailwind "this is a group anchor". `group-hover:opacity-100` on the menu button means "when the group ancestor is hovered, apply `opacity-100` to me". The button is invisible by default and fades in on card hover — clean, uncluttered design.

---

## src/components/projects/ProjectFormModal.tsx

One modal for both create and edit. The `project?` optional prop determines the mode.

```typescript
const isEditing = !!project;
```

`!!` converts any value to boolean. `!!undefined` → `false` (create mode). `!!{ id: 3 }` → `true` (edit mode). Used throughout to conditionally render labels and choose which API function to call.

```typescript
  useEffect(() => {
    if (open) {
      setName(project?.name        ?? '');
      setDescription(project?.description ?? '');
      setStatus(project?.status    ?? 'active');
      setTagsInput(project?.tags?.join(', ') ?? '');
      setError('');
    }
  }, [project, open]);
```

`if (open)` — only reset when the modal is **opening**. Without this guard, the effect fires on close too, causing a flash of empty fields during the close animation.

`project?.name ?? ''` — two levels of safety. `project?.name` returns `undefined` if `project` is undefined (create mode). `?? ''` provides the empty string fallback. Without optional chaining, `undefined.name` would throw.

`project?.tags?.join(', ')` — joins `['react', 'typescript']` into `'react, typescript'` for the input field. The `?.` is needed because even if `project` exists, `tags` might be `undefined` (though our normalisation ensures it's `[]`).

```typescript
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
```

Converts `"react, typescript, fastapi"` → `['react', 'typescript', 'fastapi']`:
1. `.split(',')` → `['react', ' typescript', ' fastapi']`
2. `.map((t) => t.trim())` → `['react', 'typescript', 'fastapi']`
3. `.filter(Boolean)` — removes empty strings. `''` is falsy, so `filter(Boolean)` drops it. Handles `"react,,typescript"` → `['react', 'typescript']`.

---

## src/components/tasks/TaskCard.tsx

```typescript
interface TaskCardProps {
  task:         Task;
  projectName?: string;  // optional — only shown on /tasks page
  onEdit:       (task: Task) => void;
  onDelete:     (projectId: number, taskId: number) => Promise<void>;
}
```

`projectName` is optional because the card appears in two contexts. On the project detail page, all tasks belong to the same project — showing the name is redundant. On the all-tasks page, tasks from different projects are mixed — showing the project name is essential.

```typescript
  const dueDate = task.due_date
    ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
      })
    : null;
```

`task.due_date + 'T00:00:00'` — appending the time component is intentional. `new Date("2024-06-15")` interprets the string as UTC midnight. In timezones west of UTC (like Chennai IST is east, but US timezones are west), this can display as June 14th — one day off. Adding `'T00:00:00'` forces local-timezone interpretation.

```typescript
  const isOverdue =
    task.due_date &&
    !['done', 'cancelled'].includes(task.status) &&
    new Date(task.due_date) < new Date();
```

Three conditions chained with `&&`:
1. `task.due_date` — must have a due date
2. `!['done', 'cancelled'].includes(task.status)` — task must still be active
3. `new Date(task.due_date) < new Date()` — due date must be in the past

`new Date()` with no arguments = the current moment. JavaScript `Date` comparison uses the underlying millisecond timestamp number.

```typescript
          className={cn(
            'text-sm font-medium leading-snug',
            task.status === 'done' && 'line-through text-muted-foreground',
          )}
```

`task.status === 'done' && 'line-through text-muted-foreground'` — in JavaScript, `false && 'string'` evaluates to `false`. `cn()` from clsx ignores `false` values. So when the task isn't done, no extra classes are added. When done, both `line-through` (strikethrough text) and `text-muted-foreground` (dimmed colour) are applied.

---

## src/components/tasks/TaskFormModal.tsx

```typescript
  useEffect(() => {
    if (open) {
      ...
      setSelectedProjectId(
        String(task?.project_id ?? projectId ?? projects[0]?.id ?? '')
      );
    }
  }, [task, open, projectId, projects]);
```

A chain of fallbacks using `??` (nullish coalescing):
1. `task?.project_id` — if editing an existing task, use its project
2. `projectId` — if opened from a project detail page, use that project
3. `projects[0]?.id` — default to the first project in the list
4. `''` — final fallback if there are no projects at all

`String(...)` converts the number ID to a string because `<Select>` values are always strings in shadcn.

```typescript
      className="[color-scheme:dark]"
```

Applied to the `type="date"` input. Without this, browsers render the native date picker in light mode even on a dark-themed page. `[color-scheme:dark]` is a Tailwind arbitrary property that forces the browser's native UI elements to use dark mode. Square brackets let you write any CSS property that Tailwind doesn't have a built-in utility for.

---

## src/pages/Projects.tsx

This is the file you uploaded. The page is intentionally thin — it orchestrates, it doesn't contain business logic.

```typescript
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
```

Two state variables control the modal. `editingProject` being `undefined` = create mode. Having a value = edit mode.

```typescript
  const openCreateModal = () => {
    setEditingProject(undefined);
    setModalOpen(true);
  };
```

Always clears `editingProject` first. If the user edits project A, closes the modal, then immediately clicks "New project", without this reset the modal would still hold project A's data.

```typescript
      {projects.length > 0
        ? `${projects.length} project${projects.length === 1 ? '' : 's'}`
        : 'No projects yet'}
```

`projects.length === 1 ? '' : 's'` — adds the plural `'s'`. "1 project" (no s), "3 projects" (with s). A small detail that makes the UI feel genuinely polished.

```typescript
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}
```

`Array.from({ length: 6 })` — creates an array of 6 empty slots. The `_` in `(_, i)` is conventional for "I'm ignoring this parameter" — we only need the index `i` for the `key` prop. `animate-pulse` makes the placeholder boxes fade in and out — the standard "skeleton loading" pattern.

```typescript
      {!isLoading && !error && projects.length === 0 && ( ... )}
      {!isLoading && projects.length > 0 && ( ... )}
```

Three mutually exclusive content blocks (loading / empty / grid). The conditions are carefully written so exactly one shows at any time.

---

## src/pages/ProjectDetail.tsx

This is the file you uploaded. The most complex page — two hooks, URL parameters, and two modals.

```typescript
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? '0', 10);
```

`useParams<{ id: string }>()` — reads URL segments. For `/projects/3`, returns `{ id: "3" }`. URL params are always strings.

`id ?? '0'` — if `id` is somehow `undefined`, fall back to `'0'`. `parseInt('0', 10)` → `0`, which won't match any real project ID.

`parseInt(str, 10)` — always pass `10` as the radix (base). Without it, older engines might interpret strings starting with `0` as octal (base 8). Always explicit.

```typescript
  const {
    projects, isLoading: projectsLoading,
    updateProject, deleteProject,
  } = useProjects();

  const {
    tasks, isLoading: tasksLoading,
    createTask, updateTask, deleteTask,
  } = useTasks({ projectId });
```

**Destructuring with rename** — `isLoading: projectsLoading` extracts `isLoading` from the hook result and renames it locally to `projectsLoading`. Both hooks return `isLoading` — without renaming, you'd have a name collision.

```typescript
  const project = projects.find((p) => p.id === projectId);
```

`Array.find()` returns the first element where the callback returns `true`, or `undefined` if none found. We search the already-loaded projects list instead of making a separate API call — no extra network request needed.

```typescript
  {project.title}
```

Note: `project.title` — not `project.name`. Your backend uses the column `title`. This is why the type definition must use `title: string`, and why the form modal input maps to `title`.

```typescript
                  {tasks.filter((t) => t.status === 'done').length}/{tasks.length} done
```

`tasks.filter((t) => t.status === 'done').length` — counts done tasks by filtering the array and reading the resulting array's length. Displayed as "2/7 done".

---

## src/pages/Tasks.tsx

This is the file you uploaded. The all-tasks page with client-side filtering.

```typescript
  const projectMap = projects.reduce<Record<number, string>>((acc, p) => {
    acc[p.id] = p.title;
    return acc;
  }, {});
```

`Array.reduce()` transforms an array into a single value. Here: `Project[]` → `Record<number, string>`.

How it works step by step:
- Starts with `{}` (the initial value)
- For each project `p`: sets `acc[p.id] = p.title` (adds to the map)
- Returns `acc` (passes the updated map to the next iteration)
- Final result: `{ 1: "Portfolio", 2: "DevPulse" }`

`p.title` — your code correctly uses `.title` (not `.name`), matching the backend column.

```typescript
  const filteredTasks = tasks
    .filter((t) => filterProject === 'all' || String(t.project_id) === filterProject)
    .filter((t) => filterStatus  === 'all' || t.status   === filterStatus)
    .filter((t) => filterPriority === 'all' || t.priority === filterPriority);
```

Three chained `.filter()` calls — each narrows the result further. Client-side only — no API calls when changing filters.

`filterProject === 'all' || ...` — short-circuit evaluation. If the left side is true, the right side isn't evaluated. This makes "All projects" fast — every task passes without checking `project_id`.

`String(t.project_id) === filterProject` — `t.project_id` is a number; `filterProject` from the Select is a string. `String(3) === "3"` is true. Without the conversion, `3 === "3"` is false in JavaScript (strict equality compares both value AND type).

```typescript
<SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
```

`p.title` — correctly uses the backend field name. All project display in filters and dropdowns references `title`.

---

## Critical Fix — The /api/tasks 404 Bug

When you first navigated to `/tasks`, the console showed:
```
GET http://localhost:8000/api/v1/tasks 404 (Not Found)
```

**Root cause:** `tasksApi.listAll()` called `/tasks`, but that endpoint didn't exist in the backend. Every task route was nested under `/projects/:projectId/tasks`. There was no flat `/tasks` route.

**The fix — two backend changes:**

**`task_service.py`** — add `list_all_tasks`:
```python
def list_all_tasks(user: User, db: Session) -> list[Task]:
    return (
        db.query(Task)
        .join(Project, Task.project_id == Project.id)
        .filter(Project.user_id == user.id)
        .order_by(Task.created_at.desc())
        .all()
    )
```

This uses a SQL JOIN to reach tasks through their parent projects, filtering by the current user's ownership. One efficient query — no Python loops.

**`tasks.py`** (router) — add a second router and one new endpoint:
```python
user_tasks_router = APIRouter(prefix="/tasks", tags=["tasks"])

@user_tasks_router.get("", response_model=list[TaskResponse])
def list_all_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return task_service.list_all_tasks(current_user, db)
```

**`main.py`** — register the new router:
```python
from app.api.routes.tasks import router as tasks_router, user_tasks_router
app.include_router(tasks_router,      prefix="/api/v1")
app.include_router(user_tasks_router, prefix="/api/v1")
```

The frontend needed no changes — `tasksApi.listAll()` already called the right URL.

---

## Data Flow Diagrams

### Project Grid Load

```
Browser opens /projects
        │
        ▼
Projects.tsx renders, calls useProjects()
        │
        ▼
useProjects — useState initialises:
  projects = []
  isLoading = true
  error = null
        │
        ▼
useEffect fires → fetchProjects() runs
        │
        ▼
projectsApi.list() → api.get('/projects')
  Browser sends access_token cookie automatically
        │
        ▼
FastAPI verifies cookie → returns Project[] JSON
        │
        ▼
normalized = data.map(p => ({ ...p, tags: p.tags || [] }))
setProjects(normalized)
setIsLoading(false)
        │
        ▼
React re-renders Projects.tsx
  isLoading = false, projects.length > 0
        │
        ▼
ProjectCard renders for each project
  statusCfg = projectStatusConfig[project.status]
  Badge renders with colour classes
```

### Optimistic Delete with Rollback

```
User clicks Delete on ProjectCard
        │
AlertDialog opens
        │
User confirms → handleDelete() fires
  setIsDeleting(true)  ← dialog buttons disabled
  calls onDelete(project.id)
        │
        ▼
deleteProject(id) in useProjects
  const previous = projects  ← snapshot
  setProjects(prev => prev.filter(p => p.id !== id))
  ← PROJECT DISAPPEARS FROM UI IMMEDIATELY
        │
projectsApi.delete(id) fires HTTP DELETE
        │
    ┌── Success ──────────────────────────────────┐
    │  API returns 200                            │
    │  handleDelete finally block:                │
    │    setIsDeleting(false)                     │
    │    setDeleteOpen(false)                     │
    └─────────────────────────────────────────────┘
    OR
    ┌── Failure ──────────────────────────────────┐
    │  API throws error                           │
    │  setProjects(previous)  ← PROJECT RETURNS  │
    │  throw err propagates to handleDelete       │
    │  finally: setIsDeleting(false)              │
    │           setDeleteOpen(false)              │
    └─────────────────────────────────────────────┘
```

### Status Mapping on Create

```
User selects "Active" in ProjectFormModal
        │
handleSubmit fires
  await onUpdate(id, { status: 'active', ... })
        │
        ▼
updateProject in useProjects
  projectsApi.update(id, {
    ...data,
    status: mapStatusToAPI('active')  →  'in_progress'
  })
        │
        ▼
PATCH /projects/:id  body: { status: 'in_progress' }
        │
        ▼
FastAPI validates 'in_progress' against ProjectStatus enum ✓
Returns updated Project
        │
        ▼
setProjects(prev => prev.map(p => p.id === id ? updated : p))
Card re-renders with new status badge
```

---

## Patterns Cheat Sheet

### Conditional rendering
```typescript
{condition && <Component />}
{condition ? <A /> : <B />}
{maybeNull && <p>{maybeNull}</p>}
```

### Conditional class names (cn)
```typescript
className={cn(
  'always-applied',
  isActive && 'class-when-true',
  hasError ? 'error-class' : 'normal-class',
)}
```

### Functional state update (always use in async)
```typescript
setItems(prev => [...prev, newItem])          // add
setItems(prev => prev.filter(i => i.id !== id)) // remove
setItems(prev => prev.map(i => i.id === id ? updated : i)) // replace
```

### Optional chaining chain
```typescript
user?.profile?.avatar?.url ?? '/default.png'
```

### Optimistic delete skeleton
```typescript
const previous = state;
setState(prev => prev.filter(i => i.id !== id));
try {
  await api.delete(id);
} catch {
  setState(previous);
  throw err;
}
```

### reduce to build a lookup map
```typescript
const map = items.reduce<Record<number, string>>((acc, item) => {
  acc[item.id] = item.name;
  return acc;
}, {});
// Usage: map[item.id] → "name"
```

---

*End of Phase F-2 Documentation*
*Phase F-3 covers: Sessions + Journal pages*
