import { classifyUserResponse } from "@/utils/gpt";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Message type definition
interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  animValue?: Animated.Value; // For animation
}

// Main app component
export default function ChatbotApp() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
      animValue: new Animated.Value(1), // Initial message is already visible
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Animation values
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  // Format timestamp to display only hours and minutes
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Animate send button on press
  const animateSendButton = () => {
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(sendButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.elastic(1.2),
      }),
    ]).start();
  };

  // Start typing indicator animation
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.ease,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.ease,
          }),
        ])
      ).start();
    } else {
      typingAnimation.setValue(0);
    }
  }, [isTyping]);

  // Animate message entrance
  const animateNewMessage = (newMessage: Message) => {
    // Create animation value for the new message
    const animValue = new Animated.Value(0);
    newMessage.animValue = animValue;

    // Start the animation
    Animated.timing(animValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.2)),
    }).start();

    return newMessage;
  };

  // Simulate bot response
  const handleSendMessage = () => {
    if (inputText.trim() === "") return;

    // Animate the send button
    animateSendButton();

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    // Animate and add the user message
    setMessages((prevMessages) => [
      ...prevMessages,
      animateNewMessage(userMessage),
    ]);
    setInputText("");
    setIsTyping(true);

    // Simulate bot thinking and responding
    setTimeout(async () => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:  await classifyUserResponse(inputText),
        sender: "bot",
        timestamp: new Date(),
      };

      // Animate and add the bot message
      setMessages((prevMessages) => [
        ...prevMessages,
        animateNewMessage(botMessage),
      ]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Render individual message bubble
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isBot = item.sender === "bot";

    // Default to 1 if animValue isn't set (for initial messages)
    const animValue = item.animValue || new Animated.Value(1);

    return (
      <Animated.View
        style={[
          styles.messageBubbleContainer,
          isBot ? styles.botMessageContainer : styles.userMessageContainer,
          {
            opacity: animValue,
            transform: [
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        {/* Profile icon - only for bot messages */}
        {isBot && (
          <View style={styles.avatarContainer}>
            <View style={styles.botAvatar}>
              <Ionicons name="logo-electron" size={16} color="#FFFFFF" />
            </View>
          </View>
        )}

        <View style={styles.messageContentContainer}>
          <View
            style={[
              styles.messageBubble,
              isBot ? styles.botMessage : styles.userMessage,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isBot ? styles.botMessageText : styles.userMessageText,
              ]}
            >
              {item.text}
            </Text>
          </View>
          <Text
            style={[
              styles.timestamp,
              isBot ? styles.botTimestamp : styles.userTimestamp,
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>

        {/* Profile icon - only for user messages */}
        {!isBot && (
          <View style={styles.avatarContainer}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={16} color="#FFFFFF" />
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  // Create animated dots for the typing indicator
  const typingDot = (delay: number) => {
    return (
      <Animated.View
        style={[
          styles.typingDot,
          {
            opacity: typingAnimation.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 1, 0.3],
            }),
            transform: [
              {
                translateY: typingAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, -4, 0],
                }),
              },
            ],
          },
        ]}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Assistant</Text>
        </View>

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
        />

        {/* Typing indicator */}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <View style={styles.botAvatar}>
              <Ionicons name="logo-electron" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.typingBubble}>
              <View style={styles.typingDotsContainer}>
                {typingDot(0)}
                {typingDot(300)}
                {typingDot(600)}
              </View>
            </View>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message AI Assistant..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            onSubmitEditing={handleSendMessage}
          />
          <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? "#FFFFFF" : "#A8A8A8"}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Light background color
  },
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubbleContainer: {
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  botMessageContainer: {
    justifyContent: "flex-start",
  },
  messageContentContainer: {
    maxWidth: "70%",
    flexDirection: "column",
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userMessage: {
    backgroundColor: "#6E56CF", // Modern purple
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: "#E5E7EB",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  botMessageText: {
    color: "#111827",
  },
  avatarContainer: {
    width: 34,
    height: 34,
    marginHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#6E56CF",
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4B5563",
    justifyContent: "center",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  botTimestamp: {
    alignSelf: "flex-start",
  },
  userTimestamp: {
    alignSelf: "flex-end",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: "#E5E7EB",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  typingDotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 20,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6B7280",
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: "#111827",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6E56CF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
});
