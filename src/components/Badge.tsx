import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../theme';

interface BadgeProps extends ViewProps {
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
  label: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', label, style, ...props }) => {
  const { colors, radius, spacing, typography } = useTheme();

  let bgColor = colors.card;
  let textColor = colors.text;

  switch (variant) {
    case 'success':
      bgColor = `${colors.status.green}20`; // 20% opacity
      textColor = colors.status.green;
      break;
    case 'warning':
      bgColor = `${colors.status.amber}20`;
      textColor = colors.status.amber;
      break;
    case 'danger':
      bgColor = `${colors.status.red}20`;
      textColor = colors.status.red;
      break;
    case 'neutral':
    default:
      bgColor = colors.border;
      textColor = colors.muted;
      break;
  }

  return (
    <View 
      style={[
        styles.badge, 
        { backgroundColor: bgColor, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2 },
        style
      ]} 
      {...props}
    >
      <Text style={{ color: textColor, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs }}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  }
});
