
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useCreatorData } from '@/hooks/useCreatorData';
import { IconSymbol } from '@/components/IconSymbol';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

interface TierRequirement {
  name: string;
  minDays: number;
  minHours: number;
  minDiamonds: number;
  maxDiamonds: number;
  minPayout: number;
  maxPayout: number;
}

const TIER_REQUIREMENTS: TierRequirement[] = [
  {
    name: 'Elite',
    minDays: 22,
    minHours: 100,
    minDiamonds: 1600000,
    maxDiamonds: 16000000,
    minPayout: 650,
    maxPayout: 1050,
  },
  {
    name: 'Expert',
    minDays: 20,
    minHours: 60,
    minDiamonds: 500000,
    maxDiamonds: 1599999,
    minPayout: 250,
    maxPayout: 350,
  },
  {
    name: 'Ascensus',
    minDays: 15,
    minHours: 40,
    minDiamonds: 100000,
    maxDiamonds: 499999,
    minPayout: 30,
    maxPayout: 90,
  },
];

interface TierCalculationResult {
  qualifiedTier: string | null;
  payoutRange: string;
  reason: string;
  activityMet: boolean;
  diamondMet: boolean;
}

function calculateTier(
  daysStreamed: number,
  hoursStreamed: number,
  creatorDiamonds: number
): TierCalculationResult {
  // Evaluate tiers from highest to lowest
  for (const tier of TIER_REQUIREMENTS) {
    const activityMet = daysStreamed >= tier.minDays && hoursStreamed >= tier.minHours;
    const diamondMet = creatorDiamonds >= tier.minDiamonds && creatorDiamonds <= tier.maxDiamonds;

    if (activityMet && diamondMet) {
      return {
        qualifiedTier: tier.name,
        payoutRange: `$${tier.minPayout}–$${tier.maxPayout}`,
        reason: 'All requirements met',
        activityMet: true,
        diamondMet: true,
      };
    }
  }

  // No tier qualified
  return {
    qualifiedTier: null,
    payoutRange: '$0',
    reason: 'Requirements not met',
    activityMet: false,
    diamondMet: false,
  };
}

