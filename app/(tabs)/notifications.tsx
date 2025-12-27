
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { useCreatorData } from '@/hooks/useCreatorData';
import { IconSymbol } from '@/components/IconSymbol';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

interface Notification {
  id: string;
  type: 'news' | 'contests';
  title: string | null;
  content: string;
  region: string;
  language: string;
  created_at: string;
}

// Placeholder financial/progress activities
const PLACEHOLDER_ACTIVITIES = [
  {
    id: '1',
    title: 'You reached a new milestone',
    description: 'Congratulations! You\'ve earned 50,000 diamonds this month.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    icon: 'star.fill' as const,
    iconAndroid: 'star' as const,
  },
  {
    id: '2',
    title: 'You unlocked a bonus tier',
    description: 'Great work! You\'ve qualified for the Ascensus bonus tier.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    icon: 'trophy.fill' as const,
    iconAndroid: 'emoji-events' as const,
  },
  {
    id: '3',
    title: 'Bonus payment processed',
    description: 'Your monthly bonus of $100 has been processed.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    icon: 'dollarsign.circle.fill' as const,
    iconAndroid: 'attach-money' as const,
  },
];

type TabType = 'all' | 'news' | 'contests';

export default function NotificationsScreen() {
  const { creator } = useCreatorData();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [newsNotifications, setNewsNotifications] = useState<Notification[]>([]);
  const [contestNotifications, setContestNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useEffect(() => {
    fetchNotifications();
  }, [creator]);

  const fetchNotifications = async () => {
    if (!creator) return;

    try {
      setLoading(true);

      // Fetch news notifications
      const { data: newsData, error: newsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'news')
        .or(`region.eq.${creator.region},region.eq.All`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (newsError) {
        console.error('Error fetching news:', newsError);
      } else {
        setNewsNotifications(newsData || []);
      }

      // Fetch contest notifications
      const { data: contestsData, error: contestsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'contests')
        .or(`region.eq.${creator.region},region.eq.All`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (contestsError) {
        console.error('Error fetching contests:', contestsError);
      } else {
        setContestNotifications(contestsData || []);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Notifications',
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  const showNews = activeTab === 'all' || activeTab === 'news';
  const showContests = activeTab === 'all' || activeTab === 'contests';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="square.grid.2x2.fill"
              android_material_icon_name="dashboard"
              size={20}
              color={activeTab === 'all' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'news' && styles.tabActive]}
            onPress={() => setActiveTab('news')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="newspaper.fill"
              android_material_icon_name="article"
              size={20}
              color={activeTab === 'news' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'news' && styles.tabTextActive]}>
              News
            </Text>
            {newsNotifications.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{newsNotifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'contests' && styles.tabActive]}
            onPress={() => setActiveTab('contests')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="trophy.fill"
              android_material_icon_name="emoji-events"
              size={20}
              color={activeTab === 'contests' ? '#F59E0B' : colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'contests' && styles.tabTextActiveContest
            ]}>
              Contests
            </Text>
            {contestNotifications.length > 0 && (
              <View style={[styles.badge, styles.badgeContest]}>
                <Text style={styles.badgeText}>{contestNotifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* News Section */}
          {showNews && newsNotifications.length > 0 && (
            <View style={styles.section}>
              {activeTab === 'all' && (
                <View style={styles.sectionHeaderRow}>
                  <IconSymbol
                    ios_icon_name="newspaper.fill"
                    android_material_icon_name="article"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Agency News</Text>
                </View>
              )}
              {newsNotifications.map((news) => (
                <View key={news.id} style={styles.newsCard}>
                  <View style={styles.newsTopBar}>
                    <View style={styles.newsTypeIndicator}>
                      <IconSymbol
                        ios_icon_name="info.circle.fill"
                        android_material_icon_name="info"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.newsTypeText}>NEWS</Text>
                    </View>
                    <Text style={styles.newsDate}>{formatDate(news.created_at)}</Text>
                  </View>
                  <Text style={styles.newsTitle}>{news.title || 'News Update'}</Text>
                  <Text style={styles.newsBody}>{news.content}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Contests Section */}
          {showContests && contestNotifications.length > 0 && (
            <View style={styles.section}>
              {activeTab === 'all' && (
                <View style={styles.sectionHeaderRow}>
                  <IconSymbol
                    ios_icon_name="trophy.fill"
                    android_material_icon_name="emoji-events"
                    size={24}
                    color="#F59E0B"
                  />
                  <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>Active Contests</Text>
                </View>
              )}
              {contestNotifications.map((contest) => (
                <View key={contest.id} style={styles.contestCard}>
                  <View style={styles.contestGradientBar} />
                  <View style={styles.contestContent}>
                    <View style={styles.contestTopSection}>
                      <View style={styles.contestIconCircle}>
                        <IconSymbol
                          ios_icon_name="trophy.fill"
                          android_material_icon_name="emoji-events"
                          size={32}
                          color="#F59E0B"
                        />
                      </View>
                      <View style={styles.contestBadgeTag}>
                        <IconSymbol
                          ios_icon_name="star.fill"
                          android_material_icon_name="star"
                          size={12}
                          color="#FFFFFF"
                        />
                        <Text style={styles.contestBadgeTagText}>CONTEST</Text>
                      </View>
                    </View>
                    <Text style={styles.contestTitle}>{contest.title || 'Contest Alert'}</Text>
                    <Text style={styles.contestDescription}>{contest.content}</Text>
                    <View style={styles.contestFooter}>
                      <IconSymbol
                        ios_icon_name="calendar"
                        android_material_icon_name="event"
                        size={14}
                        color="#F59E0B"
                      />
                      <Text style={styles.contestFooterText}>
                        Posted {formatDate(contest.created_at)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {((showNews && newsNotifications.length === 0) || 
            (showContests && contestNotifications.length === 0)) && 
            newsNotifications.length === 0 && 
            contestNotifications.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="bell.slash"
                android_material_icon_name="notifications-off"
                size={64}
                color={colors.textTertiary}
              />
              <Text style={styles.emptyStateTitle}>No Notifications</Text>
              <Text style={styles.emptyStateText}>
                {activeTab === 'news' && 'No news updates at the moment'}
                {activeTab === 'contests' && 'No active contests right now'}
                {activeTab === 'all' && 'No announcements or contests at the moment'}
              </Text>
            </View>
          )}

          {/* Recent Activity Section - Only show in 'all' tab */}
          {activeTab === 'all' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="history"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.sectionTitle}>Recent Activity</Text>
              </View>
              {PLACEHOLDER_ACTIVITIES.map((activity) => (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityIconContainer}>
                    <IconSymbol
                      ios_icon_name={activity.icon}
                      android_material_icon_name={activity.iconAndroid}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityTime}>{formatRelativeTime(activity.timestamp)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.background,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabTextActiveContest: {
    color: '#F59E0B',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeContest: {
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  // News Card Styles - Clean, minimal design
  newsCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  newsTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  newsTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(102, 66, 239, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newsTypeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  newsDate: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  newsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  newsBody: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // Contest Card Styles - Bold, eye-catching design
  contestCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  contestGradientBar: {
    height: 6,
    backgroundColor: '#F59E0B',
  },
  contestContent: {
    padding: 20,
  },
  contestTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  contestIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contestBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  contestBadgeTagText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  contestTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 28,
  },
  contestDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 16,
  },
  contestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
  },
  contestFooterText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#F59E0B',
  },
  // Activity Card Styles
  activityCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(102, 66, 239, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.textTertiary,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
