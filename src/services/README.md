# services/

Servicios para comunicación con APIs externas y con Supabase.

## Servicios disponibles

### `supabase.js`

Inicializa y exporta el cliente de Supabase. Utiliza las variables de entorno `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Es el punto de entrada para todas las operaciones con la base de datos y la autenticación.

### `openFoodFactsService.js`

Consulta la API pública de Open Food Facts (`https://world.openfoodfacts.org/api/v2`) para obtener información de un producto a partir de su código de barras.

**Función exportada:**

```js
getProductByBarcode(barcode: string): Promise<{ name: string, brand: string } | null>
```

- Hace fetch con un timeout de 5 segundos.
- Retorna `{ name, brand }` con los campos `product_name_es` (o `product_name`) y `brands`.
- Retorna `null` si el producto no existe en la base de datos de Open Food Facts.
- Lanza un error si la conexión falla o el servidor responde con error HTTP.

Este servicio es consumido por el hook `useOpenFoodFacts` en `src/hooks/`.
