import { useState, useEffect } from 'react';

type User = {
    id: number;
    userId: number;
    nickname: string;
    email: string;
    plan?: string;
} | null;

export function useAuth() {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Auth check failed", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        window.location.href = '/'; // Redirect to home
    };

    return { user, loading, logout };
}
