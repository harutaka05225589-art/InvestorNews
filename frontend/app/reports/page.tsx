import Link from 'next/link';
import { getLatestEdinetDocs } from '@/lib/db';
import styles from './reports.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ReportsPage() {
    // Fetch more for the full list page (e.g. 50)
    const docs = getLatestEdinetDocs(50);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>大量保有報告書 速報リスト</h1>
            <p className={styles.description}>
                注目の著名投資家による変更報告書（大量保有報告書）の提出状況を時系列で表示しています。
            </p>

            <div className={styles.list}>
                {docs.length === 0 ? (
                    <p className={styles.empty}>現在、表示できる履歴はありません。</p>
                ) : (
                    <ul className={styles.ul}>
                        {docs.map((doc: any) => (
                            <li key={doc.id} className={styles.item}>
                                <div className={styles.header}>
                                    <span className={styles.date}>{new Date(doc.submitted_at).toLocaleString('ja-JP')}</span>
                                    <h2 className={styles.investor}>{doc.submitter_name}</h2>
                                </div>
                                <div className={styles.body}>
                                    <p className={styles.desc}>
                                        <span className={styles.target}>{doc.subject_edinet_code}</span> の
                                        <strong>{doc.doc_description}</strong> を提出しました。
                                    </p>
                                    <a href={doc.pdf_link} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                        原文PDFを確認 &rarr;
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
