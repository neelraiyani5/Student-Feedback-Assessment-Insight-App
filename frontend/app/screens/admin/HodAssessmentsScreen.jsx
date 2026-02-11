import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import AppText from "../../components/AppText";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS, SPACING, LAYOUT } from "../../constants/theme";

const HodAssessmentsScreen = () => {
  const router = useRouter();
  const { subjectId, subjectName } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load assessments data here when API is available
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      // TODO: Fetch assessments for this subject
      // const data = await getSubjectAssessments(subjectId);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: SPACING.m }}>
          <AppText variant="h2" style={styles.headerTitle}>
            Manage Assessment
          </AppText>
          <AppText variant="body2" color={COLORS.textSecondary}>
            {subjectName}
          </AppText>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText style={{ marginTop: SPACING.m, color: COLORS.textSecondary }}>
            Loading assessments...
          </AppText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.emptyContainer}>
            <Ionicons
              name="clipboard-outline"
              size={48}
              color={COLORS.textLight}
            />
            <AppText style={styles.emptyText}>
              Assessment management coming soon
            </AppText>
          </View>
        </ScrollView>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  container: {
    flex: 1,
    padding: SPACING.m,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
    gap: SPACING.m,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});

export default HodAssessmentsScreen;
