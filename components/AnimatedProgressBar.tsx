
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedProgressBarProps {
  percentage: number;
  duration?: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  borderRadius?: number;
  containerStyle?: ViewStyle;
  delay?: number;
}

/**
 * Animated progress bar component
 * Smoothly animates fill from 0 to target percentage on mount, then from previous to new percentage
 */
export function AnimatedProgressBar({
  percentage,
  duration = 800,
  height = 12,
  backgroundColor = '#2A2A2A',
  fillColor = '#6642EF',
  borderRadius = 12,
  containerStyle,
  delay = 0,
}: AnimatedProgressBarProps) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const animatedPercentage = useSharedValue(0);

  useEffect(() => {
    // On mount, animate from 0 to the target percentage
    const timer = setTimeout(() => {
      animatedPercentage.value = withTiming(Math.min(percentage, 100), {
        duration,
        easing: Easing.out(Easing.cubic),
      });
      setHasAnimated(true);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // After initial animation, update when percentage changes
    if (hasAnimated) {
      animatedPercentage.value = withTiming(Math.min(percentage, 100), {
        duration: duration * 0.6, // Faster for subsequent updates
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [percentage, hasAnimated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedPercentage.value}%`,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor,
          borderRadius,
        },
        containerStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: fillColor,
            borderRadius,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
});
