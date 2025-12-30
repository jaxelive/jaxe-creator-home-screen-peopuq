
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useCreatorData } from '@/hooks/useCreatorData';

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  androidIcon: string;
  route: string;
  color: string;
}

const MANAGER_TOOLS: ToolItem[] = [
  {
    id: 'manager-portal',
    title: 'Manager Portal',
    description: 'View your manager dashboard',
    icon: 'person.3.fill',
    androidIcon: 'group',
    route: '/(tabs)/manager-portal',
    color: '#10B981',
  },
];

const CREATOR_TOOLS: ToolItem[] = [
  {
    id: 'academy',
    title: 'Academy',
    description: 'Master your creator journey',
    icon: 'play.circle.fill',
    androidIcon: 'play-circle',
    route: '/(tabs)/academy',
    color: '#6642EF',
  },
  {
    id: 'challenge',
    title: '21-Day Challenge',
    description: 'Complete daily tasks',
    icon: 'calendar',
    androidIcon: 'calendar-today',
    route: '/(tabs)/challenge-list',
    color: '#3B82F6',
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Get help from JAXE Agent',
    icon: 'message.fill',
    androidIcon: 'chat',
    route: '/(tabs)/(home)/',
    color: '#10B981',
  },
  {
    id: 'contests',
    title: 'Contests',
    description: 'View active contests',
    icon: 'trophy.fill',
    androidIcon: 'emoji-events',
    route: '/(tabs)/notifications',
    color: '#F59E0B',
  },
  {
    id: 'battles',
    title: 'Battles',
    description: 'Schedule and manage battles',
    icon: 'flame.fill',
    androidIcon: 'whatshot',
    route: '/(tabs)/battles',
    color: '#EF4444',
  },
  {
    id: 'ai-flyers',
    title: 'AI Flyers',
    description: 'Create promotional flyers',
    icon: 'wand.and.stars',
    androidIcon: 'auto-awesome',
    route: '/(tabs)/ai-flyers',
    color: '#8B5CF6',
  },
  {
    id: 'bonifications',
    title: 'Bonifications',
    description: 'Calculate your bonus',
    icon: 'dollarsign.circle.fill',
    androidIcon: 'attach-money',
    route: '/(tabs)/bonifications',
    color: '#10B981',
  },
];

export default function ToolsScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { creator, loading } = useCreatorData('avelezsanti');

  // Check if user is a manager
  const isManager = creator?.user_role === 'manager';

  console.log('[ToolsScreen iOS] User role check:', {
    userRole: creator?.user_role,
    isManager,
    creatorLoaded: !!creator,
    loading,
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Tools',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Manager Tools Section - Only visible if user is a manager */}
        {isManager && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={24}
                color="#10B981"
              />
              <Text style={styles.sectionTitle}>Manager Tools</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Manage your team and track performance
            </Text>

            <View style={styles.toolsGrid}>
              {MANAGER_TOOLS.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={styles.toolCard}
                  onPress={() => router.push(tool.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.toolIconContainer, { backgroundColor: `${tool.color}20` }]}>
                    <IconSymbol
                      ios_icon_name={tool.icon}
                      android_material_icon_name={tool.androidIcon}
                      size={32}
                      color={tool.color}
                    />
                  </View>
                  <Text style={styles.toolTitle}>{tool.title}</Text>
                  <Text style={styles.toolDescription}>{tool.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Creator Tools Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto-awesome"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Creator Tools</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Everything you need to grow your creator journey
          </Text>

          <View style={styles.toolsGrid}>
            {CREATOR_TOOLS.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={styles.toolCard}
                onPress={() => router.push(tool.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.toolIconContainer, { backgroundColor: `${tool.color}20` }]}>
                  <IconSymbol
                    ios_icon_name={tool.icon}
                    android_material_icon_name={tool.androidIcon}
                    size={32}
                    color={tool.color}
                  />
                </View>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolDescription}>{tool.description}</Text>
              </TouchableOpacity>
            ))}
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
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  toolCard: {
    width: '47%',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  toolIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  toolTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  toolDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
