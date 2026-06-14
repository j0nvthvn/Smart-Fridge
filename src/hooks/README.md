# hooks/

Custom hooks para encapsular lógica reutilizable entre pantallas.

## Hooks disponibles

### `useOpenFoodFacts.js`

Consulta la API de Open Food Facts a partir de un código de barras y retorna el nombre y la marca del producto.

**Retorna:**

- `fetchProductByBarcode(barcode)` — función async. Retorna `{ product, error }`.
  - `product`: `{ name: string, brand: string }` o `null` si no se encontró.
  - `error`: string con el mensaje de error, o `null` si fue exitoso.
- `loadingProduct` — booleano que indica si la consulta está en curso.
- `errorProduct` — string con el último error, o `null`.

**Ejemplo de uso:**

```js
import { useOpenFoodFacts } from '../hooks/useOpenFoodFacts';

const { fetchProductByBarcode, loadingProduct } = useOpenFoodFacts();

const { product, error } = await fetchProductByBarcode('7804900057888');
if (product) {
  console.log(product.name, product.brand);
}
```
