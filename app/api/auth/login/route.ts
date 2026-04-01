import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, updateLastLogin } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const user = await getUserByEmail(email.toLowerCase().trim());

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const passwordOk = await comparePassword(password, user.password_hash);
    if (!passwordOk) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Conta suspensa. Entre em contato com o suporte.' }, { status: 403 });
    }

    // Verifica trial expirado (bloqueia acesso)
    if (user.role === 'trial') {
      const trialEnd = new Date(user.trial_ends_at);
      if (trialEnd < new Date()) {
        return NextResponse.json({ 
          error: 'Seu período de teste expirou. Faça upgrade para continuar.',
          code: 'TRIAL_EXPIRED'
        }, { status: 403 });
      }
    }

    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
    });

    await updateLastLogin(user.id);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan }
    });

    response.cookies.set('polaris_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
