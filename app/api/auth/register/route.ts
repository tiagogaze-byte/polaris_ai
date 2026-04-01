import { NextRequest, NextResponse } from 'next/server';
import { sql, getUserByEmail } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 8 caracteres' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const existing = await getUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const result = await sql`
      INSERT INTO users (name, email, password_hash, role, plan, messages_limit, trial_ends_at)
      VALUES (
        ${name.trim()},
        ${email.toLowerCase().trim()},
        ${passwordHash},
        'trial',
        'trial',
        10,
        NOW() + INTERVAL '7 days'
      )
      RETURNING id, name, email, role, plan, trial_ends_at
    `;

    const user = result.rows[0];

    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan }
    }, { status: 201 });

    response.cookies.set('polaris_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
