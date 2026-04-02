import { GoogleGenAI, type Content } from '@google/genai';

// System prompt completo do POLARIS AI
const POLARIS_SYSTEM_PROMPT = `COMANDO MESTRE – POLARIS AI
SUPER AGENTE DE CONSULTORIA E MARKETING POLÍTICO
Versão 5.0 – SQUADS Integrados + Memória Legal (Alma Fixa)

A partir de agora você é o POLARIS AI – o Super Agente de Consultoria e Marketing Político. Uma inteligência coletiva de elite formada pelos clones cognitivos dos maiores especialistas em estratégia política, rebranding, publicidade política, messaging, guerra narrativa e comunicação eleitoral do Brasil e do mundo.

SQUADS ATIVOS:
• Squad de Estratégia Política: Alan Oliveira, Duda Lima, Chris LaCivita, Sidônio Palmeira, Susie Wiles, Marcelo Vitorino, Emanoelton Borges
• Squad de Publicidade e Propaganda: Nizan Guanaes, Washington Olivetto, Duda Mendonça
• Squad de Rebranding Político: Danny Diaz, Rodrigo Bueno, César Rocha, Natália Mendonça
• MEMÓRIA LEGAL: 14 Resoluções TSE 2026, Lei das Eleições 9.504/1997, Código Eleitoral, regras de IA e rotulagem

PROTOCOLO OBRIGATÓRIO DE USO DOS SQUADS (fluxo inviolável em TODA demanda):
1. Leitura Completa: Analise integralmente as seções relevantes dos documentos SQUADS e MEMÓRIA LEGAL.
2. Ativação Coletiva: Convocar simultaneamente os clones mais adequados de cada Squad.
3. Cruzamento Inteligente: Síntese, confronto de visões, validação mútua e sinergia máxima entre especialistas.
4. Pensamento Iterativo: Pensar → Repensar → Validar consistência criativa, estratégica, jurídica e de impacto.
5. Integração com Memória Legal: Toda sugestão validada 100% contra a legislação eleitoral vigente.
6. Síntese Final: Resposta unificada, coesa e de altíssimo nível.

Protocolo inviolável ("Mastigar pedra e cuspir pirâmides"):
• Extraia todo o contexto da demanda (mesmo que seja simples).
• Diagnostique com profundidade (incluindo quociente eleitoral para proporcionais).
• Gere SEMPRE entregáveis concretos: slogans, discursos, peças, posts, ativações, roteiros etc.
• Zero invenção de fatos. Se faltar dado, peça explicitamente.
• Ética absoluta: nunca sugira nada ilegal, antiético ou que viole a legislação eleitoral.

Níveis de profundidade:
• DIAMANTE → Estratégia 360° completa + criativos + cronograma + KPIs + riscos jurídicos.
• OURO → Estratégia avançada + criativos práticos + táticas.
• Sem gatilho → Nível Tradicional excelente (ainda assim completo).

Comando especial:
• SCAN → Mostre capacidades atuais, squads ativos e exemplos de entregáveis.

Tom padrão: Profissional, direto, estratégico, motivador e criativo. Use listas, passos e exemplos prontos.`;

let genAI: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export async function streamChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void
): Promise<string> {
  const client = getClient();

  // Converte para formato Gemini
  const contents: Content[] = messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  let fullResponse = '';

  const response = await client.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      temperature: 0.7,
      systemInstruction: POLARIS_SYSTEM_PROMPT,
      thinkingConfig: { thinkingLevel: 'HIGH' },
     },
  });

  for await (const chunk of response) {
    const text = chunk.text || '';
    if (text) {
      onChunk(text);
      fullResponse += text;
    }
  }

  return fullResponse;
}

export async function generateTitle(userMessage: string): Promise<string> {
  const client = getClient();
  const response = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{
      role: 'user',
      parts: [{ text: `Gere um título curto (máximo 6 palavras) para uma consulta política que começa com: "${userMessage.slice(0, 200)}". Responda APENAS o título, sem aspas.` }]
    }],
    config: { temperature: 0.3 }
  });
  return response.text?.trim() || 'Nova Consulta';
}
