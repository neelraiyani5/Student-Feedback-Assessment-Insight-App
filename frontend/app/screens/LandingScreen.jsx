import React, { useEffect, useState } from 'react';
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { COLORS, FONTS, SPACING, LAYOUT } from "../constants/theme";
import AppText from "../components/AppText";
import ScreenWrapper from "../components/ScreenWrapper";
import { wp, hp } from "../utils/responsive";
import { getToken, getUserInfoFromToken } from "../services/api";

export default function LandingScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      // Step 1: Check if a token exists locally — NO network call
      const token = await getToken();
      if (!token) {
        // No token at all → show the landing/welcome screen
        setChecking(false);
        return;
      }

      // Step 2: Decode the token locally to get role
      const userInfo = await getUserInfoFromToken();
      if (!userInfo || !userInfo.role) {
        // Corrupted token → show landing
        setChecking(false);
        return;
      }

      // Step 3: Navigate directly to the correct dashboard
      // The 401 interceptor will handle it if the token turns out to be expired
      if (userInfo.role === 'HOD' || userInfo.role === 'CC') {
        router.replace('/coordinator-dashboard');
      } else if (userInfo.role === 'FACULTY') {
        router.replace('/faculty-dashboard');
      } else if (userInfo.role === 'STUDENT') {
        router.replace('/student-dashboard');
      } else {
        setChecking(false);
      }
    } catch (error) {
      console.log("Token check failed:", error);
      setChecking(false);
    }
  };

  // While checking token, show a loading spinner — NOT the landing page
  if (checking) {
    return (
      <ScreenWrapper backgroundColor={COLORS.white}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  // Only show the "Streamline Academic Excellence" screen for first-time / logged-out users
  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/hello.svg")}
          contentFit="contain"
          style={styles.image}
        />
        <AppText variant="h2" align="center" style={styles.title}>
          Streamline Academic Excellence
        </AppText>
        <AppText variant="body2" align="center" color={COLORS.secondaryBlack} style={styles.subtitle}>
          Transition from manual paperwork to a unified digital ecosystem. Manage
          course files, feedback, and reviews in one secure place.
        </AppText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: COLORS.teal }]}
            onPress={() => router.push("/login")}
          >
            <AppText variant="body1" fontWeight="600" color={COLORS.white}>Log In</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.l,
    backgroundColor: COLORS.white,
  },
  title: {
    marginBottom: SPACING.s,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: wp(80),
    marginVertical: SPACING.s,
  },
  btn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: wp(80),
    maxWidth: 400,
    height: hp(35),
    marginBottom: SPACING.xl,
  },
  subtitle: {
    marginTop: SPACING.s,
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.m,
  },
});
