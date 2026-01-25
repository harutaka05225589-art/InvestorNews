'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ? styles.active : '';

    return (
        <aside className={styles.sidebar}>
            <div className={styles.container}>
                <nav className={styles.nav}>
                    <Link href="/" className={`${styles.item} ${isActive('/')}`}>
                        <span className={styles.icon}>🏠</span>
                        <span className={styles.label}>ホーム</span>
                    </Link>
                    <Link href="/reports" className={`${styles.item} ${isActive('/reports')}`}>
                        <span className={styles.icon}>⚡</span>
                        <span className={styles.label}>速報リスト</span>
                    </Link>
                    <Link href="/calendar" className={`${styles.item} ${isActive('/calendar')}`}>
                        <span className={styles.icon}>📅</span>
                        <span className={styles.label}>IRカレンダー</span>
                    </Link>
                    <Link href="/revisions" className={`${styles.item} ${isActive('/revisions')}`}>
                        <span className={styles.icon}>📊</span>
                        <span className={styles.label}>
                            業績修正
                            <span style={{ fontSize: '0.6rem', background: '#f59e0b', color: '#000', padding: '0.1rem 0.3rem', borderRadius: '4px', marginLeft: '4px', verticalAlign: 'middle' }}>New</span>
                        </span>
                    </Link>
                    <Link href="/introduction" className={`${styles.item} ${isActive('/introduction')}`}>
                        <span className={styles.icon}>👥</span>
                        <span className={styles.label}>投資家紹介</span>
                    </Link>
                    <Link href="/alerts" className={`${styles.item} ${isActive('/alerts')}`}>
                        <span className={styles.icon}>🔔</span>
                        <span className={styles.label}>登録銘柄</span>
                    </Link>
                </nav>

                <div className={styles.footer}>
                    <Link href="/request" className={styles.requestBtn}>
                        + 投資家リクエスト
                    </Link>
                </div>
            </div>
        </aside>
    );
}
