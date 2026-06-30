import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { toISODate, parseISODate, formatMonthLabel, buildCalendarDays } from '../utils/date';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const YEAR_SPAN = 12;

export default function DatePickerModal({ visible, value, onSelect, onClose }) {
  const [viewDate, setViewDate] = useState(() => parseISODate(value) || new Date());
  const [pickingYear, setPickingYear] = useState(false);

  useEffect(() => {
    if (visible) {
      setViewDate(parseISODate(value) || new Date());
      setPickingYear(false);
    }
  }, [visible, value]);

  const calendarDays = buildCalendarDays(viewDate);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: YEAR_SPAN * 2 + 1 }, (_, i) => currentYear - YEAR_SPAN + i);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.nav}
              onPress={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            >
              <Feather name="chevron-left" size={20} color={COLORS.gray700} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.titleBtn} onPress={() => setPickingYear(p => !p)}>
              <Text style={styles.title}>{formatMonthLabel(viewDate)}</Text>
              <Feather name={pickingYear ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.gray700} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.nav}
              onPress={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            >
              <Feather name="chevron-right" size={20} color={COLORS.gray700} />
            </TouchableOpacity>
          </View>

          {pickingYear ? (
            <FlatList
              data={years}
              keyExtractor={item => `${item}`}
              numColumns={4}
              initialNumToRender={years.length}
              getItemLayout={(_, index) => ({ length: 52, offset: 52 * Math.floor(index / 4), index })}
              style={styles.yearGrid}
              renderItem={({ item: year }) => {
                const selected = year === viewDate.getFullYear();
                return (
                  <TouchableOpacity
                    style={[styles.yearCell, selected && styles.yearCellSelected]}
                    onPress={() => {
                      setViewDate(d => new Date(year, d.getMonth(), 1));
                      setPickingYear(false);
                    }}
                  >
                    <Text style={[styles.yearText, selected && styles.yearTextSelected]}>{year}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <>
              <View style={styles.weekRow}>
                {WEEKDAYS.map((day, index) => (
                  <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {calendarDays.map(date => {
                  const dateValue = toISODate(date);
                  const inCurrentMonth = date.getMonth() === viewDate.getMonth();
                  const selected = value === dateValue;

                  return (
                    <TouchableOpacity
                      key={dateValue}
                      style={[styles.dayCell, selected && styles.dayCellSelected]}
                      onPress={() => onSelect(dateValue)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !inCurrentMonth && styles.dayTextMuted,
                          selected && styles.dayTextSelected,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.clearButton} onPress={() => onSelect('')}>
              <Text style={styles.clearText}>Sin fecha</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nav: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    textAlign: 'center',
    textTransform: 'capitalize',
    fontSize: 16,
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
    borderRadius: 12,
  },
  dayCellSelected: {
    backgroundColor: COLORS.green500,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  dayTextMuted: {
    color: COLORS.gray300,
  },
  dayTextSelected: {
    color: COLORS.white,
  },
  yearGrid: {
    maxHeight: 280,
  },
  yearCell: {
    width: '25%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  yearCellSelected: {
    backgroundColor: COLORS.green500,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  yearTextSelected: {
    color: COLORS.white,
  },
  actions: {
    marginTop: 12,
  },
  clearButton: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    paddingVertical: 12,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green600,
  },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray700,
  },
});
