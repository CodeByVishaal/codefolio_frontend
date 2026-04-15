import axios from "axios";

// ── Base instance ─────────────────────────────────────────────────────────────

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
    withCredentials: true,  // CRITICAL: sends httpOnly cookies on every request
});

// ── Token refresh logic ───────────────────────────────────────────────────────

// Tracks whether a refresh is already in progress.
// Prevents multiple simultaneous 401s from each triggering their own refresh.
let isRefreshing = false;

// Queue of requests that arrived while a refresh was in progress.
// Once the refresh completes, they are all retried together.
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(undefined);
        }
    });
    failedQueue = [];
}

// ── Response interceptor ──────────────────────────────────────────────────────

api.interceptors.response.use(
    // Success — pass through unchanged
    (response) => response,

    // Error — check for 401 and attempt refresh
    async (error) => {
        const originalRequest = error.config;

        // Only intercept 401s that haven't already been retried.
        // _retry flag prevents infinite refresh loops.
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // A refresh is already in progress — queue this request and wait
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return api(originalRequest);
                }).catch((err) => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Use the configured `api` instance to ensure refresh_token cookie is sent
                await api.post('/auth/refresh');

                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                // Don't hard redirect here — let the error propagate so AuthContext
                // can catch it and set user=null, which triggers ProtectedRoute redirect
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;