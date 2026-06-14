# utils/

Funciones utilitarias reutilizables.

## Archivos

### `errorUtils.js`

Convierte errores de Supabase y de red en mensajes legibles en español.

```js
parseSupabaseError(error: Error | object): string
```

Casos manejados:
- Sin conexión / timeout → `"Sin conexión. Revisa tu internet e intenta de nuevo."`
- JWT expirado / sesión inválida → `"Tu sesión expiró. Vuelve a iniciar sesión."`
- Permisos RLS → `"No tienes permiso para realizar esta acción."`
- Duplicado (code 23505) → `"Ya existe un registro con esos datos."`
- Registro no encontrado (PGRST116) → `"No se encontró el registro solicitado."`

Usado en: `InventoryContext.js` (refreshInventory, addProduct, updateProduct, deleteProduct).

## Futuros helpers

- `dateUtils.js` — formateo de fechas legibles.
- `validators.js` — validaciones reutilizables de formularios.
- `formatters.js` — capitalizar, truncar strings.
