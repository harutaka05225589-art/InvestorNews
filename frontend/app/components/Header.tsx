'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import styles from './Header.module.css';

export default function Header() {
    const { user, loading, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

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

                {/* Brand Logo (Center? or Left next to burger) */}
                <Link href="/" className={styles.brand}>Investor News</Link>

                {/* Auth Indicator (Right) */}
                <div className={styles.authContainer}>
                    {loading ? (
                        <div className={styles.spinner}></div>
                    ) : user ? (
                        <div className={styles.userMenu}>
                            <button
                                className={styles.avatarBtn}
                                onClick={() => setProfileOpen(!profileOpen)}
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
                    <Link href="/calendar" onClick={() => setMenuOpen(false)}>IRカレンダー</Link>
                    <Link href="/alerts" onClick={() => setMenuOpen(false)}>PER通知</Link>
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
