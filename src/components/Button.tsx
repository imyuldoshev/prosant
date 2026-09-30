import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';
import { useTheme } from '../theme';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary';
  title: string;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  title, 
  loading = false, 
  icon,
  disabled,
  style,
  ...props 
}) => {
  const { colors, spacing, radius, typography } = useTheme();

  const isPrimary = variant === 'primary';
  const bgColor = isPrimary ? colors.primary : colors.card;
  const textColor = isPrimary ? '#FFFFFF' : colors.text;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor, borderRadius: radius.md, padding: spacing.md },
        (disabled || loading) && { opacity: 0.7 },
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[
            styles.text, 
            { color: textColor, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.md }
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
  }
});