export default function BonusDetailsScreen() {
  const { creator, loading: creatorLoading, stats } = useCreatorData();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Calculator inputs
  const [calcDays, setCalcDays] = useState('');
  const [calcHours, setCalcHours] = useState('');
  const [calcDiamonds, setCalcDiamonds] = useState('');
  const [calcResult, setCalcResult] = useState<TierCalculationResult | null>(null);

  // Current tier based on creator data
  const [currentTier, setCurrentTier] = useState<TierCalculationResult | null>(null);

  useEffect(() => {
    if (creator && stats) {
      const result = calculateTier(
        stats.liveDays,
        stats.liveHours,
        stats.totalDiamonds
      );
      setCurrentTier(result);
    }
  }, [creator, stats]);

  const handleCalculate = () => {
    const days = parseInt(calcDays) || 0;
    const hours = parseInt(calcHours) || 0;
    const diamonds = parseInt(calcDiamonds) || 0;

    const result = calculateTier(days, hours, diamonds);
    setCalcResult(result);
  };

  if (creatorLoading || !fontsLoaded) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Bonus Details',
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading bonus details...</Text>
      </View>
    );
  }

  if (!creator || !stats) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Bonus Details',
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <Text style={styles.errorText}>No creator data available</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Bonus Details',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Bonus Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol
              ios_icon_name="dollarsign.circle.fill"
              android_material_icon_name="attach-money"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>Bonus Summary</Text>
          </View>

          {currentTier && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Current Tier</Text>
                <Text style={[styles.summaryValue, currentTier.qualifiedTier ? styles.summaryValueSuccess : styles.summaryValueError]}>
                  {currentTier.qualifiedTier || 'None'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payout Range</Text>
                <Text style={styles.summaryValue}>{currentTier.payoutRange}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Status</Text>
                <Text style={styles.summaryValue}>{currentTier.reason}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.requirementStatus}>
                <View style={styles.statusRow}>
                  <IconSymbol
                    ios_icon_name={currentTier.activityMet ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={currentTier.activityMet ? 'check-circle' : 'cancel'}
                    size={20}
                    color={currentTier.activityMet ? colors.success : colors.error}
                  />
                  <Text style={styles.statusText}>Activity Gate: {stats.liveDays} days, {stats.liveHours} hours</Text>
                </View>
                <View style={styles.statusRow}>
                  <IconSymbol
                    ios_icon_name={currentTier.diamondMet ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={currentTier.diamondMet ? 'check-circle' : 'cancel'}
                    size={20}
                    color={currentTier.diamondMet ? colors.success : colors.error}
                  />
                  <Text style={styles.statusText}>Diamond Gate: {stats.totalDiamonds.toLocaleString()} diamonds</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Bonus Calculator */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol
              ios_icon_name="calculator.fill"
              android_material_icon_name="calculate"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>Bonus Calculator</Text>
          </View>

          <Text style={styles.calculatorSubtitle}>
            Enter your metrics to see which tier you qualify for
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Days Streamed</Text>
            <TextInput
              style={styles.input}
              value={calcDays}
              onChangeText={setCalcDays}
              keyboardType="numeric"
              placeholder="e.g., 22"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hours Streamed</Text>
            <TextInput
              style={styles.input}
              value={calcHours}
              onChangeText={setCalcHours}
              keyboardType="numeric"
              placeholder="e.g., 100"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Creator Diamonds</Text>
            <TextInput
              style={styles.input}
              value={calcDiamonds}
              onChangeText={setCalcDiamonds}
              keyboardType="numeric"
              placeholder="e.g., 1600000"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
            <Text style={styles.calculateButtonText}>Calculate Tier</Text>
          </TouchableOpacity>

          {calcResult && (
            <View style={styles.calcResultContainer}>
              <View style={styles.calcResultHeader}>
                <Text style={styles.calcResultTitle}>Result</Text>
              </View>
              <View style={styles.calcResultRow}>
                <Text style={styles.calcResultLabel}>Qualified Tier:</Text>
                <Text style={[styles.calcResultValue, calcResult.qualifiedTier ? styles.calcResultValueSuccess : styles.calcResultValueError]}>
                  {calcResult.qualifiedTier || 'None'}
                </Text>
              </View>
              <View style={styles.calcResultRow}>
                <Text style={styles.calcResultLabel}>Payout Range:</Text>
                <Text style={styles.calcResultValue}>{calcResult.payoutRange}</Text>
              </View>
              <View style={styles.calcResultRow}>
                <Text style={styles.calcResultLabel}>Reason:</Text>
                <Text style={styles.calcResultValue}>{calcResult.reason}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Bonus Rules Table */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol
              ios_icon_name="list.bullet.rectangle"
              android_material_icon_name="list"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>Bonus Rules</Text>
          </View>

          <Text style={styles.rulesSubtitle}>
            Both activity and diamond gates must be passed to qualify for a tier
          </Text>

          {TIER_REQUIREMENTS.map((tier, index) => (
            <View key={index} style={styles.tierCard}>
              <View style={styles.tierHeader}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierPayout}>
                  ${tier.minPayout}–${tier.maxPayout}
                </Text>
              </View>

              <View style={styles.tierRequirements}>
                <View style={styles.tierRequirementRow}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.tierRequirementText}>
                    Days Streamed: ≥ {tier.minDays}
                  </Text>
                </View>

                <View style={styles.tierRequirementRow}>
                  <IconSymbol
                    ios_icon_name="clock"
                    android_material_icon_name="access-time"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.tierRequirementText}>
                    Hours Streamed: ≥ {tier.minHours}
                  </Text>
                </View>

                <View style={styles.tierRequirementRow}>
                  <IconSymbol
                    ios_icon_name="diamond"
                    android_material_icon_name="diamond"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.tierRequirementText}>
                    Diamonds: {tier.minDiamonds.toLocaleString()} – {tier.maxDiamonds.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.noteContainer}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.noteText}>
              Diamonds alone do NOT auto-promote. Both activity and diamond requirements must be met.
            </Text>
          </View>
        </View>
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
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  summaryValueSuccess: {
    color: colors.success,
  },
  summaryValueError: {
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  requirementStatus: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
  },
  calculatorSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.grey,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
  },
  calculateButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  calculateButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  calcResultContainer: {
    marginTop: 20,
    backgroundColor: colors.grey,
    borderRadius: 16,
    padding: 16,
  },
  calcResultHeader: {
    marginBottom: 12,
  },
  calcResultTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  calcResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calcResultLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  calcResultValue: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  calcResultValueSuccess: {
    color: colors.success,
  },
  calcResultValueError: {
    color: colors.error,
  },
  rulesSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  tierCard: {
    backgroundColor: colors.grey,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierName: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  tierPayout: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  tierRequirements: {
    gap: 8,
  },
  tierRequirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierRequirementText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.grey,
    borderRadius: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
