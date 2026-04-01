import { sql } from '@vercel/postgres';
export { sql };

export type UserRole = 'admin' | 'manager' | 'client' | 'trial';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type PlanType = 'trial' | 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  plan: PlanType;
  messages_used: number;
  messages_limit: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  trial_ends_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'model';
  content: string;
  tokens_used: number;
  created_at: string;
}

// Helpers de query
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql<User>`
    SELECT * FROM users WHERE email = ${email} AND status = 'active' LIMIT 1
  `;
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await sql<User>`
    SELECT * FROM users WHERE id = ${id} AND status = 'active' LIMIT 1
  `;
  return result.rows[0] || null;
}

export async function updateLastLogin(userId: string): Promise<void> {
  await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${userId}`;
}

export async function incrementMessageCount(userId: string): Promise<boolean> {
  // Verifica limite antes de incrementar
  const user = await getUserById(userId);
  if (!user) return false;
  if (user.role !== 'admin' && user.messages_used >= user.messages_limit) return false;

  await sql`UPDATE users SET messages_used = messages_used + 1 WHERE id = ${userId}`;
  return true;
}

export async function getConversationsByUser(userId: string): Promise<Conversation[]> {
  const result = await sql<Conversation>`
    SELECT * FROM conversations 
    WHERE user_id = ${userId} AND is_archived = FALSE
    ORDER BY updated_at DESC
    LIMIT 50
  `;
  return result.rows;
}

export async function getMessagesByConversation(conversationId: string): Promise<Message[]> {
  const result = await sql<Message>`
    SELECT * FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `;
  return result.rows;
}

export async function getAllUsers(): Promise<User[]> {
  const result = await sql<User>`
    SELECT id, name, email, role, status, plan, messages_used, messages_limit,
           created_at, last_login_at, trial_ends_at
    FROM users
    ORDER BY created_at DESC
  `;
  return result.rows;
}
