import React from 'react';
import { Text } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

/**
 * AppText Component
 * Wrapper around React Native Text to enforce theme consistency.
 * 
 * @param {string} variant - The typography variant key from FONTS (e.g., 'h1', 'body1').
 * @param {string} color - Text color (default: theme textPrimary).
 * @param {object} style - Additional styles.
 * @param {string} fontWeight - Optional font weight override.
 * @param {string} align - Text alignment.
 */
const AppText = ({ 
  children, 
  style, 
  variant = 'body1', 
  color,
  fontWeight,
  align = 'left',
  ...props 
}) => {
  // Get the base style for the variant
  const baseStyle = FONTS[variant] || FONTS.body1;
  
  // Flatten computed styles
  const textStyles = [
    baseStyle,
    color && { color },
    fontWeight && { fontWeight },
    { textAlign: align },
    style,
  ];

  return (
    <Text style={textStyles} {...props}>
      {children}
    </Text>
  );
};

export default AppText;
