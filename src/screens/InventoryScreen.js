import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useInventory } from '../context/InventoryContext';

const EMPTY_FORM = { name: '', category: '', expires: '', quantity: '', barcode: '' };
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

function getStatus(product) {
  if (!product.expires) {
    return { label: 'Sin fecha', color: COLORS.gray500, bg: COLORS.gray100 };
  }

  const [year, month, day] = product.expires.split('-').map(Number);
  const expires = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expires.setHours(0, 0, 0, 0);

  const days = Math.ceil((expires.getTime() - today.getTime()) / 86400000);

  if (days < 0) return { label: 'Vencido', color: COLORS.red400, bg: COLORS.red50 };
  if (days === 0) return { label: 'Hoy', color: COLORS.red400, bg: COLORS.red50 };
  if (days <= 2) return { label: `${days} dias`, color: COLORS.orange400, bg: COLORS.orange50 };
  if (days <= 5) return { label: `${days} dias`, color: COLORS.green600, bg: COLORS.green50 };

  return { label: product.expires, color: COLORS.gray700, bg: COLORS.gray100 };
}

export default function InventoryScreen() {
  const {
    products,
    loading,
    error,
    updateProduct,
    deleteProduct,
    refreshInventory,
  } = useInventory();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const quantityParts = parseQuantity(form.quantity);
  const calendarDays = buildCalendarDays(calendarMonth);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter(product => {
      const matchesQuery = !term || (
        product.name?.toLowerCase().includes(term)
        || product.category?.toLowerCase().includes(term)
        || product.barcode?.toLowerCase().includes(term)
      );
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, selectedCategory]);

  function openEdit(product) {
    const expires = product.expires ? new Date(product.expires) : new Date();
    setCalendarMonth(Number.isNaN(expires.getTime()) ? new Date() : expires);
    setEditing(product);
    setForm({
      name: product.name || '',
      category: product.category || '',
      expires: product.expires || '',
      quantity: product.quantity || '1 unidades',
      barcode: product.barcode || '',
    });
  }

  function closeEdit() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaving(false);
    setShowCategoryPicker(false);
    setShowUnitPicker(false);
    setShowDatePicker(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshInventory({ showLoading: false });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      Alert.alert('Error', 'El nombre del producto es obligatorio.');
      return;
    }

    setSaving(true);

    try {
      await updateProduct(editing.id, form);
      closeEdit();
      Alert.alert('Inventario', 'Producto actualizado correctamente.');
    } catch (saveError) {
      setSaving(false);
      Alert.alert('Error', saveError.message || 'No se pudo actualizar el producto.');
    }
  }

  function handleDelete(product) {
    Alert.alert(
      'Eliminar producto',
      `¿Eliminar "${product.name}" del inventario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
            } catch (deleteError) {
              Alert.alert('Error', deleteError.message || 'No se pudo eliminar el producto.');
            }
          },
        },
      ],
    );
  }

  function renderProduct({ item }) {
    const status = getStatus(item);

    return (
      <View style={styles.productCard}>
        <View style={styles.productTop}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productMeta} numberOfLines={1}>
              {item.category || 'Sin categoria'} · {item.quantity || '1 unidad'}
            </Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.productBottom}>
          <View style={styles.barcodeRow}>
            <Feather name="hash" size={13} color={COLORS.gray500} />
            <Text style={styles.barcodeText} numberOfLines={1}>
              {item.barcode || 'Sin codigo'}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => openEdit(item)}>
              <Feather name="edit-2" size={16} color={COLORS.green600} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item)}>
              <Feather name="trash-2" size={16} color={COLORS.red400} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>Productos guardados</Text>
        <Text style={styles.headerTitle}>Inventario</Text>
      </View>

      <View style={styles.searchWrapper}>
        <Feather name="search" size={16} color={COLORS.gray500} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto, categoria o codigo"
          placeholderTextColor={COLORS.gray500}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
            <Feather name="x" size={16} color={COLORS.gray500} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedCategory && styles.chipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>Todos</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, selectedCategory === cat && styles.chipActive]}
            onPress={() => setSelectedCategory(prev => prev === cat ? null : cat)}
          >
            <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.green500} />
          <Text style={styles.stateText}>Cargando inventario</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Feather name="alert-circle" size={28} color={COLORS.red400} />
          <Text style={styles.stateTitle}>No se pudo cargar</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refreshInventory()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          contentContainerStyle={filteredProducts.length ? styles.listContent : styles.emptyContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.green500}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="archive" size={30} color={COLORS.gray500} />
              <Text style={styles.stateTitle}>
                {query || selectedCategory ? 'Sin resultados' : 'Inventario vacio'}
              </Text>
              <Text style={styles.stateText}>
                {query || selectedCategory
                  ? 'Prueba con otro nombre, categoria o codigo.'
                  : 'Agrega productos desde la pestaña Escaner.'}
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={!!editing} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar producto</Text>
            <TouchableOpacity onPress={closeEdit}>
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
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
              />
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Categoría</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowCategoryPicker(true)}>
                <Text style={[styles.selectText, !form.category && styles.placeholderText]}>
                  {form.category || 'Selecciona una categoría'}
                </Text>
                <Feather name="chevron-down" size={18} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Fecha de vencimiento</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.selectText, !form.expires && styles.placeholderText]}>
                  {form.expires || 'Selecciona una fecha'}
                </Text>
                <Feather name="calendar" size={18} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>

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
                    setForm(f => ({
                      ...f,
                      quantity: buildQuantity(cleanValue, parseQuantity(f.quantity).unit),
                    }));
                  }}
                />
                <TouchableOpacity style={styles.quantityUnit} onPress={() => setShowUnitPicker(true)}>
                  <Text style={styles.selectText}>{quantityParts.unit}</Text>
                  <Feather name="chevron-down" size={18} color={COLORS.gray500} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Código</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 7800000000000"
                placeholderTextColor={COLORS.gray300}
                keyboardType="default"
                value={form.barcode}
                onChangeText={v => setForm(f => ({ ...f, barcode: v }))}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.helpText}>La fecha se guarda en formato AAAA-MM-DD para activar alertas de vencimiento.</Text>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <View style={styles.optionOverlay}>
          <View style={styles.optionSheet}>
            <Text style={styles.optionTitle}>Seleccionar categoría</Text>
            {CATEGORIES.map(category => (
              <TouchableOpacity
                key={category}
                style={styles.optionRow}
                onPress={() => {
                  setForm(f => ({ ...f, category }));
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={styles.optionText}>{category}</Text>
                {form.category === category ? (
                  <Feather name="check" size={18} color={COLORS.green600} />
                ) : null}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.optionCancel} onPress={() => setShowCategoryPicker(false)}>
              <Text style={styles.optionCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showUnitPicker} transparent animationType="fade">
        <View style={styles.optionOverlay}>
          <View style={styles.optionSheet}>
            <Text style={styles.optionTitle}>Tipo de cantidad</Text>
            {QUANTITY_UNITS.map(unit => (
              <TouchableOpacity
                key={unit}
                style={styles.optionRow}
                onPress={() => {
                  setForm(f => ({
                    ...f,
                    quantity: buildQuantity(parseQuantity(f.quantity).amount, unit),
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
            <TouchableOpacity style={styles.optionCancel} onPress={() => setShowUnitPicker(false)}>
              <Text style={styles.optionCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.optionOverlay}>
          <View style={styles.calendarSheet}>
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
                const selected = form.expires === dateValue;

                return (
                  <TouchableOpacity
                    key={dateValue}
                    style={[styles.dayCell, selected && styles.dayCellSelected]}
                    onPress={() => {
                      setForm(f => ({ ...f, expires: dateValue }));
                      setShowDatePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !inCurrentMonth && styles.dayTextMuted,
                        selected && styles.dayTextSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => {
                  setForm(f => ({ ...f, expires: '' }));
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.clearDateText}>Sin fecha</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionCancel} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.optionCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  searchInput: {
    flex: 1,
    color: COLORS.gray700,
    fontSize: 14,
  },
  clearButton: {
    padding: 4,
  },
  chipsScroll: {
    flexGrow: 0,
    marginBottom: 6,
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  chipActive: {
    backgroundColor: COLORS.green500,
    borderColor: COLORS.green500,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  productTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  productMeta: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 3,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  barcodeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  barcodeText: {
    flex: 1,
    color: COLORS.gray500,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray700,
    marginTop: 12,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 13,
    color: COLORS.gray500,
    marginTop: 6,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: COLORS.green500,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '700',
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
  saveButton: {
    backgroundColor: COLORS.green500,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
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