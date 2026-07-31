import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          contentStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Attune" }} />
        <Stack.Screen name="login" options={{ title: "Log in" }} />
        <Stack.Screen name="discover" options={{ title: "Discover" }} />
        <Stack.Screen name="matches" options={{ title: "Matches" }} />
        <Stack.Screen name="plus" options={{ title: "Attune Plus" }} />
        <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
      </Stack>
    </>
  );
}
