import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
  elevation?: number;
}

export function Card({ children, style, onPress, padding = 16, elevation = 1 }: CardProps) {
  const { colors, radius } = useTheme();
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding,
          shadowColor: colors.shadow,
          shadowOpacity: elevation * 0.5,
          shadowRadius: elevation * 4,
          shadowOffset: { width: 0, height: elevation * 2 },
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
});
