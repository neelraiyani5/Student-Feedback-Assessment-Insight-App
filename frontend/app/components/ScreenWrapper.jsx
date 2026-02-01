import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

/**
 * ScreenWrapper Component
 * Handles safe area insets and standard padding for screens.
 * 
 * @param {ReactNode} children - Screen content.
 * @param {object} style - Additional styles for the content container.
 * @param {string} backgroundColor - Background color for the screen (default: theme surface).
 * @param {boolean} withPadding - Whether to apply standard horizontal padding (default: true).
 */
const ScreenWrapper = ({ 
  children, 
  style, 
  backgroundColor = COLORS.surface,
  withPadding = true 
}) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: SPACING.m,
  }
});

export default ScreenWrapper;
