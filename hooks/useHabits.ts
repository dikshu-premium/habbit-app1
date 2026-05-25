import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  Habit,
  HabitCompletion,
  getHabits,
  getCompletions,
  toggleCompletion as dbToggle,
  createHabit as dbCreate,
  updateHabit as dbUpdate,
  deleteHabit as dbDelete,
} from '../lib/database';

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHabits = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getHabits(user.id);
      setHabits(data);
    } catch (err) {
      console.error('Load habits error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadCompletions = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return;
    try {
      const data = await getCompletions(user.id, startDate, endDate);
      setCompletions(data);
    } catch (err) {
      console.error('Load completions error:', err);
    }
  }, [user]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const toggleCompletion = async (habitId: string, date: string) => {
    if (!user) return;
    const habit = habits.find(h => h.id === habitId);
    try {
      await dbToggle(habitId, user.id, date, habit?.target_per_day);
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      await loadCompletions(start.toISOString().split('T')[0], '2099-12-31');
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const createHabit = async (habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await dbCreate(habit);
      await loadHabits();
    } catch (err) {
      console.error('Create habit error:', err);
      throw err;
    }
  };

  const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
    try {
      await dbUpdate(habitId, updates);
      await loadHabits();
    } catch (err) {
      console.error('Update habit error:', err);
      throw err;
    }
  };

  const archiveHabit = async (habitId: string) => {
    await updateHabit(habitId, { is_archived: true });
  };

  const unarchiveHabit = async (habitId: string) => {
    await updateHabit(habitId, { is_archived: false });
  };

  const removeHabit = async (habitId: string) => {
    try {
      await dbDelete(habitId);
      await loadHabits();
    } catch (err) {
      console.error('Delete habit error:', err);
      throw err;
    }
  };

  const getCompletionForHabitDate = (habitId: string, date: string): number => {
    const comp = completions.find(c => c.habit_id === habitId && c.date === date);
    return comp?.count || 0;
  };

  const isHabitCompleted = (habitId: string, date: string): boolean => {
    const habit = habits.find(h => h.id === habitId);
    const count = getCompletionForHabitDate(habitId, date);
    return count >= (habit?.target_per_day || 1);
  };

  return {
    habits,
    completions,
    loading,
    loadCompletions,
    toggleCompletion,
    createHabit,
    updateHabit,
    archiveHabit,
    unarchiveHabit,
    removeHabit,
    getCompletionForHabitDate,
    isHabitCompleted,
    refreshHabits: loadHabits,
  };
}
