import React, { useEffect } from 'react';
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { COLORS, FONTS, SPACING, LAYOUT } from "../constants/theme";
import AppText from "../components/AppText";
import ScreenWrapper from "../components/ScreenWrapper";
import { wp, hp } from "../utils/responsive";
import { getToken, getMyProfile, getUserInfoFromToken } from "../services/api";

export default function LandingScreen() {
  const router = useRouter();

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const userInfo = await getUserInfoFromToken();
      if (userInfo && userInfo.role) {
        if (userInfo.role === 'HOD' || userInfo.role === 'CC') {
            router.replace('/coordinator-dashboard');
        } else if (userInfo.role === 'FACULTY') {
            router.replace('/faculty-dashboard');
        } else if (userInfo.role === 'STUDENT') {
            router.replace('/student-dashboard');
        }
      }
    } catch (error) {
      console.log("Quick login check failed", error);
    }
  };

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

        {/* <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: COLORS.black }]}
            onPress={() => router.push("/register")}
          >
             <AppText variant="body1" fontWeight="600" color={COLORS.white}>Create Account</AppText>
          </TouchableOpacity>
        </View> */}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
