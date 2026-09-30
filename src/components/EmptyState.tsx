import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../theme';
import { Inbox } from 'lucide-react-native';

interface EmptyStateProps extends ViewProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon,
  style, 
  ...props 
}) => {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xl }, style]} {...props}>
      <View style={[styles.iconContainer, { backgroundColor: colors.card, marginBottom: spacing.md }]}>
        {icon || <Inbox size={48} color={colors.muted} />}
      </View>
      <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.lg, marginBottom: spacing.xs }]}>
        {title}
      </Text>
      {description && (
        <Text style={[styles.description, { color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm }]}>
          {description}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  }
});
