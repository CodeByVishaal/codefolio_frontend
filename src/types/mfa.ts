export interface MfaStatus {
    enabled: boolean;
    recovery_codes_remaining: number;
}

export interface MfaSetupResponse {
    secret: string;
    otpauth_url: string;
    issuer: string;
}

export interface MfaRecoveryCodesResponse {
    message: string;
    recovery_codes: string[];
}
