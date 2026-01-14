'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import styles from './admin.module.css';

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth/signin');
            } else {
                fetchStats();
            }
        }
    }, [user, loading, router]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setRecentUsers(data.recentUsers);
            } else {
                setError('管理者権限がありません');
            }
        } catch (e) {
            console.error(e);
            setError('データの取得に失敗しました');
        }
    };

    if (loading) return <div className={styles.container}>Loading...</div>;
    if (error) return <div className={styles.container} style={{ color: 'red' }}>{error}</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>管理者ダッシュボード</h1>

            {stats && (
                <div className={styles.grid}>
                    <div className={styles.card}>
                        <h3>総ユーザー数</h3>
                        <p className={styles.number}>{stats.totalUsers}</p>
                    </div>
                    <div className={styles.card}>
                        <h3>総アラート数</h3>
                        <p className={styles.number}>{stats.totalAlerts}</p>
                    </div>
                    <div className={styles.card}>
                        <h3>稼働中アラート</h3>
                        <p className={styles.number}>{stats.activeAlerts}</p>
                    </div>
                    <div className={styles.card}>
                        <h3>送信済み通知</h3>
                        <p className={styles.number}>{stats.totalNotifications}</p>
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <h2>最近登録したユーザー</h2>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ニックネーム</th>
                            <th>Email</th>
                            <th>登録日時</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentUsers.map((u, i) => (
                            <tr key={i}>
                                <td>{u.nickname}</td>
                                <td>{u.email}</td>
                                <td>{new Date(u.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
