
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  androidIcon: string;
  route: string;
  color: string;
}

const TOOLS: ToolItem[] = [
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
    id: 'learning-hub',
    title: 'Learning Hub',
    description: '21-Day Challenge & Academy',
    icon: 'graduationcap.fill',
    androidIcon: 'school',
    route: '/(tabs)/learning-hub',
    color: '#3B82F6',
  },
  {
    id: 'bonuses',
    title: 'Bonuses',
    description: 'View earnings and bonuses',
    icon: 'dollarsign.circle.fill',
    androidIcon: 'attach-money',
    route: '/(tabs)/bonuses',
    color: '#10B981',
  },
  {
    id: 'rewards',
    title: 'Rewards',
    description: 'Track your achievements',
    icon: 'trophy.fill',
    androidIcon: 'emoji-events',
    route: '/(tabs)/rewards',
    color: '#F59E0B',
  },
  {
    id: 'shop',
    title: 'Shop',
    description: 'Browse creator tools',
    icon: 'cart.fill',
    androidIcon: 'shopping-cart',
    route: '/(tabs)/shop',
    color: '#EC4899',
  },
];

export default function ToolsScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Creator Tools</Text>
          <Text style={styles.headerSubtitle}>
            Everything you need to grow your creator journey
          </Text>
        </View>

        {/* Tools Grid */}
        <View style={styles.toolsGrid}>
          {TOOLS.map((tool) => (
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
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 24,
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
