# Frontend MFA Documentation

## Purpose of this document

This document explains the frontend Multi-Factor Authentication (MFA) implementation in CodeFolio in a detailed, code-aware way.

It covers:

- what the MFA frontend is responsible for
- how the frontend talks to the backend MFA API
- each important file involved in the MFA flow
- each function and UI workflow in execution order
- why specific design and state-management decisions were made
- how to test the flow end to end

This is written as a line-by-line style walkthrough, but grouped by logical code blocks so it stays readable.

---

## MFA frontend goals

The frontend MFA implementation solves four separate jobs:

1. Let a user sign in with email and password as usual.
2. Detect when the backend says a second factor is required.
3. Move the user into a dedicated MFA verification screen before granting dashboard access.
4. Let the user manage MFA from the profile area:
   - enable MFA
   - scan a QR code
   - verify the first authenticator code
   - view one-time recovery codes
   - regenerate recovery codes
   - disable MFA

In short, the frontend does not decide whether MFA is valid. The backend is the source of truth. The frontend's job is to guide the user through the correct flow, preserve the short-lived MFA challenge state, and make the experience clear and responsive.

---

## High-level architecture

The MFA feature is spread across a small group of focused files:

- `src/contexts/AuthContext.tsx`
  Owns authentication state and exposes `login`, `verifyMfa`, `register`, and `logout`.

- `src/pages/auth/Login.tsx`
  Collects email and password. If the backend requires MFA, it stores the challenge token and redirects to the MFA verification page.

- `src/pages/auth/VerifyMfa.tsx`
  Collects either a 6-digit authenticator code or a recovery code, then completes sign-in.

- `src/components/profile/MfaSecurityCard.tsx`
  Handles MFA setup and lifecycle management from the profile page.

- `src/lib/api/mfa.ts`
  A small API wrapper around the backend MFA routes.

- `src/lib/axios.ts`
  Configures shared Axios behavior, especially refresh-token retry rules.

- `src/types/auth.ts`
  Defines auth-related types, including the MFA-aware `LoginResult`.

- `src/types/mfa.ts`
  Defines response types used by the MFA UI.

- `src/pages/Profile.tsx`
  Hosts the MFA security card inside the profile screen.

- `src/App.tsx`
  Registers the MFA verification route.

There are also small support changes in:

- `src/types/analytics.ts`
- `src/layouts/DashboardLayout.tsx`
- `src/components/Sidebar.tsx`
- `vite.config.ts`
- `package.json`

---

## End-to-end flow summary

### 1. Normal login attempt

The user submits email and password on the login page.

- If the backend returns a normal authenticated response, the frontend loads `/users/me` and sends the user to `/dashboard`.
- If the backend returns `requires_2fa` or `requires_mfa`, the frontend does **not** treat the user as logged in yet.
- Instead, it stores `challenge_token` in `sessionStorage` and redirects to `/verify-mfa`.

### 2. MFA verification

On `/verify-mfa`, the user can choose:

- authenticator app code
- recovery code

When verification succeeds:

- the frontend calls the MFA verify endpoint
- the backend issues the real auth cookies
- the frontend loads `/users/me`
- the user is sent to `/dashboard`

### 3. MFA setup from Profile

From the profile page:

- the user opens the MFA security card
- confirms password
- requests setup data from backend
- the backend returns:
  - `secret`
  - `otpauth_url`
  - `issuer`
- the frontend converts `otpauth_url` into a QR image using the `qrcode` package
- the user scans the QR with an authenticator app
- the user enters the current 6-digit code
- the frontend calls the enable endpoint
- the backend returns one-time recovery codes

### 4. Ongoing management

If MFA is already enabled, the user can:

- regenerate recovery codes
- disable MFA

Both of those actions require:

- current password
- either authenticator app code or recovery code

---

## Routing and access design

## File: `src/App.tsx`

### Purpose

This file makes the MFA verification screen reachable and keeps it outside the protected dashboard route tree.

### Key routes

- `/login`
  Standard password login page.

- `/verify-mfa`
  Main MFA verification page.

- `/verify-2fa`
  Alias route pointing to the same MFA verification page.

### Why `/verify-mfa` is public

The verification page must be public because the user is not fully authenticated yet. They only have a short-lived MFA challenge token, not a completed session.

If this page were behind `ProtectedRoute`, the user would get bounced away before they could finish MFA.

### Why there is also `/verify-2fa`

This provides compatibility with older naming or alternate navigation assumptions. Both paths render the same component:

- `VerifyMfa`

That keeps the code simple while allowing either route shape.

---

## Auth state orchestration

## File: `src/contexts/AuthContext.tsx`

### Purpose

`AuthContext` is the central auth brain on the frontend. It owns:

- current user state
- auth loading state
- login workflow
- MFA verification workflow
- logout workflow
- initial session restore

Without this file, each page would have to duplicate auth logic and session loading.

### Imports

```tsx
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { mfaApi } from '@/lib/api/mfa';
import api from '@/lib/axios';
import type { AuthContextType, LoginResult, User } from '@/types/auth';
```

#### Why these imports exist

- React hooks power shared state and lifecycle handling.
- `mfaApi` is used specifically for the MFA verification call.
- `api` is the shared Axios instance for normal authenticated endpoints like `/users/me`.
- Types keep context methods strongly typed.

### Context creation

```tsx
const AuthContext = createContext<AuthContextType | null>(null);
```

