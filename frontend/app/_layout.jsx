import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ presentation: "modal" }} />
        <Stack.Screen name="register" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="profile" options={{ presentation: "modal" }} />
        <Stack.Screen name="manage-faculty" />
        <Stack.Screen name="faculty-detail" />
        <Stack.Screen name="manage-curriculum" />
        <Stack.Screen name="hod-manage-subjects" />
        <Stack.Screen name="hod-subject-details" />
      </Stack>
    </SafeAreaProvider>
  );
}
