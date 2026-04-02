import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// ── Error extraction ──────────────────────────────────────────────────────
// FastAPI can return errors in two shapes:
//   1. Pydantic validation: { detail: [{ msg: "...", type: "..." }, ...] }
//   2. HTTPException:       { detail: "plain error string" }
function extractError(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (Array.isArray(detail)) {
            return detail.map((d: { msg: string }) => d.msg).join('. ');
        }
        if (typeof detail === 'string') return detail;
    }
    return 'Something went wrong. Please try again.';
}

export function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password);

            if ('requires_2fa' in result && result.requires_2fa) {
                // Pass the challenge token through router state to the 2FA page
                navigate('/verify-2fa', { state: { challenge_token: result.challenge_token } });
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(extractError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-6">
                {/* Brand */}
                <div className="text-center space-y-1">
                    <span className="font-mono text-2xl font-semibold">
                        <span className="text-primary">Dev</span>
                        <span className="text-foreground">Pulse</span>
                    </span>
                    <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Welcome back</CardTitle>
                        <CardDescription>Enter your credentials to continue</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="py-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Signing in…' : 'Sign in'}
                            </Button>
                        </form>

                        <p className="mt-5 text-center text-sm text-muted-foreground">
                            No account?{' '}
                            <Link to="/register" className="text-primary hover:underline underline-offset-4">
                                Create one
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}