This starts the context with `null` so `useAuth()` can later guard against accidental usage outside `AuthProvider`.

### Component: `AuthProvider`

```tsx
export function AuthProvider({ children }: { children: ReactNode }) {
```

This wraps the app and makes auth state available anywhere below it.

### State: `user`

```tsx
const [user, setUser] = useState<User | null>(null);
```

Holds the authenticated user object after `/users/me` succeeds.

- `null` means no active authenticated user is currently loaded.

### State: `isLoading`

```tsx
const [isLoading, setIsLoading] = useState(true);
```

Tracks whether auth state is still being resolved.

This matters during:

- app startup
- login
- MFA verification
- registration
- logout

### Ref: `authRequestIdRef`

```tsx
const authRequestIdRef = useRef(0);
```

This is a race-condition guard.

#### Why it exists

If two auth-related requests overlap, an older request could finish after a newer one and overwrite the newest state. Incrementing a request id prevents stale results from winning.

### Function: `beginAuthRequest`

```tsx
const beginAuthRequest = () => {
    const requestId = ++authRequestIdRef.current;
    setIsLoading(true);
    return requestId;
};
```

#### Purpose

Every auth workflow calls this first.

#### What each line does

- increments the internal request id
- stores the new request id in `requestId`
- sets loading state to `true`
- returns the id to the caller

#### Why it matters

Every later state update can check whether it still belongs to the latest auth request.

### Function: `finishAuthRequest`

```tsx
const finishAuthRequest = (requestId: number, nextUser: User | null) => {
    if (authRequestIdRef.current !== requestId) return;
    setUser(nextUser);
    setIsLoading(false);
};
```

#### Purpose

Completes an auth request only if it is still the newest one.

#### What each line does

- compares the request id that started the operation against the current latest id
- exits early if this response is stale
- updates the user state
- turns loading off

#### Why this is a good design choice

It prevents state flicker and accidental rollback when requests overlap.

### Function: `loadCurrentUser`

```tsx
const loadCurrentUser = async (requestId: number) => {
    const userRes = await api.get<User>('/users/me');
    finishAuthRequest(requestId, userRes.data);
};
```

#### Purpose

Loads the real current user profile after the backend has issued valid auth cookies.

#### Why `/users/me` is used here

The app does not trust login responses to be the complete user object. Instead, it asks the backend for the canonical current-user payload.

This keeps auth state normalized.

### Startup `useEffect`

```tsx
useEffect(() => {
    const requestId = beginAuthRequest();

    api.get<User>('/users/me')
        .then((res) => finishAuthRequest(requestId, res.data))
        .catch(() => finishAuthRequest(requestId, null));
}, []);
```

#### Purpose

Runs once when the app mounts to restore any existing cookie session.

#### Workflow

1. Start an auth request.
2. Ask backend who the current user is.
3. If successful, store that user.
4. If unsuccessful, set user to `null`.

#### Why this is important

This lets the app survive refreshes and browser reloads when the user still has valid cookies.

### Function: `login`

```tsx
const login = async (email: string, password: string): Promise<LoginResult> => {
```

#### Purpose

Starts password-based login and returns one of two possible outcomes:

- full login success
- MFA challenge required

#### Internal flow

```tsx
const requestId = beginAuthRequest();
```

Starts tracked auth loading.

```tsx
const res = await api.post('/auth/login', { email, password });
```

Sends credentials to the backend.

```tsx
if (res.data.requires_2fa || res.data.requires_mfa) {
```

Checks whether the backend wants a second factor.

```tsx
if (authRequestIdRef.current === requestId) {
    setIsLoading(false);
}
```

If the request is still current, loading is turned off because login is paused, not completed.

```tsx
return {
    requires_2fa: true,
    requires_mfa: true,
    challenge_token: res.data.challenge_token,
    expires_in: res.data.expires_in,
};
```

Returns the MFA challenge payload to the caller instead of setting a user immediately.

If MFA is **not** required:

```tsx
await loadCurrentUser(requestId);
return { success: true };
```

This means:

- the backend already issued valid auth cookies
- the frontend can now load `/users/me`
- the user is considered fully authenticated

#### Error path

On error, the code safely turns loading off for the current request and rethrows the error so the page can render the message.

### Function: `verifyMfa`

```tsx
const verifyMfa = async (
    challengeToken: string,
    factor: { code?: string; recoveryCode?: string },
): Promise<void> => {
```

#### Purpose

Completes the second factor step after password login.

#### Why it accepts two possible factor shapes

The UI supports:

- authenticator app code
- recovery code

The context keeps that interface flexible by accepting either.

#### Internal workflow

```tsx
const requestId = beginAuthRequest();
```

Starts tracked loading.

```tsx
await mfaApi.verify({
    challenge_token: challengeToken,
    code: factor.code,
    recovery_code: factor.recoveryCode,
});
```

Posts the challenge token and whichever proof the user supplied.

```tsx
await loadCurrentUser(requestId);
```

Once verification succeeds, the frontend loads the now-authenticated user session.

That is the moment where the user becomes fully signed in on the frontend.

### Function: `register`

Registers a new user, then loads `/users/me` so the session state becomes current.

This is not MFA-specific, but it follows the same request-tracking pattern for consistency.

### Function: `logout`

```tsx
const logout = async (): Promise<void> => {
    const requestId = beginAuthRequest();

    try {
        await api.post('/auth/logout');
    } finally {
        finishAuthRequest(requestId, null);
    }
};
```

#### Purpose

