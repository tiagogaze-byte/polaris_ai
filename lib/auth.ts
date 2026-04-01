import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

export interface JWTPayload {
  sub: string;       // user id
  email: string;
  name: string;
  role: string;
  plan: string;
  jti: string;       // token id único (para blacklist)
  iat?: number;
  exp?: number;
}

export async function signToken(payload: Omit<JWTPayload, 'jti'>): Promise<string> {
  const jti = crypto.randomUUID();
  return new SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get('polaris_token')?.value || null;
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;
  return verifyToken(token);
}

export function setAuthCookie(token: string): void {
  const cookieStore = cookies();
  cookieStore.set('polaris_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  });
}

export function clearAuthCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete('polaris_token');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Verificar permissões
export function canAccessAdmin(role: string): boolean {
  return role === 'admin';
}

export function canManageUsers(role: string): boolean {
  return role === 'admin' || role === 'manager';
}

export function isTrialExpired(trialEndsAt: string): boolean {
  return new Date(trialEndsAt) < new Date();
}
