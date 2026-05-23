import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Modal, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../constants/colors';
import SectionHeader from '../components/SectionHeader';
import { useInventory } from '../context/InventoryContext';

const EMPTY_PRODUCT = { name: '', category: '', expires: '', quantity: '' };

export default function ScannerScreen() {
  const { addProduct } = useInventory();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive]   = useState(false);
  const [scanned, setScanned]             = useState(false);

  const [showManual, setShowManual] = useState(false);
  const [product, setProduct]       = useState(EMPTY_PRODUCT);

  const [lastScanned, setLastScanned] = useState({
    name:     'Leche Colun 1L',
    category: 'Lácteos',
    expires:  '2026-05-22',
    quantity: '1 unidad',
    barcode:  null,
  });

  const pulseAnim = useRef(new Animated.Value(0)).current;

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }

  async function handleActivateCamera() {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permiso requerido',
          'SmartFridge necesita acceso a la cámara para escanear productos. Puedes habilitarlo en Configuración.',
          [{ text: 'Entendido' }],
        );
        return;
      }
    }
    setScanned(false);
    setCameraActive(true);
    startPulse();
  }

  function handleCloseCamera() {
    setCameraActive(false);
    pulseAnim.stopAnimation();
  }

  function handleBarcodeScanned({ type, data }) {
    if (scanned) return; // ignore duplicates
    setScanned(true);
    setCameraActive(false);
    pulseAnim.stopAnimation();

    setLastScanned(prev => ({
      ...prev,
      id: null,
      barcode: data,
      name: `Código: ${data}`,
    }));

    Alert.alert(
      '¡Código detectado!',
      `Tipo: ${type}\nCódigo: ${data}\n\nPuedes editar los datos del producto abajo.`,
      [{ text: 'OK' }],
    );
  }

  async function handleSaveManual() {
    if (!product.name.trim()) {
      Alert.alert('Error', 'El nombre del producto es obligatorio.');
      return;
    }

    try {
      const savedProduct = await addProduct({ ...product, barcode: null });
      setLastScanned(savedProduct);
      Alert.alert('¡Guardado!', 'Producto agregado al inventario.', [
        { text: 'OK', onPress: () => setShowManual(false) },
      ]);
      setProduct(EMPTY_PRODUCT);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar el producto.');
    }
  }

  async function handleSaveInventory() {
    if (!lastScanned.name?.trim()) {
      Alert.alert('Error', 'No hay producto para guardar.');
      return;
    }

    try {
      if (!lastScanned.id) {
        const savedProduct = await addProduct(lastScanned);
        setLastScanned(savedProduct);
      }

      Alert.alert('Inventario', `"${lastScanned.name}" guardado correctamente.`);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar el producto.');
    }
  }

  // Animated scan-line translateY
  const scanLineTranslate = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-80, 80],
  });

  if (cameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128', 'code39'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />

        {/* Dark overlay with transparent cutout feel */}
        <View style={styles.cameraOverlay}>
          {/* Top bar */}
          <SafeAreaView style={styles.cameraTopBar}>
            <TouchableOpacity style={styles.closeCameraBtn} onPress={handleCloseCamera}>
              <Feather name="x" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.cameraTopText}>Escanear producto</Text>
            <View style={{ width: 40 }} />
          </SafeAreaView>

          {/* Viewfinder */}
          <View style={styles.viewfinder}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Animated scan line */}
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY: scanLineTranslate }] }]}
            />
          </View>

          {/* Hint */}
          <Text style={styles.cameraHint}>
            Centra el código de barras dentro del recuadro
          </Text>

          {/* Manual fallback */}
          <TouchableOpacity
            style={styles.manualFallbackBtn}
            onPress={() => { handleCloseCamera(); setShowManual(true); }}
          >
            <Feather name="edit-2" size={14} color={COLORS.white} />
            <Text style={styles.manualFallbackText}>Ingresar manualmente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>Agregar producto</Text>
          <Text style={styles.headerTitle}>Escanear código de barras</Text>
        </View>

        {/* Scanner viewfinder (inactive state) */}
        <View style={styles.scannerBox}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <Feather name="camera" size={36} color="rgba(255,255,255,0.3)" />
          <Text style={styles.scanHint}>Apunta al código de barras</Text>

          <TouchableOpacity style={styles.activateBtn} onPress={handleActivateCamera}>
            <Feather name="zap" size={14} color={COLORS.white} style={{ marginRight: 6 }} />
            <Text style={styles.activateBtnText}>Activar cámara</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>o ingresa manualmente</Text>

        <TouchableOpacity style={styles.manualBtn} onPress={() => setShowManual(true)}>
          <Feather name="plus" size={16} color={COLORS.gray700} />
          <Text style={styles.manualBtnText}>Ingresar producto manual</Text>
        </TouchableOpacity>

        {/* Último escaneado */}
        <SectionHeader icon="clock" title="Último escaneado" />

        <View style={styles.formCard}>
          {[
            { label: 'Producto',  value: lastScanned.name,     color: COLORS.gray700   },
            { label: 'Categoría', value: lastScanned.category, color: COLORS.gray700   },
            { label: 'Vence',     value: lastScanned.expires,  color: COLORS.orange400 },
            { label: 'Cantidad',  value: lastScanned.quantity, color: COLORS.gray700   },
            ...(lastScanned.barcode
              ? [{ label: 'Código', value: lastScanned.barcode, color: COLORS.gray500 }]
              : []),
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.formRow, i < arr.length - 1 && styles.formRowBorder]}>
              <Text style={styles.formLabel}>{row.label}</Text>
              <Text style={[styles.formValue, { color: row.color }]} numberOfLines={1} ellipsizeMode="tail">
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveInventory}>
          <Text style={styles.saveBtnText}>Guardar en inventario</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Modal ingreso manual ────────────────────────────────────────────── */}
      <Modal visible={showManual} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ingresar producto</Text>
            <TouchableOpacity onPress={() => setShowManual(false)}>
              <Feather name="x" size={22} color={COLORS.gray700} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {[
              { label: 'Nombre del producto',  key: 'name',     placeholder: 'Ej: Leche entera 1L', keyboard: 'default'       },
              { label: 'Categoría',            key: 'category', placeholder: 'Ej: Lácteos',         keyboard: 'default'       },
              { label: 'Fecha de vencimiento', key: 'expires',  placeholder: 'Ej: 2026-04-30',      keyboard: 'default'       },
              { label: 'Cantidad',             key: 'quantity', placeholder: 'Ej: 1 unidad',         keyboard: 'default'       },
            ].map(field => (
              <View key={field.key} style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.gray300}
                  keyboardType={field.keyboard}
                  value={product[field.key]}
                  onChangeText={v => setProduct(p => ({ ...p, [field.key]: v }))}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveManual}>
              <Text style={styles.saveBtnText}>Guardar producto</Text>
            </TouchableOpacity>
            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: COLORS.green500,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 4,
  },

  scannerBox: {
    backgroundColor: '#1E293B',
    margin: 20,
    borderRadius: 24,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  scanHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  activateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: COLORS.green500,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 99,
  },
  activateBtnText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '600',
  },

  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: COLORS.green400,
    borderStyle: 'solid',
  },
  cornerTL: { top: 20, left: 20, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: 20, right: 20, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: 20, left: 20, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 20, right: 20, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },

  orText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.gray500,
    marginVertical: 14,
    fontWeight: '500',
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  manualBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
  },

  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  formRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formLabel: {
    width: 100,
    fontSize: 13,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  formValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },

  saveBtn: {
    backgroundColor: COLORS.green500,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.green500,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  closeCameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTopText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  viewfinder: {
    width: 260,
    height: 180,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: COLORS.green400,
    borderRadius: 1,
    shadowColor: COLORS.green400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  cameraHint: {
    marginTop: 28,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  manualFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  manualFallbackText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '500',
  },

  modalSafe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  modalScroll: {
    flex: 1,
    paddingTop: 8,
  },
  fieldWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 10,
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.gray700,
  },
});