Clears frontend auth state even if the backend logout call throws.

#### Why `finally` is used

The frontend must not leave the UI looking logged in after the user clicks logout.

### Context provider value

The provider exposes:

- `user`
- `isLoading`
- `isAuthenticated`
- `login`
- `verifyMfa`
- `register`
- `logout`

### Hook: `useAuth`

```tsx
export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>');
    return ctx;
}
```

#### Purpose

Provides a safe way to consume auth state.

#### Why the error guard matters

It prevents silent failures if someone forgets to wrap a route tree in `AuthProvider`.

---

## Login page behavior

## File: `src/pages/auth/Login.tsx`

### Purpose

This page collects email and password and decides whether the user:

- goes directly to the dashboard
- or gets redirected into MFA verification

### Function: `extractError`

This helper normalizes API errors into friendly strings.

#### Behavior

- If the Axios error contains `detail` as an array, it joins messages.
- If `detail` is a string, it returns that.
- Otherwise it returns a generic fallback.

This same pattern is reused in multiple files because the backend may return either structured validation errors or plain text detail messages.

### Component state

The page stores:

- `email`
- `password`
- `showPassword`
- `error`
- `isLoading`

These are all view-level concerns, so they live in the page instead of `AuthContext`.

### Function: `handleSubmit`

This is the core login page workflow.

#### Step 1: prevent default form submission

```tsx
e.preventDefault();
```

Prevents the browser from doing a full page refresh.

#### Step 2: reset visible error and start loading

```tsx
setError('');
setIsLoading(true);
```

This clears any previous failure and disables the form.

#### Step 3: call context `login`

```tsx
const result = await login(email, password);
```

The page does not talk to Axios directly. It delegates auth behavior to `AuthContext`.

#### Step 4: branch on MFA challenge

```tsx
if ('requires_2fa' in result && result.requires_2fa) {
```

This checks whether the result is the challenge variant of `LoginResult`.

#### Step 5: persist challenge token

```tsx
sessionStorage.setItem('mfa_challenge_token', result.challenge_token);
```

This is an important design detail.

##### Why `sessionStorage` is used

React Router route state can disappear on refresh. `sessionStorage` gives the page a backup place to recover the challenge token during the same browser tab session.

##### Why not `localStorage`

The challenge token is short-lived and only useful for the current in-progress login flow. `sessionStorage` is a tighter fit.

#### Step 6: navigate to verify page

```tsx
navigate('/verify-mfa', {
    state: {
        challenge_token: result.challenge_token,
        expires_in: result.expires_in,
    },
});
```

Both route state and session storage are used:

- route state makes the handoff immediate
- session storage makes refresh recovery possible

#### Step 7: normal login success path

If MFA is not required:

```tsx
navigate('/dashboard');
```

#### Step 8: error path

```tsx
setError(extractError(err));
```

Shows a readable message in the alert component.

#### Step 9: loading cleanup

```tsx
setIsLoading(false);
```

Runs in `finally`, so the button always re-enables.

### UI purpose

The login screen was designed to make MFA feel intentional rather than bolted on.

#### Left panel

The left side on large screens explains:

- MFA-ready flow
- session cookie behavior
- developer/security branding

#### Right panel

The form itself stays compact and familiar.

#### Why this matters

Users should understand that "password accepted" does not always mean "fully signed in."

---

## MFA verification page

## File: `src/pages/auth/VerifyMfa.tsx`

### Purpose

This page finishes sign-in after the password step for MFA-enabled accounts.

It supports both:

- authenticator app code
- recovery code

### Helper: `extractError`

Same purpose as in the login page:

- turn backend/Axios errors into readable text

### Type: `VerifyState`

```tsx
type VerifyState = {
    challenge_token?: string;
    expires_in?: number;
};
```

This matches what the login page passes via router state.

### State variables

The page stores:

- `method`
  Which proof mode is active: app or recovery.

- `code`
  The 6-digit authenticator code.

- `recoveryCode`
  The fallback recovery code string.

- `error`
  Visible API error message.

- `isLoading`
  Button disable/loading state.

### `challengeToken` via `useMemo`

```tsx
const challengeToken = useMemo(
    () => routeState.challenge_token ?? sessionStorage.getItem('mfa_challenge_token') ?? '',
    [routeState.challenge_token],
);
```

#### Purpose

Creates a single source of truth for the in-progress MFA challenge.

#### Lookup order

1. route state from navigation
2. `sessionStorage` fallback
3. empty string if neither exists

#### Why this is a strong choice

It protects the flow from accidental refreshes or lost in-memory route state.

### `useEffect` that stores route token

```tsx
useEffect(() => {
    if (routeState.challenge_token) {
        sessionStorage.setItem('mfa_challenge_token', routeState.challenge_token);
    }
}, [routeState.challenge_token]);
```

#### Purpose

If the user arrived via navigation state, immediately mirror that value into `sessionStorage`.

This makes the flow resilient without requiring the login page to be the only writer.

### Redirect guard

```tsx
if (!challengeToken) {
    return <Navigate to="/login" replace />;
}
```

#### Purpose

Prevents the user from opening the MFA page without a valid in-progress challenge.

#### Why this matters

Without a challenge token, the page has nothing meaningful to verify.

### `expiresInMinutes`

```tsx
const expiresInMinutes = Math.max(1, Math.ceil((routeState.expires_in ?? 300) / 60));
```

#### Purpose

Transforms backend expiry seconds into a friendlier UI label.

