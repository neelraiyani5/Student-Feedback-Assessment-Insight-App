import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Width Percentage
 * Converts a width percentage to independent pixels.
 * @param {string|number} widthPercent - The percentage of the screen width (e.g., "50%" or 50).
 * @returns {number} The calculated width in pixels.
 */
const wp = (widthPercent) => {
  const elemWidth = typeof widthPercent === "number" ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100);
};

/**
 * Height Percentage
 * Converts a height percentage to independent pixels.
 * @param {string|number} heightPercent - The percentage of the screen height (e.g., "50%" or 50).
 * @returns {number} The calculated height in pixels.
 */
const hp = (heightPercent) => {
  const elemHeight = typeof heightPercent === "number" ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100);
};

/**
 * Responsive Font
 * Scales the font size based on the screen width.
 * Standard screen width used is 375 (iPhone X/11/12/13).
 * @param {number} size - The font size to scale.
 * @returns {number} The scaled font size.
 */
const rf = (size) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    // Android fonts tend to look slightly larger, so we adjust.
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};

export { wp, hp, rf, SCREEN_WIDTH, SCREEN_HEIGHT };
