import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';

/**
 * ScreenWrapper Component
 * Handles safe area insets and standard padding for screens.
 */
const ScreenWrapperContent = ({ 
  children, 
  style, 
  backgroundColor = COLORS.surface,
  withPadding = true 
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }
    ]}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={backgroundColor} 
        translucent={Platform.OS === 'android'}
      />
      <View 
        style={[
          styles.content, 
          withPadding && styles.padding,
          style
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const ScreenWrapper = (props) => (
  <SafeAreaProvider>
    <ScreenWrapperContent {...props} />
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: SPACING.m,
  }
});

export default ScreenWrapper;
