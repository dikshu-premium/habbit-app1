import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useHabits } from '../../hooks/useHabits';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/Card';
import { ProgressRing } from '../../components/ProgressRing';
import { HabitCard } from '../../components/HabitCard';
import { EmptyState } from '../../components/EmptyState';
import { HabitFormModal } from '../../components/HabitFormModal';
import { NoteModal } from '../../components/NoteModal';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Calendar,
  TrendingUp,
  Flame,
  FileText,
  Sun,
  Moon,
} from 'lucide-react-native';
import { getNotes, HabitCompletion, DailyNote, getCompletions } from '../../lib/database';

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const {
    habits,
    completions,
    loading,
    toggleCompletion,
    createHabit,
    updateHabit,
    loadCompletions,
    isHabitCompleted,
    getCompletionForHabitDate,
    refreshHabits,
  } = useHabits();
  const { colors, spacing, fontSizes, radius, colorScheme } = useTheme();
  const router = useRouter();

  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [showNote, setShowNote] = useState(false);
  const [noteDate, setNoteDate] = useState('');
  const [existingNote, setExistingNote] = useState<DailyNote | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [todayNotes, setTodayNotes] = useState<DailyNote[]>([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setMonth(startOfMonth.getMonth() - 1);
      loadCompletions(startOfMonth.toISOString().split('T')[0], '2099-12-31');
      loadTodayNote();
    }
  }, [user]);

  const loadTodayNote = async () => {
    if (!user) return;
    try {
      const notes = await getNotes(user.id, today, today);
      setTodayNotes(notes);
    } catch (err) {
      console.error('Load note error:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHabits();
    if (user) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setMonth(startOfMonth.getMonth() - 1);
      await loadCompletions(startOfMonth.toISOString().split('T')[0], '2099-12-31');
      await loadTodayNote();
    }
    setRefreshing(false);
  };

  const activeHabits = habits.filter(h => !h.is_archived);
  const completedToday = activeHabits.filter(h => isHabitCompleted(h.id, today)).length;
  const completionPercent = activeHabits.length > 0 ? (completedToday / activeHabits.length) * 100 : 0;

  const todaysNote = todayNotes.length > 0 ? todayNotes[0] : null;

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

  const handleToggle = async (habitId: string) => {
    await toggleCompletion(habitId, today);
  };

  const handleHabitPress = (habit: any) => {
    setEditingHabit(habit);
    setShowHabitForm(true);
  };

  const handleSaveHabit = async (data: any) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data);
    } else {
      await createHabit(data);
    }
    setEditingHabit(null);
  };

  const handleNotePress = () => {
    setNoteDate(today);
    setExistingNote(todaysNote || null);
    setShowNote(true);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={[styles.header, { borderRadius: 0 }]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.greeting, { color: '#FFFFFF90', fontSize: fontSizes.md }]}>
                {greeting()}
              </Text>
              <Text style={[styles.userName, { color: '#FFFFFF', fontSize: fontSizes.xxl }]}>
                {user?.email?.split('@')[0] || 'User'}
              </Text>
            </View>
            <ProgressRing
              progress={completionPercent}
              size={64}
              strokeWidth={6}
              color="#FFFFFF"
              trackColor="#FFFFFF30"
              label={`${completedToday}`}
              sublabel="done"
            />
          </View>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={{ color: '#FFFFFF', fontSize: fontSizes.xxl, fontWeight: '700' }}>
                {activeHabits.length}
              </Text>
              <Text style={{ color: '#FFFFFF90', fontSize: fontSizes.xs }}>Habits</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: '#FFFFFF30' }]} />
            <View style={styles.statItem}>
              <Text style={{ color: '#FFFFFF', fontSize: fontSizes.xxl, fontWeight: '700' }}>
                {completedToday}
              </Text>
              <Text style={{ color: '#FFFFFF90', fontSize: fontSizes.xs }}>Done</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: '#FFFFFF30' }]} />
            <View style={styles.statItem}>
              <Flame size={20} color="#FFD700" />
              <Text style={{ color: '#FFFFFF', fontSize: fontSizes.xxl, fontWeight: '700' }}>
                {activeHabits.reduce((max, h) => Math.max(max, getStreak(h.id)), 0)}
              </Text>
              <Text style={{ color: '#FFFFFF90', fontSize: fontSizes.xs }}>Best Streak</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={[styles.quickActions, { gap: spacing.md, paddingHorizontal: spacing.lg, marginTop: spacing.lg }]}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderRadius: radius.md }]}
            onPress={() => { setEditingHabit(null); setShowHabitForm(true); }}
          >
            <Plus size={20} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: fontSizes.sm, fontWeight: '600', marginLeft: 6 }}>
              Add Habit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderRadius: radius.md }]}
            onPress={handleNotePress}
          >
            <FileText size={20} color={colors.accent} />
            <Text style={{ color: colors.accent, fontSize: fontSizes.sm, fontWeight: '600', marginLeft: 6 }}>
              Daily Note
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Habits */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Text style={{ color: colors.text, fontSize: fontSizes.lg, fontWeight: '700' }}>
              Today's Habits
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
              <Calendar size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {activeHabits.length === 0 ? (
            <EmptyState
              title="No habits yet"
              message="Start building better routines by adding your first habit"
            />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {activeHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  completed={isHabitCompleted(habit.id, today)}
                  completionCount={getCompletionForHabitDate(habit.id, today)}
                  streak={getStreak(habit.id)}
                  onPress={() => handleHabitPress(habit)}
                  onToggle={() => handleToggle(habit.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Productivity Score Card */}
        {activeHabits.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
            <Card>
              <View style={styles.scoreCard}>
                <View>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '500' }}>
                    Productivity Score
                  </Text>
                  <Text style={{ color: colors.text, fontSize: fontSizes.xxxl, fontWeight: '700', marginTop: 4 }}>
                    {Math.round(completionPercent)}%
                  </Text>
                  <Text style={{ color: colors.textTertiary, fontSize: fontSizes.xs, marginTop: 2 }}>
                    {completedToday} of {activeHabits.length} completed
                  </Text>
                </View>
                <ProgressRing
                  progress={completionPercent}
                  size={80}
                  strokeWidth={8}
                />
              </View>
            </Card>
          </View>
        )}

        {/* Today's Note Preview */}
        {todaysNote && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
            <Card onPress={handleNotePress}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color={colors.accent} />
                <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '500' }}>
                  Today's Note
                </Text>
                {todaysNote.mood && <Text style={{ fontSize: 16 }}>{todaysNote.mood}</Text>}
              </View>
              <Text
                style={{ color: colors.text, fontSize: fontSizes.md, marginTop: 8, lineHeight: 20 }}
                numberOfLines={3}
              >
                {todaysNote.content}
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>

      <HabitFormModal
        visible={showHabitForm}
        onClose={() => { setShowHabitForm(false); setEditingHabit(null); }}
        onSave={handleSaveHabit}
        habit={editingHabit}
        userId={user?.id || ''}
      />

      <NoteModal
        visible={showNote}
        onClose={() => setShowNote(false)}
        date={noteDate}
        userId={user?.id || ''}
        existingNote={existingNote}
        onSaved={loadTodayNote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontWeight: '400' },
  userName: { fontWeight: '700', marginTop: 2 },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    backgroundColor: '#FFFFFF15',
    borderRadius: 16,
    padding: 16,
  },
  statItem: { alignItems: 'center' },
  statDivider: { width: 1, height: 40 },
  quickActions: {
    flexDirection: 'row',
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
