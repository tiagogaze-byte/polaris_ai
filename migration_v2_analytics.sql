-- POLARIS AI — Migration v2: Analytics
-- Execute no Neon após o schema.sql inicial

-- Adiciona coluna de tema nas mensagens (classificado pela IA)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS topic VARCHAR(100);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS squad_detected VARCHAR(100);

-- Índices para queries de analytics
CREATE INDEX IF NOT EXISTS idx_messages_topic ON messages(topic);
CREATE INDEX IF NOT EXISTS idx_messages_created_hour ON messages(DATE_TRUNC('hour', created_at));
CREATE INDEX IF NOT EXISTS idx_messages_user_day ON messages(conversation_id, DATE_TRUNC('day', created_at));

-- View de analytics por usuário
CREATE OR REPLACE VIEW user_analytics AS
SELECT
  u.id AS user_id,
  u.name,
  u.plan,

  -- Volume por dia (últimos 30 dias)
  COUNT(m.id) FILTER (
    WHERE m.role = 'user'
    AND m.created_at >= NOW() - INTERVAL '30 days'
  ) AS msgs_last_30d,

  -- Total histórico
  COUNT(m.id) FILTER (WHERE m.role = 'user') AS msgs_total,

  -- Horário de pico (hora com mais mensagens)
  MODE() WITHIN GROUP (
    ORDER BY EXTRACT(HOUR FROM m.created_at)
  ) FILTER (WHERE m.role = 'user') AS peak_hour,

  -- Tema mais consultado
  MODE() WITHIN GROUP (
    ORDER BY m.topic
  ) FILTER (WHERE m.role = 'user' AND m.topic IS NOT NULL) AS top_topic,

  -- Squad mais acionado
  MODE() WITHIN GROUP (
    ORDER BY m.squad_detected
  ) FILTER (WHERE m.role = 'user' AND m.squad_detected IS NOT NULL) AS top_squad

FROM users u
LEFT JOIN conversations c ON c.user_id = u.id
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY u.id, u.name, u.plan;
