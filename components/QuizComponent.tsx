
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
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { IconSymbol } from '@/components/IconSymbol';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);

      // Fetch quiz details
      const { data: quiz, error: quizError } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      // Fetch questions
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      // Fetch answers for all questions
      const questionIds = questions.map(q => q.id);
      const { data: answers, error: answersError } = await supabase
        .from('quiz_answers')
        .select('*')
        .in('question_id', questionIds)
        .order('order_index', { ascending: true });

      if (answersError) throw answersError;

      // Group answers by question
      const questionsWithAnswers: QuizQuestion[] = questions.map(question => ({
        id: question.id,
        question_text: question.question_text,
        order_index: question.order_index,
        answers: answers.filter(a => a.question_id === question.id),
      }));

      setQuizData({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passing_score: quiz.passing_score,
        required_correct_answers: quiz.required_correct_answers,
        total_questions: quiz.total_questions,
        questions: questionsWithAnswers,
      });
    } catch (error: any) {
      console.error('[QuizComponent] Error fetching quiz data:', error);
      Alert.alert('Error', 'Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quizData) return;

    // Check if all questions are answered
    const unansweredQuestions = quizData.questions.filter(
      q => !selectedAnswers[q.id]
    );

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        'Incomplete Quiz',
        `Please answer all questions before submitting. ${unansweredQuestions.length} question(s) remaining.`
      );
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
      const passed = correct >= (quizData.required_correct_answers || 0);

      setCorrectCount(correct);
      setScore(scorePercentage);

      // Save attempt to database
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
      }

      setShowResults(true);
      onComplete(passed, scorePercentage);
    } catch (error: any) {
      console.error('[QuizComponent] Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setCorrectCount(0);
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </View>
    );
  }

  if (!quizData) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Quiz not found</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
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

        <View style={[styles.resultsCard, passed ? styles.passedCard : styles.failedCard]}>
          <View style={styles.resultsIconContainer}>
            <IconSymbol
              ios_icon_name={passed ? "checkmark.circle.fill" : "xmark.circle.fill"}
              android_material_icon_name={passed ? "check-circle" : "cancel"}
              size={80}
              color={passed ? colors.primary : colors.error}
            />
          </View>

          <Text style={styles.resultsTitle}>
            {passed ? 'Congratulations!' : 'Not Quite There'}
          </Text>

          <Text style={styles.resultsSubtitle}>
            {passed
              ? 'You passed the quiz!'
              : 'You need more correct answers to pass.'}
          </Text>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={styles.scoreValue}>{score}%</Text>
            <Text style={styles.scoreDetails}>
              {correctCount} out of {quizData.questions.length} correct
            </Text>
            <Text style={styles.scoreRequirement}>
              Required: {quizData.required_correct_answers} correct answers
            </Text>
          </View>

          <View style={styles.resultsButtons}>
            {!passed && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="arrow.clockwise"
                  android_material_icon_name="refresh"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.doneButtonText}>
                {passed ? 'Continue Learning' : 'Back to Academy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const selectedAnswerId = selectedAnswers[currentQuestion.id];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  return (
    <View style={styles.container}>
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

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {quizData.questions.length}
        </Text>
      </View>

      <ScrollView style={styles.quizContent} contentContainerStyle={styles.quizContentContainer}>
        <Text style={styles.questionText}>{currentQuestion.question_text}</Text>

        <View style={styles.answersContainer}>
          {currentQuestion.answers.map((answer) => {
            const isSelected = selectedAnswerId === answer.id;

            return (
              <TouchableOpacity
                key={answer.id}
                style={[
                  styles.answerCard,
                  isSelected && styles.answerCardSelected,
                ]}
                onPress={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.answerRadio,
                  isSelected && styles.answerRadioSelected,
                ]}>
                  {isSelected && (
                    <View style={styles.answerRadioInner} />
                  )}
                </View>
                <Text style={[
                  styles.answerText,
                  isSelected && styles.answerTextSelected,
                ]}>
                  {answer.answer_text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.navigationContainer}>
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

        {currentQuestionIndex === quizData.questions.length - 1 ? (
          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit Quiz</Text>
                <IconSymbol
                  ios_icon_name="checkmark"
                  android_material_icon_name="check"
                  size={20}
                  color="#FFFFFF"
                />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonText}>Next</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  errorText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey,
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
  questionText: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    lineHeight: 28,
    marginBottom: 24,
  },
  answersContainer: {
    gap: 12,
  },
  answerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  answerCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(102, 66, 239, 0.1)',
  },
  answerRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.grey,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerRadioSelected: {
    borderColor: colors.primary,
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
    lineHeight: 22,
  },
  answerTextSelected: {
    color: colors.primary,
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flex: 1,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  resultsCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
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
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 64,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
    marginBottom: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  doneButton: {
    backgroundColor: colors.backgroundAlt,
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
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    paddingHorizontal: 32,
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
});
