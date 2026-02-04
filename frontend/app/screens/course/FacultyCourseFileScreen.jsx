import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import AppText from "../../components/AppText";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { wp, hp } from "../../utils/responsive";
import {
  getFacultyCourseTasks,
  completeCoursTask,
} from "../../services/courseFileApi";

const FacultyCourseFileScreen = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getFacultyCourseTasks();
      setTasks(data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load your course file tasks");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks().finally(() => setRefreshing(false));
  };

  const handleCompleteTask = async (taskId) => {
    Alert.alert(
      "Mark Complete?",
      "Once marked complete, Class Coordinator will review this task.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Complete",
          onPress: async () => {
            try {
              await completeCoursTask(taskId);
              Alert.alert("Success", "Task marked as complete");
              fetchTasks();
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to complete task");
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (task) => {
    if (task.status === "COMPLETED") {
      if (task.ccStatus === "PENDING") return COLORS.warning; // Waiting for CC
      if (task.ccStatus === "YES" && task.hodStatus === "PENDING")
        return COLORS.info; // Waiting for HOD
      if (task.ccStatus === "YES" && task.hodStatus === "YES")
        return COLORS.success; // Fully approved
      if (task.ccStatus === "NO") return COLORS.error; // CC rejected
      if (task.hodStatus === "NO") return COLORS.error; // HOD rejected
    }
    return COLORS.textSecondary;
  };

  const getStatusText = (task) => {
    if (task.status !== "COMPLETED") return "Pending Completion";
    if (task.ccStatus === "PENDING") return "Waiting for CC Review";
    if (task.ccStatus === "NO") return "❌ CC Rejected";
    if (task.ccStatus === "YES" && task.hodStatus === "PENDING")
      return "Waiting for HOD Review";
    if (task.hodStatus === "NO") return "❌ HOD Rejected";
    if (task.hodStatus === "YES") return "✓ Approved";
    return "In Progress";
  };

  const TaskCard = ({ task }) => (
    <View
      style={[
        styles.taskCard,
        { borderLeftColor: getStatusColor(task), borderLeftWidth: 4 },
      ]}
    >
      <View style={styles.taskHeader}>
        <View style={{ flex: 1 }}>
          <AppText style={styles.taskTitle}>{task.template.title}</AppText>
          <AppText variant="caption" style={styles.taskDesc}>
            {task.template.description}
          </AppText>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(task) },
          ]}
        >
          <AppText style={styles.statusText}>
            {task.status === "COMPLETED" ? "✓" : "○"}
          </AppText>
        </View>
      </View>

      {/* Task Status */}
      <View style={styles.statusSection}>
        <AppText
          variant="small"
          style={[styles.statusLabel, { color: getStatusColor(task) }]}
        >
          {getStatusText(task)}
        </AppText>

        {task.deadline && (
          <AppText variant="small" style={styles.deadline}>
            📅 Due: {new Date(task.deadline).toLocaleDateString()}
          </AppText>
        )}
      </View>

      {/* Review History */}
      {task.status === "COMPLETED" && (
        <View style={styles.reviewHistory}>
          {/* CC Review */}
          <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <Ionicons
                name={
                  task.ccStatus === "PENDING"
                    ? "hourglass-outline"
                    : task.ccStatus === "YES"
                      ? "checkmark-circle"
                      : "close-circle"
                }
                size={16}
                color={
                  task.ccStatus === "PENDING"
                    ? COLORS.warning
                    : task.ccStatus === "YES"
                      ? COLORS.success
                      : COLORS.error
                }
              />
              <AppText variant="small" style={styles.reviewerLabel}>
                CC Review
              </AppText>
            </View>
            {task.ccStatus !== "PENDING" && (
              <>
                <AppText variant="caption" style={styles.reviewStatus}>
                  {task.ccStatus === "YES" ? "Approved" : "Rejected"}
                </AppText>
                {task.ccRemarks && (
                  <AppText variant="caption" style={styles.remarks}>
                    📝 {task.ccRemarks}
                  </AppText>
                )}
                {task.ccReviewDate && (
                  <AppText variant="caption" style={styles.reviewDate}>
                    {new Date(task.ccReviewDate).toLocaleDateString()}
                  </AppText>
                )}
              </>
            )}
          </View>

          {/* HOD Review */}
          {task.ccStatus === "YES" && (
            <View style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Ionicons
                  name={
                    task.hodStatus === "PENDING"
                      ? "hourglass-outline"
                      : task.hodStatus === "YES"
                        ? "checkmark-circle"
                        : "close-circle"
                  }
                  size={16}
                  color={
                    task.hodStatus === "PENDING"
                      ? COLORS.warning
                      : task.hodStatus === "YES"
                        ? COLORS.success
                        : COLORS.error
                  }
                />
                <AppText variant="small" style={styles.reviewerLabel}>
                  HOD Review
                </AppText>
              </View>
              {task.hodStatus !== "PENDING" && (
                <>
                  <AppText variant="caption" style={styles.reviewStatus}>
                    {task.hodStatus === "YES" ? "Approved" : "Rejected"}
                  </AppText>
                  {task.hodRemarks && (
                    <AppText variant="caption" style={styles.remarks}>
                      📝 {task.hodRemarks}
                    </AppText>
                  )}
                  {task.hodReviewDate && (
                    <AppText variant="caption" style={styles.reviewDate}>
                      {new Date(task.hodReviewDate).toLocaleDateString()}
                    </AppText>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      )}

      {/* Action Button */}
      {task.status !== "COMPLETED" && (
        <TouchableOpacity
          style={styles.completeBtn}
          onPress={() => handleCompleteTask(task.id)}
        >
          <Ionicons name="checkmark" size={16} color={COLORS.white} />
          <AppText style={styles.completeBtnText}>Mark Complete</AppText>
        </TouchableOpacity>
      )}

      {/* Re-submission for Rejection */}
      {(task.ccStatus === "NO" || task.hodStatus === "NO") &&
        task.status === "COMPLETED" && (
          <TouchableOpacity
            style={[styles.completeBtn, { backgroundColor: COLORS.warning }]}
            onPress={() => handleCompleteTask(task.id)}
          >
            <Ionicons name="reload" size={16} color={COLORS.white} />
            <AppText style={styles.completeBtnText}>Re-submit</AppText>
          </TouchableOpacity>
        )}
    </View>
  );

  return (
    <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
      <View style={styles.header}>
        <AppText variant="h2" style={styles.headerTitle}>
          My Course Files
        </AppText>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.centerContent}>
            <Ionicons name="document" size={48} color={COLORS.textSecondary} />
            <AppText
              style={{ marginTop: SPACING.m, color: COLORS.textSecondary }}
            >
              Loading...
            </AppText>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons
              name="checkmark-done-circle"
              size={48}
              color={COLORS.success}
            />
            <AppText
              style={{ marginTop: SPACING.m, color: COLORS.textSecondary }}
            >
              No course file tasks assigned
            </AppText>
          </View>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: SPACING.l,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  taskCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderRadius: 8,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.m,
  },
  taskTitle: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: SPACING.xs,
  },
  taskDesc: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SPACING.m,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },
  statusSection: {
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.m,
  },
  statusLabel: {
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  deadline: {
    color: COLORS.textSecondary,
  },
  reviewHistory: {
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.m,
    borderRadius: 6,
    marginBottom: SPACING.m,
  },
  reviewItem: {
    marginBottom: SPACING.m,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reviewItem: {
    marginBottom: SPACING.s,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  reviewerLabel: {
    fontWeight: "600",
    marginLeft: SPACING.s,
  },
  reviewStatus: {
    color: COLORS.textSecondary,
    marginLeft: 24,
    marginTop: SPACING.xs,
  },
  remarks: {
    color: COLORS.warning,
    marginLeft: 24,
    marginTop: SPACING.xs,
    fontStyle: "italic",
  },
  reviewDate: {
    color: COLORS.textLight,
    marginLeft: 24,
    marginTop: SPACING.xs,
  },
  completeBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.m,
    borderRadius: 6,
    gap: SPACING.s,
  },
  completeBtnText: {
    color: COLORS.white,
    fontWeight: "600",
  },
});

export default FacultyCourseFileScreen;
