import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useHabits } from '../../hooks/useHabits';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { HabitFormModal } from '../../components/HabitFormModal';
import {
  Plus,
  Search,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit3,
  Filter,
  Flame,
} from 'lucide-react-native';
import { HABIT_CATEGORIES } from '../../constants/theme';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';

export default function HabitsScreen() {
  const { user } = useAuth();
  const { habits, completions, createHabit, updateHabit, archiveHabit, unarchiveHabit, removeHabit } = useHabits();
  const { colors, spacing, fontSizes, radius } = useTheme();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const getStreak = (habitId: string): number => {
    let streak = 0;
    let d = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = d.toISOString().split('T')[0];
      const comp = completions.find(c => c.habit_id === habitId && c.date === dateStr);
      if (comp && comp.count > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else if (i === 0) {
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const getCompletionRate = (habitId: string): number => {
    const total = completions.filter(c => c.habit_id === habitId && c.count > 0).length;
    const daysSinceCreation = Math.max(1, Math.min(30, Math.ceil(
      (Date.now() - new Date(habits.find(h => h.id === habitId)?.created_at || Date.now()).getTime()) / 86400000
    )));
    return Math.round((total / daysSinceCreation) * 100);
  };

  const filteredHabits = habits
    .filter(h => showArchived ? h.is_archived : !h.is_archived)
    .filter(h => !search || h.name.toLowerCase().includes(search.toLowerCase()))
    .filter(h => !selectedCategory || h.category === selectedCategory);

  const categories = [...new Set(habits.filter(h => !h.is_archived).map(h => h.category))];

  const handleSaveHabit = async (data: any) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data);
    } else {
      await createHabit(data);
    }
    setEditingHabit(null);
  };

  const handleDelete = async (habitId: string) => {
    if (confirmDelete === habitId) {
      await removeHabit(habitId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(habitId);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: 48, paddingBottom: spacing.md }]}>
        <Text style={{ color: colors.text, fontSize: fontSizes.xxl, fontWeight: '700' }}>
          Habits
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: radius.md }]}
          onPress={() => { setEditingHabit(null); setShowForm(true); }}
        >
          <Plus size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <View style={[
          styles.searchBox,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.borderLight,
          },
        ]}>
          <Search size={18} color={colors.textTertiary} style={{ marginLeft: 12 }} />
          <TextInput
            style={{ flex: 1, padding: 12, color: colors.text, fontSize: fontSizes.md }}
            placeholder="Search habits..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            {
              backgroundColor: !selectedCategory ? colors.primary : colors.surfaceSecondary,
              borderRadius: radius.full,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              marginRight: spacing.sm,
            },
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={{ color: !selectedCategory ? '#FFF' : colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '500' }}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.chip,
              {
                backgroundColor: selectedCategory === cat ? colors.primary : colors.surfaceSecondary,
                borderRadius: radius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                marginRight: spacing.sm,
              },
            ]}
            onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
          >
            <Text style={{ color: selectedCategory === cat ? '#FFF' : colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '500' }}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Archive Toggle */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '600' }}>
          {showArchived ? 'Archived' : 'Active'} ({filteredHabits.length})
        </Text>
        <TouchableOpacity onPress={() => setShowArchived(!showArchived)}>
          <Text style={{ color: colors.primary, fontSize: fontSizes.sm, fontWeight: '500' }}>
            {showArchived ? 'Show Active' : 'Show Archived'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Habits List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
      >
        {filteredHabits.length === 0 ? (
          <EmptyState
            title={showArchived ? 'No archived habits' : 'No habits yet'}
            message={showArchived ? 'Archived habits will appear here' : 'Create your first habit to start tracking'}
          />
        ) : (
          filteredHabits.map((habit) => (
            <Animated.View key={habit.id} entering={FadeIn} layout={Layout.springify()}>
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.habitRow}>
                  <View style={[styles.emojiCircle, { backgroundColor: habit.color + '20' }]}>
                    <Text style={{ fontSize: 20 }}>{habit.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: fontSizes.md, fontWeight: '600' }}>
                      {habit.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Text style={{ color: colors.textTertiary, fontSize: fontSizes.xs }}>
                        {habit.category}
                      </Text>
                      <View style={[styles.priorityDot, { backgroundColor: habit.priority === 'high' ? colors.danger : habit.priority === 'medium' ? colors.accent : colors.success }]} />
                      {getStreak(habit.id) > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Flame size={12} color={colors.accent} />
                          <Text style={{ color: colors.accent, fontSize: fontSizes.xs, fontWeight: '600', marginLeft: 2 }}>
                            {getStreak(habit.id)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm }]}
                      onPress={() => { setEditingHabit(habit); setShowForm(true); }}
                    >
                      <Edit3 size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm }]}
                      onPress={() => habit.is_archived ? unarchiveHabit(habit.id) : archiveHabit(habit.id)}
                    >
                      {habit.is_archived
                        ? <ArchiveRestore size={14} color={colors.textSecondary} />
                        : <Archive size={14} color={colors.textSecondary} />
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: confirmDelete === habit.id ? colors.dangerLight : colors.surfaceSecondary, borderRadius: radius.sm }]}
                      onPress={() => handleDelete(habit.id)}
                    >
                      <Trash2 size={14} color={confirmDelete === habit.id ? colors.danger : colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Completion bar */}
                {!habit.is_archived && (
                  <View style={{ marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: colors.textTertiary, fontSize: fontSizes.xs }}>Completion rate</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: fontSizes.xs, fontWeight: '600' }}>
                        {getCompletionRate(habit.id)}%
                      </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: colors.borderLight, borderRadius: radius.full }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: habit.color,
                            borderRadius: radius.full,
                            width: `${Math.min(getCompletionRate(habit.id), 100)}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}
              </Card>
            </Animated.View>
          ))
        )}
      </ScrollView>

      <HabitFormModal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingHabit(null); }}
        onSave={handleSaveHabit}
        habit={editingHabit}
        userId={user?.id || ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {},
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressBar: {
    height: 6,
  },
  progressFill: {
    height: '100%',
  },
});