#### Why `Math.max(1, ...)` is used

Even if the backend returns a very small value, the UI should not display `0 minutes`.

### Function: `handleSubmit`

This is the core MFA verification workflow.

#### Step 1

Prevent default form behavior and clear prior error.

#### Step 2

Turn loading on.

#### Step 3

Call context `verifyMfa`.

```tsx
await verifyMfa(
    challengeToken,
    method === 'app' ? { code } : { recoveryCode },
);
```

##### Important detail

The page sends one shape or the other depending on selected method.

#### Step 4

Remove the temporary challenge token after success.

```tsx
sessionStorage.removeItem('mfa_challenge_token');
```

This cleanup is important because the challenge is single-flow state, not long-term auth state.

#### Step 5

Navigate to dashboard with `replace: true`.

```tsx
navigate('/dashboard', { replace: true });
```

##### Why `replace` is used

It keeps the browser history cleaner so users do not land back on the verification page by pressing Back after successful login.

### Method switch buttons

The segmented control toggles between:

- `App code`
- `Recovery code`

This is a good UX choice because both paths are related, but only one should be active at a time.

### Form rendering logic

If `method === 'app'`:

- render numeric code field
- use `inputMode="numeric"`
- set `autoComplete="one-time-code"`

If `method === 'recovery'`:

- render recovery code field
- use monospaced presentation

### Error display behavior

If the error text includes "too many", the page switches to a more cautionary icon.

That creates a better signal for temporary rate-limiting or lockout states.

### UI purpose

The page is intentionally distinct from login:

- login says "prove your password"
- verify page says "prove you also hold the second factor"

The challenge-expiry panel reinforces that this is a short, temporary state.

---

## MFA API wrapper

## File: `src/lib/api/mfa.ts`

### Purpose

This file centralizes the backend MFA routes into one small client wrapper.

That gives the rest of the UI:

- cleaner imports
- consistent payload shapes
- stronger typing

### Function: `status`

```tsx
status: async (): Promise<MfaStatus> => {
    const res = await api.get<MfaStatus>('/auth/mfa/status');
    return res.data;
},
```

#### Purpose

Gets current MFA status for the signed-in user, including how many recovery codes remain.

### Function: `setup`

```tsx
setup: async (password: string): Promise<MfaSetupResponse> => {
    const res = await api.post<MfaSetupResponse>('/auth/mfa/setup', { password });
    return res.data;
},
```

#### Purpose

Begins setup after password confirmation.

#### Response data used later

- `secret`
- `otpauth_url`
- `issuer`

### Function: `enable`

Posts:

- password
- current authenticator code

The backend uses this to confirm the secret was scanned correctly before enabling MFA.

### Function: `verify`

Posts:

- `challenge_token`
- optional `code`
- optional `recovery_code`

This endpoint is used during login completion, not profile management.

### Function: `regenerateRecoveryCodes`

Used after MFA is already enabled.

Requires:

- password
- current second factor proof

### Function: `disable`

Disables MFA with the same proof requirements as regeneration.

### Why this wrapper matters

Keeping these endpoints in one file avoids duplicated endpoint strings and reduces the chance of payload drift across components.

---

## Shared Axios behavior and refresh logic

## File: `src/lib/axios.ts`

### Purpose

This file creates the shared Axios instance and manages cookie-based refresh behavior.

This is one of the most important supporting files for MFA because login and MFA verification are not normal authenticated requests.

### Base Axios instance

```tsx
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
    withCredentials: true,
});
```

#### Why `withCredentials: true` matters

Your backend uses cookies, including `httpOnly` cookies. Those only travel with requests if the browser is allowed to send credentials.

Without this, auth would appear to break even when the backend is correct.

### Refresh coordination variables

#### `isRefreshing`

Tracks whether a refresh request is already running.

#### `failedQueue`

Stores requests that failed with `401` while refresh was already in progress.

This prevents many simultaneous expired requests from each trying to refresh independently.

### Function: `processQueue`

Resolves or rejects all queued requests after refresh finishes.

#### Behavior

- If refresh succeeded, queued requests retry.
- If refresh failed, queued requests reject.

### Function: `shouldAttemptRefresh`

```tsx
function shouldAttemptRefresh(url?: string): boolean {
    if (!url) return true;

    const refreshExcludedPaths = [
        '/auth/login',
        '/auth/register',
        '/auth/mfa/verify',
    ];

    return !refreshExcludedPaths.some((path) => url.includes(path));
}
```

### Why this function is crucial for MFA

Some requests should **not** trigger the silent refresh flow:

- `/auth/login`
- `/auth/register`
- `/auth/mfa/verify`

#### Why exclude `/auth/login`

If login fails, the app should show the failure. It should not try to refresh a session that does not exist yet.

#### Why exclude `/auth/mfa/verify`

MFA verify is part of login completion, not ordinary session refresh behavior. If that step fails, the correct behavior is to show the MFA error, not enter a refresh loop.

### Response interceptor

The interceptor:

1. passes successful responses through unchanged
2. checks for `401`
3. retries once after calling `/auth/refresh`
4. queues concurrent failures if refresh is already happening

### Why this supports MFA well

Authenticated management endpoints like:

- `/auth/mfa/status`
- `/auth/mfa/setup`
- `/auth/mfa/enable`
- `/auth/mfa/recovery-codes`
- `/auth/mfa/disable`

are allowed to participate in normal refresh behavior because those happen inside an already authenticated session.

