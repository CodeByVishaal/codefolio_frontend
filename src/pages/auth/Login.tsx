import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CodeRain } from '@/components/ui/CodeRain';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Eye, EyeOff, Terminal } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
        <div className="flex min-h-screen">
            {/* Left panel — code rain + branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-background items-center justify-center">
                <CodeRain />
                <div className="relative z-10 px-12 max-w-md space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <Terminal className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                <span className="text-primary">Dev</span>
                                <span className="text-foreground">Pulse</span>
                            </span>
                        </div>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Track your code. Measure your growth. Ship faster.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="rounded-lg border border-border/50 bg-card/60 backdrop-blur-sm p-4 space-y-2"
                        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}
                    >
                        <div className="text-muted-foreground">
                            <span className="text-primary">$</span> devpulse stats --week
                        </div>
                        <div className="text-muted-foreground/70 space-y-1 text-xs">
                            <div>
                                <span className="text-primary">commits</span>
                                <span className="text-foreground/60 ml-4">47</span>
                                <span className="text-primary ml-2">████████████░░</span>
                            </div>
                            <div>
                                <span className="text-primary">prs_merged</span>
                                <span className="text-foreground/60 ml-2">12</span>
                                <span className="text-primary ml-2">████░░░░░░░░░░</span>
                            </div>
                            <div>
                                <span className="text-primary">streak</span>
                                <span className="text-foreground/60 ml-5">21d</span>
                                <span className="text-chart-3 ml-2">🔥</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right panel — login form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-card/30">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-sm space-y-8"
                >
                    {/* Mobile brand */}
                    <div className="lg:hidden text-center space-y-2">
                        <div className="flex items-center justify-center gap-2">
                            <Terminal className="w-5 h-5 text-primary" />
                            <span className="text-xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                <span className="text-primary">Dev</span>
                                <span className="text-foreground">Pulse</span>
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
                        <p className="text-muted-foreground text-sm">Enter your credentials to continue</p>
                    </div>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl shadow-primary/5">
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <Alert variant="destructive" className="py-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-foreground/80 text-xs uppercase tracking-wider font-medium">
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
                                        className="h-11 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 placeholder:text-muted-foreground/40"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-foreground/80 text-xs uppercase tracking-wider font-medium">
                                            Password
                                        </Label>
                                        <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                                            Forgot?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                            disabled={isLoading}
                                            className="h-11 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 pr-10 placeholder:text-muted-foreground/40"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium group transition-all"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            Authenticating...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Sign in
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                        </span>
                                    )}
                                </Button>


                            </form>
                        </CardContent>
                    </Card>

                    <p className="text-center text-sm text-muted-foreground">
                        No account?{' '}
                        <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                            Create one
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}