
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { AnimatedNumber } from './AnimatedNumber';
import { AnimatedProgressBar } from './AnimatedProgressBar';

interface RotatingCardProps {
  type: 'bonus' | 'diamonds';
  isFaded?: boolean;
  onPress: () => void;
  data: {
    bonusAmount?: number;
    nextBonus?: number;
    liveDays?: number;
    liveHours?: number;
    battlesBooked?: number;
    diamondsEarned?: number;
    totalGoal?: number;
    remaining?: number;
    nextTier?: string;
    currentTier?: string;
    isMaxTier?: boolean;
  };
}

export function RotatingCard({ type, isFaded = false, onPress, data }: RotatingCardProps) {
  const cardStyle = {
    opacity: isFaded ? 0.4 : 1,
  };

  if (type === 'bonus') {
    const liveDaysComplete = (data.liveDays || 0) >= 15;
    const liveHoursComplete = (data.liveHours || 0) >= 40;
    const battlesComplete = (data.battlesBooked || 0) >= 1;
    const requirementsMet = [liveDaysComplete, liveHoursComplete, battlesComplete].filter(Boolean).length;
    const requirementsPercentage = (requirementsMet / 3) * 100;

    return (
      <View style={styles.cardWrapperBonus}>
        <Animated.View style={[styles.cardBonus, cardStyle]}>
          {/* Header */}
          <View style={styles.bonusHeader}>
            <Text style={styles.bonusTitle}>BONUS FORECAST</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>STATUS</Text>
              <Text style={styles.statusValue}>Active</Text>
            </View>
          </View>

          {/* Main Amount */}
          <View style={styles.mainAmountSection}>
            <View style={styles.amountRow}>
              <AnimatedNumber 
                value={data.bonusAmount || 100}
                style={styles.mainAmount}
                prefix="$"
              />
              <View style={styles.checkCircle}>
                <IconSymbol 
                  ios_icon_name="checkmark" 
                  android_material_icon_name="check" 
                  size={24} 
                  color="#FFFFFF" 
                />
              </View>
            </View>
            <Text style={styles.earnedLabel}>Earned</Text>
          </View>

          {/* Next Bonus - INCREASED SIZE */}
          <View style={styles.nextBonusSection}>
            <Text style={styles.nextBonusLabel}>NEXT BONUS</Text>
            <AnimatedNumber 
              value={data.nextBonus || 175}
              style={styles.nextBonusValue}
              prefix="$"
            />
          </View>

          {/* Progress Bar */}
          <AnimatedProgressBar
            percentage={requirementsPercentage}
            height={8}
            backgroundColor="rgba(255, 255, 255, 0.2)"
            fillColor="rgba(255, 255, 255, 0.9)"
            containerStyle={{ marginBottom: 16 }}
          />

          {/* Requirements Label */}
          <Text style={styles.requirementsLabel}>Requirements</Text>

          {/* Requirements */}
          <View style={styles.requirementsContainer}>
            <View style={styles.requirementRow}>
              <Text style={styles.requirementLabel}>LIVE Days</Text>
              <View style={styles.requirementValue}>
                <View style={styles.requirementTextRow}>
                  <AnimatedNumber 
                    value={data.liveDays || 15}
                    style={styles.requirementText}
                    formatNumber={false}
                  />
                  <Text style={styles.requirementText}> / 15</Text>
                </View>
                {/* Status Circle Indicator - Always visible */}
                {liveDaysComplete ? (
                  <View style={styles.statusCircleComplete}>
                    <IconSymbol 
                      ios_icon_name="checkmark" 
                      android_material_icon_name="check" 
                      size={14} 
                      color="#FFFFFF" 
                    />
                  </View>
                ) : (
                  <View style={styles.statusCircleEmpty} />
                )}
              </View>
            </View>

            <View style={styles.requirementRow}>
              <Text style={styles.requirementLabel}>LIVE Hours</Text>
              <View style={styles.requirementValue}>
                <View style={styles.requirementTextRow}>
                  <AnimatedNumber 
                    value={data.liveHours || 32}
                    style={styles.requirementText}
                    formatNumber={false}
                  />
                  <Text style={styles.requirementText}> / 40</Text>
                </View>
                {/* Status Circle Indicator - Always visible */}
                {liveHoursComplete ? (
                  <View style={styles.statusCircleComplete}>
                    <IconSymbol 
                      ios_icon_name="checkmark" 
                      android_material_icon_name="check" 
                      size={14} 
                      color="#FFFFFF" 
                    />
                  </View>
                ) : (
                  <View style={styles.statusCircleEmpty} />
                )}
              </View>
            </View>

            <View style={styles.requirementRow}>
              <Text style={styles.requirementLabel}>Battles Booked</Text>
              <View style={styles.requirementValue}>
                <View style={styles.requirementTextRow}>
                  <AnimatedNumber 
                    value={data.battlesBooked || 1}
                    style={styles.requirementText}
                    formatNumber={false}
                  />
                  <Text style={styles.requirementText}> / 1</Text>
                </View>
                {/* Status Circle Indicator - Always visible */}
                {battlesComplete ? (
                  <View style={styles.statusCircleComplete}>
                    <IconSymbol 
                      ios_icon_name="checkmark" 
                      android_material_icon_name="check" 
                      size={14} 
                      color="#FFFFFF" 
                    />
                  </View>
                ) : (
                  <View style={styles.statusCircleEmpty} />
                )}
              </View>
            </View>
          </View>

        </Animated.View>
      </View>
    );
  }

  // Diamonds card - with region-based tier logic
  const isMaxTier = data.isMaxTier || false;
  const progressPercentage = isMaxTier ? 100 : ((data.diamondsEarned || 0) / (data.totalGoal || 1)) * 100;

  return (
    <View style={styles.cardWrapper}>
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Header with Diamonds Number at Top-Left */}
        <View style={styles.diamondsHeader}>
          <View style={styles.diamondsTopLeft}>
            <AnimatedNumber 
              value={data.diamondsEarned || 0}
              style={styles.diamondsNumberTopLeft}
            />
            <Text style={styles.diamondsLabelSmall}>Diamonds</Text>
          </View>
          <View style={styles.tierBadge}>
            <View style={styles.tierDot} />
            <Text style={styles.tierText}>{data.currentTier || 'Rookie'}</Text>
          </View>
        </View>

        {/* Progress Section or Max Tier Message */}
        {isMaxTier ? (
          <View style={styles.maxTierSection}>
            <View style={styles.maxTierIconContainer}>
              <IconSymbol 
                ios_icon_name="crown.fill" 
                android_material_icon_name="workspace-premium" 
                size={48} 
                color="#FFD700" 
              />
            </View>
            <Text style={styles.maxTierTitle}>Max Tier Reached!</Text>
            <Text style={styles.maxTierSubtitle}>
              You&apos;ve achieved the highest tier. Keep up the amazing work!
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress to {data.nextTier}</Text>
                <View style={styles.remainingTextRow}>
                  <Text style={styles.remainingText}>Remaining: </Text>
                  <AnimatedNumber 
                    value={data.remaining || 0}
                    style={styles.remainingText}
                  />
                </View>
              </View>

              {/* Progress Bar */}
              <AnimatedProgressBar
                percentage={progressPercentage}
                height={12}
                backgroundColor="rgba(255, 255, 255, 0.2)"
                fillColor="rgba(255, 255, 255, 0.9)"
              />
            </View>

            {/* Goal Info */}
            <View style={styles.goalSection}>
              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>TOTAL GOAL</Text>
                <Text style={styles.goalLabel}>NEXT TIER</Text>
              </View>
              <View style={styles.goalRow}>
                <AnimatedNumber 
                  value={data.totalGoal || 0}
                  style={styles.goalValue}
                />
                <Text style={styles.goalValueHighlight}>{data.nextTier || 'Silver'}</Text>
              </View>
            </View>
          </>
        )}

      </Animated.View>
    </View>
  );
}