That means a user does not get kicked out of the MFA settings page just because an access cookie expired naturally.

---

## Auth and MFA types

## File: `src/types/auth.ts`

### Purpose

Defines the shapes used by auth state and login outcomes.

### Interface: `User`

Important MFA-related field:

- `mfa_enabled: boolean`

This allows the UI to show accurate MFA state in profile and any other authenticated area.

### Type: `LoginResult`

This is one of the most important type changes in the whole feature.

```tsx
export type LoginResult =
    | { success: true }
    | {
        requires_2fa: true;
        requires_mfa?: true;
        challenge_token: string;
        expires_in?: number;
    };
```

#### Why this union matters

The login flow no longer has exactly one outcome. It can end in:

- full session success
- MFA challenge required

Typing that explicitly forces the page to handle both branches.

### Interface: `AuthContextType`

The key MFA addition is:

```tsx
verifyMfa: (challengeToken: string, factor: { code?: string; recoveryCode?: string }) => Promise<void>;
```

That gives the rest of the app a typed, centralized entry point for finishing MFA.

## File: `src/types/mfa.ts`

### Interface: `MfaStatus`

```tsx
{
    enabled: boolean;
    recovery_codes_remaining: number;
}
```

Used by the profile security card to show current state.

### Interface: `MfaSetupResponse`

```tsx
{
    secret: string;
    otpauth_url: string;
    issuer: string;
}
```

This powers both manual setup and QR setup.

### Interface: `MfaRecoveryCodesResponse`

```tsx
{
    message: string;
    recovery_codes: string[];
}
```

This is used after:

- initial enable
- recovery code regeneration

## File: `src/types/analytics.ts`

### Relevant change

`PrivateProfile` now includes:

```tsx
mfa_enabled: boolean;
```

That lets the profile screen and other private-profile consumers display accurate security status without custom reshaping.

---

## Profile integration

## File: `src/pages/Profile.tsx`

### Purpose

This screen is where the signed-in user manages account identity and security.

### Why it matters for MFA

The page passes the current MFA state into the security card:

```tsx
<MfaSecurityCard enabled={profile.mfa_enabled} onStateChange={refresh} />
```

### Why `onStateChange={refresh}` is smart

After enabling, disabling, or regenerating codes, the profile data may change.

Calling `refresh` means the page can immediately reflect:

- `mfa_enabled`
- any updated profile payload tied to security state

without forcing a full reload.

### UI role

The profile page gives MFA a natural home inside a broader "Profile & security" experience instead of isolating it as a hidden settings toggle.

---

## MFA management card

## File: `src/components/profile/MfaSecurityCard.tsx`

### Purpose

This is the main interactive MFA management surface for authenticated users.

It handles:

- showing MFA status
- starting setup
- rendering QR code setup
- enabling MFA
- revealing recovery codes
- regenerating recovery codes
- disabling MFA

This is the biggest piece of MFA UI logic in the frontend.

### Imports

The important imports are:

- `axios`
  for error normalization
- `QRCode`
  to convert `otpauth_url` into a scannable image
- icon imports
  for clear action cues
- `mfaApi`
  for all backend calls
- MFA types
  for type-safe state

### Local types

```tsx
type PanelMode = 'setup' | 'disable' | 'regenerate' | null;
type ProofMode = 'app' | 'recovery';
```

#### Why these exist

The component has two separate control decisions:

- which management panel is open
- which proof method is selected inside proof-based actions

Using narrow string unions makes the render logic clean and safe.

### Props

```tsx
interface MfaSecurityCardProps {
    enabled: boolean;
    onStateChange: () => Promise<void> | void;
}
```

#### `enabled`

Comes from the profile page and tells the card whether MFA is currently on.

#### `onStateChange`

Lets the parent refresh profile state when MFA changes.

### Component state overview

The component owns several groups of state.

#### Status state

- `status`
- `isStatusLoading`
- `statusError`

These belong to the passive display section.

#### Panel mode state

- `panel`
- `proofMode`

These control which action UI is visible.

#### Setup state

- `setupPassword`
- `setupCode`
- `setupData`
- `qrCodeDataUrl`

These exist only for the enable-MFA workflow.

#### Proof action state

- `proofPassword`
- `proofCode`
- `proofRecoveryCode`

These support disable and regenerate flows.

#### Shared action state

- `actionError`
- `isActionLoading`
- `revealedCodes`
- `copiedField`

These control feedback and one-time-code visibility.

### Function: `refreshStatus`

```tsx
const refreshStatus = async () => {
    setIsStatusLoading(true);
    setStatusError('');

    try {
        const nextStatus = await mfaApi.status();
        setStatus(nextStatus);
    } catch (error) {
        setStatusError(extractError(error));
    } finally {
        setIsStatusLoading(false);
    }
};
```

#### Purpose

Fetches the latest MFA state from the backend.

#### Why it exists separately

This logic is needed:

- on mount
- after enable
- after regeneration
- after disable

Keeping it in one function avoids duplication.

### Mount `useEffect`

```tsx
useEffect(() => {
    refreshStatus();
}, []);
```

Loads MFA status as soon as the card appears.

### QR generation `useEffect`

This is one of the most important recent improvements.

