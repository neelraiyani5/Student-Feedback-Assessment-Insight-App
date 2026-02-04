import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import AppText from "../../components/AppText";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS, SPACING } from "../../constants/theme";
import {
  getCCReviewableTasks,
  reviewCourseFileTask,
} from "../../services/courseFileApi";

const CCCourseFileReviewScreen = () => {
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams();
  const [assignment, setAssignment] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingTask, setReviewingTask] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [assignmentId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getCCReviewableTasks(assignmentId);
      setAssignment(data.assignment);
      setTasks(data.tasks);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (task, action) => {
    setReviewingTask({ ...task, action });
    setRemarks("");
    setModalVisible(true);
  };

  const submitReview = async () => {
    if (!reviewingTask) return;

    try {
      setLoading(true);
      await reviewCourseFileTask(
        reviewingTask.id,
        reviewingTask.action,
        remarks,
      );
      Alert.alert(
        "Success",
        `Task ${reviewingTask.action === "YES" ? "approved" : "rejected"}`,
      );
      setModalVisible(false);
      fetchTasks();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const TaskCard = ({ task }) => {
    const isReviewable = task.requiresCCReview;

    return (
      <View
        style={[
          styles.taskCard,
          {
            borderLeftColor: isReviewable ? COLORS.warning : COLORS.success,
            borderLeftWidth: 4,
          },
        ]}
      >
        <View style={styles.taskHeader}>
          <View style={{ flex: 1 }}>
            <AppText style={styles.taskTitle}>{task.template.title}</AppText>
            <AppText variant="caption" style={styles.taskDesc}>
              {task.template.description}
            </AppText>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View>
            <AppText variant="small" style={styles.label}>
              Status:
            </AppText>
            <AppText
              variant="small"
              style={{ color: COLORS.success, fontWeight: "600" }}
            >
              ✓ Completed by Faculty
            </AppText>
          </View>
          <View>
            <AppText variant="small" style={styles.label}>
              Deadline:
            </AppText>
            <AppText variant="small">
              {new Date(task.deadline).toLocaleDateString()}
            </AppText>
          </View>
        </View>

        {task.ccReviewed && (
          <View style={styles.reviewedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={COLORS.success}
            />
            <AppText variant="small" style={styles.reviewedText}>
              You {task.ccStatus === "YES" ? "approved" : "rejected"} this on{" "}
              {new Date(task.ccReviewDate).toLocaleDateString()}
            </AppText>
            {task.ccRemarks && (
              <AppText variant="caption" style={styles.remarks}>
                Your remarks: {task.ccRemarks}
              </AppText>
            )}
          </View>
        )}

        {isReviewable && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.btn, styles.approveBtn]}
              onPress={() => handleReview(task, "YES")}
            >
              <Ionicons name="checkmark" size={16} color={COLORS.white} />
              <AppText style={styles.btnText}>Approve</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={() => handleReview(task, "NO")}
            >
              <Ionicons name="close" size={16} color={COLORS.white} />
              <AppText style={styles.btnText}>Reject</AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <AppText variant="h3">Review Tasks</AppText>
          {assignment && (
            <>
              <AppText variant="small" style={styles.faculty}>
                {assignment.faculty}
              </AppText>
              <AppText variant="small" style={styles.subject}>
                {assignment.subject}
              </AppText>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 100,
            }}
          >
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="checkmark-done-circle"
              size={48}
              color={COLORS.success}
            />
            <AppText style={styles.emptyText}>All tasks reviewed!</AppText>
          </View>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">
                {reviewingTask?.action === "YES" ? "Approve" : "Reject"} Task
              </AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <AppText style={styles.taskName}>
                {reviewingTask?.template.title}
              </AppText>

              <AppText variant="h4" style={styles.remarksLabel}>
                {reviewingTask?.action === "YES"
                  ? "Comments (optional)"
                  : "Feedback for faculty"}
              </AppText>
              <TextInput
                style={styles.textInput}
                placeholder={`Enter ${reviewingTask?.action === "YES" ? "comments" : "rejection reason"}...`}
                multiline
                numberOfLines={4}
                value={remarks}
                onChangeText={setRemarks}
                placeholderTextColor={COLORS.textLight}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setModalVisible(false)}
                >
                  <AppText style={styles.cancelBtnText}>Cancel</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    reviewingTask?.action === "YES"
                      ? styles.approveModalBtn
                      : styles.rejectModalBtn,
                  ]}
                  onPress={submitReview}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <AppText style={styles.submitBtnText}>
                      {reviewingTask?.action === "YES" ? "Approve" : "Reject"}
                    </AppText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    marginLeft: SPACING.m,
    flex: 1,
  },
  faculty: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  subject: {
    color: COLORS.primary,
    fontWeight: "500",
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.l,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  emptyText: {
    marginTop: SPACING.m,
    color: COLORS.success,
    fontWeight: "600",
  },
  taskCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderRadius: 8,
  },
  taskHeader: {
    marginBottom: SPACING.m,
  },
  taskTitle: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: SPACING.xs,
  },
  taskDesc: {
    color: COLORS.textSecondary,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.m,
  },
  label: {
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  reviewedBadge: {
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.m,
    borderRadius: 6,
    marginBottom: SPACING.m,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  reviewedText: {
    marginLeft: SPACING.s,
    color: COLORS.success,
    fontWeight: "500",
  },
  remarks: {
    marginTop: SPACING.xs,
    marginLeft: SPACING.s,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    gap: SPACING.m,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.m,
    borderRadius: 6,
    gap: SPACING.s,
  },
  approveBtn: {
    backgroundColor: COLORS.success,
  },
  rejectBtn: {
    backgroundColor: COLORS.error,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalBody: {
    padding: SPACING.l,
  },
  taskName: {
    fontWeight: "600",
    marginBottom: SPACING.m,
    fontSize: 16,
  },
  remarksLabel: {
    marginBottom: SPACING.s,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.m,
    marginBottom: SPACING.l,
    color: COLORS.text,
    fontFamily: "Helvetica",
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: SPACING.m,
  },
  modalBtn: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: COLORS.border,
  },
  cancelBtnText: {
    fontWeight: "600",
    color: COLORS.text,
  },
  approveModalBtn: {
    backgroundColor: COLORS.success,
  },
  rejectModalBtn: {
    backgroundColor: COLORS.error,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: "600",
  },
});

export default CCCourseFileReviewScreen;
