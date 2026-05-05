import { useEffect, useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import {
    AlertTriangle,
    CheckCheck,
    Copy,
    KeyRound,
    LoaderCircle,
    LockKeyhole,
    ShieldAlert,
    ShieldCheck,
    ShieldEllipsis,
    Smartphone,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mfaApi } from '@/lib/api/mfa';
import type { MfaRecoveryCodesResponse, MfaSetupResponse, MfaStatus } from '@/types/mfa';

type PanelMode = 'setup' | 'disable' | 'regenerate' | null;
type ProofMode = 'app' | 'recovery';

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

interface MfaSecurityCardProps {
    enabled: boolean;
    onStateChange: () => Promise<void> | void;
}

export function MfaSecurityCard({ enabled, onStateChange }: MfaSecurityCardProps) {
    const [status, setStatus] = useState<MfaStatus | null>(null);
    const [isStatusLoading, setIsStatusLoading] = useState(true);
    const [statusError, setStatusError] = useState('');
    const [panel, setPanel] = useState<PanelMode>(null);
    const [proofMode, setProofMode] = useState<ProofMode>('app');
    const [setupPassword, setSetupPassword] = useState('');
    const [setupCode, setSetupCode] = useState('');
    const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
    const [proofPassword, setProofPassword] = useState('');
    const [proofCode, setProofCode] = useState('');
    const [proofRecoveryCode, setProofRecoveryCode] = useState('');
    const [actionError, setActionError] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [revealedCodes, setRevealedCodes] = useState<string[]>([]);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

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

    useEffect(() => {
        refreshStatus();
    }, []);

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

    const resetSetupPanel = () => {
        setSetupPassword('');
        setSetupCode('');
        setSetupData(null);
        setQrCodeDataUrl('');
        setActionError('');
    };

    const resetProofPanel = () => {
        setProofPassword('');
        setProofCode('');
        setProofRecoveryCode('');
        setProofMode('app');
        setActionError('');
    };

    const openPanel = (nextPanel: Exclude<PanelMode, null>) => {
        setPanel(nextPanel);
        setActionError('');
        if (nextPanel === 'setup') {
            resetSetupPanel();
        } else {
            resetProofPanel();
        }
    };

    const closePanel = () => {
        setPanel(null);
        resetSetupPanel();
        resetProofPanel();
    };

    const copyText = async (value: string, field: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedField(field);
            window.setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1600);
        } catch {
            setCopiedField(null);
        }
    };

    const handleSetupStart = async () => {
        setIsActionLoading(true);
        setActionError('');

        try {
            const response = await mfaApi.setup(setupPassword);
            setSetupData(response);
            setSetupCode('');
            setRevealedCodes([]);
        } catch (error) {
            setActionError(extractError(error));
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleEnable = async () => {
        setIsActionLoading(true);
        setActionError('');

        try {
            const response = await mfaApi.enable(setupPassword, setupCode);
            setRevealedCodes(response.recovery_codes);
            await refreshStatus();
            await onStateChange();
            closePanel();
        } catch (error) {
            setActionError(extractError(error));
        } finally {
            setIsActionLoading(false);
        }
    };

    const currentProofPayload =
        proofMode === 'app'
            ? { password: proofPassword, code: proofCode }
            : { password: proofPassword, recovery_code: proofRecoveryCode };

    const finishProofAction = async (
        request: Promise<{ message: string } | MfaRecoveryCodesResponse>,
        nextEnabled: boolean,
    ) => {
        setIsActionLoading(true);
        setActionError('');

        try {
            const response = await request;
            if ('recovery_codes' in response) {
                setRevealedCodes(response.recovery_codes);
            } else if (!nextEnabled) {
                setRevealedCodes([]);
            }

            await refreshStatus();
            await onStateChange();
            closePanel();
        } catch (error) {
            setActionError(extractError(error));
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRegenerate = async () => {
        await finishProofAction(mfaApi.regenerateRecoveryCodes(currentProofPayload), true);
    };

    const handleDisable = async () => {
        await finishProofAction(mfaApi.disable(currentProofPayload), false);
    };

    const statusBadge = enabled ? (
        <Badge className="border-0 bg-emerald-400/15 text-emerald-300">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            MFA enabled
        </Badge>
    ) : (
        <Badge className="border-0 bg-amber-400/15 text-amber-300">
            <ShieldEllipsis className="mr-1 h-3.5 w-3.5" />
            MFA not enabled
        </Badge>
    );

    return (
        <Card className="overflow-hidden border border-border/70 bg-card/80 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_24px_80px_rgba(0,0,0,0.28)]">
            <CardContent className="p-0">
                <div className="border-b border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(41,217,194,0.18),transparent_42%),linear-gradient(135deg,rgba(14,22,30,0.96),rgba(17,27,35,0.92))] px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                                    <LockKeyhole className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Security Center</p>
                                    <h2 className="text-xl font-semibold text-foreground">Multi-factor authentication</h2>
                                </div>
                            </div>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                Protect sign-in with an authenticator app and one-time recovery codes. The extra step kicks in after password login and keeps full sessions locked until verification finishes.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {statusBadge}
                                <Badge variant="outline" className="border-primary/20 bg-background/40 text-muted-foreground">
                                    <Smartphone className="mr-1 h-3.5 w-3.5 text-primary" />
                                    Authenticator apps
                                </Badge>
                                <Badge variant="outline" className="border-primary/20 bg-background/40 text-muted-foreground">
                                    <KeyRound className="mr-1 h-3.5 w-3.5 text-primary" />
                                    Recovery codes
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[320px]">
                            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                                <p className="mt-3 text-lg font-semibold text-foreground">{enabled ? 'Armed' : 'Inactive'}</p>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recovery</p>
                                <p className="mt-3 text-lg font-semibold text-foreground">
                                    {isStatusLoading ? '...' : status?.recovery_codes_remaining ?? 0}
                                </p>
                            </div>
                            <div className="col-span-2 rounded-2xl border border-border/60 bg-background/50 p-4 sm:col-span-1">
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Replay Guard</p>
                                <p className="mt-3 text-lg font-semibold text-foreground">On</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-5 px-5 py-5 sm:px-6">
                    {statusError && (
                        <Alert variant="destructive">
                            <ShieldAlert className="h-4 w-4" />
                            <AlertDescription>{statusError}</AlertDescription>
                        </Alert>
                    )}

                    {revealedCodes.length > 0 && (
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Recovery codes</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        These are shown only once. Keep them somewhere private and offline if you can.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-primary/20 bg-background/60"
                                    onClick={() => copyText(revealedCodes.join('\n'), 'recovery-codes')}
                                >
                                    {copiedField === 'recovery-codes' ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    {copiedField === 'recovery-codes' ? 'Copied' : 'Copy all'}
                                </Button>
                            </div>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {revealedCodes.map((code) => (
                                    <div
                                        key={code}
                                        className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 font-mono text-sm tracking-[0.16em] text-foreground/90"
                                    >
                                        {code}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                            <p className="text-sm font-semibold text-foreground">How it works here</p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">1</p>
                                    <p className="mt-2 text-sm font-medium text-foreground">Password check</p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Email and password are still the first gate.</p>
                                </div>
                                <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">2</p>
                                    <p className="mt-2 text-sm font-medium text-foreground">Challenge token</p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Protected accounts get a short-lived MFA challenge instead of a full session.</p>
                                </div>
                                <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">3</p>
                                    <p className="mt-2 text-sm font-medium text-foreground">Verified access</p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Only a valid app code or recovery code unlocks the real auth cookies.</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                            <p className="text-sm font-semibold text-foreground">Actions</p>
                            <div className="mt-3 flex flex-col gap-2">
                                {enabled ? (
                                    <>
                                        <Button className="justify-start" onClick={() => openPanel('regenerate')}>
                                            <KeyRound className="h-4 w-4" />
                                            Regenerate recovery codes
                                        </Button>
                                        <Button variant="outline" className="justify-start border-border/70 bg-card/60" onClick={() => openPanel('disable')}>
                                            <ShieldAlert className="h-4 w-4" />
                                            Disable MFA
                                        </Button>
                                    </>
                                ) : (
                                    <Button className="justify-start" onClick={() => openPanel('setup')}>
                                        <ShieldCheck className="h-4 w-4" />
                                        Enable MFA
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {panel === 'setup' && (
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-base font-semibold text-foreground">Enable authenticator MFA</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        First confirm your password, then add the secret below to your authenticator app and verify the current 6-digit code.
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={closePanel}>Close</Button>
                            </div>

                            {actionError && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{actionError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                                <div className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="setup-password">Password confirmation</Label>
                                        <Input
                                            id="setup-password"
                                            type="password"
                                            value={setupPassword}
                                            onChange={(e) => setSetupPassword(e.target.value)}
                                            placeholder="Enter your current password"
                                            disabled={isActionLoading || !!setupData}
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={handleSetupStart}
                                        disabled={!setupPassword.trim() || isActionLoading || !!setupData}
                                    >
                                        {isActionLoading && !setupData ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                                        Generate setup key
                                    </Button>
                                </div>

                                <div className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-4">
                                    <div className="grid gap-4 xl:grid-cols-[1fr_1.05fr]">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Scan the QR code</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Open your authenticator app and scan this code to add CodeFolio instantly.
                                                </p>
                                            </div>

                                            <div className="flex min-h-[296px] items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-slate-950/40 p-4">
                                                {setupData ? (
                                                    qrCodeDataUrl ? (
                                                        <img
                                                            src={qrCodeDataUrl}
                                                            alt="QR code for MFA authenticator setup"
                                                            className="h-64 w-64 rounded-2xl bg-white p-3 shadow-[0_16px_50px_rgba(0,0,0,0.28)]"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-3 text-center">
                                                            <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                                                            <p className="max-w-[12rem] text-xs leading-5 text-muted-foreground">
                                                                Generating the QR code for your authenticator app.
                                                            </p>
                                                        </div>
                                                    )
                                                ) : (
                                                    <p className="max-w-[14rem] text-center text-xs leading-5 text-muted-foreground">
                                                        Generate a setup key and the QR code will appear here for scanning.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">Manual setup key</p>
                                                    <p className="text-xs text-muted-foreground">Use this if your authenticator app prefers manual entry.</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-primary/20 bg-background/60"
                                                    onClick={() => setupData && copyText(setupData.secret, 'secret')}
                                                    disabled={!setupData}
                                                >
                                                    {copiedField === 'secret' ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    {copiedField === 'secret' ? 'Copied' : 'Copy'}
                                                </Button>
                                            </div>

                                            <div className="rounded-2xl border border-dashed border-primary/30 bg-slate-950/40 p-4 font-mono text-sm tracking-[0.22em] text-primary/90 break-all">
                                                {setupData?.secret ?? 'Generate a setup key to begin'}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-primary/20 bg-background/60"
                                                    onClick={() => setupData && copyText(setupData.otpauth_url, 'otpauth')}
                                                    disabled={!setupData}
                                                >
                                                    {copiedField === 'otpauth' ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    {copiedField === 'otpauth' ? 'Copied link' : 'Copy app link'}
                                                </Button>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                                <div className="space-y-2">
                                                    <Label htmlFor="setup-code">Current 6-digit code</Label>
                                                    <Input
                                                        id="setup-code"
                                                        inputMode="numeric"
                                                        value={setupCode}
                                                        onChange={(e) => setSetupCode(e.target.value)}
                                                        placeholder="123456"
                                                        disabled={!setupData || isActionLoading}
                                                    />
                                                </div>
                                                <Button
                                                    className="self-end sm:min-w-36"
                                                    onClick={handleEnable}
                                                    disabled={!setupData || !setupCode.trim() || isActionLoading}
                                                >
                                                    {isActionLoading && !!setupData ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                                    Enable MFA
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {(panel === 'disable' || panel === 'regenerate') && (
                        <div className="rounded-2xl border border-border/70 bg-background/40 p-4 sm:p-5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-base font-semibold text-foreground">
                                        {panel === 'disable' ? 'Disable MFA' : 'Regenerate recovery codes'}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Confirm your password and current second factor to continue.
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={closePanel}>Close</Button>
                            </div>

                            {actionError && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{actionError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                                <div className="space-y-3 rounded-2xl border border-border/60 bg-card/70 p-4">
                                    <Label htmlFor="proof-password">Password</Label>
                                    <Input
                                        id="proof-password"
                                        type="password"
                                        value={proofPassword}
                                        onChange={(e) => setProofPassword(e.target.value)}
                                        placeholder="Enter your current password"
                                        disabled={isActionLoading}
                                    />
                                </div>

                                <div className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-4">
                                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-background/60 p-1">
                                        <button
                                            type="button"
                                            onClick={() => setProofMode('app')}
                                            className={`rounded-xl px-3 py-2 text-sm transition-colors ${proofMode === 'app' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            App code
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setProofMode('recovery')}
                                            className={`rounded-xl px-3 py-2 text-sm transition-colors ${proofMode === 'recovery' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Recovery code
                                        </button>
                                    </div>

                                    {proofMode === 'app' ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="proof-code">Authenticator code</Label>
                                            <Input
                                                id="proof-code"
                                                inputMode="numeric"
                                                value={proofCode}
                                                onChange={(e) => setProofCode(e.target.value)}
                                                placeholder="123456"
                                                disabled={isActionLoading}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label htmlFor="proof-recovery">Recovery code</Label>
                                            <Input
                                                id="proof-recovery"
                                                value={proofRecoveryCode}
                                                onChange={(e) => setProofRecoveryCode(e.target.value)}
                                                placeholder="abcd-1234-ef56-7890"
                                                disabled={isActionLoading}
                                            />
                                        </div>
                                    )}

                                    <Button
                                        className="w-full"
                                        variant={panel === 'disable' ? 'destructive' : 'default'}
                                        onClick={panel === 'disable' ? handleDisable : handleRegenerate}
                                        disabled={
                                            isActionLoading ||
                                            !proofPassword.trim() ||
                                            (proofMode === 'app' ? !proofCode.trim() : !proofRecoveryCode.trim())
                                        }
                                    >
                                        {isActionLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : panel === 'disable' ? <ShieldAlert className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
                                        {panel === 'disable' ? 'Disable MFA' : 'Generate new codes'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
