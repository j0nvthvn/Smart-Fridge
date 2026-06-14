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
      setErrorProduct(err.message);
      return { product: null, error: err.message };
    } finally {
      setLoadingProduct(false);
    }
  };

  return { loadingProduct, errorProduct, fetchProductByBarcode };
};
