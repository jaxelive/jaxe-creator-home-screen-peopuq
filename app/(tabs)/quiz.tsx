
import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import QuizComponent from '@/components/QuizComponent';
import { useFocusEffect } from '@react-navigation/native';

// Hardcoded creator handle - no authentication needed
const CREATOR_HANDLE = 'avelezsanti';

export default function QuizScreen() {
  const { quizId, quizTitle } = useLocalSearchParams<{ 
    quizId: string;
    quizTitle: string;
  }>();

  const handleQuizComplete = (passed: boolean, score: number) => {
    console.log('[QuizScreen] Quiz completed:', { passed, score });
  };

  const handleClose = () => {
    router.back();
  };

  // Prevent going back during quiz
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  if (!quizId) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <View style={styles.container}>
        <QuizComponent
          quizId={quizId}
          creatorHandle={CREATOR_HANDLE}
          onComplete={handleQuizComplete}
          onClose={handleClose}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
