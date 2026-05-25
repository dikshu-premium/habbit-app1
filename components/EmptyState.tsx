import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Calendar } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, message, icon }: EmptyStateProps) {
  const { colors, spacing, fontSizes } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xl }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight, marginBottom: spacing.lg }]}>
        {icon || <Calendar size={32} color={colors.primary} />}
      </View>
      <Text style={[styles.title, { color: colors.text, fontSize: fontSizes.xl, marginBottom: spacing.sm }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary, fontSize: fontSizes.md }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
