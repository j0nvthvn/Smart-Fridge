import AsyncStorage from '@react-native-async-storage/async-storage';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_KEY = '@smartfridge/chef-model';

export const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

export const CHEF_MODEL_OPTIONS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (recomendado)' },
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B' },
  { id: 'qwen/qwen3-32b', label: 'Qwen3 32B' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (rápido)' },
];

export async function loadChefModel() {
  try {
    const stored = await AsyncStorage.getItem(MODEL_KEY);
    if (stored && CHEF_MODEL_OPTIONS.some(m => m.id === stored)) return stored;
    return DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export async function saveChefModel(modelId) {
  await AsyncStorage.setItem(MODEL_KEY, modelId);
}

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

export async function testChefConnection() {
  if (!GROQ_API_KEY) {
    return { ok: false, message: 'Falta configurar EXPO_PUBLIC_GROQ_API_KEY en el archivo .env' };
  }

  const model = await loadChefModel();

  let response;
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    });
  } catch (_) {
    return { ok: false, message: 'No se pudo conectar con Groq, revisa tu conexión.' };
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return { ok: false, message: friendlyErrorMessage(response, err) };
  }

  return { ok: true, message: `Conexión OK con el modelo ${model}.` };
}

async function requestCompletion(messages, systemPrompt, model) {
  let response;
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
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
  const model = await loadChefModel();
  const models = model === FALLBACK_MODEL ? [model] : [model, FALLBACK_MODEL];

  let result = null;
  let lastError = null;

  for (const currentModel of models) {
    try {
      result = await requestCompletion(messages, systemPrompt, currentModel);
      if (!result.reply) {
        result = await requestCompletion(messages, systemPrompt, currentModel);
      }
      if (result.reply) break;
    } catch (err) {
      lastError = err;
      result = null;
    }
  }

  if (!result) throw lastError;

  return result.reply ?? { type: 'text', content: result.raw, suggestions: [] };
}
