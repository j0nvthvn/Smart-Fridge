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
  const [darkMode, setDarkMode] = useState(false);
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
          <Text style={styles.userName}>{user?.name ?? ''}</Text>
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
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: COLORS.gray300, true: COLORS.green500 }}
                thumbColor={COLORS.white}
              />
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
  safe: { flex: 1, backgroundColor: COLORS.gray50 },
  profileHeader: {
    backgroundColor: COLORS.green500,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 32,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  avatarText: { fontSize: 24, fontWeight: '600', color: COLORS.white },
  userName: { fontSize: 17, fontWeight: '600', color: COLORS.white },
  userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: COLORS.gray200,
    overflow: 'hidden',
  },
  divider: {
    height: 0.5,
    backgroundColor: COLORS.gray100,
    marginLeft: 58,
  },
  daysChip: { paddingHorizontal: 4 },
  daysChipText: { fontSize: 13, color: COLORS.green500, fontWeight: '500' },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.gray300,
    marginTop: 24,
  },
});
