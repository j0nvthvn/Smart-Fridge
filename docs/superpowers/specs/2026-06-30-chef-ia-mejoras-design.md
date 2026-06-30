# Chef IA: respuestas más precisas + sugerencias rápidas

## Contexto

El Chef IA (`src/screens/ChefScreen.js` + `src/services/chefService.js`) es un chat
que usa Groq (`llama-3.3-70b-versatile`) para sugerir recetas según el inventario
del usuario. Hoy:

- El usuario solo puede interactuar escribiendo texto libre.
- El prompt fuerza JSON (`recipe` / `menu` / `text`) pero sin `response_format`,
  sin reintento si el parseo falla, y sin reglas para mensajes fuera de tema o
  ingredientes faltantes.
- No hay memoria de preferencias dietéticas (no existe ese campo en el perfil
  hoy — fuera de alcance de este cambio).

## Objetivo

1. Mejorar la calidad y robustez de las respuestas del Chef IA.
2. Agregar sugerencias rápidas (chips) para reducir la fricción de escribir.

## Cambios en `chefService.js`

### Prompt
- Pedir explícitamente que las recetas consideren las cantidades reales del
  inventario, tiempo de preparación aproximado y porciones.
- Reglas para casos límite:
  - Mensaje no relacionado con cocina → responder amablemente redirigiendo al
    tema (tipo `text`).
  - Piden un plato que requiere un ingrediente que no está en el inventario →
    sugerir sustituto disponible o avisar qué falta, sin inventar que sí lo
    tiene.
  - Inventario vacío → mantener el comportamiento actual (anima a agregar
    productos) pero con tono consistente con el resto del prompt.
- El prompt debe seguir devolviendo **un único objeto JSON**, pero ahora con un
  campo adicional `suggestions` en los tres tipos de respuesta (`recipe`,
  `menu`, `text`): arreglo de 2-3 strings cortos con preguntas de seguimiento
  relevantes al turno actual (ej. tras una receta: "¿Otra opción más rápida?",
  "¿Versión vegetariana?"). Si el modelo no tiene una sugerencia natural,
  puede devolver un arreglo vacío.

### Llamada a la API
- Agregar `response_format: { type: 'json_object' }` al body de la request a
  Groq para reducir fallos de parseo (Groq es compatible con la API de
  OpenAI y soporta este modo).
- Si el JSON no parsea o no cumple el esquema esperado, reintentar la llamada
  una sola vez antes de caer al fallback actual (mostrar el texto crudo como
  `type: 'text'`).
- Los mensajes de error que llegan al usuario deben ser más claros que
  `err.message` crudo: mapear errores comunes (red, rate limit, API key
  faltante) a un texto amigable en español; usar el mensaje original solo
  como fallback genérico.

### Contrato de salida
`sendMessage` sigue retornando un objeto `{ type, ... }`, ahora con
`suggestions?: string[]` opcional en cualquiera de los tres tipos.

## Cambios en `ChefScreen.js`

### Chips iniciales (sin llamar a la IA)
- Calculados localmente a partir de `products` del inventario, una sola vez al
  montar la pantalla:
  - Si hay productos por vencer (≤3 días o vencidos) → incluir un chip tipo
    "¿Qué cocino con lo que vence pronto?".
  - Completar con chips genéricos fijos hasta tener 3 (ej. "Sorpréndeme con
    algo rápido", "Receta con lo que tengo", "Menú para hoy").
- Se muestran como fila horizontal scrolleable debajo de la burbuja de
  bienvenida, antes del primer mensaje del usuario.

### Chips de continuidad (desde `suggestions` de la respuesta)
- Tras cada respuesta del asistente que incluya `suggestions` no vacío, se
  renderiza una fila de chips debajo de esa burbuja.
- Solo la fila de chips del **último** mensaje del asistente es interactiva;
  las filas de turnos anteriores se ocultan/dejan de mostrarse al llegar una
  respuesta nueva (no se acumulan en pantalla).

### Interacción
- Tocar un chip dispara el mismo flujo que `handleSend`, usando el texto del
  chip como si el usuario lo hubiera escrito y enviado (no pasa por el
  `TextInput`).
- Mientras `loading` es `true`, los chips no son interactivos (mismo criterio
  que el botón de enviar).

## Fuera de alcance

- Memoria de preferencias dietéticas/alergias entre conversaciones (no existe
  el campo en el perfil; se podría abordar en un proyecto aparte).
- Sugerencias siempre visibles en una barra fija (se descartó por overhead de
  estar regenerando contexto constantemente).
- Streaming de respuesta token a token.

## Testing

- Probar manualmente: inventario vacío, inventario con productos por vencer,
  pregunta fuera de tema, pregunta pidiendo un ingrediente no disponible,
  fallo de red simulado (sin `EXPO_PUBLIC_GROQ_API_KEY`).
- Verificar que tocar un chip envía el mensaje correctamente y que los chips
  del turno previo desaparecen al llegar la nueva respuesta.
