import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface AvatarProps {
  name: string;
  size?: number;
  backgroundColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 40, backgroundColor }) => {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: backgroundColor || colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: '#FFFFFF',
      fontSize: size * 0.4,
      fontFamily: 'Inter_600SemiBold',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{initials}</Text>
    </View>
  );
};
