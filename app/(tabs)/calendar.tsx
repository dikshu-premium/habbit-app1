import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useHabits } from '../../hooks/useHabits';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/Card';
import { HabitCard } from '../../components/HabitCard';
import { NoteModal } from '../../components/NoteModal';
import { HabitFormModal } from '../../components/HabitFormModal';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  FileText,
} from 'lucide-react-native';
import { DAYS_SHORT, MONTHS } from '../../constants/theme';
import { getNoteForDate, DailyNote } from '../../lib/database';

type ViewMode = 'month' | 'week';

export default function CalendarScreen() {
  const { user } = useAuth();
  const {
    habits,
    completions,
    loadCompletions,
    toggleCompletion,
    isHabitCompleted,
    getCompletionForHabitDate,
    updateHabit,
    createHabit,
    refreshHabits,
  } = useHabits();
  const { colors, spacing, fontSizes, radius } = useTheme();

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNote, setShowNote] = useState(false);
  const [existingNote, setExistingNote] = useState<DailyNote | null>(null);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const end = new Date(year, month + 2, 0).toISOString().split('T')[0];
      loadCompletions(start, end);
    }
  }, [user, year, month]);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

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

  const getCompletionCountForDate = (date: string): number => {
    const dateCompletions = completions.filter(c => c.date === date && c.count > 0);
    const activeHabits = habits.filter(h => !h.is_archived);
    return dateCompletions.filter(c => activeHabits.some(h => h.id === c.habit_id)).length;
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const handleDayPress = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleLongPress = async (dateStr: string) => {
    if (!user) return;
    setSelectedDate(dateStr);
    try {
      const note = await getNoteForDate(user.id, dateStr);
      setExistingNote(note);
      setShowNote(true);
    } catch (err) {
      console.error('Get note error:', err);
    }
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === today;
      const isSelected = dateStr === selectedDate;
      const completionCount = getCompletionCountForDate(dateStr);
      const activeCount = habits.filter(h => !h.is_archived).length;
      const isFull = completionCount >= activeCount && activeCount > 0;

      cells.push(
        <TouchableOpacity
          key={dateStr}
          style={[
            styles.dayCell,
            {
              backgroundColor: isSelected
                ? colors.primary
                : isToday
                ? colors.primaryLight
                : 'transparent',
              borderRadius: radius.md,
            },
          ]}
          onPress={() => handleDayPress(dateStr)}
          onLongPress={() => handleLongPress(dateStr)}
          activeOpacity={0.7}
        >
          <Text
            style={{
              color: isSelected ? '#FFFFFF' : isToday ? colors.primary : colors.text,
              fontSize: fontSizes.md,
              fontWeight: isToday || isSelected ? '700' : '400',
            }}
          >
            {day}
          </Text>
          {completionCount > 0 && (
            <View style={styles.dayIndicators}>
              {isFull ? (
                <View style={[styles.dayDot, { backgroundColor: isSelected ? '#FFFFFF' : colors.primary }]} />
              ) : (
                <View style={[styles.dayDotHalf, { backgroundColor: isSelected ? '#FFFFFF80' : colors.accent }]} />
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return cells;
  };

  const renderWeekView = () => {
    const selected = new Date(selectedDate + 'T12:00:00');
    const weekStart = new Date(selected);
    weekStart.setDate(selected.getDate() - selected.getDay());

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === today;
      const isSelected = dateStr === selectedDate;
      const completionCount = getCompletionCountForDate(dateStr);
      const activeCount = habits.filter(h => !h.is_archived).length;
      const isFull = completionCount >= activeCount && activeCount > 0;

      weekDays.push(
        <TouchableOpacity
          key={dateStr}
          style={[
            styles.weekDay,
            {
              backgroundColor: isSelected ? colors.primary : isToday ? colors.primaryLight : 'transparent',
              borderRadius: radius.md,
            },
          ]}
          onPress={() => handleDayPress(dateStr)}
          onLongPress={() => handleLongPress(dateStr)}
        >
          <Text style={{ color: colors.textTertiary, fontSize: fontSizes.xs, fontWeight: '500' }}>
            {DAYS_SHORT[d.getDay()]}
          </Text>
          <Text
            style={{
              color: isSelected ? '#FFFFFF' : isToday ? colors.primary : colors.text,
              fontSize: fontSizes.xl,
              fontWeight: isSelected || isToday ? '700' : '400',
              marginTop: 4,
            }}
          >
            {d.getDate()}
          </Text>
          {completionCount > 0 && (
            <View
              style={[
                styles.weekDot,
                { backgroundColor: isFull ? (isSelected ? '#FFFFFF' : colors.primary) : (isSelected ? '#FFFFFF80' : colors.accent) },
              ]}
            />
          )}
        </TouchableOpacity>
      );
    }
    return weekDays;
  };

  const activeHabits = habits.filter(h => !h.is_archived);
  const selectedDateHabits = activeHabits.map(habit => ({
    habit,
    completed: isHabitCompleted(habit.id, selectedDate),
    completionCount: getCompletionForHabitDate(habit.id, selectedDate),
  }));

  const handleSaveHabit = async (data: any) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data);
    } else {
      await createHabit(data);
    }
    setEditingHabit(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Calendar Header */}
      <View style={[styles.calendarHeader, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} hitSlop={12}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: fontSizes.lg, fontWeight: '700' }}>
          {MONTHS[month]} {year}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[
              styles.viewToggle,
              {
                backgroundColor: viewMode === 'month' ? colors.primary : colors.surfaceSecondary,
                borderRadius: radius.sm,
              },
            ]}
            onPress={() => setViewMode('month')}
          >
            <CalendarIcon size={16} color={viewMode === 'month' ? '#FFF' : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggle,
              {
                backgroundColor: viewMode === 'week' ? colors.primary : colors.surfaceSecondary,
                borderRadius: radius.sm,
              },
            ]}
            onPress={() => setViewMode('week')}
          >
            <List size={16} color={viewMode === 'week' ? '#FFF' : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateMonth(1)} hitSlop={12}>
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Calendar Grid */}
        {viewMode === 'month' ? (
          <View style={[styles.monthGrid, { paddingHorizontal: spacing.lg }]}>
            {DAYS_SHORT.map(day => (
              <View key={day} style={styles.dayHeader}>
                <Text style={{ color: colors.textTertiary, fontSize: fontSizes.xs, fontWeight: '600' }}>
                  {day}
                </Text>
              </View>
            ))}
            {renderMonthView()}
          </View>
        ) : (
          <View style={[styles.weekGrid, { paddingHorizontal: spacing.lg, gap: 8 }]}>
            {renderWeekView()}
          </View>
        )}

        {/* Selected Date Habits */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <View style={styles.dateHeader}>
            <Text style={{ color: colors.text, fontSize: fontSizes.lg, fontWeight: '700' }}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <TouchableOpacity
              style={[styles.noteBtn, { backgroundColor: colors.accentLight, borderRadius: radius.sm }]}
              onPress={() => handleLongPress(selectedDate)}
            >
              <FileText size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {selectedDateHabits.length === 0 ? (
            <Card>
              <Text style={{ color: colors.textSecondary, fontSize: fontSizes.md, textAlign: 'center', paddingVertical: 24 }}>
                No habits for this day
              </Text>
            </Card>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {selectedDateHabits.map(({ habit, completed, completionCount }) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  completed={completed}
                  completionCount={completionCount}
                  streak={getStreak(habit.id)}
                  onPress={() => { setEditingHabit(habit); setShowHabitForm(true); }}
                  onToggle={() => toggleCompletion(habit.id, selectedDate)}
                />
              ))}
            </View>
          )}
        </View>
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
        date={selectedDate}
        userId={user?.id || ''}
        existingNote={existingNote}
        onSaved={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 48 },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewToggle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHeader: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIndicators: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dayDotHalf: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  weekGrid: {
    flexDirection: 'row',
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  weekDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
