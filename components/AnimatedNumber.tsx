
import React, { useState, useEffect, useRef } from 'react';
import { Animated, Easing, Text } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: any;
  decimals?: number;
}

export function AnimatedNumber({ 
  value = 0, 
  duration = 800, 
  style, 
  decimals = 0 
}: AnimatedNumberProps) {
  // Ensure value is always a valid number
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  
  const animation = useRef(new Animated.Value(safeValue)).current;
  const [displayValue, setDisplayValue] = useState(safeValue);

  useEffect(() => {
    const targetValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    
    // Set the starting value for the animation
    animation.setValue(displayValue);
    
    // Animate to the target value
    Animated.timing(animation, {
      toValue: targetValue,
      duration: duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Listen to animation updates
    const listenerId = animation.addListener(({ value: animValue }) => {
      setDisplayValue(animValue);
    });

    // Cleanup listener on unmount or when dependencies change
    return () => {
      animation.removeListener(listenerId);
    };
  }, [value, duration]);

  // Ensure displayValue is always a valid number before calling toFixed
  const safeDisplayValue = typeof displayValue === 'number' && !isNaN(displayValue) ? displayValue : 0;
  const formattedValue = safeDisplayValue.toFixed(decimals);

  return <Text style={style}>{formattedValue}</Text>;
}

export default AnimatedNumber;
