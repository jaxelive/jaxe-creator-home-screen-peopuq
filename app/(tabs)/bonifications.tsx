
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useCreatorData } from '@/hooks/useCreatorData';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

interface BonusTier {
  name: string;
  minDays: number;
  minHours: number;
  minDiamonds: number;
  maxDiamonds: number;
  minBonus: number;
  maxBonus: number;
}

const BONUS_TIERS: BonusTier[] = [
  {
    name: 'Elite',
    minDays: 22,
    minHours: 100,
    minDiamonds: 1600000,
    maxDiamonds: 16000000,
    minBonus: 650,
    maxBonus: 1050,
  },
  {
    name: 'Expert',
    minDays: 20,
    minHours: 60,
    minDiamonds: 500000,
    maxDiamonds: 1600000,
    minBonus: 250,
    maxBonus: 350,
  },
  {
    name: 'Ascensus',
    minDays: 15,
    minHours: 40,
    minDiamonds: 100000,
    maxDiamonds: 500000,
    minBonus: 30,
    maxBonus: 90,
  },
];

export default function BonificationsScreen() {
  const { creator, loading: creatorLoading } = useCreatorData();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [daysStreamed, setDaysStreamed] = useState('');
  const [hoursStreamed, setHoursStreamed] = useState('');
  const [creatorDiamonds, setCreatorDiamonds] = useState('');
  const [calculatedTier, setCalculatedTier] = useState<string | null>(null);
  const [bonusRange, setBonusRange] = useState<string | null>(null);

  useEffect(() => {
    if (creator) {
      // Prefill creator diamonds from Supabase
      setCreatorDiamonds(creator.diamonds_monthly?.toString() || '0');
    }
  }, [creator]);

  const calculateBonus = () => {
    const days = parseInt(daysStreamed) || 0;
    const hours = parseInt(hoursStreamed) || 0;
    const diamonds = parseInt(creatorDiamonds) || 0;

    let qualifiedTier: BonusTier | null = null;

    // Check tiers from highest to lowest
    for (const tier of BONUS_TIERS) {
      if (
        days >= tier.minDays &&
        hours >= tier.minHours &&
        diamonds >= tier.minDiamonds &&
        diamonds <= tier.maxDiamonds
      ) {
        qualifiedTier = tier;
        break;
      }
    }

    if (qualifiedTier) {
      setCalculatedTier(qualifiedTier.name);
      setBonusRange(`$${qualifiedTier.minBonus}–$${qualifiedTier.maxBonus}`);
    } else {
      setCalculatedTier('No Tier');
      setBonusRange('$0');
    }
  };

  const resetInputs = () => {
    setDaysStreamed('');
    setHoursStreamed('');
    setCreatorDiamonds(creator?.diamonds_monthly?.toString() || '0');
    setCalculatedTier(null);
    setBonusRange(null);
  };

  if (creatorLoading || !fontsLoaded) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Bonifications Calculator',
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Bonifications Calculator',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="dollarsign.circle.fill"
            android_material_icon_name="attach-money"
            size={64}
            color={colors.primary}
          />
          <Text style={styles.headerTitle}>Bonifications Calculator</Text>
          <Text style={styles.headerSubtitle}>
            Calculate your potential monthly bonus based on your performance
          </Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Your Performance</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Days Streamed</Text>
            <TextInput
              style={styles.input}
              value={daysStreamed}
              onChangeText={setDaysStreamed}
              placeholder="Enter days streamed"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hours Streamed</Text>
            <TextInput
              style={styles.input}
              value={hoursStreamed}
              onChangeText={setHoursStreamed}
              placeholder="Enter hours streamed"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Creator Diamonds</Text>
            <TextInput
              style={styles.input}
              value={creatorDiamonds}
              onChangeText={setCreatorDiamonds}
              placeholder="Enter diamonds earned"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />
            <Text style={styles.inputHint}>Prefilled from your account</Text>
          </View>
        </View>

        {/* Tier Requirements */}
        <View style={styles.tierSection}>
          <Text style={styles.sectionTitle}>Tier Requirements</Text>

          {BONUS_TIERS.map((tier) => (
            <View key={tier.name} style={styles.tierCard}>
              <View style={styles.tierHeader}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierBonus}>
                  ${tier.minBonus}–${tier.maxBonus}
                </Text>
              </View>
              <View style={styles.tierRequirements}>
                <View style={styles.tierRequirement}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.tierRequirementText}>≥{tier.minDays} days</Text>
                </View>
                <View style={styles.tierRequirement}>
                  <IconSymbol
                    ios_icon_name="clock"
                    android_material_icon_name="access-time"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.tierRequirementText}>≥{tier.minHours} hours</Text>
                </View>
                <View style={styles.tierRequirement}>
                  <IconSymbol
                    ios_icon_name="sparkles"
                    android_material_icon_name="auto-awesome"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.tierRequirementText}>
                    {(tier.minDiamonds / 1000).toFixed(0)}K–
                    {tier.maxDiamonds >= 1000000
                      ? `${(tier.maxDiamonds / 1000000).toFixed(1)}M`
                      : `${(tier.maxDiamonds / 1000).toFixed(0)}K`}{' '}
                    diamonds
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Result Section */}
        {calculatedTier && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Your Result</Text>
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Qualified Tier</Text>
                <Text style={styles.resultValue}>{calculatedTier}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Bonus Range</Text>
                <Text style={styles.resultValueHighlight}>{bonusRange}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.calculateButton} onPress={calculateBonus}>
            <Text style={styles.calculateButtonText}>Calculate Bonus</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={resetInputs}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputSection: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
  },
  inputHint: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginTop: 6,
  },
  tierSection: {
    marginBottom: 24,
  },
  tierCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierName: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  tierBonus: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  tierRequirements: {
    gap: 12,
  },
  tierRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierRequirementText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  resultSection: {
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 24,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  resultValue: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  resultValueHighlight: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FCD34D',
  },
  actionButtons: {
    gap: 12,
  },
  calculateButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  calculateButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  resetButton: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
});
