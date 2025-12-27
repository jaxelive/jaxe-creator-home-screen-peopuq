
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { useCreatorData } from '@/hooks/useCreatorData';
import { IconSymbol } from '@/components/IconSymbol';
import { uploadImageToStorage, deleteImageFromStorage, extractStoragePathFromUrl } from '@/utils/imageUpload';

export default function ProfileScreen() {
  const { creator, loading: creatorLoading, refetch } = useCreatorData();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);

  // Editable fields
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Track if profile picture has changed
  const [profilePictureChanged, setProfilePictureChanged] = useState(false);

  useEffect(() => {
    if (creator) {
      setEmail(creator.email || '');
      setLanguage(creator.language || 'English');
      setPaypalEmail(creator.paypal_email || '');
      setProfilePicture(creator.profile_picture_url || creator.avatar_url || null);
      setProfilePictureChanged(false);
    }
  }, [creator]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePicture(result.assets[0].uri);
      setProfilePictureChanged(true);
    }
  };

  const handleSave = async () => {
    if (!creator) return;

    setIsSaving(true);
    try {
      const updates: any = {
        email,
        language,
        paypal_email: paypalEmail,
      };

      // Upload profile picture if it changed
      if (profilePictureChanged && profilePicture) {
        setIsUploadingProfilePic(true);
        try {
          console.log('[Profile] Uploading profile picture...');
          
          // Delete old profile picture if it exists
          if (creator.profile_picture_url) {
            const oldPath = extractStoragePathFromUrl(creator.profile_picture_url, 'avatars');
            if (oldPath) {
              try {
                await deleteImageFromStorage(oldPath, 'avatars');
                console.log('[Profile] Old profile picture deleted');
              } catch (deleteError) {
                console.warn('[Profile] Could not delete old profile picture:', deleteError);
              }
            }
          }

          // Upload new profile picture
          const uploadResult = await uploadImageToStorage(
            profilePicture,
            'avatars',
            `creators/${creator.id}`,
            800,
            800,
            0.8
          );

          console.log('[Profile] Profile picture uploaded:', uploadResult.publicUrl);
          updates.profile_picture_url = uploadResult.publicUrl;
          updates.avatar_url = uploadResult.publicUrl;
        } catch (uploadError) {
          console.error('[Profile] Profile picture upload error:', uploadError);
          Alert.alert('Upload Error', 'Failed to upload profile picture. Please try again.');
          setIsSaving(false);
          setIsUploadingProfilePic(false);
          return;
        } finally {
          setIsUploadingProfilePic(false);
        }
      }

      // Update the creators table
      console.log('[Profile] Updating creators table with:', updates);
      const { error } = await supabase
        .from('creators')
        .update(updates)
        .eq('id', creator.id);

      if (error) {
        console.error('[Profile] Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditing(false);
        setProfilePictureChanged(false);
        await refetch();
      }
    } catch (error) {
      console.error('[Profile] Error saving profile:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestManager = () => {
    Alert.alert(
      'Request Manager',
      'Your request has been submitted. A manager will be assigned to you soon.',
      [{ text: 'OK' }]
    );
  };

  if (creatorLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Profile', headerShown: true }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!creator) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Profile', headerShown: true }} />
        <Text style={styles.errorText}>No profile data available</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                if (isEditing) {
                  // Cancel editing
                  setEmail(creator.email || '');
                  setLanguage(creator.language || 'English');
                  setPaypalEmail(creator.paypal_email || '');
                  setProfilePicture(creator.profile_picture_url || creator.avatar_url || null);
                  setProfilePictureChanged(false);
                  setIsEditing(false);
                } else {
                  setIsEditing(true);
                }
              }}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile Header - Simplified */}
        <LinearGradient
          colors={['#FFFFFF', '#FAF5FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <TouchableOpacity
            onPress={isEditing ? pickImage : undefined}
            disabled={!isEditing || isUploadingProfilePic}
            style={styles.avatarContainer}
            activeOpacity={isEditing ? 0.7 : 1}
          >
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={48}
                  color="#fff"
                />
              </View>
            )}
            {isEditing && (
              <View style={styles.editBadge}>
                {isUploadingProfilePic ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol
                    ios_icon_name="camera.fill"
                    android_material_icon_name="photo_camera"
                    size={16}
                    color="#fff"
                  />
                )}
              </View>
            )}
          </TouchableOpacity>
          
          {isEditing && (
            <Text style={styles.uploadHint}>Tap to change profile picture</Text>
          )}
          
          <Text style={styles.name}>
            {creator.first_name} {creator.last_name}
          </Text>
        </LinearGradient>

        {/* Contact Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.fieldValue}>{email || 'Not set'}</Text>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Language</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={language}
                onChangeText={setLanguage}
                placeholder="e.g., English, Spanish"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <Text style={styles.fieldValue}>{language || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <Text style={styles.sectionSubtitle}>For receiving payments only</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>PayPal Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={paypalEmail}
                onChangeText={setPaypalEmail}
                placeholder="Enter your PayPal email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.fieldValue}>{paypalEmail || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Creator Information - Read Only */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Creator Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>@{creator.creator_handle}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Region</Text>
            <Text style={styles.infoValue}>{creator.region || 'Not set'}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Graduation Tier</Text>
            <Text style={styles.infoValue}>
              {creator.graduation_status || 'Rookie'}
            </Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/onboarding' as any)}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="menu_book"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.settingLabel}>View Onboarding</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Manager Section */}
        {!creator.assigned_manager_id && (
          <TouchableOpacity
            style={styles.requestButton}
            onPress={handleRequestManager}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.requestButtonGradient}
            >
              <Text style={styles.requestButtonText}>Request Manager</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Save Button */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.saveButton, (isSaving || isUploadingProfilePic) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving || isUploadingProfilePic}
          >
            {(isSaving || isUploadingProfilePic) ? (
              <View style={styles.savingContainer}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.saveButtonText}>
                  {isUploadingProfilePic ? 'Uploading...' : 'Saving...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  uploadHint: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    paddingVertical: 4,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  requestButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  requestButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    marginRight: 16,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
});
