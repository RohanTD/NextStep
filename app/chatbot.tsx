import { SocialResourceSystem } from "@/utils/rag";
import { Ionicons } from "@expo/vector-icons";
// import "@react-native-community/geolocation";
import type { RootStackParamList } from "@/app/_layout";
import type { RouteProp } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "react-native-get-random-values";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  animValue?: Animated.Value;
}

type ChatRouteProp = RouteProp<RootStackParamList, "NextStep">;

export default function ChatbotApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [location, setLocation] = useState(""); // <-- New location state
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // navigator.geolocation = require("@react-native-community/geolocation");

  const [system, setSystem] = useState<SocialResourceSystem | null>(null);

  const route = useRoute<ChatRouteProp>();
  const responses = route.params;

  useEffect(() => {
    const init = async () => {
      setIsTyping(true);
      const sys = await new SocialResourceSystem(responses);
      setSystem(sys);
      const firstMessageText = await sys?.handleUserQuery(
        "first!!!",
        responses?.location ?? ""
      );
      const firstMessage: Message = {
        id: "1",
        text:
          firstMessageText ??
          "Hello! I am an AI assistant that can help provide you with social resources. Do you need help finding food, housing, employment, education, healtchare, or other resources?",
        sender: "bot",
        timestamp: new Date(),
        animValue: new Animated.Value(1), // Initial message is already visible
      };
      setMessages([firstMessage]);
      setIsTyping(false);
    };
    init();
  }, []);

  const typingAnimation = useRef(new Animated.Value(0)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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

  const animateNewMessage = (newMessage: Message) => {
    const animValue = new Animated.Value(0);
    newMessage.animValue = animValue;

    Animated.timing(animValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.2)),
    }).start();

    return newMessage;
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    animateSendButton();
    Keyboard.dismiss();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      animateNewMessage(userMessage),
    ]);
    setInputText("");
    setIsTyping(true);

    setTimeout(async () => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          (await system?.handleUserQuery(
            inputText,
            responses?.location ?? ""
          )) || "I'm sorry - I'm having trouble right now. Can you try again?",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [
        ...prevMessages,
        animateNewMessage(botMessage),
      ]);
      setIsTyping(false);
    }, 50);
  };

  // useEffect(() => {
  //   if (messages.length > 0) {
  //     setTimeout(() => {
  //       flatListRef.current?.scrollToEnd({ animated: true });
  //     }, 100);
  //   }
  // }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastIndex = messages.length - 1;
      const lastMessage = messages[lastIndex];

      // Scroll to bot messages only
      if (lastMessage.sender === "bot") {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: lastIndex,
            animated: true,
            viewPosition: 0, // Scroll so the message is at the top of the view
          });
        }, 100);
      }
    }
  }, [messages]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isBot = item.sender === "bot";
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

  const typingDot = (delay: number) => (
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
          {/* <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Location"
            placeholderTextColor="#9CA3AF"
          /> */}
          {/* <GooglePlacesAutocomplete
            // Required props
            placeholder="Search"
            query={{
              key: API_KEY,
              language: "en",
              types: "geocode",
            }}
            //Changed props
            styles={styles.locationInput}
            currentLocation={true}
            currentLocationLabel="Current location"
            debounce={300}
            GoogleReverseGeocodingQuery={{
              language: "en",
              components: "country:us",
            }}
            // All other default props explicitly defined
            autoFillOnNotFound={false}
            disableScroll={false}
            enableHighAccuracyLocation={true}
            enablePoweredByContainer={true}
            fetchDetails={false}
            filterReverseGeocodingByTypes={[]}
            GooglePlacesDetailsQuery={{}}
            GooglePlacesSearchQuery={{
              rankby: "distance",
            }}
            isRowScrollable={true}
            keyboardShouldPersistTaps="always"
            listUnderlayColor="#c8c7cc"
            listViewDisplayed="auto"
            keepResultsAfterBlur={false}
            minLength={1}
            nearbyPlacesAPI="GooglePlacesSearch"
            numberOfLines={1}
            onFail={() => {}}
            onNotFound={() => {}}
            onPress={(data, details = null) => {
              // Handle selection
              console.log(data, details);
            }}
            onTimeout={() =>
              console.warn("google places autocomplete: request timeout")
            }
            predefinedPlaces={[]}
            predefinedPlacesAlwaysVisible={false}
            suppressDefaultStyles={false}
            textInputHide={false}
            textInputProps={{}}
            timeout={0}
          /> */}
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          initialNumToRender={10}
          onScrollToIndexFailed={(info) => {
            // Scroll to end as fallback
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />

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

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message AI Assistant..."
            placeholderTextColor="#9CA3AF"
            multiline
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
    backgroundColor: "#F9FAFB",
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
    justifyContent: "space-between", // <-- for spacing
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  locationInput: {
    width: 200,
    height: 32,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: "#111827",
  },
  messagesList: {
    paddingHorizontal: 5,
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
