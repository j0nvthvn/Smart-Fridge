import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import SettingsRow from '../components/SettingsRow';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [daysWarning, setDaysWarning] = useState(3);

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  }

  function handleDays() {
    Alert.alert(
      'Días de aviso previo',
      'Selecciona cuántos días antes quieres recibir la alerta:',
      [1, 2, 3, 5, 7].map(d => ({
        text: `${d} día${d > 1 ? 's' : ''}`,
        onPress: () => setDaysWarning(d),
      })),
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
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
            onPress={() => Alert.alert('Próximamente', 'Edición de perfil en desarrollo.')}
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
                onValueChange={setNotifications}
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
              <TouchableOpacity onPress={handleDays} style={styles.daysChip}>
                <Text style={styles.daysChipText}>{daysWarning} días ›</Text>
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

        <Text style={styles.version}>SmartFridge v1.0.0</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0', 
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9', 
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
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2', 
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.red400, 
  },
});
