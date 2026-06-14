import { useState } from 'react';
import { getProductByBarcode } from '../services/openFoodFactsService';

export const useOpenFoodFacts = () => {
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [errorProduct, setErrorProduct] = useState(null);

  const fetchProductByBarcode = async (barcode) => {
    setLoadingProduct(true);
    setErrorProduct(null);
    try {
      return await getProductByBarcode(barcode);
    } catch (err) {
      setErrorProduct(err.message);
      return null;
    } finally {
      setLoadingProduct(false);
    }
  };

  return { loadingProduct, errorProduct, fetchProductByBarcode };
};
