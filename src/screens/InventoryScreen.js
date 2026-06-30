import React, { useEffect, useMemo, useState } from 'react';
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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { CATEGORIES, getCategoryConfig } from '../constants/categories';
import { useInventory } from '../context/InventoryContext';
import DatePickerModal from '../components/DatePickerModal';
import { formatDisplayDate } from '../utils/date';

const EMPTY_FORM = { name: '', category: '', expires: '', quantity: '1 unidades', barcode: '' };

const QUANTITY_UNITS = ['unidades', 'paquetes', 'cajas', 'botellas', 'bolsas', 'kg', 'g', 'L', 'ml'];

function parseQuantity(quantity) {
  const [amount = '1', ...unitParts] = (quantity || '1 unidades').split(' ');
  return { amount, unit: unitParts.join(' ') || 'unidades' };
}

function buildQuantity(amount, unit) {
  return `${amount || '1'} ${unit || 'unidades'}`;
}

function getDaysUntilExpiry(product) {
  if (!product.expires) return null;
  const [year, month, day] = product.expires.split('-').map(Number);
  const expires = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expires.setHours(0, 0, 0, 0);
  return Math.ceil((expires.getTime() - today.getTime()) / 86400000);
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
  return { label: formatDisplayDate(product.expires), color: COLORS.gray700, bg: COLORS.gray100 };
}

