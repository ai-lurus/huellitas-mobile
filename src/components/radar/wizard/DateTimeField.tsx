import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../../../design/tokens';

export interface DateTimeFieldProps {
  dateValue: Date;
  timeValue: Date;
  onChangeDate: (d: Date) => void;
  onChangeTime: (t: Date) => void;
  testID: string;
}

export function DateTimeField({
  dateValue,
  timeValue,
  onChangeDate,
  onChangeTime,
  testID,
}: DateTimeFieldProps): React.ReactElement {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  return (
    <View style={styles.row}>
      <View style={styles.col}>
        <Pressable
          onPress={(): void => setShowDate(true)}
          style={styles.inputRow}
          testID={`${testID}.date`}
        >
          <Ionicons color={colors.textSecondary} name="calendar-outline" size={18} />
          <Text style={styles.inputText}>
            {dateValue.toLocaleDateString('es-MX', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </Text>
        </Pressable>
        {showDate ? (
          <>
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              mode="date"
              value={dateValue}
              onChange={(e: DateTimePickerEvent, d?: Date): void => {
                if (Platform.OS === 'android' && e.type === 'dismissed') {
                  setShowDate(false);
                  return;
                }
                if (d) onChangeDate(d);
                if (Platform.OS === 'android') setShowDate(false);
              }}
            />
            {Platform.OS === 'ios' ? (
              <Pressable onPress={(): void => setShowDate(false)} style={styles.pickerDone}>
                <Text style={styles.pickerDoneText}>Listo</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </View>

      <View style={styles.col}>
        <Pressable
          onPress={(): void => setShowTime(true)}
          style={styles.inputRow}
          testID={`${testID}.time`}
        >
          <Ionicons color={colors.textSecondary} name="time-outline" size={18} />
          <Text style={styles.inputText}>
            {timeValue.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Pressable>
        {showTime ? (
          <>
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              mode="time"
              value={timeValue}
              onChange={(e: DateTimePickerEvent, t?: Date): void => {
                if (Platform.OS === 'android' && e.type === 'dismissed') {
                  setShowTime(false);
                  return;
                }
                if (t) onChangeTime(t);
                if (Platform.OS === 'android') setShowTime(false);
              }}
            />
            {Platform.OS === 'ios' ? (
              <Pressable onPress={(): void => setShowTime(false)} style={styles.pickerDone}>
                <Text style={styles.pickerDoneText}>Listo</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  col: { flex: 1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  inputText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  pickerDone: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  pickerDoneText: { ...typography.bodyStrong, color: colors.primary },
});
