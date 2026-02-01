import { useRouter } from "expo-router";
import { useState } from "react";
import { TouchableOpacity, StyleSheet, TextInput, View } from "react-native";
import AppText from "../../components/AppText";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS, SPACING, LAYOUT } from "../../constants/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    console.log("Registering:", email, password);
    // Logic here
    router.replace("/login");
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <AppText variant="h1" align="center" style={styles.header}>Create Account</AppText>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.textLight}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.textLight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleRegister}>
             <AppText color={COLORS.white} fontWeight="bold">Sign Up</AppText>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
      flex: 1, 
      padding: SPACING.m, 
      justifyContent: "center" 
  },
  header: {
    marginBottom: SPACING.l,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    padding: SPACING.m,
    borderRadius: LAYOUT.radius.s,
    marginBottom: SPACING.m,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  },
  btn: {
      backgroundColor: COLORS.success,
      padding: SPACING.m,
      borderRadius: LAYOUT.radius.s,
      alignItems: 'center'
  }
});
