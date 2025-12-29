
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  ZoomOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { IconSymbol } from '@/components/IconSymbol';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface QuizAnswer {
  id: string;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  order_index: number;
  answers: QuizAnswer[];
}

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  passing_score: number;
  required_correct_answers: number;
  total_questions: number;
  questions: QuizQuestion[];
}

interface QuizComponentProps {
  quizId: string;
  creatorHandle: string;
  onComplete: (passed: boolean, score: number) => void;
  onClose: () => void;
}

export default function QuizComponent({ quizId, creatorHandle, onComplete, onClose }: QuizComponentProps) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: string }>({});
  const [questionLocked, setQuestionLocked] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Animation values
  const progressValue = useSharedValue(0);
  const analyzingProgress = useSharedValue(0);
  const scoreAnimValue = useSharedValue(0);

  useEffect(() => {
    console.log('[QuizComponent] Mounted with quizId:', quizId, 'creatorHandle:', creatorHandle);
    if (!quizId) {
      console.error('[QuizComponent] No quizId provided!');
      setError('Quiz ID is missing');
      setLoading(false);
      return;
    }
    
    fetchQuizData();
  }, [quizId]);

  // Animate progress bar
  useEffect(() => {
    if (quizData) {
      const targetProgress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
      progressValue.value = withSpring(targetProgress, {
        damping: 15,
        stiffness: 100,
      });
    }
  }, [currentQuestionIndex, quizData]);

  // Animate analyzing progress
  useEffect(() => {
    if (analyzing) {
      analyzingProgress.value = 0;
      analyzingProgress.value = withTiming(100, {
        duration: 2000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [analyzing]);

  // Animate score counting
  useEffect(() => {
    if (showResults) {
      scoreAnimValue.value = 0;
      scoreAnimValue.value = withTiming(score, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [showResults, score]);

  const fetchQuizData = async () => {
    try {
      console.log('[QuizComponent] Starting fetchQuizData for quizId:', quizId);
      setLoading(true);
      setError(null);

      // Fetch quiz details
      console.log('[QuizComponent] Fetching quiz from course_quizzes...');
      const { data: quiz, error: quizError } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) {
        console.error('[QuizComponent] Error fetching quiz:', quizError);
        setError('Failed to load quiz. Please try again.');
        throw quizError;
      }

      if (!quiz) {
        console.error('[QuizComponent] Quiz not found for id:', quizId);
        setError('Quiz not found');
        setLoading(false);
        return;
      }

      console.log('[QuizComponent] Quiz fetched successfully:', {
        id: quiz.id,
        title: quiz.title,
        required_correct_answers: quiz.required_correct_answers,
        total_questions: quiz.total_questions,
        passing_score: quiz.passing_score,
      });

      // Fetch questions
      console.log('[QuizComponent] Fetching questions from quiz_questions...');
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

      if (questionsError) {
        console.error('[QuizComponent] Error fetching questions:', questionsError);
        setError('Failed to load quiz questions. Please try again.');
        throw questionsError;
      }

      if (!questions || questions.length === 0) {
        console.error('[QuizComponent] No questions found for quiz:', quizId);
        setError('No questions found for this quiz');
        setLoading(false);
        return;
      }

      console.log('[QuizComponent] Questions fetched:', questions.length, 'questions');

      // Fetch answers for all questions
      const questionIds = questions.map(q => q.id);
      console.log('[QuizComponent] Fetching answers for', questionIds.length, 'questions...');
      
      const { data: answers, error: answersError } = await supabase
        .from('quiz_answers')
        .select('*')
        .in('question_id', questionIds)
        .order('order_index', { ascending: true });

      if (answersError) {
        console.error('[QuizComponent] Error fetching answers:', answersError);
        setError('Failed to load quiz answers. Please try again.');
        throw answersError;
      }

      if (!answers || answers.length === 0) {
        console.error('[QuizComponent] No answers found for questions');
        setError('No answers found for quiz questions');
        setLoading(false);
        return;
      }

      console.log('[QuizComponent] Answers fetched:', answers.length, 'answers');

      // Group answers by question
      const questionsWithAnswers: QuizQuestion[] = questions.map(question => {
        const questionAnswers = answers.filter(a => a.question_id === question.id);
        console.log(`[QuizComponent] Question "${question.question_text.substring(0, 50)}..." has ${questionAnswers.length} answers`);
        
        return {
          id: question.id,
          question_text: question.question_text,
          order_index: question.order_index,
          answers: questionAnswers,
        };
      });

      const quizDataToSet = {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passing_score: quiz.passing_score,
        required_correct_answers: quiz.required_correct_answers || 0,
        total_questions: quiz.total_questions || questions.length,
        questions: questionsWithAnswers,
      };

      console.log('[QuizComponent] Setting quiz data with', questionsWithAnswers.length, 'questions, required correct:', quiz.required_correct_answers);
      setQuizData(quizDataToSet);
      console.log('[QuizComponent] Quiz data set successfully!');
    } catch (error: any) {
      console.error('[QuizComponent] Exception in fetchQuizData:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      console.log('[QuizComponent] fetchQuizData completed, loading set to false');
    }
  };

  const handleAnswerSelect = async (questionId: string, answerId: string) => {
    if (questionLocked) {
      console.log('[QuizComponent] Question locked, ignoring answer selection');
      return;
    }

    console.log('[QuizComponent] Answer selected:', { questionId, answerId });
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Lock the question to prevent double-taps
    setQuestionLocked(true);
    
    // Update selected answer
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId,
    }));

    // Check if this is the last question
    if (quizData && currentQuestionIndex === quizData.questions.length - 1) {
      // Last question - show analyzing animation then submit
      console.log('[QuizComponent] Last question answered, showing analyzing animation');
      
      // Wait a bit to show the selection
      setTimeout(() => {
        setAnalyzing(true);
        
        // Show analyzing for 2 seconds
        setTimeout(() => {
          setAnalyzing(false);
          handleSubmit();
        }, 2000);
      }, 300);
    } else {
      // Not the last question - auto-advance after a short delay
      console.log('[QuizComponent] Auto-advancing to next question');
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionLocked(false);
      }, 400);
    }
  };

  const handleNext = () => {
    console.log('[QuizComponent] Moving to next question');
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    console.log('[QuizComponent] Moving to previous question');
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quizData) {
      console.error('[QuizComponent] Cannot submit - no quiz data');
      return;
    }

    console.log('[QuizComponent] Submitting quiz');

    // Check if all questions are answered
    const unansweredQuestions = quizData.questions.filter(
      (q) => !selectedAnswers[q.id]
    );

    if (unansweredQuestions.length > 0) {
      console.log('[QuizComponent] Unanswered questions:', unansweredQuestions.length);
      Alert.alert(
        'Incomplete Quiz',
        `Please answer all questions before submitting. ${unansweredQuestions.length} question(s) remaining.`
      );
      setQuestionLocked(false);
      return;
    }

    try {
      setSubmitting(true);

      // Calculate score
      let correct = 0;
      
      quizData.questions.forEach(question => {
        const selectedAnswerId = selectedAnswers[question.id];
        const selectedAnswer = question.answers.find(a => a.id === selectedAnswerId);
        if (selectedAnswer?.is_correct) {
          correct++;
        }
      });

      const totalQuestions = quizData.questions.length;
      const scorePercentage = Math.round((correct / totalQuestions) * 100);
      
      // Use required_correct_answers from database to determine pass/fail
      const requiredCorrect = quizData.required_correct_answers || 0;
      const passed = correct >= requiredCorrect;

      console.log('[QuizComponent] Quiz results:', { 
        correct, 
        totalQuestions, 
        scorePercentage, 
        passed,
        required: requiredCorrect 
      });

      setCorrectCount(correct);
      setScore(scorePercentage);

      // Save attempt to database
      console.log('[QuizComponent] Saving quiz attempt to database...');
      const { error } = await supabase
        .from('user_quiz_attempts')
        .insert({
          creator_handle: creatorHandle,
          quiz_id: quizId,
          score: scorePercentage,
          passed: passed,
          answers: selectedAnswers,
        });

      if (error) {
        console.error('[QuizComponent] Error saving quiz attempt:', error);
      } else {
        console.log('[QuizComponent] Quiz attempt saved successfully');
      }

      setShowResults(true);
      onComplete(passed, scorePercentage);
    } catch (error: any) {
      console.error('[QuizComponent] Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
      setQuestionLocked(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    console.log('[QuizComponent] Retrying quiz');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setCorrectCount(0);
    setQuestionLocked(false);
    setAnalyzing(false);
  };

  const progressAnimStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value}%`,
    };
  });

  const analyzingProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${analyzingProgress.value}%`,
    };
  });

  const scoreCountStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scoreAnimValue.value, [0, score], [0, 1]),
    };
  });

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.container}>
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={styles.centerContent}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </Animated.View>
      </View>
    );
  }

  if (error || !quizData) {
    return (
      <View style={styles.container}>
        <Animated.View 
          entering={ZoomIn.duration(400)}
          style={styles.centerContent}
        >
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="error"
            size={64}
            color={colors.error}
          />
          <Text style={styles.errorTitle}>Unable to Load Quiz</Text>
          <Text style={styles.errorText}>
            {error || 'Quiz not found. Please try again later.'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={fetchQuizData}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Show analyzing animation
  if (analyzing) {
    return (
      <View style={styles.container}>
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={styles.centerContent}
        >
          <Animated.View
            entering={ZoomIn.springify().damping(15)}
            style={styles.analyzingIconContainer}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </Animated.View>
          
          <Animated.Text 
            entering={FadeIn.delay(200).duration(400)}
            style={styles.analyzingTitle}
          >
            Analyzing your answers...
          </Animated.Text>
          
          <Animated.Text 
            entering={FadeIn.delay(400).duration(400)}
            style={styles.analyzingSubtitle}
          >
            Calculating your score
          </Animated.Text>

          <Animated.View 
            entering={FadeIn.delay(600).duration(400)}
            style={styles.analyzingProgressContainer}
          >
            <View style={styles.analyzingProgressBar}>
              <Animated.View 
                style={[styles.analyzingProgressFill, analyzingProgressStyle]} 
              />
            </View>
            <View style={styles.analyzingSteps}>
              <Animated.Text 
                entering={FadeIn.delay(800).duration(300)}
                style={styles.analyzingStep}
              >
                ✓ Checking accuracy
              </Animated.Text>
              <Animated.Text 
                entering={FadeIn.delay(1200).duration(300)}
                style={styles.analyzingStep}
              >
                ✓ Applying pass threshold
              </Animated.Text>
              <Animated.Text 
                entering={FadeIn.delay(1600).duration(300)}
                style={styles.analyzingStep}
              >
                ✓ Preparing results
              </Animated.Text>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  if (showResults) {
    const passed = correctCount >= (quizData.required_correct_answers || 0);

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="xmark"
              android_material_icon_name="close"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz Results</Text>
          <View style={styles.backButton} />
        </View>

        <Animated.View 
          entering={ZoomIn.springify().damping(15).delay(100)}
          style={[styles.resultsCard, passed ? styles.passedCard : styles.failedCard]}
        >
          <Animated.View 
            entering={ZoomIn.springify().damping(12).delay(300)}
            style={styles.resultsIconContainer}
          >
            <IconSymbol
              ios_icon_name={passed ? "checkmark.circle.fill" : "xmark.circle.fill"}
              android_material_icon_name={passed ? "check-circle" : "cancel"}
              size={80}
              color={passed ? colors.primary : colors.error}
            />
          </Animated.View>

          <Animated.Text 
            entering={FadeIn.delay(500).duration(400)}
            style={styles.resultsTitle}
          >
            {passed ? 'Congratulations!' : 'Not Quite There'}
          </Animated.Text>

          <Animated.Text 
            entering={FadeIn.delay(600).duration(400)}
            style={styles.resultsSubtitle}
          >
            {passed
              ? 'You passed the quiz!'
              : 'You need more correct answers to pass.'}
          </Animated.Text>

          <Animated.View 
            entering={FadeIn.delay(700).duration(400)}
            style={styles.scoreContainer}
          >
            <Text style={styles.scoreLabel}>Your Score</Text>
            
            <Animated.View style={styles.scoreCircle}>
              <Animated.Text style={[styles.scoreValue, scoreCountStyle]}>
                {score}%
              </Animated.Text>
            </Animated.View>
            
            <Animated.Text 
              entering={FadeIn.delay(1200).duration(400)}
              style={styles.scoreDetails}
            >
              {correctCount} out of {quizData.questions.length} correct
            </Animated.Text>
            <Animated.Text 
              entering={FadeIn.delay(1400).duration(400)}
              style={styles.scoreRequirement}
            >
              Required: {quizData.required_correct_answers} correct answers ({Math.round((quizData.required_correct_answers / quizData.questions.length) * 100)}%)
            </Animated.Text>
          </Animated.View>

          <Animated.View 
            entering={FadeIn.delay(1600).duration(400)}
            style={styles.resultsButtons}
          >
            <TouchableOpacity
              style={styles.retryButtonLarge}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="arrow.clockwise"
                android_material_icon_name="refresh"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.retryButtonTextLarge}>Retake Quiz</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>
                {passed ? 'Continue Learning' : 'Back to Academy'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    );
  }

  // Render current question
  const currentQuestion = quizData.questions[currentQuestionIndex];
  const selectedAnswerId = selectedAnswers[currentQuestion.id];
  const totalQuestions = quizData.questions.length;

  return (
    <View style={styles.container}>
      {/* Animated background gradient */}
      <LinearGradient
        colors={['rgba(102, 66, 239, 0.03)', 'rgba(0, 0, 0, 0)']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="xmark"
            android_material_icon_name="close"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quizData.title}</Text>
        <View style={styles.backButton} />
      </View>

      <Animated.View 
        entering={FadeIn.duration(300)}
        style={styles.progressContainer}
      >
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, progressAnimStyle]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Text>
      </Animated.View>

      <ScrollView style={styles.quizContent} contentContainerStyle={styles.quizContentContainer}>
        <Animated.View
          key={`question-${currentQuestionIndex}`}
          entering={SlideInRight.duration(250).springify().damping(15)}
          exiting={SlideOutLeft.duration(200)}
        >
          <Animated.View 
            entering={FadeIn.delay(100).duration(300)}
            style={styles.questionCard}
          >
            <Text style={styles.questionText}>
              {currentQuestion.question_text}
            </Text>
          </Animated.View>

          <View style={styles.answersContainer}>
            {currentQuestion.answers.map((answer: QuizAnswer, index: number) => {
              const isSelected = selectedAnswerId === answer.id;

              return (
                <AnimatedAnswerCard
                  key={answer.id}
                  answer={answer}
                  isSelected={isSelected}
                  onPress={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                  disabled={questionLocked}
                  index={index}
                />
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View 
        entering={FadeIn.delay(200).duration(300)}
        style={styles.navigationContainer}
      >
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestionIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="chevron-left"
            size={20}
            color={currentQuestionIndex === 0 ? colors.grey : colors.primary}
          />
          <Text style={[
            styles.navButtonText,
            currentQuestionIndex === 0 && styles.navButtonTextDisabled,
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <View style={styles.navButton}>
            <Text style={styles.navButtonTextInfo}>
              Select answer to finish
            </Text>
          </View>
        ) : (
          <View style={styles.navButton}>
            <Text style={styles.navButtonTextInfo}>
              Select answer to continue
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// Animated Answer Card Component
function AnimatedAnswerCard({ 
  answer, 
  isSelected, 
  onPress, 
  disabled,
  index 
}: { 
  answer: QuizAnswer; 
  isSelected: boolean; 
  onPress: () => void; 
  disabled: boolean;
  index: number;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withSpring(1.02, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    opacity.value = withTiming(1, { duration: 150 });
  };

  return (
    <Animated.View
      entering={FadeIn.delay(150 + index * 80).duration(300)}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[
          styles.answerCard,
          isSelected && styles.answerCardSelected,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
      >
        {isSelected && (
          <LinearGradient
            colors={['rgba(102, 66, 239, 0.15)', 'rgba(102, 66, 239, 0.05)']}
            style={styles.answerCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        
        <Animated.View 
          style={[
            styles.answerRadio,
            isSelected && styles.answerRadioSelected,
          ]}
        >
          {isSelected && (
            <Animated.View 
              entering={ZoomIn.springify().damping(12)}
              style={styles.answerRadioInner} 
            />
          )}
        </Animated.View>
        
        <Text style={[
          styles.answerText,
          isSelected && styles.answerTextSelected,
        ]}>
          {answer.answer_text}
        </Text>

        {isSelected && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={styles.answerCheckmark}
          >
            <IconSymbol
              ios_icon_name="checkmark"
              android_material_icon_name="check"
              size={16}
              color={colors.primary}
            />
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  analyzingIconContainer: {
    marginBottom: 24,
  },
  analyzingTitle: {
    marginTop: 24,
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    textAlign: 'center',
  },
  analyzingSubtitle: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  analyzingProgressContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 32,
  },
  analyzingProgressBar: {
    height: 6,
    backgroundColor: colors.grey,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 24,
  },
  analyzingProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  analyzingSteps: {
    gap: 12,
  },
  analyzingStep: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.grey,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quizContent: {
    flex: 1,
  },
  quizContentContainer: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.grey,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.3)',
    elevation: 3,
  },
  questionText: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    lineHeight: 30,
  },
  answersContainer: {
    gap: 14,
  },
  answerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.grey,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
    elevation: 2,
  },
  answerCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  answerCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundCard,
    boxShadow: '0px 4px 16px rgba(102, 66, 239, 0.3)',
    elevation: 4,
  },
  answerRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.grey,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  answerRadioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  answerRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  answerText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    lineHeight: 24,
  },
  answerTextSelected: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  answerCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(102, 66, 239, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grey,
    gap: 12,
    backgroundColor: colors.background,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primary,
  },
  navButtonTextDisabled: {
    color: colors.grey,
  },
  navButtonTextInfo: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  resultsCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.4)',
    elevation: 6,
  },
  passedCard: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  failedCard: {
    borderWidth: 3,
    borderColor: colors.error,
  },
  resultsIconContainer: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  scoreLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.backgroundCard,
    borderWidth: 8,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    boxShadow: '0px 8px 24px rgba(102, 66, 239, 0.3)',
    elevation: 5,
  },
  scoreValue: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  scoreDetails: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 4,
  },
  scoreRequirement: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  resultsButtons: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    paddingHorizontal: 32,
    marginBottom: 12,
    boxShadow: '0px 4px 16px rgba(102, 66, 239, 0.4)',
    elevation: 4,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  retryButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    boxShadow: '0px 4px 16px rgba(102, 66, 239, 0.4)',
    elevation: 4,
  },
  retryButtonTextLarge: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  doneButton: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  closeButton: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 16,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
});
