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

// Constantes traídas de ScannerScreen para mantener la consistencia
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
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const result = [];
  for (let i = 0; i < blanks; i++) {
    result.push({ key: `blank-${i}`, disabled: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    result.push({ key: `day-${d}`, day: d, dateStr: `${year}-${`${month + 1}`.padStart(2, '0')}-${`${d}`.padStart(2, '0')}` });
  }
  return result;
}

function getStatus(product) {
  if (!product.expires) {
    return { label: 'Sin fecha', color: COLORS.gray500, bg: COLORS.gray100 };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(product.expires)) {
    return { label: 'Fecha inválida', color: COLORS.red400, bg: COLORS.red50 };
  }

  const [year, month, day] = product.expires.split('-').map(Number);
  const expires = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expires.setHours(0, 0, 0, 0);

  const days = Math.ceil((expires.getTime() - today.getTime()) / 86400000);

  if (days < 0) return { label: 'Vencido', color: COLORS.red400, bg: COLORS.red50 };
  if (days === 0) return { label: 'Hoy', color: COLORS.red400, bg: COLORS.red50 };
  if (days <= 2) return { label: `${days} días`, color: COLORS.orange400, bg: COLORS.orange50 };
  if (days <= 5) return { label: `${days} días`, color: COLORS.green600, bg: COLORS.green50 };

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

  // Estados para los menús desplegables controlados
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    // Resetear el mes del calendario al abrir basado en el producto o mes actual
    if (product.expires && /^\d{4}-\d{2}-\d{2}$/.test(product.expires)) {
      const [y, m] = product.expires.split('-').map(Number);
      setCurrentMonth(new Date(y, m - 1, 1));
    } else {
      setCurrentMonth(new Date());
    }
  }

  function closeEdit() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaving(false);
    setShowCategoryMenu(false);
    setShowCalendarMenu(false);
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
      Alert.alert('Campos Obligatorios', 'Por favor ingresa el nombre del producto.');
      return;
    }

    setSaving(true);
    try {
      await updateProduct(editing.id, {
        ...form,
        expires: form.expires.trim() || null
      });
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

  // Funciones de navegación del calendario personalizado
  function changeMonth(direction) {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
    setCurrentMonth(next);
  }

  function renderProduct({ item }) {
    const status = getStatus(item);

    return (
      <View style={styles.productCard}>
        <View style={styles.productTop}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productMeta} numberOfLines={1}>
              {item.category || 'Sin categoría'} · {item.quantity || '1 unidad'}
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
              {item.barcode || 'Sin código'}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => openEdit(item)}>
              <Feather name="edit-2" size={15} color={COLORS.green600} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item)}>
              <Feather name="trash-2" size={15} color={COLORS.red400} />
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
          placeholder="Buscar producto, categoría o código"
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
                {query ? 'Sin resultados' : 'Inventario vacío'}
              </Text>
              <Text style={styles.stateText}>
                {query
                  ? 'Prueba con otro nombre, categoría o código.'
                  : 'Agrega productos desde la pestaña Escáner.'}
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL CON SELECTORES DESPLEGABLES NATIVOS */}
      <Modal visible={!!editing} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Editar Producto</Text>
              <Text style={styles.modalSubTitle}>Modifica las propiedades del artículo</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseCircle} onPress={closeEdit}>
              <Feather name="x" size={18} color={COLORS.gray700} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            
            {/* Input: Nombre */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Nombre del artículo</Text>
              <View style={styles.inputContainer}>
                <Feather name="shopping-bag" size={16} color={COLORS.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Leche entera 1L"
                  placeholderTextColor={COLORS.gray400}
                  value={form.name}
                  onChangeText={value => setForm(current => ({ ...current, name: value }))}
                />
              </View>
            </View>

            {/* Selector Desplegable: Categoría */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Categoría</Text>
              <TouchableOpacity 
                style={styles.inputContainer} 
                onPress={() => {
                  setShowCategoryMenu(!showCategoryMenu);
                  setShowCalendarMenu(false);
                }}
              >
                <Feather name="tag" size={16} color={COLORS.gray400} style={styles.inputIcon} />
                <Text style={[styles.inputTextValue, !form.category && { color: COLORS.gray400 }]}>
                  {form.category || 'Selecciona una categoría'}
                </Text>
                <Feather 
                  name={showCategoryMenu ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={COLORS.gray500} 
                  style={{ marginRight: 14 }} 
                />
              </TouchableOpacity>

              {showCategoryMenu && (
                <View style={styles.dropdownMenu}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity 
                      key={cat} 
                      style={[styles.dropdownItem, form.category === cat && styles.dropdownItemSelected]}
                      onPress={() => {
                        setForm(current => ({ ...current, category: cat }));
                        setShowCategoryMenu(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, form.category === cat && styles.dropdownItemTextSelected]}>
                        {cat}
                      </Text>
                      {form.category === cat && <Feather name="check" size={14} color={COLORS.green600} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Selector Desplegable: Calendario de Vencimiento */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Fecha de vencimiento</Text>
              <TouchableOpacity 
                style={styles.inputContainer} 
                onPress={() => {
                  setShowCalendarMenu(!showCalendarMenu);
                  setShowCategoryMenu(false);
                }}
              >
                <Feather name="calendar" size={16} color={COLORS.gray400} style={styles.inputIcon} />
                <Text style={[styles.inputTextValue, !form.expires && { color: COLORS.gray400 }]}>
                  {form.expires || 'Selecciona una fecha'}
                </Text>
                <Feather 
                  name={showCalendarMenu ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={COLORS.gray500} 
                  style={{ marginRight: 14 }} 
                />
              </TouchableOpacity>

              {showCalendarMenu && (
                <View style={styles.calendarContainer}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity style={styles.calendarNav} onPress={() => changeMonth(-1)}>
                      <Feather name="chevron-left" size={16} color={COLORS.gray700} />
                    </TouchableOpacity>
                    <Text style={styles.calendarTitle}>{formatMonthLabel(currentMonth)}</Text>
                    <TouchableOpacity style={styles.calendarNav} onPress={() => changeMonth(1)}>
                      <Feather name="chevron-right" size={16} color={COLORS.gray700} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.weekRow}>
                    {WEEKDAYS.map((w, i) => (
                      <Text key={i} style={styles.weekDay}>{w}</Text>
                    ))}
                  </View>

                  <View style={styles.daysGrid}>
                    {buildCalendarDays(currentMonth).map((cell) => {
                      if (cell.disabled) {
                        return <View key={cell.key} style={styles.dayCell} />;
                      }
                      const isSelected = form.expires === cell.dateStr;
                      return (
                        <TouchableOpacity
                          key={cell.key}
                          style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                          onPress={() => {
                            setForm(current => ({ ...current, expires: cell.dateStr }));
                            setShowCalendarMenu(false);
                          }}
                        >
                          <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                            {cell.day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.clearDateOption} 
                    onPress={() => {
                      setForm(current => ({ ...current, expires: '' }));
                      setShowCalendarMenu(false);
                    }}
                  >
                    <Text style={styles.clearDateText}>Quitar fecha de vencimiento</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Input: Cantidad */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Cantidad disponible</Text>
              <View style={styles.inputContainer}>
                <Feather name="box" size={16} color={COLORS.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 3 unidades"
                  placeholderTextColor={COLORS.gray400}
                  value={form.quantity}
                  onChangeText={value => setForm(current => ({ ...current, quantity: value }))}
                />
              </View>
            </View>

            {/* Input: Código de barras */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Código de barras (SKU / EAN)</Text>
              <View style={styles.inputContainer}>
                <Feather name="bar-chart-2" size={16} color={COLORS.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 7800000000000"
                  placeholderTextColor={COLORS.gray400}
                  value={form.barcode}
                  onChangeText={value => setForm(current => ({ ...current, barcode: value }))}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? 'Guardando cambios...' : 'Guardar cambios'}</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
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
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  modalSubTitle: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
  modalCloseCircle: {
    backgroundColor: COLORS.gray100,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  fieldWrapper: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: 6,
    paddingLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    height: 48,
    justifyContent: 'space-between',
  },
  inputTextValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray700,
  },
  inputIcon: {
    paddingLeft: 14,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: COLORS.gray700,
    paddingRight: 14,
  },
  dropdownMenu: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.green50 / 2,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.gray700,
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: COLORS.green600,
  },
  calendarContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarNav: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    flex: 1,
    textAlign: 'center',
    textTransform: 'capitalize',
    fontSize: 15,
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
    borderRadius: 10,
  },
  dayCellSelected: {
    backgroundColor: COLORS.green500,
  },
  dayText: {
    fontSize: 14,
    color: COLORS.gray700,
  },
  dayTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  clearDateOption: {
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    alignItems: 'center',
  },
  clearDateText: {
    fontSize: 13,
    color: COLORS.red400,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: COLORS.green500,
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 32,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.green500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
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