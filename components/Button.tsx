import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors, radius, spacing, fontSizes } = useTheme();

  const sizeConfig = {
    sm: { paddingV: spacing.sm, paddingH: spacing.md, fontSize: fontSizes.sm },
    md: { paddingV: spacing.md, paddingH: spacing.lg, fontSize: fontSizes.md },
    lg: { paddingV: spacing.md + 2, paddingH: spacing.xl, fontSize: fontSizes.lg },
  }[size];

  const variantStyles = {
    primary: {
      bg: colors.primary,
      text: '#FFFFFF',
    },
    secondary: {
      bg: colors.primaryLight,
      text: colors.primary,
    },
    ghost: {
      bg: 'transparent',
      text: colors.primary,
    },
    danger: {
      bg: colors.danger,
      text: '#FFFFFF',
    },
  }[variant];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.bg,
          borderRadius: radius.md,
          paddingVertical: sizeConfig.paddingV,
          paddingHorizontal: sizeConfig.paddingH,
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: variantStyles.text,
                fontSize: sizeConfig.fontSize,
                fontWeight: '600',
                marginLeft: icon ? 6 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
