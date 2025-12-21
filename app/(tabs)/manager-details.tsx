
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { useCreatorData } from '@/hooks/useCreatorData';
import { IconSymbol } from '@/components/IconSymbol';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

interface ManagerData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  whatsapp: string | null;
}

export default function ManagerDetailsScreen() {
  const { creator, loading: creatorLoading } = useCreatorData();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [manager, setManager] = useState<ManagerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagerData();
  }, [creator]);

  const fetchManagerData = async () => {
    if (!creator || !creator.assigned_manager_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch manager data
      const { data: managerData, error: managerError } = await supabase
        .from('managers')
        .select(`
          id,
          whatsapp,
          user_id,
          users:user_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('id', creator.assigned_manager_id)
        .single();

      if (managerError) throw managerError;

      if (managerData && managerData.users) {
        const userData = Array.isArray(managerData.users) ? managerData.users[0] : managerData.users;
        setManager({
          id: managerData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          avatar_url: userData.avatar_url,
          whatsapp: managerData.whatsapp,
        });
      }
    } catch (error: any) {
      console.error('Error fetching manager data:', error);
      Alert.alert('Error', 'Failed to load manager data');
    } finally {
      setLoading(false);
    }
  };

  const handleTikTokPress = () => {
    if (creator?.creator_handle) {
      const url = `https://www.tiktok.com/@${creator.creator_handle}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open TikTok');
      });
    }
  };

  const handleEmailPress = () => {
    if (manager?.email) {
      Linking.openURL(`mailto:${manager.email}`).catch(() => {
        Alert.alert('Error', 'Could not open email app');
      });
    }
  };

  const handleWhatsAppPress = () => {
    if (manager?.whatsapp) {
      const phoneNumber = manager.whatsapp.replace(/[^0-9]/g, '');
      const url = `https://wa.me/${phoneNumber}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open WhatsApp');
      });
    }
  };

  if (creatorLoading || loading || !fontsLoaded) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Manager Details',
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading manager details...</Text>
      </View>
    );
  }

  if (!creator?.assigned_manager_id || !manager) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Manager Details',
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="person.crop.circle.badge.xmark"
            android_material_icon_name="person-off"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={styles.emptyStateTitle}>No Manager Assigned</Text>
          <Text style={styles.emptyStateText}>
            You don&apos;t have a manager assigned yet. Contact support for assistance.
          </Text>
        </View>
      </View>
    );
  }

  const profileImageUrl = manager.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Manager Details',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profileImageUrl }}
              style={styles.profileImage}
            />
            <View style={styles.onlineIndicator} />
          </View>

          <Text style={styles.managerName}>
            {manager.first_name} {manager.last_name}
          </Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>YOUR MANAGER</Text>
          </View>
        </View>

        {/* Contact Options */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Options</Text>

          {/* TikTok */}
          {creator.creator_handle && (
            <TouchableOpacity style={styles.contactCard} onPress={handleTikTokPress}>
              <View style={styles.contactIconContainer}>
                <IconSymbol
                  ios_icon_name="music.note"
                  android_material_icon_name="music-note"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>TikTok</Text>
                <Text style={styles.contactValue}>@{creator.creator_handle}</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}

          {/* Email */}
          <TouchableOpacity style={styles.contactCard} onPress={handleEmailPress}>
            <View style={styles.contactIconContainer}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{manager.email}</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {/* WhatsApp */}
          {manager.whatsapp && (
            <TouchableOpacity style={styles.contactCard} onPress={handleWhatsAppPress}>
              <View style={styles.contactIconContainer}>
                <IconSymbol
                  ios_icon_name="message.fill"
                  android_material_icon_name="chat"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactValue}>{manager.whatsapp}</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Your manager is here to support you on your creator journey. Feel free to reach out with any questions or concerns.
          </Text>
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  profileCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    borderWidth: 4,
    borderColor: colors.backgroundAlt,
  },
  managerName: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  contactSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.grey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
