import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCheck, KeyRound, LoaderCircle, ShieldCheck, Smartphone, TimerReset, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

type VerifyState = {
    challenge_token?: string;
    expires_in?: number;
};

export function VerifyMfa() {
    const { verifyMfa } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const routeState = (location.state ?? {}) as VerifyState;
    const [method, setMethod] = useState<'app' | 'recovery'>('app');
    const [code, setCode] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const challengeToken = useMemo(
        () => routeState.challenge_token ?? sessionStorage.getItem('mfa_challenge_token') ?? '',
        [routeState.challenge_token],
    );

    useEffect(() => {
        if (routeState.challenge_token) {
            sessionStorage.setItem('mfa_challenge_token', routeState.challenge_token);
        }
    }, [routeState.challenge_token]);

    if (!challengeToken) {
        return <Navigate to="/login" replace />;
    }

    const expiresInMinutes = Math.max(1, Math.ceil((routeState.expires_in ?? 300) / 60));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await verifyMfa(
                challengeToken,
                method === 'app' ? { code } : { recoveryCode },
            );
            sessionStorage.removeItem('mfa_challenge_token');
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(extractError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-background lg:flex-row">
            <div className="hidden border-r border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(41,217,194,0.18),transparent_42%),linear-gradient(180deg,rgba(10,18,23,0.96),rgba(13,20,27,0.92))] lg:flex lg:w-[48%] lg:items-center lg:justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65 }}
                    className="max-w-lg space-y-6 px-12 py-16"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/12 text-primary">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-[0.28em] text-primary/75">Verification step</p>
                            <h1 className="mt-2 text-4xl font-semibold leading-tight text-foreground">One more proof before the session opens.</h1>
                        </div>
                    </div>

                    <p className="text-base leading-7 text-muted-foreground">
                        The password step already passed. This screen exists so the backend can issue real auth cookies only after the second factor checks out.
                    </p>

                    <div className="grid gap-3">
                        <div className="rounded-2xl border border-border/60 bg-card/45 p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Smartphone className="h-4 w-4 text-primary" />
                                Authenticator app path
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Use the current 6-digit code from Google Authenticator, Authy, 1Password, Microsoft Authenticator, or a similar app.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-card/45 p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <KeyRound className="h-4 w-4 text-primary" />
                                Recovery path
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                If you lost the device, use one of your one-time recovery codes. Each code works once and burns after use.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
                <motion.div
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55 }}
                    className="w-full max-w-md space-y-6"
                >
                    <div className="space-y-3">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to login
                        </Link>

                        <div>
                            <p className="text-sm uppercase tracking-[0.22em] text-primary/80">MFA verification</p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Finish sign-in</h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Enter the current code from your authenticator app, or switch to a recovery code if you need the fallback route.
                            </p>
                        </div>
                    </div>

                    <Card className="border-border/70 bg-card/65 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                        <CardContent className="space-y-5 pt-6">
                            <div className="rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3">
                                <div className="flex items-start gap-3">
                                    <TimerReset className="mt-0.5 h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Short-lived challenge</p>
                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            This verification token expires in about {expiresInMinutes} minute{expiresInMinutes === 1 ? '' : 's'}.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-background/60 p-1">
                                <button
                                    type="button"
                                    onClick={() => setMethod('app')}
                                    className={`rounded-xl px-3 py-2 text-sm transition-colors ${method === 'app' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    App code
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMethod('recovery')}
                                    className={`rounded-xl px-3 py-2 text-sm transition-colors ${method === 'recovery' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Recovery code
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <Alert variant="destructive">
                                        {error.toLowerCase().includes('too many') ? <TriangleAlert className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {method === 'app' ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="totp-code" className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/80">
                                            Authenticator code
                                        </Label>
                                        <Input
                                            id="totp-code"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            placeholder="123456"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            disabled={isLoading}
                                            className="h-11 bg-secondary/50 text-center font-mono text-lg tracking-[0.38em]"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="recovery-code" className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/80">
                                            Recovery code
                                        </Label>
                                        <Input
                                            id="recovery-code"
                                            placeholder="abcd-1234-ef56-7890"
                                            value={recoveryCode}
                                            onChange={(e) => setRecoveryCode(e.target.value)}
                                            disabled={isLoading}
                                            className="h-11 bg-secondary/50 font-mono"
                                        />
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="h-11 w-full"
                                    disabled={isLoading || (method === 'app' ? !code.trim() : !recoveryCode.trim())}
                                >
                                    {isLoading ? (
                                        <>
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                            Verifying
                                        </>
                                    ) : (
                                        <>
                                            {method === 'app' ? <Smartphone className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
                                            Continue to dashboard
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
