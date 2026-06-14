# types/

Carpeta reservada para definiciones de tipos y estructuras de datos del proyecto.

El proyecto actualmente usa JavaScript, por lo que esta carpeta está disponible para incorporar tipos con JSDoc o migrar a TypeScript en el futuro.

## Estructuras de datos principales (referencia)

### Producto (`product`)

```js
{
  id: string,           // UUID generado por Supabase
  user_id: string,      // UUID del usuario autenticado
  name: string,         // Nombre del producto
  brand: string,        // Marca (puede venir de Open Food Facts)
  category: string,     // Una de las categorías definidas en constants/categories.js
  quantity: number,     // Cantidad disponible
  expiration_date: string, // Fecha de vencimiento (ISO 8601)
  barcode: string,      // Código de barras escaneado (opcional)
  created_at: string,   // Timestamp de creación
}
```
