import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';
import { parseSupabaseError } from '../utils/errorUtils';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  syncExpiryNotifications,
} from '../services/notificationService';

const LEGACY_STORAGE_KEY = '@smartfridge/inventory';
const PRODUCT_COLUMNS = 'id, name, category, expires, quantity, barcode, created_at';

const InventoryContext = createContext(null);

function parseDate(value) {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysUntil(dateValue) {
  const expires = parseDate(dateValue);
  if (!expires) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expires.setHours(0, 0, 0, 0);

  return Math.ceil((expires.getTime() - today.getTime()) / 86400000);
}

function buildAlert(product) {
  const days = daysUntil(product.expires);
  if (days === null || days > 5) return null;

  if (days < 0) {
    return { ...product, date: 'Vencido', level: 'expired' };
  }

  if (days === 0) {
    return { ...product, date: 'Vence hoy', level: 'urgent' };
  }

  return {
    ...product,
    date: `Vence en ${days} dia${days > 1 ? 's' : ''}`,
    level: days <= 2 ? 'soon' : 'ok',
  };
}

function normalizeProduct(product, userId, { strictDate = true } = {}) {
  const expires = product.expires?.trim() || null;

  if (expires && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) {
    if (!strictDate) {
      return {
        user_id: userId,
        name: product.name?.trim() || '',
        category: product.category?.trim() || 'Sin categoria',
        expires: null,
        quantity: product.quantity?.trim() || '1 unidad',
        barcode: product.barcode || null,
      };
    }

    throw new Error('La fecha de vencimiento debe usar formato AAAA-MM-DD.');
  }

  return {
    user_id: userId,
    name: product.name?.trim() || '',
    category: product.category?.trim() || 'Sin categoria',
    expires,
    quantity: product.quantity?.trim() || '1 unidad',
    barcode: product.barcode || null,
  };
}

export function InventoryProvider({ children }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState(null);

  useEffect(() => {
    loadNotificationSettings().then(setNotificationSettings);
  }, []);

  useEffect(() => {
    if (!notificationSettings) return;
    syncExpiryNotifications(products, notificationSettings);
  }, [products, notificationSettings]);

  async function updateNotificationSettings(partial) {
    const next = { ...notificationSettings, ...partial };
    setNotificationSettings(next);
    await saveNotificationSettings(next);
  }

  async function migrateLegacyInventory(userId) {
    const stored = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return null;

    const legacyProducts = JSON.parse(stored);
    if (!Array.isArray(legacyProducts) || legacyProducts.length === 0) {
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      return null;
    }

    const payload = legacyProducts
      .filter(product => product?.name?.trim())
      .map(product => normalizeProduct(product, userId, { strictDate: false }));

    if (payload.length === 0) {
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      return null;
    }

    const { data, error: migrateError } = await supabase
      .from('products')
      .insert(payload)
      .select(PRODUCT_COLUMNS)
      .order('created_at', { ascending: false });

    if (migrateError) throw migrateError;

    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
    return data ?? [];
  }

  async function refreshInventory({ showLoading = true } = {}) {
    if (!user?.id) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    try {
      const { data, error: loadError } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (loadError) throw loadError;

      if (data?.length) {
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
        setProducts(data);
      } else {
        const migratedProducts = await migrateLegacyInventory(user.id);
        setProducts(migratedProducts ?? []);
      }

      setError(null);
    } catch (loadError) {
      setProducts([]);
      setError(parseSupabaseError(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshInventory();
  }, [user?.id]);

  async function addProduct(product) {
    if (!user?.id) {
      throw new Error('Debes iniciar sesion para guardar productos.');
    }

    const payload = normalizeProduct(product, user.id);

    const { data, error: insertError } = await supabase
      .from('products')
      .insert(payload)
      .select(PRODUCT_COLUMNS)
      .single();

    if (insertError) throw new Error(parseSupabaseError(insertError));

    setProducts(current => [data, ...current]);
    setError(null);

    return data;
  }

  async function updateProduct(productId, product) {
    if (!user?.id) {
      throw new Error('Debes iniciar sesion para editar productos.');
    }

    const payload = normalizeProduct(product, user.id);
    delete payload.user_id;

    const { data, error: updateError } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .eq('user_id', user.id)
      .select(PRODUCT_COLUMNS)
      .single();

    if (updateError) throw new Error(parseSupabaseError(updateError));

    setProducts(current => current.map(item => (item.id === productId ? data : item)));
    setError(null);

    return data;
  }

  async function deleteProduct(productId) {
    if (!user?.id) {
      throw new Error('Debes iniciar sesion para eliminar productos.');
    }

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('user_id', user.id);

    if (deleteError) throw new Error(parseSupabaseError(deleteError));

    setProducts(current => current.filter(item => item.id !== productId));
    setError(null);
  }

  const summary = useMemo(() => {
    const alerts = products.map(buildAlert).filter(Boolean);

    return {
      total: products.length,
      expiringSoon: alerts.filter(item => item.level === 'urgent' || item.level === 'soon').length,
      expired: alerts.filter(item => item.level === 'expired').length,
      alerts,
    };
  }, [products]);

  return (
    <InventoryContext.Provider
      value={{
        products,
        loading,
        error,
        summary,
        addProduct,
        updateProduct,
        deleteProduct,
        refreshInventory,
        notificationSettings,
        updateNotificationSettings,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  return useContext(InventoryContext);
}
