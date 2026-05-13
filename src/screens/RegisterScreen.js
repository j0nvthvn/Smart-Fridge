import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ onGoToLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (password !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    const { error } = await register(name.trim(), email.trim(), password);
    setLoading(false);
    if (error) Alert.alert('Error', error);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Feather name="thermometer" size={36} color={COLORS.white} />
            </View>
            <Text style={styles.appName}>SmartFridge</Text>
            <Text style={styles.tagline}>Crea tu cuenta gratis</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Crear cuenta</Text>

            <Text style={styles.label}>Nombre completo</Text>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={16} color={COLORS.gray500} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                placeholderTextColor={COLORS.gray500}
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={16} color={COLORS.gray500} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={COLORS.gray500}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={16} color={COLORS.gray500} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={COLORS.gray500}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={16}
                  color={COLORS.gray500}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={16} color={COLORS.gray500} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Repite tu contraseña"
                placeholderTextColor={COLORS.gray500}
                secureTextEntry={!showPassword}
                value={confirm}
                onChangeText={setConfirm}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={onGoToLogin}>
              <Text style={styles.footerLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.green500,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray700,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: 6,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 10,
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray700,
  },
  eyeBtn: {
    padding: 4,
  },
  primaryBtn: {
    backgroundColor: COLORS.green500,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    textDecorationLine: 'underline',
  },
});
