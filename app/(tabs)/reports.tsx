import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useHabits } from '../../hooks/useHabits';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/Card';
import { ProgressRing } from '../../components/ProgressRing';
import { BarChart } from '../../components/BarChart';
import { PieChart } from '../../components/PieChart';
import { Heatmap } from '../../components/Heatmap';
import { EmptyState } from '../../components/EmptyState';
import { DAYS_SHORT, MONTHS } from '../../constants/theme';
import {
  TrendingUp,
  Flame,
  Target,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { getCompletionHeatmap } from '../../lib/database';

export default function ReportsScreen() {
  const { user } = useAuth();
  const { habits, completions, loadCompletions } = useHabits();
  const { colors, spacing, fontSizes, radius } = useTheme();

  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});

  const today = new Date();
  const activeHabits = habits.filter(h => !h.is_archived);

  useEffect(() => {
    if (user) {
      const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      loadCompletions(start.toISOString().split('T')[0], '2099-12-31');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadHeatmap();
    }
  }, [user, heatmapYear]);

  const loadHeatmap = async () => {
    if (!user) return;
    try {
      const data = await getCompletionHeatmap(user.id, heatmapYear);
      setHeatmapData(data);
    } catch (err) {
      console.error('Heatmap error:', err);
    }
  };

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

  // Weekly data for bar chart (last 7 days)
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const completed = completions.filter(c => c.date === dateStr && c.count > 0 && activeHabits.some(h => h.id === c.habit_id)).length;
    weeklyData.push({
      label: DAYS_SHORT[d.getDay()],
      value: completed,
      color: completed >= activeHabits.length && activeHabits.length > 0 ? colors.primary : colors.accent,
    });
  }

  // Monthly stats
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const thisMonthCompletions = completions.filter(c => c.date >= thisMonthStart && c.count > 0);
  const daysThisMonth = today.getDate();
  const monthlyCompletionRate = activeHabits.length > 0
    ? Math.round((thisMonthCompletions.length / (activeHabits.length * daysThisMonth)) * 100)
    : 0;

  // Per-habit stats
  const habitStats = activeHabits.map(h => {
    const habitCompletions = completions.filter(c => c.habit_id === h.id && c.count > 0);
    const daysSinceCreation = Math.max(1, Math.ceil(
      (Date.now() - new Date(h.created_at).getTime()) / 86400000
    ));
    const rate = Math.round((habitCompletions.length / Math.min(daysSinceCreation, 30)) * 100);
    return { habit: h, streak: getStreak(h.id), rate };
  }).sort((a, b) => b.streak - a.streak);

  // Category pie chart
  const categoryMap: Record<string, number> = {};
  activeHabits.forEach(h => {
    categoryMap[h.category] = (categoryMap[h.category] || 0) + 1;
  });
  const pieSegments = Object.entries(categoryMap).map(([label, value], i) => {
    const pieColors = [colors.primary, colors.accent, colors.info, colors.success, colors.warning, colors.danger];
    return { label, value, color: pieColors[i % pieColors.length] };
  });

  // Best streak
  const bestStreak = habitStats.reduce((max, s) => Math.max(max, s.streak), 0);

  // Total completions this month
  const totalCompletions = thisMonthCompletions.length;

  // Perfect days (all habits completed)
  const perfectDays = new Set<string>();
  const dateSet = new Set(completions.filter(c => c.date >= thisMonthStart && c.count > 0).map(c => c.date));
  dateSet.forEach(date => {
    const dateCompletions = completions.filter(c => c.date === date && c.count > 0);
    if (dateCompletions.length >= activeHabits.length && activeHabits.length > 0) {
      perfectDays.add(date);
    }
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: 48, paddingBottom: spacing.md }]}>
        <Text style={{ color: colors.text, fontSize: fontSizes.xxl, fontWeight: '700' }}>
          Reports
        </Text>
        <BarChart3 size={24} color={colors.primary} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.lg }}>
        {/* Overview Cards */}
        <View style={[styles.statsRow, { gap: spacing.sm }]}>
          <Card style={{ flex: 1 }}>
            <View style={styles.statCard}>
              <Flame size={20} color={colors.accent} />
              <Text style={{ color: colors.text, fontSize: fontSizes.xxl, fontWeight: '700', marginTop: 4 }}>
                {bestStreak}
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: fontSizes.xs }}>Best Streak</Text>
            </View>
          </Card>
          <Card style={{ flex: 1 }}>
            <View style={styles.statCard}>
              <Target size={20} color={colors.primary} />
              <Text style={{ color: colors.text, fontSize: fontSizes.xxl, fontWeight: '700', marginTop: 4 }}>
                {monthlyCompletionRate}%
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: fontSizes.xs }}>This Month</Text>
            </View>
          </Card>
          <Card style={{ flex: 1 }}>
            <View style={styles.statCard}>
              <Calendar size={20} color={colors.success} />
              <Text style={{ color: colors.text, fontSize: fontSizes.xxl, fontWeight: '700', marginTop: 4 }}>
                {perfectDays.size}
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: fontSizes.xs }}>Perfect Days</Text>
            </View>
          </Card>
        </View>

        {/* Weekly Progress */}
        <Card style={{ marginTop: spacing.md }}>
          <Text style={{ color: colors.text, fontSize: fontSizes.lg, fontWeight: '700', marginBottom: spacing.md }}>
            Weekly Progress
          </Text>
          <BarChart data={weeklyData} maxValue={activeHabits.length || 1} />
        </Card>

        {/* Completion Heatmap */}
        <Card style={{ marginTop: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <Text style={{ color: colors.text, fontSize: fontSizes.lg, fontWeight: '700' }}>
              Activity Heatmap
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity onPress={() => setHeatmapYear(y => y - 1)}>
                <ChevronLeft size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '600' }}>
                {heatmapYear}
              </Text>
              <TouchableOpacity onPress={() => setHeatmapYear(y => y + 1)}>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Heatmap data={heatmapData} year={heatmapYear} />
          </ScrollView>
        </Card>

        {/* Category Distribution */}
        {pieSegments.length > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={{ color: colors.text, fontSize: fontSizes.lg, fontWeight: '700', marginBottom: spacing.md }}>
              Category Distribution
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
              <PieChart segments={pieSegments} size={140} strokeWidth={24} />
              <View style={{ gap: 6 }}>
                {pieSegments.map((s, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
                    <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm }}>
                      {s.label} ({s.value})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        )}

        {/* Per-Habit Performance */}
        {habitStats.length > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={{ color: colors.text, fontSize: fontSizes.lg, fontWeight: '700', marginBottom: spacing.md }}>
              Habit Performance
            </Text>
            <View style={{ gap: spacing.md }}>
              {habitStats.map(({ habit, streak, rate }) => (
                <View key={habit.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 18 }}>{habit.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.text, fontSize: fontSizes.md, fontWeight: '600' }}>
                          {habit.name}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm }}>
                          {rate}%
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                        {streak > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Flame size={12} color={colors.accent} />
                            <Text style={{ color: colors.accent, fontSize: fontSizes.xs, fontWeight: '600' }}>
                              {streak}d
                            </Text>
                          </View>
                        )}
                        <Text style={{ color: colors.textTertiary, fontSize: fontSizes.xs }}>
                          {habit.category}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.borderLight, borderRadius: radius.full, marginTop: 6 }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: habit.color, borderRadius: radius.full, width: `${Math.min(rate, 100)}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {activeHabits.length === 0 && (
          <EmptyState
            title="No data yet"
            message="Add habits and start tracking to see your reports"
          />
        )}
      </ScrollView>
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
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    alignItems: 'center',
  },
  progressBar: { height: 6 },
  progressFill: { height: '100%' },
});
