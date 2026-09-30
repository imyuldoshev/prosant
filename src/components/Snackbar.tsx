import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';

export type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  onDismiss: () => void;
  duration?: number;
}

export function Snackbar({ visible, message, type = 'success', onDismiss, duration = 3000 }: SnackbarProps) {
  const { colors, typography, radius } = useTheme();
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, duration);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, duration, onDismiss, translateY]);

  if (!visible && translateY.interpolate({ inputRange: [0, 100], outputRange: [0, 100] }) as unknown as number >= 100) return null;

  let Icon = CheckCircle2;
  let bgColor = colors.status.green;
  
  if (type === 'error') {
    Icon = AlertCircle;
    bgColor = colors.status.red;
  } else if (type === 'info') {
    Icon = Info;
    bgColor = colors.primary;
  }

  return (
    <Animated.View style={[
      styles.container, 
      { 
        backgroundColor: bgColor,
        borderRadius: radius.md,
        transform: [{ translateY }]
      }
    ]}>
      <Icon color="#fff" size={20} />
      <Text style={[styles.message, { fontFamily: typography.fontFamily.medium }]}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
});
