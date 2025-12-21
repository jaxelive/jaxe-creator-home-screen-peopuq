
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';
import { BlurView } from 'expo-blur';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
}

export default function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (route: string) => {
    if (route === '/(tabs)/(home)/') {
      return pathname === '/(tabs)/(home)/' || pathname === '/(tabs)/(home)';
    }
    return pathname.startsWith(route);
  };

  const activeIndex = tabs.findIndex(tab => isActive(tab.route));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {/* Sliding Background Indicator */}
          {activeIndex >= 0 && (
            <View
              style={[
                styles.activeIndicator,
                {
                  left: `${(activeIndex / tabs.length) * 100}%`,
                  width: `${100 / tabs.length}%`,
                },
              ]}
            />
          )}

          {tabs.map((tab, index) => {
            const active = isActive(tab.route);
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.tab}
                onPress={() => router.push(tab.route as any)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name={tab.icon}
                  android_material_icon_name={tab.icon}
                  size={24}
                  color={active ? '#6642EF' : colors.text}
                />
                <Text
                  style={[
                    styles.label,
                    active && styles.labelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabBarContainer: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#6642EF',
    borderRadius: 24,
    marginVertical: 4,
    marginHorizontal: 4,
    opacity: 0.15,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    zIndex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  labelActive: {
    color: '#6642EF',
  },
});
