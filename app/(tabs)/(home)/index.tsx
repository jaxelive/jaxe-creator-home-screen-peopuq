
import React, { useRef, useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { HeaderRightButton, HeaderLeftButton } from "@/components/HeaderButtons";
import { useCreatorData } from "@/hooks/useCreatorData";
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { supabase } from "@/app/integrations/supabase/client";

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  
  // Using avelezsanti as the default creator for testing
  const { creator, loading, error, stats, refetch } = useCreatorData('avelezsanti');
  const [nextBattle, setNextBattle] = useState<any>(null);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [educationProgress, setEducationProgress] = useState(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (creator) {
      console.log('[HomeScreen] Creator loaded:', {
        handle: creator.creator_handle,
        name: `${creator.first_name} ${creator.last_name}`,
        monthlyDiamonds: creator.diamonds_monthly,
        totalDiamonds: creator.total_diamonds,
        liveDays: creator.live_days_30d,
        liveHours: Math.floor(creator.live_duration_seconds_30d / 3600)
      });
      fetchBattleData();
      fetchLearningData();
    }
  }, [creator]);

  const fetchBattleData = async () => {
    if (!creator) return;

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('battles_calendar')
        .select('*')
        .or(`creator_1_id.eq.${creator.id},creator_2_id.eq.${creator.id}`)
        .gte('battle_date', now)
        .order('battle_date', { ascending: true })
        .limit(1);

      if (error) {
        console.error('[HomeScreen] Error fetching battle data:', error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log('[HomeScreen] Next battle found:', data[0]);
        setNextBattle(data[0]);
      } else {
        console.log('[HomeScreen] No upcoming battles found');
      }
    } catch (error: any) {
      console.error('[HomeScreen] Unexpected error fetching battle data:', error);
    }
  };

  const fetchLearningData = async () => {
    if (!creator) return;

    try {
      // Fetch 21-day challenge progress
      const { data: challengeData, error: challengeError } = await supabase
        .from('learning_challenge_progress')
        .select('*')
        .eq('creator_id', creator.id)
        .eq('is_completed', true);

      if (challengeError) {
        console.error('[HomeScreen] Error fetching challenge data:', challengeError);
      } else {
        const completedDays = challengeData?.length || 0;
        console.log('[HomeScreen] Challenge progress:', completedDays, '/21');
        setChallengeProgress(completedDays);
      }

      // Fetch UR education progress
      const { data: educationData, error: educationError } = await supabase
        .from('ur_education_progress')
        .select('*')
        .eq('creator_id', creator.id)
        .eq('quiz_passed', true);

      if (educationError) {
        console.error('[HomeScreen] Error fetching education data:', educationError);
      } else {
        const completedVideos = educationData?.length || 0;
        console.log('[HomeScreen] Education progress:', completedVideos, '/5');
        setEducationProgress(completedVideos);
      }
    } catch (error: any) {
      console.error('[HomeScreen] Unexpected error fetching learning data:', error);
    }
  };

  if (loading || !fontsLoaded) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "JAXE One",
            headerShown: false,
          }}
        />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </>
    );
  }

  if (error || !creator || !stats) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "JAXE One",
            headerShown: false,
          }}
        />
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>
            {error || 'No creator data found'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <LinearGradient
              colors={colors.gradientPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryButtonGradient}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const fullName = `${creator.first_name} ${creator.last_name}`.trim() || creator.creator_handle;
  const profileImageUrl = creator.avatar_url || creator.profile_picture_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';
  const region = creator.region || 'USA / Canada';
  const language = creator.language || 'English';

  const formatBattleDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatBattleTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "JAXE One",
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* HEADER CARD */}
            <LinearGradient
              colors={['#FFFFFF', '#FAF5FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerCard}
            >
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.headerAvatar}
              />
              <Text style={styles.headerGreeting}>Welcome, {fullName}!</Text>
              <Text style={styles.headerHandle}>@{creator.creator_handle}</Text>
              <View style={styles.headerBadges}>
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{region}</Text>
                </View>
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{language}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* DIAMONDS PROGRESS CARD */}
            <CardPressable onPress={() => console.log('Diamonds tapped')}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>💎</Text>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitleLarge}>Monthly Diamonds</Text>
                    <Text style={styles.cardSubtitle}>Resets every 1st of the month</Text>
                  </View>
                </View>
                <Text style={styles.bigNumber}>{stats.monthlyDiamonds.toLocaleString()}</Text>
                <View style={styles.progressBarContainer}>
                  <LinearGradient
                    colors={colors.gradientPurple}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${Math.min(stats.currentProgress, 100)}%` }]}
                  />
                </View>
                <Text style={styles.progressHint}>
                  {stats.remaining > 0 
                    ? `You need ${stats.remaining.toLocaleString()} more diamonds to reach ${stats.nextTarget}`
                    : `Congratulations! You've reached ${stats.nextTarget}!`
                  }
                </Text>
              </View>
            </CardPressable>

            {/* NEXT GRADUATION CARD */}
            <CardPressable onPress={() => router.push('/(tabs)/bonuses')}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>🎯</Text>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitleLarge}>Next Graduation: {stats.nextTarget}</Text>
                    <Text style={styles.cardSubtitle}>{stats.currentStatus}</Text>
                  </View>
                </View>
                <View style={styles.progressBarContainer}>
                  <LinearGradient
                    colors={colors.gradientPurple}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${Math.min(stats.currentProgress, 100)}%` }]}
                  />
                </View>
                <View style={styles.graduationStats}>
                  <Text style={styles.graduationLabel}>Current Progress: {stats.currentProgress.toFixed(1)}%</Text>
                  <Text style={styles.graduationLabel}>Remaining: {stats.remaining.toLocaleString()}</Text>
                </View>
              </View>
            </CardPressable>

            {/* MISSIONS OVERVIEW CARD */}
            <CardPressable onPress={() => router.push('/(tabs)/learning-hub')}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>🧩</Text>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitleLarge}>Missions Overview</Text>
                    <Text style={styles.cardSubtitle}>Your learning progress</Text>
                  </View>
                </View>
                <View style={styles.missionsGrid}>
                  <View style={styles.missionBox}>
                    <Text style={styles.missionIcon}>🎓</Text>
                    <Text style={styles.missionTitle}>Education</Text>
                    <Text style={styles.missionProgress}>{educationProgress}/5</Text>
                    <View style={styles.miniProgressBar}>
                      <View style={[styles.miniProgressFill, { width: `${(educationProgress / 5) * 100}%` }]} />
                    </View>
                  </View>
                  <View style={styles.missionBox}>
                    <Text style={styles.missionIcon}>🔥</Text>
                    <Text style={styles.missionTitle}>21-Day Challenge</Text>
                    <Text style={styles.missionProgress}>{challengeProgress}/21</Text>
                    <View style={styles.miniProgressBar}>
                      <View style={[styles.miniProgressFill, { width: `${(challengeProgress / 21) * 100}%` }]} />
                    </View>
                    <Text style={styles.missionSubtext}>{21 - challengeProgress} days to go</Text>
                  </View>
                  <View style={styles.missionBox}>
                    <Text style={styles.missionIcon}>💵</Text>
                    <Text style={styles.missionTitle}>Bonus Forecast</Text>
                    <Text style={styles.missionProgress}>$0.00</Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>Rising</Text>
                    </View>
                    <Text style={styles.missionSubtext}>{stats.liveHours} hrs • {stats.monthlyDiamonds} diamonds • {stats.liveDays} day</Text>
                  </View>
                </View>
              </View>
            </CardPressable>

            {/* UPCOMING BATTLES CARD */}
            <CardPressable onPress={() => router.push('/(tabs)/battles')}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>⚔️</Text>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitleLarge}>Upcoming Battles</Text>
                    <Text style={styles.cardSubtitle}>Schedule your monthly battle</Text>
                  </View>
                </View>
                {nextBattle ? (
                  <>
                    <View style={styles.battleItem}>
                      <Text style={styles.battleDate}>
                        {formatBattleDate(nextBattle.battle_date)} • {formatBattleTime(nextBattle.battle_time)}
                      </Text>
                      <Text style={styles.battleOpponent}>
                        VS @{nextBattle.creator_1_id === creator.id ? nextBattle.creator_2_handle : nextBattle.creator_1_handle}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.noBattlesText}>No upcoming battles scheduled</Text>
                )}
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllButtonText}>View All Battles</Text>
                </TouchableOpacity>
              </View>
            </CardPressable>

            {/* LIVE ACTIVITY SUMMARY CARD */}
            <CardPressable onPress={() => console.log('Live activity tapped')}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>📊</Text>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitleLarge}>LIVE Activity Summary</Text>
                    <Text style={styles.cardSubtitle}>Last 30 days</Text>
                  </View>
                </View>
                <View style={styles.statsGrid}>
                  <View style={styles.statCapsule}>
                    <Text style={styles.statCapsuleLabel}>LIVE Days</Text>
                    <Text style={styles.statCapsuleValue}>{stats.liveDays}</Text>
                  </View>
                  <View style={styles.statCapsule}>
                    <Text style={styles.statCapsuleLabel}>LIVE Hours</Text>
                    <Text style={styles.statCapsuleValue}>{stats.liveHours}</Text>
                  </View>
                  <View style={styles.statCapsule}>
                    <Text style={styles.statCapsuleLabel}>Diamonds Today</Text>
                    <Text style={styles.statCapsuleValue}>{stats.diamondsToday.toLocaleString()}</Text>
                  </View>
                  <View style={styles.statCapsule}>
                    <Text style={styles.statCapsuleLabel}>Streak</Text>
                    <Text style={styles.statCapsuleValue}>{stats.streak} Day{stats.streak !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
              </View>
            </CardPressable>

            {/* MY MANAGER CARD */}
            <CardPressable onPress={() => console.log('Manager tapped')}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>👤</Text>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitleLarge}>My Manager</Text>
                    <Text style={styles.cardSubtitle}>Get personalized support</Text>
                  </View>
                </View>
                {creator.assigned_manager_id ? (
                  <Text style={styles.managerInfo}>Manager assigned</Text>
                ) : (
                  <>
                    <Text style={styles.noManagerText}>No manager assigned</Text>
                    <TouchableOpacity style={styles.requestButton}>
                      <LinearGradient
                        colors={colors.gradientPurple}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.requestButtonGradient}
                      >
                        <Text style={styles.requestButtonText}>Request Manager</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </CardPressable>

            {/* TOOLS & PROMOTE CARD */}
            <CardPressable onPress={() => console.log('Tools tapped')}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>🛠</Text>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitleLarge}>Tools & Promote</Text>
                    <Text style={styles.cardSubtitle}>Grow your presence</Text>
                  </View>
                </View>
                <View style={styles.toolsGrid}>
                  <TouchableOpacity style={styles.toolButton} onPress={() => console.log('Promote tapped')}>
                    <Text style={styles.toolIcon}>📢</Text>
                    <Text style={styles.toolLabel}>Promote Myself</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolButton} onPress={() => router.push('/(tabs)/battles')}>
                    <Text style={styles.toolIcon}>⚔️</Text>
                    <Text style={styles.toolLabel}>Battles</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolButton} onPress={() => router.push('/(tabs)/ai-flyers')}>
                    <Text style={styles.toolIcon}>🎨</Text>
                    <Text style={styles.toolLabel}>Flyer AI</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </CardPressable>
          </Animated.View>
        </ScrollView>
      </View>
    </>
  );
}

function CardPressable({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  retryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  headerCard: {
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  headerGreeting: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerHandle: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.primary,
    marginBottom: 12,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  headerBadgeText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitleLarge: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },
  bigNumber: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: colors.grey,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressHint: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  graduationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  graduationLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  missionsGrid: {
    gap: 12,
  },
  missionBox: {
    backgroundColor: colors.grey,
    borderRadius: 20,
    padding: 16,
  },
  missionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  missionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 4,
  },
  missionProgress: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
    marginBottom: 8,
  },
  miniProgressBar: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  missionSubtext: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#22C55E',
  },
  battleItem: {
    backgroundColor: colors.grey,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  battleDate: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 4,
  },
  battleOpponent: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.primary,
  },
  noBattlesText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  viewAllButton: {
    backgroundColor: colors.grey,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCapsule: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.grey,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statCapsuleLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statCapsuleValue: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  managerInfo: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    textAlign: 'center',
  },
  noManagerText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  requestButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  requestButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  requestButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  toolsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  toolButton: {
    flex: 1,
    backgroundColor: colors.grey,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  toolLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    textAlign: 'center',
  },
});
