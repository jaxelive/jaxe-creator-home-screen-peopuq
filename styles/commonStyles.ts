
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Dark theme color palette - FLAT COLORS ONLY (NO GRADIENTS)
export const colors = {
  // Primary color - flat purple
  primary: '#6642EF',           // Primary purple (flat)
  primaryLight: '#8B5CF6',      // Light purple
  primaryDark: '#5B34D1',       // Deep purple
  
  // Accent colors
  accent: '#EC4899',            // Pink accent
  accentLight: '#F9A8D4',       // Light pink
  
  // Secondary colors
  secondary: '#06B6D4',         // Cyan
  secondaryLight: '#67E8F9',    // Light cyan
  
  // Background colors - dark theme
  background: '#0F0F0F',        // Very dark grey (almost black)
  backgroundAlt: '#1A1A1A',     // Dark grey for cards
  backgroundCard: '#1F1F1F',    // Slightly lighter for elevated cards
  backgroundGradientStart: '#1A1A1A',
  backgroundGradientEnd: '#0F0F0F',
  
  // Text colors - adjusted for dark theme
  text: '#FFFFFF',              // White for primary text
  textSecondary: '#A0A0A0',     // Light grey for secondary text
  textTertiary: '#707070',      // Medium grey for tertiary text
  
  // UI elements
  grey: '#2A2A2A',              // Dark grey for backgrounds
  greyMedium: '#3A3A3A',        // Medium grey
  greyDark: '#1A1A1A',          // Darker grey
  
  // Status colors
  success: '#10B981',           // Green
  successLight: '#6EE7B7',      // Light green
  warning: '#F59E0B',           // Orange
  warningLight: '#FCD34D',      // Light orange
  error: '#EF4444',             // Red
  errorLight: '#FCA5A5',        // Light red
  
  // Special colors
  border: '#2A2A2A',            // Dark border
  shadow: 'rgba(0, 0, 0, 0.5)', // Dark shadow
  overlay: 'rgba(0, 0, 0, 0.7)', // Dark overlay
  
  // Gradient colors for cards (kept for backwards compatibility but should use flat colors)
  gradientPurple: ['#6642EF', '#6642EF'],
  gradientPink: ['#EC4899', '#EC4899'],
  gradientCyan: ['#06B6D4', '#06B6D4'],
  gradientSunset: ['#F59E0B', '#F59E0B'],
  gradientOcean: ['#06B6D4', '#06B6D4'],
  gradientDark: ['#1F1F1F', '#1F1F1F'],
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.backgroundAlt,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 24,
    padding: 20,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.primary,
  },
});
