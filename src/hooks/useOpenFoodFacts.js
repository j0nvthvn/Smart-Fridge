import { useState } from 'react';
import { getProductByBarcode } from '../services/openFoodFactsService';

export const useOpenFoodFacts = () => {
  const [loadingProduct, setLoadingProduct] = useState(false);

  const fetchProductByBarcode = async (barcode) => {
    setLoadingProduct(true);
    try {
      return await getProductByBarcode(barcode);
    } catch (err) {
      console.warn('OpenFoodFacts error:', err.message);
      return null;
    } finally {
      setLoadingProduct(false);
    }
  };

  return { loadingProduct, fetchProductByBarcode };
};