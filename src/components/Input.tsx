import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon, 
  isPassword,
  style,
  ...props 
}) => {
  const { colors, spacing, radius, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);

  return (
    <View style={[{ marginBottom: spacing.md }, style as any]}>
      {label ? (
        <Text style={[
          styles.label,
          { color: colors.text, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, marginBottom: spacing.xs }
        ]}>
          {label}
        </Text>
      ) : null}
      
      <View style={[
        styles.inputContainer,
        { 
          backgroundColor: colors.card,
          borderColor: isFocused ? colors.primary : colors.border,
          borderRadius: radius.md,
          borderWidth: 1,
          paddingHorizontal: spacing.md,
          height: 48,
        }
      ]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        
        <TextInput
          style={[
            styles.input,
            { 
              color: colors.text, 
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.fontSize.md,
              flex: 1,
              paddingVertical: 0,
              textAlignVertical: 'center',
            }
          ]}
          placeholderTextColor={colors.muted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity 
            onPress={() => setSecureTextEntry(!secureTextEntry)}
            style={styles.eyeIcon}
          >
            {secureTextEntry ? (
              <EyeOff size={20} color={colors.muted} />
            ) : (
              <Eye size={20} color={colors.muted} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={[
          styles.error,
          { color: colors.status.red, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, marginTop: spacing.xs }
        ]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
  },
  eyeIcon: {
    padding: 8,
    marginRight: -8,
  },
  error: {},
});
