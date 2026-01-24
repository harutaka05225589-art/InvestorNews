import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '../../../../lib/db';

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// Verify Signature
function verifySignature(body: string, signature: string) {
    if (!LINE_CHANNEL_SECRET) return true; // Skip if no secret (dev)
    const hash = crypto
        .createHmac('sha256', LINE_CHANNEL_SECRET)
        .update(body)
        .digest('base64');
    return hash === signature;
}

// Reply Message
async function replyMessage(replyToken: string, text: string) {
    if (!LINE_ACCESS_TOKEN) return;

    await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
            replyToken,
            messages: [{ type: 'text', text }]
        })
    });
}

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get('x-line-signature') || '';

        if (!verifySignature(bodyText, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const body = JSON.parse(bodyText);
        const events = body.events || [];

        for (const event of events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const text = event.message.text.trim();
                const userId = event.source.userId;
                const replyToken = event.replyToken;

                // Check for Linking Code
                // Since this runs in Next.js (Node), using `better-sqlite3` logic via `lib/db` usually works 
                // but might need adjustment for edge runtime. 
                // We assume Node runtime (default).

                // Find user with this nonce
                const stmt = db.prepare("SELECT id, nickname FROM users WHERE line_link_nonce = ?");
                const user = stmt.get(text) as { id: number, nickname: string } | undefined;

                if (user) {
                    console.log(`[LINE Webhook] Link success for user ${user.id}`);
                    // Match found! Link logic
                    const update = db.prepare("UPDATE users SET line_user_id = ?, line_link_nonce = NULL WHERE id = ?");
                    update.run(userId, user.id);

                    await replyMessage(replyToken, `連携が完了しました！\nこんにちは、${user.nickname}さん。\n今後は重要な通知をこちらにお届けします。`);
                } else {
                    console.log(`[LINE Webhook] Code mismatch: ${text}`);
                    // Debug Reply (Temporary: Remove later if spammy)
                    await replyMessage(replyToken, 'コードが見つかりません。\n設定画面で「コードを発行」し、6桁の数字を正確に入力してください。');
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
