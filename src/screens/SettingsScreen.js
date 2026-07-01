import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import SettingsRow from '../components/SettingsRow';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import EditProfileScreen from './EditProfileScreen';
import { CHEF_MODEL_OPTIONS, DEFAULT_MODEL, loadChefModel, saveChefModel, testChefConnection } from '../services/chefService';
import { sendTestNotification } from '../services/notificationService';

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { notificationSettings, updateNotificationSettings, addProduct } = useInventory();
  const showToast = useToast();
  const [editingProfile, setEditingProfile] = useState(false);
  const [chefModel, setChefModel] = useState(DEFAULT_MODEL);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showDaysPicker, setShowDaysPicker] = useState(false);
  const [showTestTools, setShowTestTools] = useState(false);

  const notifications = notificationSettings?.enabled ?? true;
  const daysWarning = notificationSettings?.daysWarning ?? 3;

  useEffect(() => {
    loadChefModel().then(setChefModel);
  }, []);

  if (editingProfile) {
    return <EditProfileScreen onClose={() => setEditingProfile(false)} />;
  }

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  }

  function selectDaysWarning(d) {
    updateNotificationSettings({ daysWarning: d });
    setShowDaysPicker(false);
  }

  async function handleTestNotification() {
    const result = await sendTestNotification();
    if (result.ok) {
      showToast('Notificación de prueba enviada.');
    } else if (result.reason === 'web') {
      Alert.alert('No disponible', 'Las notificaciones de prueba solo funcionan en el dispositivo (Android/iOS), no en la versión web.');
    } else {
      Alert.alert('Permiso denegado', 'Activa los permisos de notificaciones para este dispositivo en los ajustes del sistema.');
    }
  }

  function selectChefModel(id) {
    setChefModel(id);
    saveChefModel(id);
    setShowModelPicker(false);
    const label = CHEF_MODEL_OPTIONS.find(m => m.id === id)?.label ?? id;
    showToast(`Modelo actualizado: ${label}`);
  }

  async function handleTestExpiredProduct() {
    try {
      await addProduct({
        name: 'Producto de prueba',
        category: 'Otros',
        expires: yesterdayISO(),
        quantity: '1 unidad',
      });
      showToast('Producto de prueba creado (vencido ayer).');
    } catch (err) {
      Alert.alert('Error', err.message ?? 'No se pudo crear el producto de prueba.');
    }
  }

  async function handleTestChefConnection() {
    const result = await testChefConnection();
    if (result.ok) {
      showToast(result.message);
    } else {
      Alert.alert('Error de conexión', result.message);
    }
  }

  const chefModelLabel = CHEF_MODEL_OPTIONS.find(m => m.id === chefModel)?.label ?? chefModel;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : '??'}
            </Text>
          </View>
          <Text style ={styles.userName}>{user?.name ?? ''}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        </View>

        {/* Cuenta */}
        <View style={styles.card}>
          <SettingsRow
            icon="user"
            iconBg={COLORS.green50}
            iconColor={COLORS.green600}
            label="Editar perfil"
            right={<Feather name="chevron-right" size={16} color={COLORS.gray300} />}
            onPress={() => setEditingProfile(true)}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="lock"
            iconBg={COLORS.blue50}
            iconColor={COLORS.blue700}
            label="Cambiar contraseña"
            right={<Feather name="chevron-right" size={16} color={COLORS.gray300} />}
            onPress={() => Alert.alert('Próximamente', 'Cambio de contraseña en desarrollo.')}
          />
        </View>

        {/* Preferencias */}
        <Text style={styles.sectionLabel}>Preferencias</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="bell"
            iconBg={COLORS.green50}
            iconColor={COLORS.green600}
            label="Notificaciones"
            right={
              <Switch
                value={notifications}
                onValueChange={value => updateNotificationSettings({ enabled: value })}
                trackColor={{ false: COLORS.gray300, true: COLORS.green500 }}
                thumbColor={COLORS.white}
              />
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="clock"
            iconBg={COLORS.orange50}
            iconColor={COLORS.orange600}
            label="Días de aviso previo"
            right={
              <TouchableOpacity onPress={() => setShowDaysPicker(true)} style={styles.daysChip}>
                <Text style={styles.daysChipText}>{daysWarning} días ›</Text>
              </TouchableOpacity>
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="cpu"
            iconBg={COLORS.orange50}
            iconColor={COLORS.orange600}
            label="Modelo del Chef IA"
            right={
              <TouchableOpacity onPress={() => setShowModelPicker(true)} style={styles.daysChip}>
                <Text style={styles.daysChipText} numberOfLines={1}>{chefModelLabel} ›</Text>
              </TouchableOpacity>
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="moon"
            iconBg={COLORS.blue50}
            iconColor={COLORS.blue700}
            label="Modo oscuro"
            right={
              <Text style={styles.comingSoonText}>Próximamente</Text>
            }
          />
        </View>

        {/* Sesión */}
        <Text style={styles.sectionLabel}>Sesión</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="log-out"
            iconBg={COLORS.red50}
            iconColor={COLORS.red400}
            label="Cerrar sesión"
            labelColor={COLORS.red400}
            right={<Feather name="chevron-right" size={16} color={COLORS.gray300} />}
            onPress={handleLogout}
          />
        </View>

        {/* Herramientas de prueba (oculto) */}
        <TouchableOpacity
          style={styles.testToolsToggle}
          onPress={() => setShowTestTools(v => !v)}
          activeOpacity={0.6}
        >
          <Feather name="tool" size={12} color={COLORS.gray400} />
          <Text style={styles.testToolsToggleText}>Herramientas de prueba</Text>
          <Feather name={showTestTools ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.gray400} />
        </TouchableOpacity>

        {showTestTools && (
          <View style={[styles.card, { marginTop: 4 }]}>
            <SettingsRow
              icon="send"
              iconBg={COLORS.gray100}
              iconColor={COLORS.gray500}
              label="Probar notificación"
              right={<Feather name="chevron-right" size={16} color={COLORS.gray300} />}
              onPress={handleTestNotification}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="alert-triangle"
              iconBg={COLORS.gray100}
              iconColor={COLORS.gray500}
              label="Crear producto vencido de prueba"
              right={<Feather name="chevron-right" size={16} color={COLORS.gray300} />}
              onPress={handleTestExpiredProduct}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="wifi"
              iconBg={COLORS.gray100}
              iconColor={COLORS.gray500}
              label="Probar conexión Chef IA"
              right={<Feather name="chevron-right" size={16} color={COLORS.gray300} />}
              onPress={handleTestChefConnection}
            />
          </View>
        )}

        <Text style={styles.version}>SmartFridge v1.0.0</Text>
        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={showModelPicker} transparent animationType="fade" onRequestClose={() => setShowModelPicker(false)}>
        <View style={styles.optionOverlay}>
          <View style={styles.optionSheet}>
            <Text style={styles.optionTitle}>Modelo del Chef IA</Text>
            {CHEF_MODEL_OPTIONS.map(({ id, label }) => {
              const isSelected = chefModel === id;
              return (
                <TouchableOpacity key={id}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  onPress={() => selectChefModel(id)}>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{label}</Text>
                  {isSelected ? <Feather name="check" size={18} color={COLORS.green600} /> : null}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.optionCancel} onPress={() => setShowModelPicker(false)}>
              <Text style={styles.optionCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showDaysPicker} transparent animationType="fade" onRequestClose={() => setShowDaysPicker(false)}>
        <View style={styles.optionOverlay}>
          <View style={styles.optionSheet}>
            <Text style={styles.optionTitle}>Días de aviso previo</Text>
            {[1, 2, 3, 5, 7].map(d => {
              const isSelected = daysWarning === d;
              return (
                <TouchableOpacity key={d}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  onPress={() => selectDaysWarning(d)}>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {d} día{d > 1 ? 's' : ''} antes
                  </Text>
                  {isSelected ? <Feather name="check" size={18} color={COLORS.green600} /> : null}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.optionCancel} onPress={() => setShowDaysPicker(false)}>
              <Text style={styles.optionCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.gray50
  },
  profileHeader: {
    backgroundColor: COLORS.green500,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40, 
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  avatarText: { 
    fontSize: 26, 
    fontWeight: '700', 
    color: COLORS.white 
  },
  userName: { 
    fontSize: 19, 
    fontWeight: '700', 
    color: COLORS.white 
  },
  userEmail: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 4 
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray400,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1, 
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    marginLeft: 58,
  },
  daysChip: {
    backgroundColor: COLORS.gray100,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  daysChipText: {
    fontSize: 12,
    color: COLORS.gray700,
    fontWeight: '600',
  },
  comingSoonText: {
    fontSize: 11,
    color: COLORS.gray400,
    fontStyle: 'italic',
  },
  version: {
    textAlign: 'center',
    marginTop: 28,
    fontSize: 12,
    color: COLORS.gray500,
  },
  testToolsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    paddingVertical: 8,
  },
  testToolsToggleText: {
    fontSize: 11,
    color: COLORS.gray400,
    fontWeight: '600',
  },
  optionOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-end' },
  optionSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 18, paddingBottom: 20 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray700, paddingHorizontal: 20, paddingBottom: 10 },
  optionRow: { minHeight: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  optionRowSelected: { backgroundColor: COLORS.green50 },
  optionText: { flex: 1, fontSize: 14, color: COLORS.gray700, fontWeight: '500' },
  optionTextSelected: { color: COLORS.green600, fontWeight: '700' },
  optionCancel: { marginHorizontal: 20, marginTop: 14, borderRadius: 12, backgroundColor: COLORS.gray100, alignItems: 'center', paddingVertical: 12 },
  optionCancelText: { fontSize: 14, fontWeight: '700', color: COLORS.gray700 },
});
