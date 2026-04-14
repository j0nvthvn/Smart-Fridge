import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function SettingsRow({ icon, iconBg, iconColor, label, right, onPress, labelColor }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.6 : 1}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={15} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, labelColor && { color: labelColor }]}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.gray700 },
});
