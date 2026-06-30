const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function buildSystemPrompt(products) {
  const noProducts = !products || products.length === 0;

  const inventorySection = noProducts
    ? 'El usuario no tiene productos registrados aún. Anímalo a agregar productos.'
    : (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const list = products.map(p => {
          let expiryNote = 'sin fecha';
          if (p.expires) {
            const exp = new Date(p.expires + 'T00:00:00');
            const days = Math.ceil((exp - today) / 86400000);
            if (days < 0) expiryNote = '⚠️ VENCIDO';
            else if (days === 0) expiryNote = '⚠️ vence HOY';
            else if (days <= 3) expiryNote = `⚠️ vence en ${days} día${days > 1 ? 's' : ''}`;
            else expiryNote = `vence en ${days} días`;
          }
          return `- ${p.name} (${p.category}, ${p.quantity}, ${expiryNote})`;
        }).join('\n');
        return `El usuario tiene estos productos:\n${list}`;
      })();

  return `Eres un chef amigable, creativo y práctico. ${inventorySection}

INSTRUCCIÓN CRÍTICA: Responde SIEMPRE con un JSON válido, sin texto adicional antes ni después. Usa uno de estos tres formatos según corresponda:

Una sola receta:
{"type":"recipe","name":"Nombre","steps":["Paso 1...","Paso 2..."]}

Varias recetas o menú semanal:
{"type":"menu","recipes":[{"name":"Nombre receta","steps":["Paso 1...","Paso 2..."]},{"name":"Otra receta","steps":["Paso 1..."]}]}

Respuesta conversacional (saludo, pregunta, aclaración):
{"type":"text","content":"Tu respuesta aquí."}

Reglas:
- Prioriza ingredientes próximos a vencer (⚠️).
- Asume que el usuario tiene sal, aceite y especias básicas.
- Pasos breves y directos, máximo 6 pasos por receta.
- Responde siempre en español.`;
}

export async function sendMessage(messages, products) {
  if (!GROQ_API_KEY) {
    throw new Error('Falta configurar EXPO_PUBLIC_GROQ_API_KEY en el archivo .env');
  }

  const systemPrompt = buildSystemPrompt(products);

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 600,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message ?? `Error ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content.trim();

  try {
    const parsed = JSON.parse(raw);
    if (parsed.type === 'recipe' && parsed.name && Array.isArray(parsed.steps)) {
      return parsed;
    }
    if (parsed.type === 'menu' && Array.isArray(parsed.recipes)) {
      return parsed;
    }
    if (parsed.type === 'text' && parsed.content) {
      return parsed;
    }
  } catch (_) {}

  return { type: 'text', content: raw };
}
