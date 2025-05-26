import ChatScreen from "@/app/chatbot";
import QuestionnaireScreen from "@/app/survey";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { SafeAreaView, StatusBar } from "react-native";

export type RootStackParamList = {
  Survey: undefined;
  NextStep: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function Layout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: "#ffffff",
          headerStyle: {
            backgroundColor: "#32373d",
          },
          headerTitleStyle: {
            fontWeight: "bold",
            textAlignVertical: "center",
            fontSize: 35,
          },
          headerTitleAlign: "center",
          headerShown: false,
        }}
      >
        <Stack.Screen name="Survey" component={QuestionnaireScreen} />
        <Stack.Screen name="NextStep" component={ChatScreen} />
      </Stack.Navigator>
    </SafeAreaView>
  );
}
