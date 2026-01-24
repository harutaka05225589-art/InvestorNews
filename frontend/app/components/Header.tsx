'use client'; // Header v2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import styles from './Header.module.css';

export default function Header() {
    const { user, loading, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    // Notification State
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch Notifications on load if user exists
    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Polling every 60 seconds
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleNotifClick = async () => {
        setNotifOpen(!notifOpen);
        setProfileOpen(false); // Close other menu

        if (!notifOpen && unreadCount > 0) {
            // Mark all as read when opening
            try {
                await fetch('/api/notifications', { method: 'PUT', body: JSON.stringify({}) });
                setUnreadCount(0); // Optimistic update
                fetchNotifications(); // Refresh to be sure
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* Burger Menu Button (Left) */}
                <button
                    className={styles.burgerBtn}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Menu"
                >
                    <div className={`${styles.bar} ${menuOpen ? styles.open : ''}`}></div>
                    <div className={`${styles.bar} ${menuOpen ? styles.open : ''}`}></div>
                    <div className={`${styles.bar} ${menuOpen ? styles.open : ''}`}></div>
                </button>

                {/* Brand Logo */}
                <Link href="/" className={styles.brand}>億り人・決算速報</Link>

                {/* Desktop Navigation (Hidden on Mobile) */}
                <nav className={styles.desktopNav}>
                    <Link href="/">ホーム</Link>
                    <Link href="/reports">速報リスト</Link>
                    <Link href="/calendar">IRカレンダー</Link>
                    <Link href="/revisions">業績修正</Link>
                    <Link href="/introduction">投資家紹介</Link>
                    <Link href="/alerts">登録銘柄</Link>
                    <Link href="/request">リクエスト</Link>
                </nav>

                {/* Auth Indicator (Right) */}
                <div className={styles.authContainer}>
                    {loading ? (
                        <div className={styles.spinner}></div>
                    ) : user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Notification Bell */}
                            <div className={styles.notifWrapper}>
                                <button className={styles.notifBtn} onClick={handleNotifClick} aria-label="Notifications">
                                    <span>🔔</span>
                                    <span className={styles.notifText}>お知らせ</span>
                                    {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                                </button>

                                {notifOpen && (
                                    <div className={styles.notifDropdown}>
                                        <div className={styles.notifHeader}>お知らせ</div>
                                        <div className={styles.notifList}>
                                            {notifications.length === 0 ? (
                                                <p className={styles.notifEmpty}>お知らせはありません</p>
                                            ) : (
                                                notifications.map(n => (
                                                    <div key={n.id} className={`${styles.notifItem} ${n.is_read ? '' : styles.unread}`}>
                                                        <p className={styles.notifMsg}>{n.message}</p>
                                                        <span className={styles.notifDate}>{new Date(n.created_at).toLocaleString()}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Menu */}
                            <div className={styles.userMenu}>
                                <button
                                    className={styles.avatarBtn}
                                    onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                                    title={user.nickname}
                                >
                                    <div className={styles.avatarDot}></div>
                                </button>
                                {/* Dropdown for User */}
                                {profileOpen && (
                                    <div className={styles.dropdown}>
                                        <div className={styles.userInfo}>
                                            <p className={styles.userName}>{user.nickname}</p>
                                            <p className={styles.userId}>ID: {user.userId}</p>
                                        </div>
                                        <hr className={styles.divider} />
                                        <Link href="/settings" className={styles.menuItem}>アカウント編集</Link>
                                        <button onClick={logout} className={`${styles.menuItem} ${styles.logout}`}>
                                            サインアウト
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.guestMenu}>
                            <Link href="/auth/signin" className={styles.loginLink}>Sign In</Link>
                            <Link href="/auth/signup" className={styles.signupBtn}>Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Slide-out Menu (Overlay) */}
            <div className={`${styles.mobileMenu} ${menuOpen ? styles.menuOpen : ''}`}>
                <nav className={styles.navLinks}>
                    <Link href="/" onClick={() => setMenuOpen(false)}>ホーム</Link>
                    <Link href="/reports" onClick={() => setMenuOpen(false)}>速報リスト</Link>
                    <Link href="/calendar" onClick={() => setMenuOpen(false)}>IRカレンダー</Link>
                    <Link href="/revisions" onClick={() => setMenuOpen(false)}>業績修正</Link>
                    <Link href="/introduction" onClick={() => setMenuOpen(false)}>投資家紹介</Link>
                    <Link href="/alerts" onClick={() => setMenuOpen(false)}>登録銘柄</Link>
                    <Link href="/inquiry" onClick={() => setMenuOpen(false)}>お問い合わせ</Link>
                    <Link href="/request" onClick={() => setMenuOpen(false)}>投資家追加リクエスト</Link>
                    <Link href="/privacy" onClick={() => setMenuOpen(false)}>プライバシーポリシー</Link>
                </nav>
            </div>

            {/* Backdrop for menu */}
            {menuOpen && <div className={styles.backdrop} onClick={() => setMenuOpen(false)}></div>}
        </header>
    );
}
