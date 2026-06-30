import { useState } from 'react';
import { getProductByBarcode } from '../services/openFoodFactsService';

export const useOpenFoodFacts = () => {
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [errorProduct, setErrorProduct] = useState(null);

  const fetchProductByBarcode = async (barcode) => {
    setLoadingProduct(true);
    setErrorProduct(null);
    try {
      const product = await getProductByBarcode(barcode);
      return { product, error: null };
    } catch (err) {
      const message = err.name === 'AbortError'
        ? 'Tiempo de espera agotado, revisa tu conexión.'
        : err.message;
      setErrorProduct(message);
      return { product: null, error: message };
    } finally {
      setLoadingProduct(false);
    }
  };

  return { loadingProduct, errorProduct, fetchProductByBarcode };
};
