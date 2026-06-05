import React, { useEffect, useState, useRef } from 'react';
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

const EMPTY_PRODUCT = { name: '', category: '', expires: '', quantity: '', barcode: '' };
const CATEGORIES = ['Lácteos', 'Carnes', 'Frutas', 'Verduras', 'Bebidas', 'Congelados', 'Despensa', 'Snacks', 'Otro'];
const QUANTITY_UNITS = ['unidades', 'paquetes', 'cajas', 'botellas', 'bolsas', 'kg', 'g', 'L', 'ml'];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function formatDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(date) {
  return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function parseQuantity(quantity) {
  const [amount = '1', ...unitParts] = (quantity || '1 unidades').split(' ');
  return {
    amount,
    unit: unitParts.join(' ') || 'unidades',
  };
}

function buildQuantity(amount, unit) {
  return `${amount || '1'} ${unit || 'unidades'}`;
}

export default function ScannerScreen() {
  const { addProduct, products } = useInventory();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive]   = useState(false);
  const [scanned, setScanned]             = useState(false);

  const [showManual, setShowManual] = useState(false);
  const [product, setProduct]       = useState(EMPTY_PRODUCT);
  const [saving, setSaving]         = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [lastScanned, setLastScanned] = useState(null);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const quantityParts = parseQuantity(product.quantity);
  const calendarDays = buildCalendarDays(calendarMonth);

  useEffect(() => {
    if (!lastScanned?.id) return;

    const currentProduct = products.find(item => item.id === lastScanned.id);
    setLastScanned(currentProduct || null);
  }, [products, lastScanned?.id]);

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

  function openManualForm(nextProduct = EMPTY_PRODUCT) {
    const expires = nextProduct.expires ? new Date(nextProduct.expires) : new Date();
    setCalendarMonth(Number.isNaN(expires.getTime()) ? new Date() : expires);
    setProduct({ ...EMPTY_PRODUCT, quantity: '1 unidades', ...nextProduct });
    setShowManual(true);
  }

  function closeManualForm() {
    setShowManual(false);
    setShowCategoryPicker(false);
    setShowUnitPicker(false);
    setShowDatePicker(false);
    setProduct(EMPTY_PRODUCT);
  }

  function handleBarcodeScanned({ type, data }) {
    if (scanned) return; // ignore duplicates
    setScanned(true);
    setCameraActive(false);
    pulseAnim.stopAnimation();

    openManualForm({
      ...EMPTY_PRODUCT,
      barcode: data,
      quantity: '1 unidades',
    });

    Alert.alert(
      '¡Código detectado!',
      `Tipo: ${type}\nCódigo: ${data}\n\nCompleta los datos del producto para guardarlo.`,
      [{ text: 'OK' }],
    );
  }

  function validateProduct(nextProduct) {
    if (!nextProduct.name.trim()) {
      return 'El nombre del producto es obligatorio.';
    }

    if (nextProduct.expires.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(nextProduct.expires.trim())) {
      return 'La fecha debe usar formato AAAA-MM-DD.';
    }

    return null;
  }

  async function handleSaveManual() {
    const validationError = validateProduct(product);
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    setSaving(true);

    try {
      const savedProduct = await addProduct(product);
      setLastScanned(savedProduct);
      Alert.alert('¡Guardado!', 'Producto agregado al inventario.', [
        { text: 'OK', onPress: () => setShowManual(false) },
      ]);
      setProduct(EMPTY_PRODUCT);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveInventory() {
    if (!lastScanned) {
      Alert.alert('Error', 'No hay producto para guardar.');
      return;
    }

    const validationError = validateProduct(lastScanned);
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    setSaving(true);

    try {
      if (!lastScanned.id) {
        const savedProduct = await addProduct(lastScanned);
        setLastScanned(savedProduct);
      }

      Alert.alert('Inventario', `"${lastScanned.name}" guardado correctamente.`);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
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
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
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
            onPress={() => { handleCloseCamera(); openManualForm(); }}
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

        <TouchableOpacity style={styles.manualBtn} onPress={() => openManualForm()}>
          <Feather name="plus" size={16} color={COLORS.gray700} />
          <Text style={styles.manualBtnText}>Ingresar producto manual</Text>
        </TouchableOpacity>

        {/* Último escaneado */}
        <SectionHeader icon="clock" title="Último escaneado" />

        <View style={styles.formCard}>
          {lastScanned ? (
            [
              { label: 'Producto',  value: lastScanned.name,     color: COLORS.gray700   },
              { label: 'Categoría', value: lastScanned.category, color: COLORS.gray700   },
              { label: 'Vence',     value: lastScanned.expires || 'Sin fecha', color: COLORS.orange400 },
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
            ))
          ) : (
            <View style={styles.emptyLastScan}>
              <Feather name="package" size={22} color={COLORS.gray500} />
              <Text style={styles.emptyLastScanText}>Aun no hay productos escaneados</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!lastScanned || lastScanned.id || saving) && styles.saveBtnDisabled,
          ]}
          onPress={handleSaveInventory}
          disabled={!lastScanned || !!lastScanned.id || saving}
        >
          <Text style={styles.saveBtnText}>
            {lastScanned?.id ? 'Producto guardado' : saving ? 'Guardando...' : 'Guardar en inventario'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Modal ingreso manual ────────────────────────────────────────────── */}
      <Modal visible={showManual} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ingresar producto</Text>
            <TouchableOpacity onPress={closeManualForm}>
              <Feather name="x" size={22} color={COLORS.gray700} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Nombre del producto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Leche entera 1L"
                placeholderTextColor={COLORS.gray300}
                value={product.name}
                onChangeText={v => setProduct(p => ({ ...p, name: v }))}
              />
            </View>

            {/* ── Categoría inline picker ── */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Categoría</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => {
                  setShowCategoryPicker(v => !v);
                  setShowUnitPicker(false);
                  setShowDatePicker(false);
                }}
              >
                <Text style={[styles.selectText, !product.category && styles.placeholderText]}>
                  {product.category || 'Selecciona una categoría'}
                </Text>
                <Feather name={showCategoryPicker ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.gray500} />
              </TouchableOpacity>
              {showCategoryPicker && (
                <View style={styles.inlineSheet}>
                  {CATEGORIES.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={styles.optionRow}
                      onPress={() => {
                        setProduct(p => ({ ...p, category }));
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={styles.optionText}>{category}</Text>
                      {product.category === category ? (
                        <Feather name="check" size={18} color={COLORS.green600} />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* ── Fecha inline calendar ── */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Fecha de vencimiento</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => {
                  setShowDatePicker(v => !v);
                  setShowCategoryPicker(false);
                  setShowUnitPicker(false);
                }}
              >
                <Text style={[styles.selectText, !product.expires && styles.placeholderText]}>
                  {product.expires || 'Selecciona una fecha'}
                </Text>
                <Feather name={showDatePicker ? 'chevron-up' : 'calendar'} size={18} color={COLORS.gray500} />
              </TouchableOpacity>
              {showDatePicker && (
                <View style={styles.inlineCalendar}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity
                      style={styles.calendarNav}
                      onPress={() => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                    >
                      <Feather name="chevron-left" size={20} color={COLORS.gray700} />
                    </TouchableOpacity>
                    <Text style={styles.calendarTitle}>{formatMonthLabel(calendarMonth)}</Text>
                    <TouchableOpacity
                      style={styles.calendarNav}
                      onPress={() => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                    >
                      <Feather name="chevron-right" size={20} color={COLORS.gray700} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.weekRow}>
                    {WEEKDAYS.map((day, index) => (
                      <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>
                    ))}
                  </View>
                  <View style={styles.daysGrid}>
                    {calendarDays.map(date => {
                      const dateValue = formatDate(date);
                      const inCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                      const selected = product.expires === dateValue;
                      return (
                        <TouchableOpacity
                          key={dateValue}
                          style={[styles.dayCell, selected && styles.dayCellSelected]}
                          onPress={() => {
                            setProduct(p => ({ ...p, expires: dateValue }));
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={[
                            styles.dayText,
                            !inCurrentMonth && styles.dayTextMuted,
                            selected && styles.dayTextSelected,
                          ]}>
                            {date.getDate()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity
                    style={[styles.clearDateButton, { marginTop: 8 }]}
                    onPress={() => {
                      setProduct(p => ({ ...p, expires: '' }));
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.clearDateText}>Sin fecha</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* ── Cantidad ── */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Cantidad</Text>
              <View style={styles.quantityRow}>
                <TextInput
                  style={[styles.input, styles.quantityAmount]}
                  placeholder="1"
                  placeholderTextColor={COLORS.gray300}
                  keyboardType="numeric"
                  value={quantityParts.amount}
                  onChangeText={value => {
                    const cleanValue = value.replace(/[^0-9.]/g, '');
                    setProduct(p => ({
                      ...p,
                      quantity: buildQuantity(cleanValue, parseQuantity(p.quantity).unit),
                    }));
                  }}
                />
                <TouchableOpacity
                  style={styles.quantityUnit}
                  onPress={() => {
                    setShowUnitPicker(v => !v);
                    setShowCategoryPicker(false);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.selectText}>{quantityParts.unit}</Text>
                  <Feather name={showUnitPicker ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.gray500} />
                </TouchableOpacity>
              </View>
              {/* ── Unidad inline picker ── */}
              {showUnitPicker && (
                <View style={styles.inlineSheet}>
                  {QUANTITY_UNITS.map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={styles.optionRow}
                      onPress={() => {
                        setProduct(p => ({
                          ...p,
                          quantity: buildQuantity(parseQuantity(p.quantity).amount, unit),
                        }));
                        setShowUnitPicker(false);
                      }}
                    >
                      <Text style={styles.optionText}>{unit}</Text>
                      {quantityParts.unit === unit ? (
                        <Feather name="check" size={18} color={COLORS.green600} />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Código</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 7800000000000"
                placeholderTextColor={COLORS.gray300}
                keyboardType="default"
                value={product.barcode}
                onChangeText={v => setProduct(p => ({ ...p, barcode: v }))}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.helpText}>La fecha se guarda en formato AAAA-MM-DD para activar alertas de vencimiento.</Text>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSaveManual}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar producto'}</Text>
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
  saveBtnDisabled: {
    opacity: 0.6,
  },
  emptyLastScan: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 8,
  },
  emptyLastScanText: {
    color: COLORS.gray500,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
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
  selectInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 10,
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray700,
    fontWeight: '500',
  },
  placeholderText: {
    color: COLORS.gray500,
    fontWeight: '400',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quantityAmount: {
    width: 92,
  },
  quantityUnit: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 10,
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.gray500,
    marginHorizontal: 20,
    marginTop: 12,
    lineHeight: 17,
  },
  optionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
  },
  inlineSheet: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginTop: 6,
    overflow: 'hidden',
  },
  inlineCalendar: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginTop: 6,
    padding: 12,
  },
  optionSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingBottom: 20,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray700,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  optionRow: {
    minHeight: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.gray700,
    fontWeight: '500',
  },
  optionCancel: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  calendarSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarNav: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    flex: 1,
    textAlign: 'center',
    textTransform: 'capitalize',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray500,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  dayCellSelected: {
    backgroundColor: COLORS.green500,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  dayTextMuted: {
    color: COLORS.gray300,
  },
  dayTextSelected: {
    color: COLORS.white,
  },
  calendarActions: {
    marginTop: 12,
  },
  clearDateButton: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    paddingVertical: 12,
  },
  clearDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green600,
  },
});