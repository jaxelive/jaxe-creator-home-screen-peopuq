
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
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { useCreatorData } from '@/hooks/useCreatorData';
import { IconSymbol } from '@/components/IconSymbol';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

interface ChallengeDayData {
  day_number: number;
  week_number: number;
  task_title: string;
  task_description: string;
  live_time_goal_minutes: number;
  objective: string;
}

export default function ChallengeDayDetailsScreen() {
  const { dayNumber } = useLocalSearchParams<{ dayNumber: string }>();
  const { creator } = useCreatorData();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [dayData, setDayData] = useState<ChallengeDayData | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDayData();
  }, [dayNumber, creator]);

  const fetchDayData = async () => {
    if (!creator || !dayNumber) return;

    try {
      setLoading(true);

      // Fetch day data from challenge_21_days table
      const { data: dayInfo, error: dayError } = await supabase
        .from('challenge_21_days')
        .select('*')
        .eq('day_number', parseInt(dayNumber))
        .single();

      if (dayError) throw dayError;
      setDayData(dayInfo);

      // Check if day is completed
      const { data: progressData, error: progressError } = await supabase
        .from('learning_challenge_progress')
        .select('*')
        .eq('creator_id', creator.id)
        .eq('day_number', parseInt(dayNumber))
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error fetching progress:', progressError);
      }

      setIsCompleted(progressData?.is_completed || false);
    } catch (error: any) {
      console.error('Error fetching day data:', error);
      Alert.alert('Error', 'Failed to load day data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!creator || !dayNumber) return;

    Alert.alert(
      'Mark as Complete',
      'Have you completed today\'s challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            setSubmitting(true);
            try {
              const { error } = await supabase
                .from('learning_challenge_progress')
                .upsert({
                  creator_id: creator.id,
                  day_number: parseInt(dayNumber),
                  is_completed: true,
                  completed_at: new Date().toISOString(),
                });

              if (error) throw error;

              Alert.alert('🎉 Success!', `Day ${dayNumber} completed!`, [
                {
                  text: 'Continue',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error: any) {
              console.error('Error marking complete:', error);
              Alert.alert('Error', 'Failed to mark day as completed');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: `Day ${dayNumber}`,
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading challenge...</Text>
      </View>
    );
  }

  if (!dayData) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: `Day ${dayNumber}`,
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <Text style={styles.errorText}>Challenge day not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Day ${dayNumber}`,
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Day Header */}
        <View style={styles.headerCard}>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>Day {dayData.day_number}</Text>
          </View>
          <Text style={styles.weekText}>Week {dayData.week_number}</Text>
        </View>

        {/* Title Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{dayData.task_title}</Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.success}
              />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>Description</Text>
          </View>
          <Text style={styles.description}>{dayData.task_description}</Text>
        </View>

        {/* Objective Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol
              ios_icon_name="target"
              android_material_icon_name="track-changes"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>Objective</Text>
          </View>
          <Text style={styles.objective}>{dayData.objective}</Text>
        </View>

        {/* Time Goal Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="access-time"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>LIVE Time Goal</Text>
          </View>
          <View style={styles.timeGoalContainer}>
            <Text style={styles.timeGoalValue}>{dayData.live_time_goal_minutes}</Text>
            <Text style={styles.timeGoalLabel}>minutes</Text>
          </View>
        </View>

        {/* Required Badge */}
        <View style={styles.requiredCard}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={24}
            color={colors.warning}
          />
          <Text style={styles.requiredText}>This challenge day is required</Text>
        </View>

        {/* Complete Button */}
        {!isCompleted && (
          <TouchableOpacity
            style={[styles.completeButton, submitting && styles.buttonDisabled]}
            onPress={handleMarkComplete}
            disabled={submitting}
          >
            <Text style={styles.completeButtonText}>
              {submitting ? 'Marking Complete...' : 'Mark as Completed'}
            </Text>
          </TouchableOpacity>
        )}

        {isCompleted && (
          <View style={styles.completedCard}>
            <IconSymbol
              ios_icon_name="checkmark.seal.fill"
              android_material_icon_name="verified"
              size={48}
              color={colors.success}
            />
            <Text style={styles.completedCardTitle}>Challenge Completed!</Text>
            <Text style={styles.completedCardText}>
              Great job! Keep up the momentum and continue to the next day.
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
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
  },
  headerCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  dayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  dayBadgeText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  weekText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.grey,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  completedText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.success,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 24,
  },
  objective: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    lineHeight: 24,
  },
  timeGoalContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  timeGoalValue: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  timeGoalLabel: {
    fontSize: 20,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  requiredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  requiredText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  completeButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  completedCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  completedCardTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  completedCardText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
