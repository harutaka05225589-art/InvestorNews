import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-change-it');

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}

export async function createSession(userId: number, nickname: string, email: string, plan: string = 'free') {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const sessionData = {
        id: userId, // Standardize as 'id'
        userId,
        nickname,
        email,
        plan
    };

    // @ts-ignore
    const session = await new SignJWT(sessionData)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(SECRET_KEY);

    (await cookies()).set('session', session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, SECRET_KEY, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function logout() {
    (await cookies()).set('session', '', { expires: new Date(0) });
}