export default function InventoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { products, loading, error, updateProduct, deleteProduct, refreshInventory } = useInventory();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortBy, setSortBy] = useState('reciente');
  const [nameError, setNameError] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const quantityParts = parseQuantity(form.quantity);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
    return ['Todos', ...cats];
  }, [products]);

  useEffect(() => {
    if (route.params?.statusFilter) {
      setStatusFilter(route.params.statusFilter);
      navigation.setParams({ statusFilter: undefined });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.statusFilter]);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    let result = products.filter(product => {
      const matchesQuery = !term
        || product.name?.toLowerCase().includes(term)
        || product.category?.toLowerCase().includes(term)
        || product.barcode?.toLowerCase().includes(term);
      const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
      let matchesStatus = true;
      if (statusFilter) {
        const days = getDaysUntilExpiry(product);
        if (statusFilter === 'vencidos') matchesStatus = days !== null && days <= 0;
        else if (statusFilter === 'por_vencer') matchesStatus = days !== null && days > 0 && days <= 5;
      }
      return matchesQuery && matchesCategory && matchesStatus;
    });

    if (sortBy === 'vencimiento') {
      result = [...result].sort((a, b) => {
        if (!a.expires && !b.expires) return 0;
        if (!a.expires) return 1;
        if (!b.expires) return -1;
        return a.expires.localeCompare(b.expires);
      });
    } else if (sortBy === 'nombre') {
      result = [...result].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
      );
    }
    return result;
  }, [products, query, activeCategory, statusFilter, sortBy]);

  function openEdit(product) {
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
    setNameError(false);
    setShowCategoryPicker(false);
    setShowUnitPicker(false);
    setShowDatePicker(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try { await refreshInventory({ showLoading: false }); }
    finally { setRefreshing(false); }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setNameError(true);
      Alert.alert('Campo requerido', 'El nombre del producto es obligatorio.');
      return;
    }
    if (form.expires && !/^\d{4}-\d{2}-\d{2}$/.test(form.expires.trim())) {
      Alert.alert('Fecha inválida', 'La fecha debe tener el formato AAAA-MM-DD.');
      return;
    }
    const amount = parseQuantity(form.quantity).amount;
    if (!amount || Number(amount) <= 0 || Number.isNaN(Number(amount))) {
      Alert.alert('Cantidad inválida', 'La cantidad debe ser un número mayor a 0.');
      return;
    }
    setSaving(true);
    try {
      await updateProduct(editing.id, form);
      closeEdit();
      Alert.alert('Inventario', 'Producto actualizado correctamente.');
    } catch (saveError) {
      setSaving(false);
      Alert.alert('Error al guardar', saveError.message || 'No se pudo actualizar el producto.');
    }
  }

  function handleDelete(product) {
    Alert.alert(
      'Eliminar producto',
      `¿Eliminar "${product.name}" del inventario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try { await deleteProduct(product.id); }
            catch (deleteError) { Alert.alert('Error', deleteError.message || 'No se pudo eliminar el producto.'); }
          },
        },
      ],
    );
  }

  function renderProduct({ item }) {
    const status = getStatus(item);
    const catCfg = getCategoryConfig(item.category);
    return (
      <View style={styles.productCard}>
        <View style={styles.productTop}>
          <View style={[styles.categoryAvatar, { backgroundColor: catCfg.bg }]}>
            <MaterialCommunityIcons name={catCfg.icon} size={20} color={catCfg.color} />
          </View>
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
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
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={16} color={COLORS.gray500} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll} contentContainerStyle={styles.categoryRow}>
        {categories.map(cat => {
          const cfg = cat === 'Todos' ? null : getCategoryConfig(cat);
          const isActive = activeCategory === cat;
          const dotColor = isActive ? COLORS.white : (cfg ? cfg.color : COLORS.gray500);
          return (
            <TouchableOpacity key={cat}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}>
              <View style={[styles.chipDot, { backgroundColor: dotColor }]} />
              <Text
                allowFontScaling={false}
                style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sort row */}
      <View style={styles.sortRow}>
        <Feather name="bar-chart-2" size={12} color={COLORS.gray500} style={{ marginRight: 6 }} />
        {[
          { key: 'reciente', label: 'Reciente' },
          { key: 'vencimiento', label: 'Por vencer' },
          { key: 'nombre', label: 'A-Z' },
        ].map(({ key, label }) => (
          <TouchableOpacity key={key}
            style={[styles.sortChip, sortBy === key && styles.sortChipActive]}
            onPress={() => setSortBy(key)}>
            <Text style={[styles.sortChipText, sortBy === key && styles.sortChipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {statusFilter && (
        <View style={styles.statusFilterBanner}>
          <TouchableOpacity
            style={[styles.statusFilterChip, {
              backgroundColor: statusFilter === 'vencidos' ? COLORS.red50 : COLORS.orange50,
            }]}
            onPress={() => setStatusFilter(null)} activeOpacity={0.7}>
            <Feather name={statusFilter === 'vencidos' ? 'alert-triangle' : 'clock'} size={12}
              color={statusFilter === 'vencidos' ? COLORS.red400 : COLORS.orange400} />
            <Text style={[styles.statusFilterText, {
              color: statusFilter === 'vencidos' ? COLORS.red400 : COLORS.orange400 }]}>
              {statusFilter === 'vencidos' ? 'Vencidos' : 'Por vencer'}
            </Text>
            <Feather name="x" size={12} color={statusFilter === 'vencidos' ? COLORS.red400 : COLORS.orange400} />
          </TouchableOpacity>
        </View>
      )}

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.green500} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="archive" size={30} color={COLORS.gray500} />
              <Text style={styles.stateTitle}>{query ? 'Sin resultados' : 'Inventario vacio'}</Text>
              <Text style={styles.stateText}>
                {query ? 'Prueba con otro nombre, categoria o codigo.' : 'Toca + para agregar tu primer producto.'}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab}
        onPress={() => navigation.navigate('Escaner', { openManual: true })} activeOpacity={0.85}>
        <Feather name="plus" size={24} color={COLORS.white} />
      </TouchableOpacity>

      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <View style={styles.optionOverlay}>
          <View style={styles.optionSheet}>
            <Text style={styles.optionTitle}>Seleccionar categoria</Text>
            {CATEGORIES.map(category => {
              const cfg = getCategoryConfig(category);
              const isSelected = form.category === category;
              return (
                <TouchableOpacity key={category}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  onPress={() => { setForm(f => ({ ...f, category })); setShowCategoryPicker(false); }}>
                  <View style={[styles.pickerCategoryIcon, { backgroundColor: cfg.bg }]}>
                    <MaterialCommunityIcons name={cfg.icon} size={18} color={cfg.color} />
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{category}</Text>
                  {isSelected ? <Feather name="check" size={18} color={COLORS.green600} /> : null}
                </TouchableOpacity>
              );
            })}
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
              <TouchableOpacity key={unit}
                style={[styles.optionRow, quantityParts.unit === unit && styles.optionRowSelected]}
                onPress={() => {
                  setForm(f => ({ ...f, quantity: buildQuantity(parseQuantity(f.quantity).amount, unit) }));
                  setShowUnitPicker(false);
                }}>
                <Text style={[styles.optionText, quantityParts.unit === unit && styles.optionTextSelected]}>{unit}</Text>
                {quantityParts.unit === unit ? <Feather name="check" size={18} color={COLORS.green600} /> : null}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.optionCancel} onPress={() => setShowUnitPicker(false)}>
              <Text style={styles.optionCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={showDatePicker}
        value={form.expires}
        onSelect={dateValue => {
          setForm(f => ({ ...f, expires: dateValue }));
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />

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
              <Text style={styles.inputLabel}>Nombre <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, nameError && styles.inputError]}
                placeholder="Ej: Leche entera 1L"
                placeholderTextColor={COLORS.gray300}
                value={form.name}
                onChangeText={v => { setNameError(false); setForm(f => ({ ...f, name: v })); }}
              />
              {nameError && <Text style={styles.errorHint}>El nombre es obligatorio.</Text>}
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Categoria</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowCategoryPicker(true)}>
                {form.category ? (
                  <View style={[styles.inlineCategoryIcon, { backgroundColor: getCategoryConfig(form.category).bg }]}>
                    <MaterialCommunityIcons name={getCategoryConfig(form.category).icon} size={15}
                      color={getCategoryConfig(form.category).color} />
                  </View>
                ) : null}
                <Text style={[styles.selectText, !form.category && styles.placeholderText]}>
                  {form.category || 'Selecciona una categoria'}
                </Text>
                <Feather name="chevron-down" size={18} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Fecha de vencimiento</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.selectText, !form.expires && styles.placeholderText]}>
                  {form.expires ? formatDisplayDate(form.expires) : 'Selecciona una fecha'}
                </Text>
                <Feather name="calendar" size={18} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Cantidad</Text>
              <View style={styles.quantityRow}>
                <TextInput
                  style={[styles.input, styles.quantityAmount]}
                  placeholder="1" placeholderTextColor={COLORS.gray300}
                  keyboardType="numeric" value={quantityParts.amount}
                  onChangeText={value => {
                    const clean = value.replace(/[^0-9.]/g, '');
                    setForm(f => ({ ...f, quantity: buildQuantity(clean, parseQuantity(f.quantity).unit) }));
                  }}
                />
                <TouchableOpacity style={styles.quantityUnit} onPress={() => setShowUnitPicker(true)}>
                  <Text style={styles.selectText}>{quantityParts.unit}</Text>
                  <Feather name="chevron-down" size={18} color={COLORS.gray500} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Codigo</Text>
              <TextInput style={styles.input} placeholder="Ej: 7800000000000"
                placeholderTextColor={COLORS.gray300} value={form.barcode}
                onChangeText={v => setForm(f => ({ ...f, barcode: v }))}
                autoCapitalize="none" keyboardType="default" />
            </View>

            <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave} disabled={saving}>
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
  safe: { flex: 1, backgroundColor: COLORS.gray50, position: 'relative' },
  fab: {
    position: 'absolute', bottom: 20, right: 20, width: 52, height: 52,
    borderRadius: 26, backgroundColor: COLORS.green500,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: COLORS.green500,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, zIndex: 10,
  },
  header: {
    backgroundColor: COLORS.green500, paddingHorizontal: 24,
    paddingTop: 24, paddingBottom: 28,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white, marginTop: 4 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray100,
    borderRadius: 14, marginHorizontal: 16, marginTop: 16, marginBottom: 10,
    paddingHorizontal: 12, height: 46, gap: 8, borderWidth: 1, borderColor: COLORS.gray200,
  },
  searchInput: { flex: 1, color: COLORS.gray700, fontSize: 14 },
  clearButton: { padding: 4 },
  sortRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6, gap: 6 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: COLORS.gray100 },
  sortChipActive: { backgroundColor: COLORS.green500 },
  sortChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
  sortChipTextActive: { color: COLORS.white },
  statusFilterBanner: { paddingHorizontal: 16, paddingBottom: 6 },
  statusFilterChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  statusFilterText: { fontSize: 12, fontWeight: '600' },
  categoryScroll: { flexGrow: 0, flexShrink: 0, height: 50 },
  categoryRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center', height: 50 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', height: 34, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray300 },
  chipDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  categoryChipActive: { backgroundColor: COLORS.green500, borderColor: COLORS.green500 },
  categoryChipText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: COLORS.gray500 },
  categoryChipTextActive: { color: COLORS.white },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyContent: { flexGrow: 1, paddingHorizontal: 16 },
  productCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.gray300 },
  productTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryAvatar: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: COLORS.gray700 },
  productMeta: { fontSize: 12, color: COLORS.gray500, marginTop: 3 },
  statusChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  productBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 },
  actions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray700, marginTop: 12, textAlign: 'center' },
  stateText: { fontSize: 13, color: COLORS.gray500, marginTop: 6, textAlign: 'center' },
  retryButton: { marginTop: 16, backgroundColor: COLORS.green500, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: COLORS.white, fontWeight: '700' },
  modalSafe: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(15,23,42,0.08)' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.gray700 },
  modalScroll: { flex: 1, paddingTop: 8 },
  fieldWrapper: { paddingHorizontal: 20, paddingTop: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 10, backgroundColor: COLORS.gray50, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.gray700 },
  inputError: { borderColor: COLORS.red400, backgroundColor: COLORS.red50 },
  required: { color: COLORS.red400 },
  errorHint: { fontSize: 12, color: COLORS.red400, marginTop: 4, marginLeft: 2 },
  saveButton: { backgroundColor: COLORS.green500, borderRadius: 16, marginHorizontal: 20, marginTop: 24, paddingVertical: 16, alignItems: 'center' },
  disabledButton: { opacity: 0.65 },
  saveText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  selectInput: { minHeight: 46, borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 10, backgroundColor: COLORS.gray50, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectText: { flex: 1, fontSize: 14, color: COLORS.gray700, fontWeight: '500' },
  placeholderText: { color: COLORS.gray400, fontWeight: '400' },
  inlineCategoryIcon: { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  quantityRow: { flexDirection: 'row', gap: 10 },
  quantityAmount: { width: 92 },
  quantityUnit: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 10, backgroundColor: COLORS.gray50, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-end' },
  optionSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 18, paddingBottom: 20 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray700, paddingHorizontal: 20, paddingBottom: 10 },
  pickerCategoryIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optionRow: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  optionRowSelected: { backgroundColor: COLORS.green50 },
  optionText: { flex: 1, fontSize: 14, color: COLORS.gray700, fontWeight: '500' },
  optionTextSelected: { color: COLORS.green600, fontWeight: '700' },
  optionCancel: { marginHorizontal: 20, marginTop: 14, borderRadius: 12, backgroundColor: COLORS.gray100, alignItems: 'center', paddingVertical: 12 },
  optionCancelText: { fontSize: 14, fontWeight: '700', color: COLORS.gray700 },
});
