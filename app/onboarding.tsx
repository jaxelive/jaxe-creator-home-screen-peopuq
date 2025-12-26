
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { VideoView, useVideoPlayer } from 'expo-video';
import { IconSymbol } from '@/components/IconSymbol';
import { useCreatorData } from '@/hooks/useCreatorData';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  content: string | null;
  media_type: 'image' | 'video' | 'none' | null;
  media_url: string | null;
  slide_order: number;
  slide_type: 'default' | 'notification_request' | 'profile_upload';
}

export default function OnboardingScreen() {
  const { creator, refetch } = useCreatorData();
  const [slides, setSlides] = useState<OnboardingSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  const videoPlayer = useVideoPlayer(
    slides[currentIndex]?.media_url || '',
    (player) => {
      if (slides[currentIndex]?.media_type === 'video' && slides[currentIndex]?.media_url) {
        player.loop = true;
        player.play();
      }
    }
  );

  useEffect(() => {
    fetchOnboardingSlides();
    checkNotificationPermissions();
  }, []);

  useEffect(() => {
    // Update video player when slide changes
    if (slides[currentIndex]?.media_type === 'video' && slides[currentIndex]?.media_url) {
      videoPlayer.replace(slides[currentIndex].media_url!);
      videoPlayer.play();
    }
  }, [currentIndex, slides]);

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationStatus(status);
  };

  const fetchOnboardingSlides = async () => {
    try {
      setLoading(true);

      // Fetch active onboarding
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboardings')
        .select('id')
        .eq('is_active', true)
        .single();

      if (onboardingError) {
        console.error('[Onboarding] Error fetching onboarding:', onboardingError);
        Alert.alert('Error', 'Failed to load onboarding content.');
        return;
      }

      // Fetch slides for this onboarding
      const { data: slidesData, error: slidesError } = await supabase
        .from('onboarding_slides')
        .select('*')
        .eq('onboarding_id', onboardingData.id)
        .order('slide_order', { ascending: true });

      if (slidesError) {
        console.error('[Onboarding] Error fetching slides:', slidesError);
        Alert.alert('Error', 'Failed to load onboarding slides.');
        return;
      }

      setSlides(slidesData as OnboardingSlide[]);
    } catch (error) {
      console.error('[Onboarding] Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const currentSlide = slides[currentIndex];

    // Handle interactive slides
    if (currentSlide.slide_type === 'notification_request') {
      if (notificationStatus !== 'granted') {
        Alert.alert(
          'Enable Notifications',
          'Please enable notifications to continue and stay updated on important announcements.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    if (currentSlide.slide_type === 'profile_upload') {
      if (!profileImage && !creator?.avatar_url && !creator?.profile_picture_url) {
        Alert.alert(
          'Profile Photo Required',
          'Please upload a profile photo to continue.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Upload profile picture if selected
      if (profileImage && uploading === false) {
        await uploadProfilePicture();
      }
    }

    // Move to next slide or finish
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Onboarding complete
      router.replace('/(tabs)/(home)/');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Onboarding?',
      'Are you sure you want to skip the onboarding? You can always access it later from Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: () => router.replace('/(tabs)/(home)/') },
      ]
    );
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setNotificationStatus(finalStatus);

      if (finalStatus === 'granted') {
        Alert.alert('Success', 'Notifications enabled! You\'ll stay updated on everything important.');
      } else {
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications later in your device settings.'
        );
      }
    } catch (error) {
      console.error('[Onboarding] Error requesting notifications:', error);
      Alert.alert('Error', 'Failed to request notification permissions.');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need camera roll permissions to upload your profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const uploadProfilePicture = async () => {
    if (!profileImage || !creator) {
      return;
    }

    setUploading(true);

    try {
      // In a production app, you would upload to Supabase Storage
      // For now, we'll update the creators table with the URI
      const { error } = await supabase
        .from('creators')
        .update({ 
          avatar_url: profileImage,
          profile_picture_url: profileImage 
        })
        .eq('id', creator.id);

      if (error) {
        console.error('[Onboarding] Upload error:', error);
        Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
        return;
      }

      await refetch();
      Alert.alert('Success', 'Profile picture uploaded successfully!');
    } catch (error) {
      console.error('[Onboarding] Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading onboarding...</Text>
      </View>
    );
  }

  if (slides.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No onboarding content available</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      {/* Slide Content */}
      <ScrollView 
        contentContainerStyle={styles.slideContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Media Section */}
        {currentSlide.media_type === 'video' && currentSlide.media_url ? (
          <View style={styles.mediaContainer}>
            <VideoView
              style={styles.video}
              player={videoPlayer}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
            />
          </View>
        ) : currentSlide.media_type === 'image' && currentSlide.media_url ? (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: currentSlide.media_url }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.mediaContainer}>
            <View style={styles.placeholderMedia}>
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="auto_awesome"
                size={80}
                color={colors.primary}
              />
            </View>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{currentSlide.title}</Text>

        {/* Content */}
        {currentSlide.content && (
          <Text style={styles.content}>{currentSlide.content}</Text>
        )}

        {/* Interactive Elements */}
        {currentSlide.slide_type === 'notification_request' && (
          <View style={styles.interactiveSection}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                notificationStatus === 'granted' && styles.actionButtonSuccess,
              ]}
              onPress={requestNotificationPermissions}
              disabled={notificationStatus === 'granted'}
            >
              <LinearGradient
                colors={
                  notificationStatus === 'granted'
                    ? ['#10B981', '#059669']
                    : colors.gradientPurple
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <IconSymbol
                  ios_icon_name={
                    notificationStatus === 'granted'
                      ? 'checkmark.circle.fill'
                      : 'bell.fill'
                  }
                  android_material_icon_name={
                    notificationStatus === 'granted' ? 'check_circle' : 'notifications'
                  }
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.actionButtonText}>
                  {notificationStatus === 'granted'
                    ? 'Notifications Enabled ✓'
                    : 'Enable Notifications'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {currentSlide.slide_type === 'profile_upload' && (
          <View style={styles.interactiveSection}>
            <TouchableOpacity style={styles.avatarUploadContainer} onPress={pickImage}>
              {profileImage || creator?.avatar_url || creator?.profile_picture_url ? (
                <Image
                  source={{
                    uri:
                      profileImage ||
                      creator?.profile_picture_url ||
                      creator?.avatar_url ||
                      '',
                  }}
                  style={styles.avatarPreview}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <IconSymbol
                    ios_icon_name="camera.fill"
                    android_material_icon_name="add_a_photo"
                    size={48}
                    color={colors.primary}
                  />
                  <Text style={styles.avatarPlaceholderText}>Tap to Upload Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {profileImage && !uploading && (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={uploadProfilePicture}
              >
                <LinearGradient
                  colors={colors.gradientPurple}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.uploadButtonGradient}
                >
                  <Text style={styles.uploadButtonText}>Upload Photo</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {uploading && (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentIndex && styles.progressDotActive,
                index < currentIndex && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          {currentIndex > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="chevron_left"
                size={24}
                color={colors.text}
              />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, currentIndex === 0 && styles.nextButtonFull]}
            onPress={handleNext}
          >
            <LinearGradient
              colors={colors.gradientPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={24}
                color="#FFFFFF"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.error,
    textAlign: 'center',
    marginBottom: 24,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 60,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  slideContainer: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'android' ? 100 : 120,
    paddingHorizontal: 24,
    paddingBottom: 200,
  },
  mediaContainer: {
    width: '100%',
    height: height * 0.35,
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.backgroundAlt,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderMedia: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  content: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 24,
  },
  interactiveSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonSuccess: {
    opacity: 0.8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarUploadContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatarPreview: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  avatarPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
  },
  uploadButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  uploadButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundAlt,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'android' ? 24 : 40,
    paddingHorizontal: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    width: 32,
    backgroundColor: colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderRadius: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  nextButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
