# DevPulse — Frontend Phase F-1 Documentation

> Complete line-by-line reference for every file in Phase F-1.
> Written for TypeScript beginners. Every concept is explained on first appearance.

---

## Table of Contents

1. [How TypeScript Differs from JavaScript](#typescript-primer)
2. [src/index.css](#srcindexcss)
3. [src/lib/utils.ts](#srclibutils.ts)
4. [src/lib/axios.ts](#srclibaxios.ts)
5. [src/types/auth.ts](#srctypesauthts)
6. [src/contexts/AuthContext.tsx](#srccontextsauthcontexttsx)
7. [src/components/ProtectedRoute.tsx](#srccomponentsprotectedroutetsx)
8. [src/components/Sidebar.tsx](#srccomponentssidebartsx)
9. [src/layouts/DashboardLayout.tsx](#srclayoutsdashboardlayouttsx)
10. [src/pages/auth/Login.tsx](#srcpagesauthlogintsx)
11. [src/pages/auth/Register.tsx](#srcpagesauthregistertsx)
12. [src/pages/Dashboard.tsx](#srcpagesdashboardtsx)
13. [src/pages/Placeholder.tsx](#srcpagesplaceholdertsx)
14. [src/App.tsx](#srcapptsx)
15. [src/main.tsx](#srcmaintsx)
16. [How All the Files Connect](#how-all-the-files-connect)

---

## TypeScript Primer

Before diving into the files, here are the TypeScript concepts that appear throughout F-1. JavaScript developers often find these confusing at first.

### Type Annotations

In JavaScript you write:
```javascript
function greet(name) {
  return "Hello, " + name;
}
```

In TypeScript you write:
```typescript
function greet(name: string): string {
  return "Hello, " + name;
}
```

The `: string` after `name` says "this parameter must be a string". The `: string` after the parentheses says "this function returns a string". TypeScript will show a red underline in your editor if you call `greet(42)` — catching the bug before your code ever runs.

### Interfaces

An interface is a blueprint that describes what shape an object must have.

```typescript
interface User {
  id:    number;
  name:  string;
  email: string;
}
```

Now whenever you type `user: User`, TypeScript knows that `user.id` is a number, `user.name` is a string, etc. It will autocomplete these fields for you and warn you if you try to access `user.phone` (which doesn't exist on the interface).

### `type` Keyword

Similar to `interface` but used for unions — "this can be one of several shapes":

```typescript
type Result = { success: true } | { error: string };
```

The `|` means "or". So a `Result` is either `{ success: true }` or `{ error: string }`.

### Generics: `<T>`

Generics let a function or type work with different data types while staying type-safe.

```typescript
function first<T>(arr: T[]): T {
  return arr[0];
}
```

`T` is a placeholder. When you call `first([1, 2, 3])`, TypeScript infers `T = number`, so the return type is `number`. When you call `first(["a", "b"])`, `T = string`.

You'll see this with Axios: `api.get<User>('/api/users/me')` — the `<User>` tells Axios "the response body will be shaped like the `User` interface".

### `null` vs `undefined` vs Optional (`?`)

```typescript
let a: string       // must always be a string
let b: string | null  // can be a string or null
let c?: string      // optional — can be string or undefined
```

### `as const`

When you write an array of objects, TypeScript by default widens the types. `as const` freezes them to their exact literal values — useful for navigation config where you want precise `to` strings.

```typescript
const NAV = [{ to: '/dashboard' }] as const;
// Without as const: to is typed as string
// With as const:    to is typed as '/dashboard' (exact literal)
```

### `export` and `import`

TypeScript (like modern JavaScript) uses ES Modules:
- `export function foo()` — makes `foo` available to other files
- `export default App` — the "main" export of a file
- `import { foo } from './bar'` — imports a named export
- `import App from './App'` — imports the default export

### The `@/` Path Alias

When you see `import { useAuth } from '@/contexts/AuthContext'`, the `@/` is an alias for your `src/` folder. This prevents `../../../../` relative path hell.

---

## src/index.css

This file sets up the entire visual identity of DevPulse — all color tokens, typography, and the dark theme.

```css
@import "tw-animate-css";
```
Imports animation utilities (fade-in, slide-in, etc.) that shadcn components use for their open/close transitions.

```css
@import "shadcn/tailwind.css";
```
Imports shadcn's base reset. shadcn components reference CSS variables like `var(--primary)` — this file establishes those variable names as expectations.

```css
@import "@fontsource-variable/geist";
```
Loads the Geist Variable font from your `node_modules`. "Variable" means a single font file covers all weights (100–900) — more efficient than loading separate files per weight.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
These three directives inject Tailwind's three style layers:
- `base`: CSS resets (removes browser default margins, sets box-sizing, etc.)
- `components`: Reusable component classes (rarely used directly with Tailwind)
- `utilities`: All the `flex`, `p-4`, `text-sm` classes you write in JSX

```css
:root {
  --sidebar-width: 240px;
```
Defines a CSS custom property (CSS variable) for the sidebar width. Both the `Sidebar` component and the `DashboardLayout` reference this same variable. If you ever want a wider sidebar, you change it here and everything updates automatically.

```css
  --sans:    'Geist Variable', system-ui, sans-serif;
  --mono:    ui-monospace, 'Cascadia Code', Consolas, monospace;
```
Font stack variables. The comma-separated list is a fallback chain — if Geist Variable fails to load, the browser tries `system-ui` (the OS's native interface font), then falls back to any generic `sans-serif`.

```css
  font-family:             var(--sans);
  font-size:               16px;
  line-height:             1.5;
  color-scheme:            dark;
```
Sets defaults on the root element that all other elements inherit:
- `font-family`: Uses our custom variable
- `font-size: 16px`: The base for all `rem` calculations (`1rem = 16px`, `0.75rem = 12px`)
- `line-height: 1.5`: Text lines are 1.5× the font size — standard readable spacing
- `color-scheme: dark`: Tells the browser to use dark scrollbars, dark system UI elements

```css
  font-synthesis:          none;
  text-rendering:          optimizeLegibility;
  -webkit-font-smoothing:  antialiased;
  -moz-osx-font-smoothing: grayscale;
```
Font rendering optimizations:
- `font-synthesis: none`: Prevents the browser from faking bold/italic if the font doesn't have those weights
- `optimizeLegibility`: Enables ligatures and kerning for better readability
- `antialiased` / `grayscale`: Makes fonts look thinner and crisper on retina screens (without this, Mac fonts look slightly blurry)

```css
@layer base {
  :root {
    --background:  oklch(0.13 0.008 248);
```

`@layer base` is a Tailwind directive — styles inside are added to the base layer, which means they lose specificity battles to component and utility styles. This is intentional.

`oklch()` is a modern CSS color format. Unlike hex (`#1a1f2e`) or `hsl()`, oklch is **perceptually uniform** — equal numeric steps in oklch look like equal visual differences to the human eye. The three numbers are:
- Lightness (0 = black, 1 = white)
- Chroma (color intensity, 0 = gray)
- Hue (color wheel angle in degrees, 248 = cool blue-slate)

So `oklch(0.13 0.008 248)` = very dark, almost achromatic, blue-slate — the DevPulse dark background.

```css
    --primary:               oklch(0.68 0.13 186);
    --primary-foreground:    oklch(0.12 0 0);
```
The teal accent color (`#14b8a6`-adjacent). `186` on the hue wheel is teal-cyan. `foreground` is what you put *on top of* primary — in this case near-black text on a teal button background.

```css
    --sidebar:               oklch(0.11 0.008 248);
```
Slightly darker than `--background` so the sidebar feels recessed from the main content area.

```css
  .dark {
    /* ...same values repeated... */
  }
```
shadcn supports two strategies for dark mode: `prefers-color-scheme` media query (OS-based), or a `.dark` class on `<html>` (manual toggle). We use the class strategy. The values inside `.dark` are identical to `:root` because DevPulse is dark-first — there is no light theme yet. This block exists so shadcn's class-based system works correctly.

```css
  * {
    @apply border-border outline-ring/50;
  }
```
Sets defaults on every element:
- `border-border`: Any element that has a border will use the `--border` color variable
- `outline-ring/50`: Focus outlines use the `--ring` color at 50% opacity — so keyboard navigation has a visible but subtle teal glow

```css
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
```
Applies the background color, default text color, and font to the document root. `@apply` is a Tailwind directive that inserts utility classes into CSS — `bg-background` is equivalent to writing `background-color: var(--background)`.

---

## src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
```

Two imports:
- `clsx`: A tiny library that combines class strings conditionally. `clsx('a', isActive && 'b', { 'c': true })` → `"a b c"`
- `twMerge`: Resolves Tailwind class conflicts. If you have `p-2 p-4`, `twMerge` removes `p-2` because `p-4` wins. Without it, both classes would exist and which one wins depends on CSS load order — unpredictable.
- `type ClassValue`: The TypeScript type that `clsx` accepts — strings, booleans, null, arrays, objects. The `type` keyword in the import means we're only importing the type annotation, not any runtime code.

```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`cn` stands for "class names". This is a utility function used throughout every shadcn component.

- `...inputs`: The `...` (rest parameters) means "accept any number of arguments and put them in an array called `inputs`". So `cn('a', 'b', 'c')` receives `inputs = ['a', 'b', 'c']`.
- `clsx(inputs)`: Merges the inputs into a single class string, handling conditional classes
- `twMerge(...)`: Resolves any Tailwind conflicts in the result

Example: `cn('text-sm text-red-500', isError && 'text-red-700')` — if `isError` is true, both red classes exist and twMerge resolves the conflict, keeping only `text-red-700`.

---

## src/lib/axios.ts

This is one of the most architecturally important files. It creates a single, pre-configured HTTP client that the entire app uses.

### Why a single instance?

If every page imported raw `axios` and set `withCredentials: true` separately, you'd repeat that configuration everywhere and risk inconsistency. The single instance is created once, configured once, and imported wherever needed.

```typescript
import axios from 'axios';
```
Imports the Axios library. Axios is a popular HTTP client that simplifies `fetch` calls, handles JSON parsing automatically, and has a powerful interceptor system.

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  withCredentials: true,
});
```

`axios.create()` creates a new Axios instance with default config:

- `baseURL`: Every request made with this instance is prefixed with this URL. So `api.get('/api/users/me')` actually calls `http://localhost:8000/api/users/me`. `import.meta.env.VITE_API_URL` reads from your `.env` file — if `VITE_API_URL` is undefined, the `??` (nullish coalescing operator) falls back to `localhost:8000`.

- `withCredentials: true`: This is **critical** for cookie-based auth. By default, browsers block cookies from being sent on cross-origin requests (your frontend on port 3000 calling your backend on port 8000). `withCredentials: true` overrides this restriction. Without it, your login cookies would never be sent to the backend and every protected route would return 401.

```typescript
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject:  (reason?: unknown) => void;
}> = [];
```

These two variables live outside the interceptor function — they're **module-level state**, persisting across all requests.

- `isRefreshing`: A boolean flag. `true` means "a refresh request is already in flight". This prevents multiple simultaneous 401s from each triggering their own refresh call.
- `failedQueue`: An array of objects. Each object holds the `resolve` and `reject` functions of a Promise that is waiting for the refresh to complete. The TypeScript type `Array<{ resolve: ..., reject: ... }>` declares that this array contains objects with exactly those two function properties.

```typescript
function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(null);
  });
  failedQueue = [];
}
```

Called after the refresh attempt completes. It goes through every waiting request and either:
- Resolves them (passes `null` — they don't need a value, they just need the signal to retry)
- Rejects them with the error (if refresh failed, all waiting requests also fail)

`{ resolve, reject }` in the `forEach` is **destructuring** — shorthand for `(item) => { const resolve = item.resolve; const reject = item.reject; ... }`.

After processing, `failedQueue = []` empties the array to prevent double-processing.

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
```

`interceptors.response.use()` takes two functions:
1. The success handler — receives every successful response. We just return it unchanged.
2. The error handler — receives every failed response. This is where the refresh logic lives.

The `async` keyword on the error handler means we can use `await` inside it — necessary because the refresh call is asynchronous.

```typescript
    const originalRequest = error.config;
```

Every Axios error carries the original request configuration in `error.config`. We save it so we can **retry** the same request after refreshing the token. `error.config` includes the URL, method, headers, body — everything needed to re-fire the request.

```typescript
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
```

Two bail-out conditions:
- `error.response?.status !== 401`: We only intercept unauthorized errors. Any other error (404, 500, network failure) passes through immediately. The `?.` is optional chaining — if `error.response` is undefined (network failure with no response), `?.status` returns `undefined` instead of throwing.
- `originalRequest._retry`: `_retry` is a custom flag we set later. If this request already tried to refresh once and still got a 401, it means the refresh itself failed — stop trying or you'll loop forever.

```typescript
    const url: string = originalRequest.url ?? '';
    if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }
```

Don't try to refresh if the failing request *is itself* an auth endpoint. If `POST /auth/refresh` returns 401, we don't call `POST /auth/refresh` again — we just propagate the error.

```typescript
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch((err) => Promise.reject(err));
    }
```

If `isRefreshing` is true, another request already started the refresh. We create a new Promise and push its `resolve`/`reject` into `failedQueue`. The request is now suspended — it will wait until `processQueue` is called. When that happens and the queue is resolved, `.then(() => api(originalRequest))` retries the original request.

`new Promise((resolve, reject) => { ... })` is the Promise constructor. The function inside runs immediately; we save `resolve` and `reject` so they can be called later from outside the Promise.

```typescript
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post('/api/auth/refresh');
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
```

The first request to hit a 401 takes this path:
- Sets `_retry = true` on itself (so if it gets another 401 after refreshing, it won't loop)
- Sets `isRefreshing = true` (so subsequent 401s queue up instead of triggering their own refresh)
- `await api.post('/api/auth/refresh')`: Calls the backend's refresh endpoint. The browser sends the `refresh_token` cookie automatically. The backend issues new cookies.
- On success: `processQueue(null)` unblocks waiting requests, then retries our own request
- On failure: `processQueue(refreshError)` fails all waiting requests, propagates the error
- `finally { isRefreshing = false }`: Runs whether the try block succeeded or failed — resets the flag either way

```typescript
export default api;
```

Makes `api` the default export of this file. Other files import it as: `import api from '@/lib/axios'`.

---

## src/types/auth.ts

This file contains only TypeScript type definitions — no runtime code. Nothing here compiles to JavaScript. It exists purely so the rest of the app has a shared vocabulary for what a `User` looks like.

```typescript
export interface User {
  id:          number;
  name:        string;
  email:       string;
  role:        'admin' | 'developer';
  is_verified: boolean;
  created_at:  string;
}
```

Maps exactly to the backend's `UserResponse` Pydantic schema. Each field:
- `id: number` — primary key from PostgreSQL
- `role: 'admin' | 'developer'` — a **string literal union**. Not just any string — TypeScript will error if you assign `role = 'guest'`. This mirrors the `UserRole` enum on the backend.
- `is_verified: boolean` — true after email verification
- `created_at: string` — dates come from JSON as ISO 8601 strings (`"2024-01-15T10:30:00Z"`). The Python `datetime` object is serialized to a string in the JSON response.

```typescript
export type LoginResult =
  | { success: true }
  | { requires_2fa: true; challenge_token: string };
```

A **discriminated union** — the login function can return one of two different object shapes:
- Shape 1: `{ success: true }` — login completed, session cookies are set
- Shape 2: `{ requires_2fa: true, challenge_token: "..." }` — 2FA needed, no session yet

TypeScript can narrow which shape you're dealing with based on which property you check: `if ('requires_2fa' in result)` tells TypeScript "in this branch, result must be shape 2".

```typescript
export interface AuthContextType {
  user:            User | null;
  isLoading:       boolean;
  isAuthenticated: boolean;
  login:    (email: string, password: string) => Promise<LoginResult>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout:   () => Promise<void>;
}
```

The shape of the context object that `AuthProvider` will provide. Notice the function signatures:
- `login: (email: string, password: string) => Promise<LoginResult>` — a function that takes two strings and returns a Promise resolving to `LoginResult`. `Promise<T>` means "an asynchronous operation that eventually produces a value of type T".
- `Promise<void>` — an async operation that produces no value (like logout — you just wait for it to finish).

Separating this interface into `types/auth.ts` (instead of defining it inside `AuthContext.tsx`) means both the context file and any component that imports `AuthContextType` can reference the same definition.

---

## src/contexts/AuthContext.tsx

React Context is the mechanism for sharing state across the component tree without passing props through every intermediate component. The pattern has three parts: create the context, provide it near the root of the app, consume it in any child component.

```typescript
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
```

Named imports from React:
- `createContext`: Creates a context object
- `useContext`: Hook to consume a context value inside a component
- `useEffect`: Hook to run side effects (API calls, subscriptions) after rendering
- `useState`: Hook to add reactive state to a functional component
- `type ReactNode`: TypeScript type for "anything React can render" — JSX, strings, numbers, arrays, null. The `type` prefix means it's a type-only import.

```typescript
import api from '@/lib/axios';
import type { User, AuthContextType, LoginResult } from '@/types/auth';
```

Imports our axios instance and our type definitions. `import type` is TypeScript syntax for importing only types (no runtime bundle impact).

```typescript
const AuthContext = createContext<AuthContextType | null>(null);
```

Creates the Context object. `createContext<AuthContextType | null>(null)`:
- The generic `<AuthContextType | null>` declares what type of value this context holds
- The `null` argument is the **default value** — what the context returns if no `Provider` is found above it in the tree. We use `null` because components should always be inside `AuthProvider`; if they're not, our custom hook will throw an error.

```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
```

This is the Provider component. It:
- `{ children }`: Uses destructuring to extract `children` from the props object
- `{ children: ReactNode }`: The TypeScript type for the props object — must have a `children` property of type `ReactNode`
- Returns a `Context.Provider` wrapper that makes the auth state available to everything inside it

```typescript
  const [user,      setUser]      = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
```

`useState` returns a tuple (a fixed-length array) of `[currentValue, setterFunction]`. Array destructuring unpacks it into named variables.
- `user` starts as `null` (no one is logged in)
- `isLoading` starts as `true` — we're in the middle of checking the session. Starting `false` would briefly show the login page to authenticated users on page refresh.

`useState<User | null>(null)` — the generic says "this state holds either a User or null". TypeScript would infer this from the initial value, but being explicit makes the code self-documenting.

```typescript
  useEffect(() => {
    api.get<User>('/api/users/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);
```

`useEffect` runs after the component mounts (renders for the first time). The `[]` dependency array means "run this only once". If you passed `[user]`, it would re-run every time `user` changed.

Inside, we call the `/api/users/me` endpoint:
- `api.get<User>(...)` — the `<User>` generic tells TypeScript the response data will be shaped like the `User` interface
- `.then((res) => setUser(res.data))` — on success, store the user in state
- `.catch(() => setUser(null))` — on failure (401, network error), set user to null. The `_` prefix would conventionally mean "unused" but we just ignore the error — we don't need it here.
- `.finally(() => setIsLoading(false))` — runs regardless of success/failure, signals that the check is done

Note: if the access token is expired, the Axios interceptor in `lib/axios.ts` will try to refresh it transparently before this `.catch()` is reached.

```typescript
  const login = async (email: string, password: string): Promise<LoginResult> => {
    const res = await api.post('/api/auth/login', { email, password });
```

`async` functions always return a Promise. `await` pauses execution inside the function until the Promise resolves (but doesn't block the browser's main thread).

`{ email, password }` is **shorthand property notation** — equivalent to `{ email: email, password: password }`.

```typescript
    if (res.data.requires_2fa) {
      return { requires_2fa: true, challenge_token: res.data.challenge_token };
    }
```

If the backend says 2FA is required, we return early without setting `user`. The calling component (Login page) checks this return value and redirects to the 2FA verification screen.

```typescript
    const userRes = await api.get<User>('/api/users/me');
    setUser(userRes.data);
    return { success: true };
  };
```

After a successful login, the backend sets the access and refresh cookies in the HTTP response headers. We then immediately call `/users/me` to populate the `user` state — we can't get the user data from the login response itself (it only returns `{ message: "Logged in successfully" }`).

```typescript
  const register = async (name: string, email: string, password: string): Promise<void> => {
    await api.post('/api/auth/register', { name, email, password });
    const userRes = await api.get<User>('/api/users/me');
    setUser(userRes.data);
  };
```

Same pattern as login — register, then fetch the user. `Promise<void>` means the function is async but has nothing meaningful to return.

```typescript
  const logout = async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
    }
  };
```

The `finally` block here is a deliberate choice. Even if the network request fails (backend is down, cookie is already expired), we still clear the local `user` state. The user always gets logged out from the UI's perspective, regardless of backend response.

```typescript
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
```

Renders the Provider component with our state and functions as the `value`. `!!user` converts `user` to a boolean — `null` becomes `false`, a `User` object becomes `true`. This is the "double negation" trick: `!null = true`, `!!null = false`.

```typescript
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>');
  return ctx;
}
```

A custom hook that wraps `useContext`. The `if (!ctx)` check catches the case where `useAuth()` is called outside the `AuthProvider` — this produces a clear, actionable error message instead of a confusing `Cannot read properties of null` crash.

The return type `: AuthContextType` (not `AuthContextType | null`) — TypeScript knows that after the null check, `ctx` must be `AuthContextType`.

---

## src/components/ProtectedRoute.tsx

```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
```

Two things from React Router:
- `Navigate`: A component that immediately redirects to another route when rendered
- `Outlet`: A placeholder that renders whatever child routes match the current URL

```typescript
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
```

Destructures only the two values we need from the auth context. Destructuring with specific keys means this component only re-renders when those specific values change — not when `user.name` changes, for example.

```typescript
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
```

While the `/users/me` call on mount is in flight, `isLoading` is `true`. We show a spinner instead of rendering the route or redirecting. Without this check, authenticated users would see `/login` flash briefly every time they refresh the page.

The spinner is a `div` with:
- `animate-spin`: Tailwind class — applies a CSS `@keyframes` rotation animation
- `rounded-full`: Makes it a circle
- `border-2 border-primary border-t-transparent`: A solid teal border with the top edge transparent — this creates the "arc" of a classic spinner

```typescript
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
```

If not loading and not authenticated, redirect to `/login`. The `replace` prop replaces the current history entry instead of pushing a new one — so pressing the browser back button won't return to the protected route.

```typescript
  return <Outlet />;
```

If authenticated, render the child routes. In `App.tsx`, the children of `ProtectedRoute` are the dashboard routes — so this is where they appear.

---

## src/components/Sidebar.tsx

```typescript
import { NavLink, useNavigate } from 'react-router-dom';
```

- `NavLink`: Like `<Link>` but with active state awareness — it knows when its `to` URL matches the current URL and provides an `isActive` boolean to style accordingly
- `useNavigate`: A hook that returns a `navigate` function for programmatic navigation (e.g., after logout)

```typescript
import {
  LayoutDashboard, FolderKanban, CheckSquare, Terminal,
  BookOpen, BarChart3, UserCircle, LogOut,
} from 'lucide-react';
```

Named imports from Lucide — an icon library. Each export is a React component that renders an SVG icon.

```typescript
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  ...
] as const;
```

`as const` makes this array and all its properties read-only and locks their types to their literal values. Without `as const`, TypeScript types `to` as `string`. With it, `to` is typed as `'/dashboard'` specifically.

Storing nav items as data (rather than writing each `NavLink` manually) follows the DRY principle — add a new nav item by adding one object to the array, not duplicating a block of JSX.

```typescript
export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
```

`useNavigate()` returns the `navigate` function from React Router. Calling `navigate('/login')` is the same as clicking a link to `/login`.

```typescript
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
```

Two steps: call the auth context's logout (which hits the backend and clears `user` state), then navigate to `/login`. Both steps are necessary — logout alone doesn't navigate, navigate alone doesn't clear the session.

```typescript
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';
```

Building the avatar initials from the user's name:
- `user?.name`: Optional chaining — if `user` is null, the whole expression short-circuits to `undefined`
- `?.split(' ')`: Splits "Vishal Raj" into `["Vishal", "Raj"]`
- `.map((n) => n[0])`: Takes the first character of each word → `["V", "R"]`
- `.slice(0, 2)`: Take at most 2 initials
- `.join('')`: Combine into `"VR"`
- `.toUpperCase()`: Ensure uppercase
- `?? '?'`: If the whole chain returned `undefined` (user was null), use `'?'` as the fallback

```typescript
  return (
    <aside
      style={{ width: 'var(--sidebar-width)' }}
      className="fixed inset-y-0 left-0 flex flex-col border-r border-sidebar-border bg-sidebar"
    >
```

`style={{ width: 'var(--sidebar-width)' }}` applies the CSS variable directly as an inline style. `inset-y-0` (Tailwind) sets `top: 0; bottom: 0` — the sidebar spans the full height. `fixed` takes it out of the document flow so it doesn't scroll with the page.

```typescript
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
```

`icon: Icon` — destructuring with rename. `icon` is the property name in the array, but React requires component names to start with a capital letter. Renaming it `Icon` in the destructure makes it usable as `<Icon />` in JSX.

```typescript
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
              )
            }
          >
```

`NavLink` accepts a function as `className`. React Router calls that function with `{ isActive }` and uses the return value as the class string. This is how the active state is applied without any manual state tracking.

`bg-primary/10` — Tailwind syntax for `var(--primary)` at 10% opacity. The `/` followed by a number is an opacity modifier.

```typescript
            <Icon size={15} />
            {label}
```

`<Icon size={15} />` renders the Lucide icon SVG at 15px. The `size` prop is provided by Lucide — it sets both `width` and `height` on the SVG element.

---

## src/layouts/DashboardLayout.tsx

```typescript
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        style={{ marginLeft: 'var(--sidebar-width)' }}
        className="min-h-screen"
      >
        <Outlet />
      </main>
    </div>
  );
}
```

A structural component — it arranges the sidebar and the content area. There is intentionally no logic here.

`style={{ marginLeft: 'var(--sidebar-width)' }}` pushes the main content right by exactly the sidebar width. If the sidebar is `fixed` (taken out of flow), the main content would sit under it without this margin.

`<Outlet />` is where React Router renders the matched child route. If the current URL is `/dashboard`, React Router renders `<Dashboard />` here. If it's `/projects`, it renders `<Placeholder page="Projects" />`.

---

## src/pages/auth/Login.tsx

```typescript
function extractError(err: unknown): string {
```

`unknown` is TypeScript's safe "I don't know the type" — unlike `any`, you can't do anything with an `unknown` value until you check its type. This is appropriate for caught errors: JavaScript can throw anything (an Error, a string, a number), so `unknown` is the correct type.

```typescript
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
```

`axios.isAxiosError(err)` is a **type guard** — it returns `true` if `err` is an Axios error, and TypeScript narrows the type inside the `if` block so `err.response` is accessible without type errors.

`err.response?.data?.detail` — optional chaining through three levels. If any level is null/undefined, the whole expression returns `undefined` safely.

```typescript
    if (Array.isArray(detail)) {
      return detail.map((d: { msg: string }) => d.msg).join('. ');
    }
    if (typeof detail === 'string') return detail;
```

Handles both FastAPI error shapes:
- Pydantic validation errors: `detail` is an array of `{ msg: "...", type: "..." }` objects. We map to just the messages and join them with periods.
- HTTPException: `detail` is a plain string. Return it directly.
- Anything else: fall through to the default.

```typescript
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
```

Four pieces of local state for the form. TypeScript infers the types from the initial values — `useState('')` is `useState<string>('')`, `useState(false)` is `useState<boolean>(false)`.

```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
```

`React.FormEvent` is the TypeScript type for a form submission event. `e.preventDefault()` stops the browser's default behavior (which would reload the page when a form submits).

```typescript
    const result = await login(email, password);

    if ('requires_2fa' in result && result.requires_2fa) {
      navigate('/verify-2fa', { state: { challenge_token: result.challenge_token } });
    } else {
      navigate('/dashboard');
    }
```

`'requires_2fa' in result` checks if the property exists on the object — this is how you narrow a TypeScript discriminated union. If it's there, TypeScript knows `result` is the `{ requires_2fa: true, challenge_token: string }` shape.

`navigate('/verify-2fa', { state: ... })` passes data to the next route via React Router's state mechanism. The 2FA page can read it with `useLocation().state`.

```typescript
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
```

`{error && <Component />}` — JSX conditional rendering. If `error` is an empty string (falsy), the Alert doesn't render. If it has content (truthy), it renders. This is a common React pattern.

```typescript
              disabled={isLoading}
```

Disables all inputs and the button while the request is in flight. Prevents double submissions and shows the user that something is happening.

---

## src/pages/auth/Register.tsx

Structurally identical to Login with one additional field (name). Key difference:

```typescript
                  <span className="text-[11px] text-muted-foreground">
                    8+ chars, 1 uppercase, 1 number
                  </span>
```

`text-[11px]` is a Tailwind **arbitrary value** — when the standard scale doesn't have the exact size you need, you write it in square brackets. This renders as `font-size: 11px` in the CSS.

The hint text is rendered inline next to the "Password" label to set expectations before the user types, reducing form errors.

---

## src/pages/Dashboard.tsx

```typescript
const STAT_CARDS = [
  {
    label:       'Projects',
    value:       '—',
    description: 'Active',
    icon:        FolderKanban,
  },
  ...
] as const;
```

`'—'` is an em dash (not a hyphen). Used as a placeholder where real data will go in Phase F-2.

```typescript
export function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'there';
```

Gets the first word of the user's name for the greeting. `[0]` accesses the first element of the array returned by `split`. If `user` is somehow null, `?? 'there'` provides a friendly fallback ("Hey, there!").

```typescript
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
```

A responsive grid:
- Mobile (default): 1 column
- `sm:` breakpoint (640px+): 2 columns
- `xl:` breakpoint (1280px+): 4 columns (all cards in a row)

This is Tailwind's responsive prefix system — prefix any utility with a breakpoint name to apply it at that screen size and above.

```typescript
        {STAT_CARDS.map(({ label, value, description, icon: Icon }) => (
          <Card key={label} className="relative overflow-hidden">
```

`key={label}` — React requires a unique `key` on elements generated in a loop. The key helps React track which item is which when the list changes. Using `label` (which is unique) is correct here.

`overflow-hidden` clips any content that extends beyond the card's boundaries — useful if we add decorative elements in Phase F-2.

---

## src/pages/Placeholder.tsx

```typescript
interface PlaceholderProps {
  page: string;
}

export function Placeholder({ page }: PlaceholderProps) {
```

A simple interface defining that this component accepts one prop: `page` (a string). Destructured directly in the function parameters.

```typescript
      <span className="text-primary text-lg font-mono font-semibold">
        {page[0]}
      </span>
```

`page[0]` gets the first character of the page name string. For "Projects", it renders "P". This creates a simple initial-based avatar for each placeholder page.

---

## src/App.tsx

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
```

The React Router components:
- `BrowserRouter`: Wraps the app and provides routing context using the browser's History API (real URLs, no `#` hashes)
- `Routes`: Container for all your `Route` definitions — renders only the first matching route
- `Route`: Maps a URL path to a component
- `Navigate`: Renders nothing but immediately redirects

```typescript
      <BrowserRouter>
        <AuthProvider>
```

The order matters. `AuthProvider` is inside `BrowserRouter` because the auth context's navigation calls (redirecting to `/login` after logout) require the router context to exist.

```typescript
          <Route path="/login"    element={<Login />}    />
          <Route path="/register" element={<Register />} />
```

Public routes — accessible without authentication. No wrappers.

```typescript
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
```

This three-level nesting is the key pattern of the app:

1. `<Route element={<ProtectedRoute />}>` — no `path` here. This is a **layout route** that just wraps children. `ProtectedRoute` renders `<Outlet />` if authenticated.

2. `<Route element={<DashboardLayout />}>` — another layout route. `DashboardLayout` renders `<Sidebar />` + `<Outlet />`.

3. `<Route path="/dashboard" element={<Dashboard />} />` — the actual page route.

When `/dashboard` is visited: `ProtectedRoute` runs the auth check → `DashboardLayout` renders sidebar + outlet → `Dashboard` renders inside the outlet.

```typescript
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
```

Two catch-all redirects:
- `/` redirects to `/dashboard` (the root URL goes to the app)
- `*` matches any URL not defined above — redirects to `/dashboard` rather than showing a blank page

---

## src/main.tsx

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

The entry point of the application — the first file that runs in the browser.

`document.getElementById('root')` returns `HTMLElement | null`. The `!` at the end is the **non-null assertion operator** — you're telling TypeScript "trust me, this will never be null". This is acceptable here because `index.html` always has `<div id="root"></div>`.

`createRoot().render()` is React 18's API for mounting the app. The `root` div in `index.html` becomes the container React renders into.

`StrictMode` is a development tool — it renders components twice to detect side effects, and warns about deprecated APIs. It has zero impact on production builds.

---

## How All the Files Connect

Here is the complete data flow from page load to a protected page rendering:

```
Browser navigates to /dashboard
        │
        ▼
main.tsx → mounts App
        │
        ▼
App.tsx → BrowserRouter + AuthProvider wrap everything
        │
        ▼
AuthProvider (AuthContext.tsx)
  └─ useEffect fires: GET /api/users/me
       ├─ Cookies valid → setUser(user), setIsLoading(false)
       └─ Cookies invalid → axios interceptor tries POST /api/auth/refresh
              ├─ Refresh succeeds → retry GET /users/me → setUser
              └─ Refresh fails → setUser(null), setIsLoading(false)
        │
        ▼
Route matching: /dashboard matches inside <ProtectedRoute>
        │
        ▼
ProtectedRoute.tsx
  ├─ isLoading = true  → render spinner (wait)
  ├─ isAuthenticated = false → <Navigate to="/login" />
  └─ isAuthenticated = true  → <Outlet /> (continue)
        │
        ▼
DashboardLayout.tsx
  └─ renders <Sidebar /> + <Outlet />
        │
        ▼
Dashboard.tsx renders inside the Outlet
  └─ calls useAuth() to get user.name for greeting
```

---

*End of Phase F-1 Documentation*
*Next: Phase F-2 — Projects, Tasks, Sessions, Journal, Analytics, Profile pages*