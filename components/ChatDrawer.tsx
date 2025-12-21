
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.85;

interface ChatDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function ChatDrawer({ visible, onClose }: ChatDrawerProps) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [message, setMessage] = React.useState('');
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible && slideAnim._value === DRAWER_WIDTH) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.drawerContent}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.agentIcon}>
                <IconSymbol
                  ios_icon_name="sparkles"
                  android_material_icon_name="auto-awesome"
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>JAXE Agent</Text>
                <Text style={styles.headerSubtitle}>AI Support</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
            <View style={styles.welcomeMessage}>
              <View style={styles.agentIconSmall}>
                <IconSymbol
                  ios_icon_name="sparkles"
                  android_material_icon_name="auto-awesome"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>
                  Hi! I&apos;m JAXE Agent, your AI assistant. How can I help you today?
                </Text>
              </View>
            </View>

            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Quick Actions</Text>
              <TouchableOpacity style={styles.suggestionButton}>
                <IconSymbol
                  ios_icon_name="questionmark.circle"
                  android_material_icon_name="help"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.suggestionText}>How do I increase my diamonds?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.suggestionText}>Tell me about the 21-Day Challenge</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton}>
                <IconSymbol
                  ios_icon_name="flame.fill"
                  android_material_icon_name="whatshot"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.suggestionText}>How do battles work?</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message..."
              placeholderTextColor={colors.textTertiary}
              multiline
            />
            <TouchableOpacity style={styles.sendButton}>
              <IconSymbol
                ios_icon_name="arrow.up.circle.fill"
                android_material_icon_name="send"
                size={32}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  welcomeMessage: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  agentIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 16,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    lineHeight: 22,
  },
  suggestionsContainer: {
    gap: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    padding: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
