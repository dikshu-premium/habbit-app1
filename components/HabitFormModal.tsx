import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { useTheme } from '../hooks/useTheme';
import { Habit } from '../lib/database';
import { HABIT_COLORS, HABIT_EMOJIS, HABIT_CATEGORIES, PRIORITY_LEVELS } from '../constants/theme';

interface HabitFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (habit: Partial<Habit>) => void;
  habit?: Habit | null;
  userId: string;
}

export function HabitFormModal({ visible, onClose, onSave, habit, userId }: HabitFormModalProps) {
  const { colors, radius, spacing, fontSizes } = useTheme();
  const [name, setName] = useState(habit?.name || '');
  const [emoji, setEmoji] = useState(habit?.emoji || '✅');
  const [color, setColor] = useState(habit?.color || '#4F9D69');
  const [category, setCategory] = useState(habit?.category || 'General');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(habit?.priority || 'medium');
  const [targetPerDay, setTargetPerDay] = useState(String(habit?.target_per_day || 1));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      emoji,
      color,
      category,
      priority,
      target_per_day: parseInt(targetPerDay) || 1,
      user_id: userId,
    });
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title={habit ? 'Edit Habit' : 'New Habit'}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Input
          label="Habit Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Morning run"
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSizes.sm, marginTop: spacing.sm }]}>
          Icon
        </Text>
        <View style={[styles.emojiGrid, { gap: spacing.sm }]}>
          {HABIT_EMOJIS.slice(0, 18).map((e) => (
            <TouchableOpacity
              key={e}
              style={[
                styles.emojiItem,
                {
                  backgroundColor: emoji === e ? colors.primaryLight : colors.surfaceSecondary,
                  borderRadius: radius.sm,
                  borderWidth: 2,
                  borderColor: emoji === e ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => setEmoji(e)}
            >
              <Text style={styles.emojiText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSizes.sm, marginTop: spacing.lg }]}>
          Color
        </Text>
        <View style={[styles.colorRow, { gap: spacing.sm }]}>
          {HABIT_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorDot,
                {
                  backgroundColor: c,
                  borderRadius: 16,
                  borderWidth: 3,
                  borderColor: color === c ? colors.text : 'transparent',
                },
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSizes.sm, marginTop: spacing.lg }]}>
          Category
        </Text>
        <View style={[styles.chipRow, { gap: spacing.sm }]}>
          {HABIT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                {
                  backgroundColor: category === cat ? colors.primary : colors.surfaceSecondary,
                  borderRadius: radius.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={{ color: category === cat ? '#FFF' : colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '500' }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSizes.sm, marginTop: spacing.lg }]}>
          Priority
        </Text>
        <View style={[styles.chipRow, { gap: spacing.sm }]}>
          {PRIORITY_LEVELS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.chip,
                {
                  backgroundColor: priority === p.value ? p.color : colors.surfaceSecondary,
                  borderRadius: radius.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
              onPress={() => setPriority(p.value as 'low' | 'medium' | 'high')}
            >
              <Text style={{ color: priority === p.value ? '#FFF' : colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '500' }}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Target per day"
          value={targetPerDay}
          onChangeText={setTargetPerDay}
          placeholder="1"
          keyboardType="numeric"
        />

        <View style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
          <Button title={habit ? 'Update Habit' : 'Create Habit'} onPress={handleSave} />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontWeight: '600', marginBottom: 8 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  emojiItem: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 22 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {},
});
