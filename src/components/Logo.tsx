import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../theme';

interface LogoProps extends ViewProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 64, style, ...props }) => {
  const { colors, typography } = useTheme();

  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          backgroundColor: colors.primary,
          borderRadius: size * 0.25,
          shadowColor: colors.primary,
        },
        style
      ]}
      {...props}
    >
      <View style={styles.textContainer}>
        <Text style={[
          styles.letter, 
          styles.letterS,
          { 
            color: '#FFFFFF', 
            fontFamily: typography.fontFamily.bold,
            fontSize: size * 0.45 
          }
        ]}>
          S
        </Text>
        <Text style={[
          styles.letter, 
          styles.letterP,
          { 
            color: '#FFFFFF', 
            fontFamily: typography.fontFamily.bold,
            fontSize: size * 0.45 
          }
        ]}>
          P
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  letter: {
    includeFontPadding: false,
  },
  letterS: {
    marginRight: 1,
  },
  letterP: {
  }
});
