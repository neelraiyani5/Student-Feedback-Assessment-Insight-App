import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import AppText from "../../components/AppText";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS, SPACING, LAYOUT } from "../../constants/theme";
import { wp } from "../../utils/responsive";
import { getMyCourseAssignments } from "../../services/api";

const FacultyCourseFileScreen = () => {
  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const data = await getMyCourseAssignments();
      setAssignments(data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load your course assignments");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments().finally(() => setRefreshing(false));
  };

  const AssignmentCard = ({ assignment }) => {
    const total = assignment?.progress?.total || 0;
    const completed = assignment?.progress?.completed || 0;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Determine status color based on progress
    const getProgressColor = () => {
        if (percent >= 100) return COLORS.success;
        if (percent >= 50) return COLORS.primary;
        return COLORS.warning;
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/course-checklist?assignmentId=${assignment.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: getProgressColor() + '15' }]}>
            <Ionicons name="book" size={24} color={getProgressColor()} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={styles.subjectName}>{assignment.subject.name}</AppText>
            <AppText variant="caption" style={styles.classText}>
              {assignment.class.name} • {assignment.class.semester?.sem || 'N/A'} Semester
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <AppText variant="small" style={styles.progressLabel}>Compliance Progress</AppText>
            <AppText variant="small" style={[styles.progressValue, { color: getProgressColor() }]}>
                {percent}%
            </AppText>
          </View>
          <View style={styles.progressBarBg}>
            <View 
                style={[
                    styles.progressBarFill, 
                    { width: `${percent}%`, backgroundColor: getProgressColor() }
                ]} 
            />
          </View>
          <AppText variant="caption" style={styles.taskCount}>
            {completed} of {total} items completed
          </AppText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <AppText variant="h2" style={styles.headerTitle}>
          My Course File Assignments
        </AppText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <AppText style={{ marginTop: SPACING.m, color: COLORS.textSecondary }}>
              Loading Assignments...
            </AppText>
          </View>
        ) : assignments.length === 0 ? (
          <View style={styles.centerContent}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="folder-open-outline" size={64} color={COLORS.textLight} />
            </View>
            <AppText style={styles.emptyText}>
              No course file assignments assigned to you yet.
            </AppText>
          </View>
        ) : (
          <View style={styles.listContainer}>
              <AppText variant="caption" style={styles.listSubtitle}>
                Select a subject to view and manage your course file checklist.
              </AppText>
              {assignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.l,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  listContainer: {
    padding: SPACING.l,
  },
  listSubtitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.l,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.l,
    gap: SPACING.m
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  subjectName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2
  },
  classText: {
    color: COLORS.textSecondary,
  },
  progressSection: {
    marginTop: SPACING.s,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  progressValue: {
    fontWeight: "700",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  taskCount: {
    color: COLORS.textLight,
  },
  emptyIconContainer: {
    marginBottom: SPACING.l,
    opacity: 0.5
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.xl,
    fontSize: 16
  },
});

export default FacultyCourseFileScreen;
