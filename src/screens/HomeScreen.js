import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import SectionHeader from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';

const ALERT_STYLES = {
  expired: { border: COLORS.red400,    tag: 'Vencido', tagBg: COLORS.red50,    tagColor: COLORS.red400    },
  urgent:  { border: COLORS.red400,    tag: 'Urgente', tagBg: COLORS.red50,    tagColor: COLORS.red400    },
  soon:    { border: COLORS.orange400, tag: 'Pronto',  tagBg: COLORS.orange50, tagColor: COLORS.orange400 },
  ok:      { border: COLORS.yellow400, tag: 'OK',      tagBg: COLORS.green50,  tagColor: COLORS.green600  },
};

const SUMMARY_CARDS = [
  { icon: 'package',        key: 'total',        label: 'productos', color: COLORS.green600  },
  { icon: 'clock',          key: 'expiringSoon',  label: 'por vencer', color: COLORS.orange400 },
  { icon: 'alert-triangle', key: 'expired',       label: 'vencidos',  color: COLORS.red400    },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { loading, error, summary } = useInventory();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>¡Hola de nuevo!</Text>
          <Text style={styles.name}>{user?.name ?? ''}</Text>
          <Text style={styles.subtitle}>{
            loading
              ? 'Cargando inventario…'
              : summary.expired > 0
                ? `${summary.expired} producto${summary.expired > 1 ? 's' : ''} vencido${summary.expired > 1 ? 's' : ''} · revisa tu inventario`
                : summary.expiringSoon > 0
                  ? `${summary.expiringSoon} producto${summary.expiringSoon > 1 ? 's' : ''} por vencer pronto`
                  : '¡Todo en orden! Sin alertas pendientes'
          }</Text>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          {SUMMARY_CARDS.map(({ icon, key, label, color }) => {
            const statusParam = key === 'expired' ? 'vencidos' : key === 'expiringSoon' ? 'por_vencer' : null;
            return (
              <TouchableOpacity
                key={key}
                style={styles.summaryCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Inventario', statusParam ? { statusFilter: statusParam } : {})}
              >
                <Feather name={icon} size={18} color={color} style={styles.summaryIcon} />
                <Text style={[styles.summaryNum, { color }]}>{summary[key]}</Text>
                <Text style={styles.summaryLabel}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Alerts */}
        <SectionHeader icon="alert-circle" title="Alertas de vencimiento" />

        {loading ? (
          <View style={styles.alertCard}>
            <View style={[styles.alertBorder, { backgroundColor: COLORS.gray400 }]} />
            <View style={styles.alertInfo}>
              <Text style={styles.alertName}>Cargando inventario</Text>
              <Text style={styles.alertDate}>Sincronizando con Supabase</Text>
            </View>
          </View>
        ) : error ? (
          <View style={styles.alertCard}>
            <View style={[styles.alertBorder, { backgroundColor: COLORS.red400 }]} />
            <View style={styles.alertInfo}>
              <Text style={styles.alertName}>No se pudo cargar el inventario</Text>
              <Text style={styles.alertDate}>{error}</Text>
            </View>
          </View>
        ) : summary.alerts.length === 0 ? (
          <View style={styles.alertCard}>
            <View style={[styles.alertBorder, { backgroundColor: COLORS.green500 }]} />
            <View style={styles.alertInfo}>
              <Text style={styles.alertName}>Sin alertas pendientes</Text>
              <Text style={styles.alertDate}>No hay productos por vencer pronto</Text>
            </View>
          </View>
        ) : (
          summary.alerts.map(item => {
            const alertStyle = ALERT_STYLES[item.level] || ALERT_STYLES.ok;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.alertCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Inventario')}
              >
                <View style={[styles.alertBorder, { backgroundColor: alertStyle.border }]} />
                <View style={styles.alertInfo}>
                  <Text style={styles.alertName}>{item.name}</Text>
                  <Text style={styles.alertDate}>{item.date}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: alertStyle.tagBg }]}>
                  <Text style={[styles.tagText, { color: alertStyle.tagColor }]}>
                    {alertStyle.tag}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Shopping list */}
        <SectionHeader icon="list" title="Lista de compras" />

        <TouchableOpacity
          style={styles.alertCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Inventario', { statusFilter: 'vencidos' })}
        >
          <View style={[styles.alertBorder, { backgroundColor: COLORS.green500 }]} />
          <Text style={styles.shoppingText}>{summary.expired} productos para reponer</Text>
          <Text style={styles.shoppingLink}>Ver ›</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  scroll: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.green500,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.gray300,
  },
  summaryIcon: {
    marginBottom: 4,
  },
  summaryNum: {
    fontSize: 22,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.gray500,
    marginTop: 2,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    overflow: 'hidden',
    gap: 10,
    borderWidth: 0.5,
    borderColor: COLORS.gray300,
  },
  alertBorder: {
    width: 4,
    alignSelf: 'stretch',
  },
  alertInfo: {
    flex: 1,
    paddingVertical: 12,
  },
  alertName: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray700,
  },
  alertDate: {
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 1,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginRight: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  shoppingText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.green600,
    paddingVertical: 12,
  },
  shoppingLink: {
    fontSize: 12,
    color: COLORS.green500,
    paddingRight: 12,
  },
});