```tsx
useEffect(() => {
    let isCancelled = false;

    const createQrCode = async () => {
        if (!setupData?.otpauth_url) {
            setQrCodeDataUrl('');
            return;
        }

        try {
            const nextQrCode = await QRCode.toDataURL(setupData.otpauth_url, {
                errorCorrectionLevel: 'M',
                margin: 1,
                width: 280,
                color: {
                    dark: '#0f1720',
                    light: '#f8fffd',
                },
            });

            if (!isCancelled) {
                setQrCodeDataUrl(nextQrCode);
            }
        } catch {
            if (!isCancelled) {
                setQrCodeDataUrl('');
            }
        }
    };

    createQrCode();

    return () => {
        isCancelled = true;
    };
}, [setupData]);
```

### Why this effect exists

The backend returns an `otpauth_url`, not an image. Authenticator apps can use that URI, but users expect a QR code for scanning.

This effect converts the URI into a QR image in the browser.

### Line-by-line purpose

#### `let isCancelled = false;`

Prevents state updates if the component unmounts while async QR generation is still running.

#### `if (!setupData?.otpauth_url) { ... }`

If setup data does not exist yet, clear any old QR image and exit.

#### `QRCode.toDataURL(...)`

Generates a data URL that can be used directly in an `<img>` tag.

#### Error correction, margin, width, colors

These options improve scan reliability and visual quality:

- medium error correction
- compact margin
- fixed width for consistent layout
- dark/light colors matching the UI while preserving contrast

#### `if (!isCancelled) { setQrCodeDataUrl(nextQrCode); }`

Only update state if the component is still mounted.

#### Cleanup return

Marks the effect as cancelled during unmount or dependency change.

### Function: `resetSetupPanel`

Clears setup-specific state:

- password
- code
- setup payload
- QR image
- action error

This prevents stale setup data from leaking into future attempts.

### Function: `resetProofPanel`

Clears proof-action state:

- password
- app code
- recovery code
- proof mode
- action error

This keeps disable/regenerate flows clean between openings.

### Function: `openPanel`

Opens one of the three panel modes and resets whichever state belongs to that mode.

#### Why this matters

Users should not see stale passwords, stale codes, or previous error text when reopening a management panel.

### Function: `closePanel`

Closes the active panel and resets both setup and proof state.

This is a conservative cleanup choice and keeps the next interaction predictable.

### Function: `copyText`

```tsx
const copyText = async (value: string, field: string) => {
    try {
        await navigator.clipboard.writeText(value);
        setCopiedField(field);
        window.setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1600);
    } catch {
        setCopiedField(null);
    }
};
```

#### Purpose

Handles all copy-to-clipboard actions:

- setup secret
- app link
- recovery codes

#### Why `copiedField` exists

It allows only the clicked control to show temporary "Copied" feedback.

### Function: `handleSetupStart`

This begins MFA setup after password confirmation.

#### Workflow

1. set loading
2. clear prior action error
3. call `mfaApi.setup(setupPassword)`
4. store returned `setupData`
5. clear any prior entered setup code
6. clear previously revealed recovery codes

#### Why recovery codes are cleared here

If the user had previously enabled or regenerated MFA in the same session, those revealed codes should not visually mix with a fresh setup flow.

### Function: `handleEnable`

This completes MFA setup.

#### Workflow

1. set loading
2. clear action error
3. call `mfaApi.enable(setupPassword, setupCode)`
4. store returned recovery codes in `revealedCodes`
5. refresh status
6. tell parent to refresh profile
7. close setup panel

#### Important detail

Even though `closePanel()` clears setup form state, `revealedCodes` remain visible outside the panel so the user can still save them.

That is a nice UX detail.

### Derived value: `currentProofPayload`

```tsx
const currentProofPayload =
    proofMode === 'app'
        ? { password: proofPassword, code: proofCode }
        : { password: proofPassword, recovery_code: proofRecoveryCode };
```

#### Purpose

Builds the correct backend payload shape for:

- disable
- recovery code regeneration

This avoids duplicating the same conditional in multiple handlers.

### Function: `finishProofAction`

This helper centralizes post-request behavior for proof-based actions.

#### Parameters

- `request`
  the API promise to await
- `nextEnabled`
  whether MFA should remain enabled after the action

#### Behavior

1. start loading
2. clear action error
3. await request
4. if new recovery codes are returned, reveal them
5. if MFA was disabled, clear any displayed recovery codes
6. refresh status
7. refresh parent profile
8. close panel

#### Why this helper is good engineering

Both regenerate and disable share nearly the same success/error lifecycle. One reusable helper keeps that logic consistent.

### Function: `handleRegenerate`

Calls:

```tsx
finishProofAction(mfaApi.regenerateRecoveryCodes(currentProofPayload), true);
```

#### Meaning of `true`

After regeneration, MFA is still enabled.

### Function: `handleDisable`

Calls:

```tsx
finishProofAction(mfaApi.disable(currentProofPayload), false);
```

#### Meaning of `false`

After disable, MFA should no longer be considered enabled.

### `statusBadge`

This derived JSX chooses the badge based on the `enabled` prop.

#### Why it uses the prop, not `status?.enabled`

The parent profile is the broader user source of truth for account state, while `status` mainly adds recovery-code detail.

Using the prop keeps the headline state aligned with profile data.

### Render section: hero header

The top section communicates:

- current MFA state
- recovery codes remaining
- replay guard status

#### Why "Replay Guard" is shown

It surfaces an important security feature from the backend in a way users can understand: reused codes are rejected.

### Render section: revealed recovery codes

This block only appears when `revealedCodes.length > 0`.

#### Why this is conditional

Recovery codes should not always be visible. They are sensitive and only useful immediately after generation.

