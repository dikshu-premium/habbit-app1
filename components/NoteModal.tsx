import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { useTheme } from '../hooks/useTheme';
import { MOOD_EMOJIS } from '../constants/theme';
import { DailyNote, upsertNote, deleteNote } from '../lib/database';

interface NoteModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  userId: string;
  existingNote: DailyNote | null;
  onSaved: () => void;
}

export function NoteModal({ visible, onClose, date, userId, existingNote, onSaved }: NoteModalProps) {
  const { colors, radius, spacing, fontSizes } = useTheme();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | null>(null);

  useEffect(() => {
    if (existingNote) {
      setContent(existingNote.content);
      setMood(existingNote.mood);
    } else {
      setContent('');
      setMood(null);
    }
  }, [existingNote, visible]);

  const handleSave = async () => {
    try {
      await upsertNote(userId, date, content, mood);
      onSaved();
      onClose();
    } catch (err) {
      console.error('Save note error:', err);
    }
  };

  const handleDelete = async () => {
    if (existingNote) {
      try {
        await deleteNote(existingNote.id);
        onSaved();
        onClose();
      } catch (err) {
        console.error('Delete note error:', err);
      }
    }
  };

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal visible={visible} onClose={onClose} title="Daily Note">
      <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm, marginBottom: spacing.md, fontWeight: '500' }}>
        {dateLabel}
      </Text>

      <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>Mood</Text>
      <View style={[styles.moodRow, { gap: spacing.sm, marginBottom: spacing.md }]}>
        {MOOD_EMOJIS.map((m) => (
          <View
            key={m}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: mood === m ? colors.primaryLight : colors.surfaceSecondary,
              borderWidth: 2,
              borderColor: mood === m ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onTouchEnd={() => setMood(mood === m ? null : m)}
          >
            <Text style={{ fontSize: 20 }}>{m}</Text>
          </View>
        ))}
      </View>

      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: colors.surfaceSecondary,
            color: colors.text,
            borderRadius: radius.md,
            borderColor: colors.border,
            fontSize: fontSizes.md,
            padding: spacing.md,
          },
        ]}
        multiline
        placeholder="Write your thoughts..."
        placeholderTextColor={colors.textTertiary}
        value={content}
        onChangeText={setContent}
        textAlignVertical="top"
      />

      <View style={[styles.actions, { marginTop: spacing.lg, gap: spacing.md, marginBottom: spacing.xl }]}>
        {existingNote && (
          <Button title="Delete" variant="danger" onPress={handleDelete} style={{ flex: 1 }} />
        )}
        <Button title="Save Note" onPress={handleSave} style={{ flex: 1 }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 6 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap' },
  textInput: {
    minHeight: 120,
    borderWidth: 1,
    lineHeight: 22,
  },
  actions: { flexDirection: 'row' },
});
