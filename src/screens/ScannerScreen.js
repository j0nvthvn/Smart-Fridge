import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import SectionHeader from '../components/SectionHeader';

const LAST_SCANNED = {
  name: 'Leche Colun 1L',
  category: 'Lácteos',
  expires: '14 Abr 2026',
  quantity: '1 unidad',
};

export default function ScannerScreen() {
  const [showManual, setShowManual] = useState(false);
  const [product, setProduct] = useState({ name: '', category: '', expires: '', quantity: '' });

  function handleSave() {
    Alert.alert('¡Guardado!', 'Producto agregado al inventario.', [
      { text: 'OK', onPress: () => setShowManual(false) },
    ]);
    setProduct({ name: '', category: '', expires: '', quantity: '' });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>Agregar producto</Text>
          <Text style={styles.headerTitle}>Escanear código de barras</Text>
        </View>

        {/* Scanner viewfinder */}
        <View style={styles.scannerBox}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <Feather name="camera" size={36} color="rgba(255,255,255,0.3)" />
          <Text style={styles.scanHint}>Apunta al código de barras</Text>

          {/* Activar cámara real */}
          <TouchableOpacity
            style={styles.activateBtn}
            onPress={() => Alert.alert('Cámara', 'Integra expo-camera para activar el escáner real.')}
          >
            <Text style={styles.activateBtnText}>Activar cámara</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>o ingresa manualmente</Text>

        <TouchableOpacity style={styles.manualBtn} onPress={() => setShowManual(true)}>
          <Feather name="plus" size={16} color={COLORS.white} />
          <Text style={styles.manualBtnText}>Ingresar producto manual</Text>
        </TouchableOpacity>

        {/* Último escaneado */}
        <SectionHeader icon="clock" title="Último escaneado" />

        <View style={styles.formCard}>
          {[
            { label: 'Producto',  value: LAST_SCANNED.name,     color: COLORS.gray700  },
            { label: 'Categoría', value: LAST_SCANNED.category, color: COLORS.gray700  },
            { label: 'Vence',     value: LAST_SCANNED.expires,  color: COLORS.orange400},
            { label: 'Cantidad',  value: LAST_SCANNED.quantity,  color: COLORS.gray700  },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.formRow, i < arr.length - 1 && styles.formRowBorder]}>
              <Text style={styles.formLabel}>{row.label}</Text>
              <Text style={[styles.formValue, { color: row.color }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Guardar en inventario</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Modal ingreso manual */}
      <Modal visible={showManual} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ingresar producto</Text>
            <TouchableOpacity onPress={() => setShowManual(false)}>
              <Feather name="x" size={22} color={COLORS.gray700} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {[
              { label: 'Nombre del producto', key: 'name',     placeholder: 'Ej: Leche entera 1L' },
              { label: 'Categoría',           key: 'category', placeholder: 'Ej: Lácteos'         },
              { label: 'Fecha de vencimiento',key: 'expires',  placeholder: 'Ej: 30 Abr 2026'     },
              { label: 'Cantidad',            key: 'quantity', placeholder: 'Ej: 1 unidad'         },
            ].map(field => (
              <View key={field.key} style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.gray300}
                  value={product[field.key]}
                  onChangeText={v => setProduct(p => ({ ...p, [field.key]: v }))}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Guardar producto</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray50 },
  header: {
    backgroundColor: COLORS.green500,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.white },
  scannerBox: {
    backgroundColor: COLORS.gray700,
    margin: 16,
    borderRadius: 16,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: COLORS.green400,
    borderStyle: 'solid',
  },
  cornerTL: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  scanHint: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  activateBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(44,164,86,0.85)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activateBtnText: { fontSize: 12, color: COLORS.white, fontWeight: '500' },
  orText: { textAlign: 'center', fontSize: 11, color: COLORS.gray500, marginBottom: 12 },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.green500,
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 13,
  },
  manualBtnText: { fontSize: 14, fontWeight: '500', color: COLORS.white },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: COLORS.gray300,
    overflow: 'hidden',
  },
  formRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  formRowBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.gray100 },
  formLabel: { width: 90, fontSize: 12, color: COLORS.gray500 },
  formValue: { fontSize: 13, fontWeight: '500' },
  saveBtn: {
    backgroundColor: COLORS.green500,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '500', color: COLORS.white },
  modalSafe: { flex: 1, backgroundColor: COLORS.white },
  modalScroll: { padding: 16 },
  fieldWrapper: { marginBottom: 16 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: COLORS.gray700 },
  inputLabel: { fontSize: 12, color: COLORS.gray500, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.gray50,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: COLORS.gray300,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.gray700,
  },
});
