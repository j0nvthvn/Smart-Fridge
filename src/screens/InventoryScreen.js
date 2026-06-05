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
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para los menús desplegables
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const calendarDays = buildCalendarDays(calendarMonth);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;

    return products.filter(product => (
      product.name?.toLowerCase().includes(term)
      || product.category?.toLowerCase().includes(term)
      || product.barcode?.toLowerCase().includes(term)
    ));
  }, [products, query]);

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name || '',
      category: product.category || '',
      expires: product.expires || '',
      quantity: product.quantity || '',
      barcode: product.barcode || '',
    });

    const expires = product.expires ? new Date(product.expires) : new Date();
    setCalendarMonth(Number.isNaN(expires.getTime()) ? new Date() : expires);
    
    setShowCategoryPicker(false);
    setShowDatePicker(false);
  }

  function closeEdit() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaving(false);
    setShowCategoryPicker(false);
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

    if (form.expires.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.expires.trim())) {
      Alert.alert('Error', 'La fecha debe usar formato AAAA-MM-DD.');
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
                {query ? 'Sin resultados' : 'Inventario vacio'}
              </Text>
              <Text style={styles.stateText}>
                {query
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
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Leche entera 1L"
                placeholderTextColor={COLORS.gray300}
                value={form.name}
                onChangeText={value => setForm(current => ({ ...current, name: value }))}
              />
            </View>
            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Categoría</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => {
                  setShowCategoryPicker(!showCategoryPicker);
                  setShowDatePicker(false);
                }}
              >
                <Text style={[styles.selectText, !form.category && styles.placeholderText]}>
                  {form.category || 'Selecciona una categoría'}
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
                        setForm(current => ({ ...current, category }));
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={styles.optionText}>{category}</Text>
                      {form.category === category ? (
                        <Feather name="check" size={18} color={COLORS.green600} />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Fecha de vencimiento</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={[styles.selectText, !form.expires && styles.placeholderText]}>
                  {form.expires || 'Selecciona una fecha'}
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
                      const selected = form.expires === dateValue;
                      return (
                        <TouchableOpacity
                          key={dateValue}
                          style={[styles.dayCell, selected && styles.dayCellSelected]}
                          onPress={() => {
                            setForm(current => ({ ...current, expires: dateValue }));
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
                      setForm(current => ({ ...current, expires: '' }));
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.clearDateText}>Sin fecha</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Cantidad</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 1 unidad"
                placeholderTextColor={COLORS.gray300}
                value={form.quantity}
                onChangeText={value => setForm(current => ({ ...current, quantity: value }))}
              />
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Código</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 7800000000000"
                placeholderTextColor={COLORS.gray300}
                value={form.barcode}
                onChangeText={value => setForm(current => ({ ...current, barcode: value }))}
                autoCapitalize="none"
              />
            </View>

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
});