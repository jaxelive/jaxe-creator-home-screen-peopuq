
import { colors } from '@/styles/commonStyles';
import { useVideoProgress } from '@/hooks/useVideoProgress';
import { formatTo12Hour } from '@/utils/timeFormat';
import { supabase } from '@/app/integrations/supabase/client';
import { IconSymbol } from '@/components/IconSymbol';
import { Stack, router, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { useCreatorData } from '@/hooks/useCreatorData';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

interface CourseVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  order_index: number;
  duration_seconds: number | null;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  videos: CourseVideo[];
}

interface LiveEvent {
  id: string;
  event_name: string;
  language: string;
  event_info: string;
  event_link: string;
  event_date: string;
  event_hour: string;
  region: string | null;
  time_zone: string | null;
}

interface LiveEventRegistration {
  live_event_id: string;
  creator_handle: string;
}

const CREATOR_HANDLE = 'camilocossio';

export default function AcademyScreen() {
  const { creator, loading: creatorLoading } = useCreatorData(CREATOR_HANDLE);
  const { isVideoWatched, getCourseProgress, markVideoAsWatched, refetch: refetchVideoProgress } = useVideoProgress(CREATOR_HANDLE);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [registrations, setRegistrations] = useState<LiveEventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const fetchAcademyData = useCallback(async () => {
    try {
      console.log('[Academy] 📚 Fetching academy data...');
      
      // Fetch courses with videos
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          cover_image_url,
          course_videos (
            id,
            title,
            description,
            video_url,
            thumbnail_url,
            order_index,
            duration_seconds
          )
        `)
        .order('order_index', { ascending: true });

      if (coursesError) throw coursesError;

      const formattedCourses = (coursesData || []).map(course => ({
        ...course,
        videos: (course.course_videos || []).sort((a, b) => a.order_index - b.order_index),
      }));

      console.log('[Academy] ✅ Courses loaded:', formattedCourses.length);
      setCourses(formattedCourses);

      // Fetch live events
      const { data: eventsData, error: eventsError } = await supabase
        .from('live_events')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .order('event_hour', { ascending: true });

      if (eventsError) throw eventsError;
      console.log('[Academy] ✅ Live events loaded:', eventsData?.length || 0);
      setLiveEvents(eventsData || []);

      // Fetch registrations
      const { data: regsData, error: regsError } = await supabase
        .from('live_event_registrations')
        .select('*')
        .eq('creator_handle', CREATOR_HANDLE);

      if (regsError) throw regsError;
      console.log('[Academy] ✅ Registrations loaded:', regsData?.length || 0);
      setRegistrations(regsData || []);

    } catch (error) {
      console.error('[Academy] ❌ Error fetching academy data:', error);
      Alert.alert('Error', 'Failed to load academy data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademyData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('[Academy] 🔄 Screen focused - refetching data...');
      refetchVideoProgress();
      fetchAcademyData();
    }, [refetchVideoProgress, fetchAcademyData])
  );

  const onRefresh = useCallback(() => {
    console.log('[Academy] 🔄 Pull to refresh triggered');
    setRefreshing(true);
    refetchVideoProgress();
    fetchAcademyData();
  }, [refetchVideoProgress, fetchAcademyData]);

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
        console.log('[Academy] 📕 Course collapsed:', courseId);
      } else {
        newSet.add(courseId);
        console.log('[Academy] 📖 Course expanded:', courseId);
      }
      return newSet;
    });
  };

  const handleVideoPress = async (video: CourseVideo) => {
    console.log('[Academy] 🎬 Video pressed:', video.title);
    
    // Mark as watched immediately on tap
    await markVideoAsWatched(video.id);
    
    // Navigate to video player
    router.push({
      pathname: '/video-player',
      params: {
        videoId: video.id,
        videoUrl: video.video_url,
        title: video.title,
      },
    });
  };

  const isRegistered = (eventId: string) => {
    return registrations.some(reg => reg.live_event_id === eventId);
  };

  const handleRegister = async (eventId: string) => {
    try {
      console.log('[Academy] 📝 Registering for event:', eventId);
      
      const { error } = await supabase
        .from('live_event_registrations')
        .insert({
          live_event_id: eventId,
          creator_handle: CREATOR_HANDLE,
        });

      if (error) throw error;

      console.log('[Academy] ✅ Successfully registered for event');
      Alert.alert('Success', 'You have been registered for this event!');
      fetchAcademyData();
    } catch (error) {
      console.error('[Academy] ❌ Error registering for event:', error);
      Alert.alert('Error', 'Failed to register for event');
    }
  };

  const handleJoinEvent = (event: LiveEvent) => {
    if (event.event_link) {
      console.log('[Academy] 🔗 Opening event link:', event.event_link);
      Linking.openURL(event.event_link);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!fontsLoaded || loading || creatorLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Academy',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Courses Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Courses</Text>
          {courses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No courses available</Text>
            </View>
          ) : (
            courses.map(course => {
              const isExpanded = expandedCourses.has(course.id);
              const progress = getCourseProgress(course.id, course.videos);

              return (
                <View key={course.id} style={styles.courseCard}>
                  {/* Course Header - Collapsible */}
                  <TouchableOpacity
                    style={styles.courseHeader}
                    onPress={() => toggleCourse(course.id)}
                    activeOpacity={0.7}
                  >
                    {course.cover_image_url && (
                      <Image source={{ uri: course.cover_image_url }} style={styles.courseCover} />
                    )}
                    <View style={styles.courseHeaderText}>
                      <Text style={styles.courseTitle}>{course.title}</Text>
                      {course.description && (
                        <Text style={styles.courseDescription} numberOfLines={2}>
                          {course.description}
                        </Text>
                      )}
                      <Text style={styles.courseProgress}>
                        {progress.watched} / {progress.total} videos completed
                      </Text>
                    </View>
                    <IconSymbol
                      ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
                      android_material_icon_name={isExpanded ? 'expand-less' : 'expand-more'}
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {/* Course Videos - Expanded */}
                  {isExpanded && (
                    <View style={styles.videoList}>
                      {course.videos.map((video, index) => {
                        const watched = isVideoWatched(video.id);

                        return (
                          <TouchableOpacity
                            key={video.id}
                            style={[
                              styles.videoItem,
                              watched && styles.videoItemWatched,
                            ]}
                            onPress={() => handleVideoPress(video)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.videoNumber}>
                              {watched ? (
                                <IconSymbol 
                                  ios_icon_name="checkmark.circle.fill" 
                                  android_material_icon_name="check-circle"
                                  size={28} 
                                  color={colors.success} 
                                />
                              ) : (
                                <Text style={styles.videoNumberText}>{index + 1}</Text>
                              )}
                            </View>
                            <View style={styles.videoInfo}>
                              <Text style={[styles.videoTitle, watched && styles.videoTitleWatched]}>
                                {video.title}
                              </Text>
                              {video.description && (
                                <Text style={styles.videoDescription} numberOfLines={1}>
                                  {video.description}
                                </Text>
                              )}
                              {watched && (
                                <View style={styles.watchedBadge}>
                                  <Text style={styles.watchedBadgeText}>Watched</Text>
                                </View>
                              )}
                            </View>
                            <IconSymbol 
                              ios_icon_name="play.circle.fill" 
                              android_material_icon_name="play-circle-filled"
                              size={32} 
                              color={watched ? colors.textSecondary : colors.primary} 
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Live Events Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎥 Upcoming Live Events</Text>
          {liveEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming events</Text>
            </View>
          ) : (
            liveEvents.map(event => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventName}>{event.event_name}</Text>
                  <View style={styles.eventBadge}>
                    <Text style={styles.eventBadgeText}>{event.language}</Text>
                  </View>
                </View>
                <Text style={styles.eventInfo}>{event.event_info}</Text>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventDate}>
                    📅 {formatEventDate(event.event_date)} at {formatTo12Hour(event.event_hour)}
                  </Text>
                  {event.region && (
                    <Text style={styles.eventRegion}>🌍 {event.region}</Text>
                  )}
                </View>
                <View style={styles.eventActions}>
                  {isRegistered(event.id) ? (
                    <>
                      <View style={styles.registeredBadge}>
                        <IconSymbol 
                          ios_icon_name="checkmark.circle.fill" 
                          android_material_icon_name="check-circle"
                          size={18} 
                          color={colors.success} 
                        />
                        <Text style={styles.registeredText}>Registered</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.joinButton}
                        onPress={() => handleJoinEvent(event)}
                      >
                        <Text style={styles.joinButtonText}>Join Event</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.registerButton}
                      onPress={() => handleRegister(event.id)}
                    >
                      <Text style={styles.registerButtonText}>Register</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 16,
  },
  courseCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  courseCover: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: colors.backgroundSecondary,
  },
  courseHeaderText: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  courseProgress: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.primary,
  },
  videoList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  videoItemWatched: {
    opacity: 0.7,
    backgroundColor: colors.backgroundSecondary,
  },
  videoNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoNumberText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    marginBottom: 4,
  },
  videoTitleWatched: {
    color: colors.textSecondary,
  },
  videoDescription: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },
  watchedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  watchedBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.success,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    flex: 1,
  },
  eventBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.primary,
  },
  eventInfo: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDate: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    marginBottom: 4,
  },
  eventRegion: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  registeredText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.success,
  },
  registerButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  registerButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  joinButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },
});
