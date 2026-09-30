import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, style, ...props }) => {
  const { colors, radius, spacing } = useTheme();

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.card, 
          borderRadius: radius.lg,
          padding: spacing.md,
          borderColor: colors.border,
          borderWidth: 1,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  }
});
