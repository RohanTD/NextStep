import ChatScreen from "@/app/index"; // Adjust path if needed
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { SafeAreaView, StatusBar } from "react-native";

const Stack = createStackNavigator();

export default function Layout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <Stack.Navigator
        screenOptions={{
          // tabBarActiveTintColor: '#ffd33d',
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
        <Stack.Screen name="NextStep" component={ChatScreen} />
      </Stack.Navigator>
    </SafeAreaView>
  );
}
