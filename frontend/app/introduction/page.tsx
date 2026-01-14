'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './introduction.module.css';

type Investor = {
    id: number;
    name: string;
    style_description: string;
    image_url: string;
};

export default function IntroductionPage() {
    const [investors, setInvestors] = useState<Investor[]>([]);

    useEffect(() => {
        fetch('/api/investors?limit=100') // Get all investors
            .then(res => res.json())
            .then(data => setInvestors(data.investors));
    }, []);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>著名投資家の紹介</h1>
            <p className={styles.desc}>
                日本の株式市場で大きな成果を上げている著名投資家たちの手法や哲学を解説します。<br />
                それぞれの投資スタイルを学び、自身の投資戦略の参考にしましょう。
            </p>

            <div className={styles.grid}>
                {investors.map(investor => (
                    <Link href={`/introduction/${investor.id}`} key={investor.id} className={styles.card}>
                        <div className={styles.icon}>
                            {investor.image_url ? (
                                <img src={investor.image_url} alt={investor.name} className={styles.img} />
                            ) : (
                                <div className={styles.placeholder}>{investor.name[0]}</div>
                            )}
                        </div>
                        <div className={styles.info}>
                            <h2 className={styles.name}>{investor.name}</h2>
                            <p className={styles.style}>{investor.style_description}</p>
                            <span className={styles.readMore}>詳しく見る &rarr;</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
