import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Terminal } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CodeRain } from '@/components/ui/CodeRain';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

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
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password);

            if ('requires_2fa' in result && result.requires_2fa) {
                sessionStorage.setItem('mfa_challenge_token', result.challenge_token);
                navigate('/verify-mfa', {
                    state: {
                        challenge_token: result.challenge_token,
                        expires_in: result.expires_in,
                    },
                });
                return;
            }

            navigate('/dashboard');
        } catch (err) {
            setError(extractError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-background lg:flex-row">
            <div className="relative hidden overflow-hidden border-r border-border/60 bg-[linear-gradient(180deg,rgba(10,18,23,0.94),rgba(13,20,27,0.92))] lg:flex lg:w-[54%] lg:items-center lg:justify-center">
                <CodeRain />
                <div className="relative z-10 max-w-xl px-12 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/12 text-primary">
                                <Terminal className="h-5 w-5" />
                            </div>
                            <div className="font-mono text-2xl font-semibold tracking-tight">
                                <span className="text-primary">Code</span>
                                <span className="text-foreground">Folio</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm uppercase tracking-[0.28em] text-primary/75">Developer cockpit</p>
                            <h1 className="max-w-lg text-4xl font-semibold leading-tight text-foreground">
                                Your work log, portfolio, and sign-in security in one place.
                            </h1>
                            <p className="max-w-lg text-base leading-7 text-muted-foreground">
                                Password login is the front door. Accounts with MFA enabled get a second gate before the real session opens.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-border/60 bg-card/45 p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    MFA-ready flow
                                </div>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Protected accounts jump into a short verification step with app codes or recovery codes.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-card/45 p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <LockKeyhole className="h-4 w-4 text-primary" />
                                    Session cookies
                                </div>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Full auth cookies are only issued after verification finishes, not during the password step.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
                <motion.div
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55 }}
                    className="w-full max-w-md space-y-6"
                >
                    <div className="space-y-3 text-center lg:text-left">
                        <div className="flex items-center justify-center gap-2 lg:hidden">
                            <Terminal className="h-5 w-5 text-primary" />
                            <span className="font-mono text-xl font-semibold">
                                <span className="text-primary">Code</span>
                                <span className="text-foreground">Folio</span>
                            </span>
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-[0.22em] text-primary/80">Sign in</p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Welcome back</h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Enter your credentials to continue. If your account has MFA enabled, we&apos;ll ask for the second step right after this.
                            </p>
                        </div>
                    </div>

                    <Card className="border-border/70 bg-card/65 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/80">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        disabled={isLoading}
                                        className="h-11 bg-secondary/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/80">
                                            Password
                                        </Label>
                                        <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80">
                                            Forgot?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="........"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                            disabled={isLoading}
                                            className="h-11 bg-secondary/50 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((current) => !current)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Security-aware login</p>
                                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                MFA-enabled accounts continue to a code verification step instead of signing in immediately.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="h-11 w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                            Authenticating
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <p className="text-center text-sm text-muted-foreground">
                        No account?{' '}
                        <Link to="/register" className="font-medium text-primary hover:text-primary/80">
                            Create one
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
