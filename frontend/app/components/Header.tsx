'use client'; // Header v3 (account system removed)

import { useState } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';

import SearchCompanies from './SearchCompanies'; // Added

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

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
                <Link href="/" className={styles.brand}>
                    <span className={styles.rinText}>(RIN)</span>
                    <span className={styles.fullTitle}>億り人・決算速報</span>
                </Link>

                {/* Search Bar (Centered or Left of Nav) */}
                <div style={{
                    flex: '1 1 auto',
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '0 0.5rem',
                    minWidth: 0, /* Crucial for allowing flex children to shrink below content size */
                    maxWidth: '400px', /* Stop it from growing too large */
                }}>
                    <SearchCompanies />
                </div>


                {/* Desktop Navigation (Hidden on Mobile) */}
                <nav className={styles.desktopNav}>
                    <Link href="/">ホーム</Link>
                    <Link href="/reports">速報リスト</Link>
                    <Link href="/calendar">IRカレンダー</Link>
                    <Link href="/revisions">業績修正</Link>
                    <Link href="/revisions/ranking/hot">ランキング</Link>
                    <Link href="/introduction">投資家紹介</Link>
                    <Link href="/request">リクエスト</Link>
                </nav>
            </div>

            {/* Slide-out Menu (Overlay) */}
            <div className={`${styles.mobileMenu} ${menuOpen ? styles.menuOpen : ''}`}>
                <nav className={styles.navLinks}>
                    <Link href="/" onClick={() => setMenuOpen(false)}>ホーム</Link>
                    <Link href="/reports" onClick={() => setMenuOpen(false)}>速報リスト</Link>
                    <Link href="/calendar" onClick={() => setMenuOpen(false)}>IRカレンダー</Link>
                    <Link href="/revisions" onClick={() => setMenuOpen(false)}>業績修正</Link>
                    <Link href="/revisions/ranking/hot" onClick={() => setMenuOpen(false)}>ランキング</Link>
                    <Link href="/guide" onClick={() => setMenuOpen(false)}>使い方ガイド</Link>
                    <Link href="/introduction" onClick={() => setMenuOpen(false)}>投資家紹介</Link>
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