#### Why the component says "shown only once"

That matches backend security behavior and teaches the user to save them immediately.

### Render section: "How it works here"

This three-step explanation gives the user a short mental model:

1. password check
2. challenge token
3. verified access

This is especially useful for developers or security-conscious users wondering why login is now two-stage.

### Render section: actions

If MFA is disabled:

- show `Enable MFA`

If MFA is enabled:

- show `Regenerate recovery codes`
- show `Disable MFA`

This keeps the action surface minimal and context-aware.

### Render section: setup panel

This is the most complex UI block.

#### Left column

- password confirmation
- generate setup key button

#### Right column

- QR code area
- manual secret
- copy app link button
- current 6-digit code input
- enable button

### Why both QR and manual secret exist

Different authenticator apps support different setup paths. Scan-first is best UX, but manual entry is an essential fallback.

### QR placeholder behavior

Before setup data exists:

- explanatory placeholder text is shown

After setup data exists but QR is still generating:

- spinner and helper message are shown

After QR generation succeeds:

- the actual QR image is shown

This avoids a jarring blank space.

### Render section: disable/regenerate panel

This panel reuses a shared proof structure:

- password field
- proof method segmented control
- app or recovery input
- submit button

That consistency makes the more sensitive actions feel trustworthy and easy to follow.

---

## Responsive and visual design notes

### Login screen

- Uses a two-panel layout on large screens.
- Collapses into a single focused column on smaller screens.
- Keeps the primary form compact and readable.

### Verify screen

- Mirrors the login visual language so users understand this is part of the same sign-in flow.
- The left explainer panel only appears on larger screens.
- On mobile, the important content remains in one centered column.

### MFA security card

- Uses stacked sections that collapse cleanly on small screens.
- The QR code area has a stable minimum height so layout does not jump while generating.
- Buttons and segmented controls remain finger-friendly.
- Recovery codes render in a grid that adapts from one column to two.

### Sidebar and dashboard layout support

The updated layout helps the profile and MFA card remain comfortable on smaller screens:

- `DashboardLayout` offsets main content only on desktop sidebar widths.
- `Sidebar` now has a mobile top bar plus horizontal scroll navigation on small screens.

That matters because the MFA settings page is a real workflow, not a tiny toggle, so it needs breathing room on mobile.

---

## Supporting package and tooling changes

## File: `package.json`

### Relevant dependency additions

- `qrcode`
  Generates QR code data URLs from the backend `otpauth_url`.

- `@types/qrcode`
  Provides TypeScript support for the QR package.

### Why these were necessary

The backend already returns everything needed for authenticator setup, but users typically expect a scannable QR code. These packages let the frontend generate that locally without changing the backend response shape.

## File: `vite.config.ts`

### Relevant purpose

The Vite config was adjusted to be ESM-safe and to use a predictable cache folder:

- `fileURLToPath(import.meta.url)`
- `cacheDir: '.vite-cache'`

This helps local development and avoids some cache/path issues in this repo setup.

---

## Full workflow breakdown

## Workflow 1: Login without MFA

1. User submits email and password on `Login`.
2. `Login.handleSubmit()` calls `AuthContext.login()`.
3. Backend returns normal success and sets auth cookies.
4. `AuthContext.login()` calls `loadCurrentUser()`.
5. `/users/me` succeeds.
6. Context stores the user.
7. `Login` navigates to `/dashboard`.

## Workflow 2: Login with MFA enabled

1. User submits email and password on `Login`.
2. `AuthContext.login()` posts to `/auth/login`.
3. Backend returns `challenge_token`, `requires_2fa`, and expiry.
4. Context does **not** load the user yet.
5. `Login.handleSubmit()` stores the token in `sessionStorage`.
6. `Login` navigates to `/verify-mfa`.
7. `VerifyMfa` reads the token from route state or `sessionStorage`.
8. User enters authenticator code or recovery code.
9. `VerifyMfa.handleSubmit()` calls `AuthContext.verifyMfa()`.
10. Backend verifies second factor and issues real auth cookies.
11. `AuthContext.verifyMfa()` calls `loadCurrentUser()`.
12. Context stores the authenticated user.
13. `VerifyMfa` removes the temporary challenge token.
14. User is redirected to `/dashboard`.

## Workflow 3: Enable MFA

1. Signed-in user opens Profile.
2. `MfaSecurityCard` loads current MFA status.
3. User clicks `Enable MFA`.
4. Setup panel opens and asks for password.
5. User clicks `Generate setup key`.
6. `mfaApi.setup()` returns `secret`, `otpauth_url`, `issuer`.
7. QR effect converts `otpauth_url` into an image.
8. User scans QR code with authenticator app.
9. User enters current 6-digit code.
10. `handleEnable()` calls `mfaApi.enable()`.
11. Backend enables MFA and returns recovery codes.
12. Card reveals recovery codes once.
13. Card refreshes MFA status.
14. Parent profile refreshes.

## Workflow 4: Regenerate recovery codes

1. User opens regenerate panel.
2. User enters password.
3. User chooses app code or recovery code proof.
4. User submits.
5. `handleRegenerate()` calls `mfaApi.regenerateRecoveryCodes()`.
6. Backend returns a fresh set of recovery codes.
7. Card reveals the new set.
8. Status and profile refresh.

## Workflow 5: Disable MFA

