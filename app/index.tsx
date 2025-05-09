import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
}

// Main app component
export default function ChatbotApp() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Format timestamp to display only hours and minutes
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Simulate bot response
  const handleSendMessage = () => {
    if (inputText.trim() === "") return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate bot thinking and responding
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputText),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  // Simple bot response generator - replace with actual logic or API call
  const generateBotResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return "Hello there! How can I assist you today?";
    } else if (lowerInput.includes("help")) {
      return "I'm here to help! Feel free to ask me anything.";
    } else if (lowerInput.includes("thank")) {
      return "You're welcome! Is there anything else I can help with?";
    } else if (lowerInput.includes("bye")) {
      return "Goodbye! Have a great day!";
    } else {
      return "That's an interesting point. Could you tell me more about what you're looking for?";
    }
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

    return (
      <View
        style={[
          styles.messageBubbleContainer,
          isBot ? styles.botMessageContainer : styles.userMessageContainer,
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
      </View>
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
          <Text style={styles.headerTitle}>NextStep</Text>
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
            <Text style={styles.typingText}>AI is typing</Text>
            <ActivityIndicator
              size="small"
              color="#6E56CF"
              style={styles.typingDots}
            />
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
    fontSize: 25,
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
  typingText: {
    fontSize: 14,
    color: "#6B7280",
    marginHorizontal: 8,
  },
  typingDots: {
    marginLeft: 4,
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
