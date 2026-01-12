'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';

export default function SignUpPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        account_id: '',
        nickname: '',
        email: '',
        password: '',
        passwordConfirm: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.passwordConfirm) {
            setError('パスワードが一致しません');
            return;
        }

        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                account_id: formData.account_id,
                email: formData.email,
                nickname: formData.nickname,
                password: formData.password,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            window.location.href = '/'; // Force reload to update header
        } else {
            setError(data.error || '登録に失敗しました');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>アカウント作成</h1>
                {error && <p className={styles.error}>{error}</p>}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>アカウントID <span className={styles.note}>(半角英数)</span></label>
                        <input
                            name="account_id"
                            type="text"
                            pattern="^[a-zA-Z0-9_]+$"
                            value={formData.account_id}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label>ニックネーム</label>
                        <input
                            name="nickname"
                            type="text"
                            value={formData.nickname}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label>メールアドレス</label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label>パスワード <span className={styles.note}>(8文字以上)</span></label>
                        <input
                            name="password"
                            type="password"
                            minLength={8}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label>パスワード (確認)</label>
                        <input
                            name="passwordConfirm"
                            type="password"
                            minLength={8}
                            value={formData.passwordConfirm}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.button}>登録する</button>
                </form>
                <div className={styles.link}>
                    すでにアカウントをお持ちの方は <Link href="/auth/signin">ログイン</Link>
                </div>
            </div>
        </div>
    );
}
