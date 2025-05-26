import type { RootStackParamList } from "@/app/_layout";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  GestureResponderEvent,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type Responses = {
  name: string;
  age: string;
  location: string;
  needs: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Survey">;

const CustomButton: React.FC<{
  title: string;
  onPress: (event: GestureResponderEvent) => void;
}> = ({ title, onPress }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.button, pressed && styles.buttonPressed]}
    >
      <Text style={[styles.buttonText, pressed && styles.buttonTextPressed]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const QuestionnaireScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [responses, setResponses] = useState<Responses>({
    name: "",
    age: "",
    location: "",
    needs: "",
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const scrollViewRef = useRef<ScrollView>(null);
  const nameRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const locationRef = useRef<TextInput>(null);
  const needsRef = useRef<TextInput>(null);
  const locationContainerRef = useRef<View>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const scrollToInput = (ref: React.RefObject<any>) => {
    // if (!ref.current || !scrollViewRef.current) return;
    // const nodeHandle = findNodeHandle(ref.current);
    // if (!nodeHandle) return;
    // ref.current.measureLayout(
    //   findNodeHandle(scrollViewRef.current) as number,
    //   (x, y, width, height) => {
    //     scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
    //   },
    //   () => {}
    // );
  };

  const handleChange = (key: keyof Responses, value: string) => {
    setResponses({ ...responses, [key]: value });
  };

  const handleSubmit = () => {
    navigation.navigate("NextStep", { responses });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
    >
      <Animated.ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Intro Survey</Text>
        <Text style={styles.description}>
          This survey is completely confidential and is used only to provide you
          with the best social resources available in your area.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Name (optional)</Text>
          <TextInput
            ref={nameRef}
            style={styles.input}
            value={responses.name}
            onChangeText={(text) => handleChange("name", text)}
            placeholder="Enter your name"
            placeholderTextColor="#aaa"
            keyboardAppearance="light"
            onFocus={() => scrollToInput(nameRef)}
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Age</Text>
          <TextInput
            ref={ageRef}
            style={styles.input}
            value={responses.age}
            onChangeText={(text) => handleChange("age", text)}
            placeholder="Enter your age"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            keyboardAppearance="light"
            onFocus={() => scrollToInput(ageRef)}
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputGroup} ref={locationContainerRef}>
          <Text style={styles.label}>Your Location</Text>
          <TextInput
            ref={locationRef}
            style={styles.input}
            value={responses.location}
            onChangeText={(text) => handleChange("location", text)}
            placeholder="Enter your location (city, state, or zip)"
            placeholderTextColor="#aaa"
            keyboardAppearance="light"
            onFocus={() => scrollToInput(locationRef)}
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            What kind of help are you looking for?
          </Text>
          <TextInput
            ref={needsRef}
            style={[styles.input, { height: 90, textAlignVertical: "top" }]}
            multiline
            value={responses.needs}
            onChangeText={(text) => handleChange("needs", text)}
            placeholder="e.g., housing, food, legal help"
            placeholderTextColor="#aaa"
            keyboardAppearance="light"
            onFocus={() => scrollToInput(needsRef)}
            returnKeyType="done"
          />
        </View>

        <CustomButton title="Start Chat" onPress={handleSubmit} />
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fdfdfd",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
    marginBottom: 15,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#666",
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    color: "#222",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  button: {
    marginTop: 12,
    backgroundColor: "#4F46E5",
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonPressed: {
    backgroundColor: "#3b36b0",
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  buttonTextPressed: {
    color: "#e0e0ff",
  },
  description: {
    fontSize: 15,
    marginBottom: 25,
    color: "#aaa",
  },
});

export default QuestionnaireScreen;
