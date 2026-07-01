import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const ToastContext = createContext(null);
const DURATION = 2200;

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  const showToast = useCallback((message) => {
    clearTimeout(hideTimer.current);
    setToast(message);
    opacity.setValue(0);

    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();

    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true })
        .start(() => setToast(null));
    }, DURATION);
  }, [opacity]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <Animated.View pointerEvents="none" style={[styles.container, { opacity }]}>
          <Feather name="check-circle" size={16} color={COLORS.white} />
          <Text style={styles.text} numberOfLines={2}>{toast}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  text: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
