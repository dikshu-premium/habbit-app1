import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Check, Flame } from 'lucide-react-native';
import { Habit } from '../lib/database';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  completionCount: number;
  streak: number;
  onPress: () => void;
  onToggle: () => void;
  compact?: boolean;
}

export function HabitCard({ habit, completed, completionCount, streak, onPress, onToggle, compact = false }: HabitCardProps) {
  const { colors, radius, spacing, fontSizes } = useTheme();
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    checkScale.value = withSpring(completed ? 1 : 0, { damping: 12 });
  }, [completed]);

  useEffect(() => {
    if (completed) {
      scale.value = withSpring(1.03, { damping: 10 }, () => {
        scale.value = withSpring(1, { damping: 12 });
      });
    }
  }, [completed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: completed ? habit.color + '15' : colors.surface,
            borderRadius: radius.md,
            padding: compact ? spacing.sm : spacing.md,
            borderWidth: 1,
            borderColor: completed ? habit.color + '40' : colors.borderLight,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.left}>
          <View style={[styles.emojiWrap, { backgroundColor: habit.color + '20' }]}>
            <Text style={styles.emoji}>{habit.emoji}</Text>
          </View>
          <View style={styles.textWrap}>
            <Text
              style={[
                styles.name,
                {
                  color: completed ? habit.color : colors.text,
                  fontSize: compact ? fontSizes.sm : fontSizes.md,
                  textDecorationLine: completed ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>
            {!compact && habit.target_per_day > 1 && (
              <Text style={{ color: colors.textTertiary, fontSize: fontSizes.xs, marginTop: 2 }}>
                {completionCount}/{habit.target_per_day} today
              </Text>
            )}
          </View>
        </View>
        <View style={styles.right}>
          {streak > 0 && !compact && (
            <View style={[styles.streak, { backgroundColor: colors.accentLight }]}>
              <Flame size={12} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: fontSizes.xs, fontWeight: '600', marginLeft: 2 }}>
                {streak}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.checkBtn,
              {
                backgroundColor: completed ? habit.color : colors.surfaceSecondary,
                borderColor: completed ? habit.color : colors.border,
              },
            ]}
            onPress={onToggle}
            activeOpacity={0.6}
          >
            <Animated.View style={checkAnimatedStyle}>
              <Check size={16} color={completed ? '#FFFFFF' : colors.textTertiary} strokeWidth={3} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  emoji: {
    fontSize: 18,
  },
  textWrap: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
