import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

const ScreenWrapper = ({ children, backgroundColor = COLORS.white, withPadding = true }) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['right', 'top', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <View style={[
        styles.content, 
        { backgroundColor },
        withPadding && styles.padding
      ]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: 16,
  },
});

export default ScreenWrapper;
