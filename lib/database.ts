import { supabase } from './supabase';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  is_archived: boolean;
  reminder_enabled: boolean;
  reminder_time: string | null;
  reminder_message: string | null;
  target_per_day: number;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  count: number;
  created_at: string;
}

export interface DailyNote {
  id: string;
  user_id: string;
  date: string;
  content: string;
  mood: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  theme: 'light' | 'dark' | 'system';
  accent_color: string;
  font_size: number;
  pin_lock: string | null;
  biometric_enabled: boolean;
  morning_reminder: boolean;
  evening_reminder: boolean;
  reminder_time_morning: string;
  reminder_time_evening: string;
  created_at: string;
  updated_at: string;
}

// Auth helpers
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (data.user) {
    await supabase.from('profiles').insert({ id: data.user.id });
  }
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Profile
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Habits
export async function getHabits(userId: string, includeArchived = false): Promise<Habit[]> {
  let query = supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (!includeArchived) query = query.eq('is_archived', false);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert(habit)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', habitId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteHabit(habitId: string) {
  const { error } = await supabase.from('habits').delete().eq('id', habitId);
  if (error) throw error;
}

// Completions
export async function getCompletions(userId: string, startDate: string, endDate: string): Promise<HabitCompletion[]> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);
  if (error) throw error;
  return data || [];
}

export async function toggleCompletion(habitId: string, userId: string, date: string, targetPerDay: number = 1): Promise<HabitCompletion> {
  const { data: existing, error: fetchError } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('habit_id', habitId)
    .eq('date', date)
    .maybeSingle();
  if (fetchError) throw fetchError;

  if (existing) {
    const newCount = existing.count >= targetPerDay ? 0 : existing.count + 1;
    if (newCount === 0) {
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
      return { ...existing, count: 0 };
    }
    const { data, error } = await supabase
      .from('habit_completions')
      .update({ count: newCount })
      .eq('id', existing.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('habit_completions')
    .insert({ habit_id: habitId, user_id: userId, date, count: 1 })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCompletionForDate(habitId: string, date: string): Promise<HabitCompletion | null> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('habit_id', habitId)
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Notes
export async function getNotes(userId: string, startDate: string, endDate: string): Promise<DailyNote[]> {
  const { data, error } = await supabase
    .from('daily_notes')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);
  if (error) throw error;
  return data || [];
}

export async function getNoteForDate(userId: string, date: string): Promise<DailyNote | null> {
  const { data, error } = await supabase
    .from('daily_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertNote(userId: string, date: string, content: string, mood: string | null): Promise<DailyNote> {
  const { data, error } = await supabase
    .from('daily_notes')
    .upsert(
      { user_id: userId, date, content, mood, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteNote(noteId: string) {
  const { error } = await supabase.from('daily_notes').delete().eq('id', noteId);
  if (error) throw error;
}

// Analytics helpers
export async function getHabitStreak(habitId: string, userId: string): Promise<number> {
  const today = new Date();
  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('habit_completions')
      .select('count')
      .eq('habit_id', habitId)
      .eq('date', dateStr)
      .maybeSingle();
    if (error) break;
    if (data && data.count > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function getHabitCompletionRate(habitId: string, userId: string, days: number): Promise<number> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('habit_completions')
    .select('date')
    .eq('habit_id', habitId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);
  if (error) throw error;
  return data ? (data.length / days) * 100 : 0;
}

export async function getCompletionHeatmap(userId: string, year: number): Promise<Record<string, number>> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const { data, error } = await supabase
    .from('habit_completions')
    .select('date')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);
  if (error) throw error;

  const heatmap: Record<string, number> = {};
  (data || []).forEach((row) => {
    heatmap[row.date] = (heatmap[row.date] || 0) + 1;
  });
  return heatmap;
}
