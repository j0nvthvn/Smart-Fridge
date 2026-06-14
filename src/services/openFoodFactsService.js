const BASE_URL = 'https://world.openfoodfacts.org/api/v2';

export const getProductByBarcode = async (barcode) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `${BASE_URL}/product/${barcode}?fields=product_name,product_name_es,brands,quantity,categories_tags`,
      { signal: controller.signal },
    );

    if (!response.ok) throw new Error('Error al conectar con Open Food Facts');

    const data = await response.json();

    if (data.status === 0) return null;

    const p = data.product;
    return {
      name: p.product_name_es || p.product_name || '',
      brand: p.brands || '',
      quantity: p.quantity || '',
      categories: p.categories_tags || [],
    };
  } finally {
    clearTimeout(timeout);
  }
};