1. User opens disable panel.
2. User enters password.
3. User proves current ownership with app code or recovery code.
4. `handleDisable()` calls `mfaApi.disable()`.
5. Backend disables MFA.
6. Card clears visible recovery codes.
7. Status and profile refresh.

---

## Security-conscious frontend decisions

### 1. Challenge token is temporary UI state

The challenge token is stored in `sessionStorage`, not long-term app state.

That matches its purpose:

- short-lived
- login-specific
- not the real session

### 2. Full session is not assumed after password login

The frontend only loads `/users/me` after:

- normal login success without MFA, or
- successful MFA verification

This avoids accidentally treating a half-complete login as a full authenticated session.

### 3. Refresh logic excludes MFA verify

The Axios refresh interceptor intentionally does not retry `/auth/mfa/verify` through refresh flow.

That prevents confusing behavior during login completion.

### 4. Recovery codes are only displayed conditionally

The UI only reveals recovery codes when they are freshly returned.

It does not try to permanently store or re-fetch their raw values.

### 5. QR generation happens locally

The frontend turns `otpauth_url` into a QR image in-browser. That means:

- no extra QR endpoint is needed
- no extra backend complexity is needed
- the server response stays standard and portable

---

## Manual testing guide

## Prerequisites

- Backend MFA endpoints must already be working.
- Frontend should be running with the correct `VITE_API_URL`.
- Browser must allow cookies for the backend origin.

## Test 1: Login without MFA

1. Use an account with `mfa_enabled = false`.
2. Log in from `/login`.
3. Confirm you go directly to `/dashboard`.

Expected result:

- no MFA screen appears
- authenticated pages load normally

## Test 2: Enable MFA from profile

1. Open `/profile`.
2. Confirm the security card says MFA is off.
3. Click `Enable MFA`.
4. Enter password.
5. Click `Generate setup key`.
6. Confirm:
   - manual secret is shown
   - QR code appears
   - copy buttons work
7. Scan the QR with an authenticator app.
8. Enter the current 6-digit code.
9. Click `Enable MFA`.

Expected result:

- recovery codes appear
- status changes to enabled
- profile badge changes to `MFA enabled`

## Test 3: Login with MFA enabled

1. Log out.
2. Log in again with the same account.
3. Confirm you land on `/verify-mfa`.
4. Enter a valid app code.

Expected result:

- verification succeeds
- you reach `/dashboard`
- challenge token is removed from `sessionStorage`

## Test 4: Recovery code login

1. Log out again.
2. Log in with password.
3. On `/verify-mfa`, switch to `Recovery code`.
4. Enter one of the saved recovery codes.

Expected result:

- login completes successfully
- that recovery code should not work a second time

## Test 5: Regenerate recovery codes

1. Go to Profile.
2. Click `Regenerate recovery codes`.
3. Enter password.
4. Enter current app code or recovery code.
5. Submit.

Expected result:

- a new set of recovery codes is displayed
- old recovery codes are invalidated by backend behavior

## Test 6: Disable MFA

1. Go to Profile.
2. Click `Disable MFA`.
3. Enter password.
4. Enter app code or recovery code.
5. Submit.

Expected result:

- profile state changes to MFA off
- next login goes straight to dashboard after password

## Test 7: Refresh-resilience of verify page

1. Start login with an MFA-enabled account.
2. Reach `/verify-mfa`.
3. Refresh the browser tab before entering the code.

Expected result:

- page still works because it can recover `challenge_token` from `sessionStorage`

## Test 8: Invalid code behavior

1. Try a wrong authenticator code.
2. Try a malformed recovery code.

Expected result:

- clear error message shown
- user remains on the verify page
- no fake authenticated state appears

---

## Troubleshooting notes

### QR code does not appear

Check:

- `setupData.otpauth_url` is being returned by backend
- `qrcode` package is installed
- browser console for rendering or clipboard errors

Fallback:

- the manual secret should still work

### Verify page redirects to login unexpectedly

This means there is no challenge token available.

Check:

- login response contains `challenge_token`
- `sessionStorage.setItem('mfa_challenge_token', ...)` is running
- browser session storage is available

### MFA management calls fail after session idle time

Check:

- access/refresh cookies are still valid
- CORS and `withCredentials` are configured correctly
- backend `/auth/refresh` route is reachable

### Login loops or weird retry behavior

Check `src/lib/axios.ts`.

The refresh exclusion list must include:

- `/auth/login`
- `/auth/register`
- `/auth/mfa/verify`

---

## Suggested future improvements

These are not required for correctness, but they would polish the experience further:

1. Add a QR download button for users setting up MFA on a second device.
2. Add masked account preview text near the QR code using `issuer` and email.
3. Add a visible countdown timer on the verify page based on challenge expiry.
4. Add input formatting helpers for recovery codes.
5. Add integration tests around:
   - login challenge routing
   - verify success path
   - sessionStorage fallback behavior
   - QR rendering

---

## Final summary

The frontend MFA implementation is built around one core rule:

> Password acceptance is not the same thing as a completed authenticated session.

That rule shapes the whole design:

- `AuthContext` pauses login when MFA is required
- `Login` hands off a challenge token
- `VerifyMfa` completes the second factor
- `MfaSecurityCard` manages setup and recovery safely
- `axios.ts` avoids refresh behavior where it would be harmful
- the profile page gives the user a clear security home

The result is a frontend flow that is:

- secure in behavior
- clear to users
- resilient to refreshes
- compatible with cookie auth
- responsive across screen sizes
- practical for deployment in your current Render-based setup
