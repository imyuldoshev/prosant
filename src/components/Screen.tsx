import React from 'react';
import { StyleSheet, ViewProps, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
}

export const Screen: React.FC<ScreenProps> = ({ children, style, ...props }) => {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView 
      style={[
        styles.screen, 
        { backgroundColor: colors.background }, 
        style
      ]} 
      {...props}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  }
});
