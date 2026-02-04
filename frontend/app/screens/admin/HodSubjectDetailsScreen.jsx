import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import AppText from "../../components/AppText";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS, SPACING, LAYOUT } from "../../constants/theme";

const HodSubjectDetailsScreen = () => {
  const router = useRouter();
  const { subjectId, subjectName } = useLocalSearchParams();

  const handleNavigateCourseFile = () => {
    router.push({
      pathname: "/hod-course-file-review",
      params: { subjectId, subjectName },
    });
  };

  const handleNavigateAssessment = () => {
    router.push({
      pathname: "/assessments",
      params: { subjectId, subjectName },
    });
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
            {subjectName}
          </AppText>
          <AppText variant="body2" color={COLORS.textSecondary}>
            Subject Details
          </AppText>
        </View>
      </View>

      {/* Content */}
      <View style={styles.container}>
        <AppText variant="h3" style={styles.sectionTitle}>
          Select an Option
        </AppText>

        {/* Course File Card */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleNavigateCourseFile}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#3B82F6" }]}>
            <Ionicons name="document-text" size={32} color={COLORS.white} />
          </View>
          <View style={styles.cardContent}>
            <AppText style={styles.cardTitle}>Course File</AppText>
            <AppText variant="body2" style={styles.cardSubtitle}>
              Review and manage course file submissions
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
        </TouchableOpacity>

        {/* Manage Assessment Card */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleNavigateAssessment}
        >
          <View
            style={[styles.iconContainer, { backgroundColor: COLORS.primary }]}
          >
            <Ionicons name="clipboard" size={32} color={COLORS.white} />
          </View>
          <View style={styles.cardContent}>
            <AppText style={styles.cardTitle}>Manage Assessment</AppText>
            <AppText variant="body2" style={styles.cardSubtitle}>
              Create and manage assessments for this subject
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  container: {
    flex: 1,
    padding: SPACING.m,
  },
  sectionTitle: {
    marginBottom: SPACING.m,
    color: COLORS.textPrimary,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.radius.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    elevation: 2,
    gap: SPACING.m,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
  },
});

export default HodSubjectDetailsScreen;
