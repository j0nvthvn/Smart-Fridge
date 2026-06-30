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
{"type":"recipe","name":"Nombre","steps":["Paso 1...","Paso 2..."],"suggestions":["...","..."]}

Varias recetas o menú semanal:
{"type":"menu","recipes":[{"name":"Nombre receta","steps":["Paso 1...","Paso 2..."]},{"name":"Otra receta","steps":["Paso 1..."]}],"suggestions":["...","..."]}

Respuesta conversacional (saludo, pregunta, aclaración):
{"type":"text","content":"Tu respuesta aquí.","suggestions":["...","..."]}

Reglas:
- Prioriza ingredientes próximos a vencer (⚠️).
- Asume que el usuario tiene sal, aceite y especias básicas.
- Pasos breves y directos, máximo 6 pasos por receta.
- Considera las cantidades reales del inventario, el tiempo de preparación aproximado y las porciones que rinde la receta.
- Si el mensaje del usuario no tiene relación con cocina o comida, responde con "type":"text" redirigiéndolo amablemente al tema, sin inventar una receta.
- Si piden algo para lo que falta un ingrediente clave, NO asumas que lo tiene: sugiere un sustituto disponible en el inventario o avisa claramente qué falta.
- "suggestions" es un arreglo de 2 a 3 preguntas de seguimiento cortas (máximo ~6 palabras) relacionadas con tu respuesta, que el usuario podría querer tocar a continuación (ej. "¿Otra opción más rápida?", "¿Versión vegetariana?"). Si no aplica ninguna, usa un arreglo vacío [].
- Responde siempre en español.`;
}

function isValidReply(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;
  if (parsed.type === 'recipe') return !!parsed.name && Array.isArray(parsed.steps);
  if (parsed.type === 'menu') return Array.isArray(parsed.recipes);
  if (parsed.type === 'text') return !!parsed.content;
  return false;
}

function normalizeSuggestions(parsed) {
  return {
    ...parsed,
    suggestions: Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter(s => typeof s === 'string')
      : [],
  };
}

function friendlyErrorMessage(response, err) {
  if (response.status === 401) {
    return 'La clave de API de Groq no es válida, revisa tu configuración.';
  }
  if (response.status === 429) {
    return 'El Chef IA está muy solicitado, intenta de nuevo en un momento.';
  }
  if (response.status >= 500) {
    return 'El servicio del Chef IA no está disponible en este momento, intenta de nuevo más tarde.';
  }
  return err?.error?.message ?? `Error ${response.status}`;
}

async function requestCompletion(messages, systemPrompt) {
  let response;
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });
  } catch (_) {
    throw new Error('No se pudo conectar con el Chef IA, revisa tu conexión.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(friendlyErrorMessage(response, err));
  }

  const data = await response.json();
  const raw = data.choices[0].message.content.trim();

  try {
    const parsed = JSON.parse(raw);
    if (isValidReply(parsed)) {
      return { reply: normalizeSuggestions(parsed), raw };
    }
  } catch (_) {}

  return { reply: null, raw };
}

export async function sendMessage(messages, products) {
  if (!GROQ_API_KEY) {
    throw new Error('Falta configurar EXPO_PUBLIC_GROQ_API_KEY en el archivo .env');
  }

  const systemPrompt = buildSystemPrompt(products);

  let result = await requestCompletion(messages, systemPrompt);
  if (!result.reply) {
    result = await requestCompletion(messages, systemPrompt);
  }

  return result.reply ?? { type: 'text', content: result.raw, suggestions: [] };
}