export default RotatingCard;

const styles = StyleSheet.create({
  // Diamonds card wrapper - fixed height
  cardWrapper: {
    height: 380,
  },
  card: {
    backgroundColor: '#6642EF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    height: 380,
  },

  // Bonus card wrapper - content-driven height (auto)
  cardWrapperBonus: {
    width: '100%',
  },
  cardBonus: {
    backgroundColor: '#6642EF',
    borderRadius: 24,
    padding: 16,
    width: '100%',
  },

  // Bonus Card Styles
  bonusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bonusTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  mainAmountSection: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  mainAmount: {
    fontSize: 52,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  earnedLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  nextBonusSection: {
    marginBottom: 12,
  },
  nextBonusLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  nextBonusValue: {
    fontSize: 36,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  requirementsLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  requirementsContainer: {
    gap: 10,
  },
  requirementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  requirementLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  requirementValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  // Status Circle Indicators (always visible, same space reserved)
  statusCircleComplete: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCircleEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'transparent',
  },

  // Diamonds Card Styles - NUMBER AT TOP-LEFT
  diamondsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  diamondsTopLeft: {
    flex: 1,
  },
  diamondsNumberTopLeft: {
    fontSize: 56,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -2,
    marginBottom: 4,
  },
  diamondsLabelSmall: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  tierText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  remainingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  goalSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 20,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  goalValue: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  goalValueHighlight: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FCD34D',
  },
  
  // Max Tier Section
  maxTierSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  maxTierIconContainer: {
    marginBottom: 20,
  },
  maxTierTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  maxTierSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
