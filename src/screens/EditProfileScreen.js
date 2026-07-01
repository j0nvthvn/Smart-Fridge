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
import { useToast } from '../context/ToastContext';

export default function EditProfileScreen({ onClose }) {
  const { user, updateProfile } = useAuth();
  const showToast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    const { error } = await updateProfile(name);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    showToast('Tus datos se guardaron correctamente.');
    onClose();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={COLORS.gray700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name ? name.slice(0, 2).toUpperCase() : '??'}
            </Text>
          </View>

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
          <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
            <Feather name="mail" size={16} color={COLORS.gray400} style={styles.inputIcon} />
            <Text style={styles.disabledText}>{user?.email ?? ''}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.green50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: COLORS.green100,
    marginBottom: 24,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.green600,
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
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    height: 46,
  },
  inputWrapperDisabled: {
    backgroundColor: COLORS.gray100,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray700,
  },
  disabledText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray500,
  },
  primaryBtn: {
    backgroundColor: COLORS.green500,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
