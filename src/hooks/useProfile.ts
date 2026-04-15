import { useState, useEffect, useCallback } from 'react';
import { profileApi } from '@/lib/api/profile';
import type { PrivateProfile } from '@/types/analytics';

interface UseProfileReturn {
    profile: PrivateProfile | null;
    isLoading: boolean;
    error: string | null;
    updateName: (name: string) => Promise<void>;
    refresh: () => void;
}

export function useProfile(): UseProfileReturn {
    const [profile, setProfile] = useState<PrivateProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await profileApi.me();
            setProfile(data);
        } catch {
            setError('Failed to load profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateName = async (name: string): Promise<void> => {
        if (!profile) return;
        const updated = await profileApi.updateMe({ name });
        setProfile(updated);
    };

    return {
        profile,
        isLoading,
        error,
        updateName,
        refresh: fetchProfile,
    };
}