-- POLARIS AI - Schema do Banco de Dados
-- Execute no Vercel Postgres (Neon) via dashboard ou psql

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum de roles
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'client', 'trial');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE plan_type AS ENUM ('trial', 'free', 'pro', 'enterprise');

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'trial',
  status user_status NOT NULL DEFAULT 'active',
  plan plan_type NOT NULL DEFAULT 'trial',
  
  -- Limites de uso
  messages_used INT NOT NULL DEFAULT 0,
  messages_limit INT NOT NULL DEFAULT 10, -- trial: 10 msgs
  
  -- Metadados
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL DEFAULT 'Nova Consulta',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões (blacklist de tokens invalidados)
CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_jti VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Admin padrão (TROQUE A SENHA APÓS O PRIMEIRO LOGIN)
-- Senha padrão: Admin@2026 (hash bcrypt abaixo)
INSERT INTO users (name, email, password_hash, role, status, plan, messages_limit)
VALUES (
  'Administrador',
  'admin@polarisai.com.br',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMXJMKdnKsTKxpBo/vJQQ8Y1Ym', 
  'admin',
  'active',
  'enterprise',
  999999
) ON CONFLICT (email) DO NOTHING;

-- View útil para admin
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.status,
  u.plan,
  u.messages_used,
  u.messages_limit,
  u.created_at,
  u.last_login_at,
  u.trial_ends_at,
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(DISTINCT m.id) as total_messages
FROM users u
LEFT JOIN conversations c ON c.user_id = u.id
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY u.id;
