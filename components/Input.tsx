import { TextInput, View, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, rightIcon, secureTextEntry, ...props }: InputProps) {
  const { colors, radius, spacing, fontSizes } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, { marginBottom: spacing.md }]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSizes.sm, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}
      <View style={[
        styles.inputWrapper,
        {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
        },
      ]}>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, fontSize: fontSizes.md, padding: spacing.md },
          ]}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secureTextEntry && !showPassword}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            {showPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.danger, fontSize: fontSizes.sm, marginTop: spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: { fontWeight: '500' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1 },
  eyeIcon: { paddingRight: 12 },
  rightIcon: { paddingRight: 12 },
  error: {},
});
