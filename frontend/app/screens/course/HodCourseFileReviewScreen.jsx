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
  FlatList,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";

import AppText from "../../components/AppText";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS, SPACING } from "../../constants/theme";
import {
  getHodSemesters,
  getHodSemesterSubjects,
  getHodReviewableTasks,
  getSubjectReviewableTasks,
  getHodComplianceSummary,
  reviewCourseFileTask,
  getCourseFileLogs,
  clearCourseFileLogs,
} from "../../services/courseFileApi";

const HodCourseFileReviewScreen = () => {
  const router = useRouter();
  const { subjectId, subjectName } = useLocalSearchParams();
  const [step, setStep] = useState(subjectId ? "tasks" : "semester"); // semester → subjects → tasks
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviewingTask, setReviewingTask] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [subjectAssignment, setSubjectAssignment] = useState(null);

  // Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (step === "semester") {
          return false; // Allow default back behavior (exit screen)
        } else {
          handleBack();
          return true; // Prevent default back behavior
        }
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [step]),
  );

  useEffect(() => {
    if (subjectId) {
      // Direct subject view - fetch tasks immediately
      fetchSubjectTasks();
    } else if (step === "semester") {
      fetchSemesters();
      fetchCompliance();
    }
  }, [step, subjectId]);

  const fetchCompliance = async () => {
    try {
      const data = await getHodComplianceSummary();
      setCompliance(data);
    } catch (error) {
      console.log("Failed to fetch compliance summary");
    }
  };

  const fetchSubjectTasks = async () => {
    setLoading(true);
    try {
      const data = await getSubjectReviewableTasks(subjectId);
      setSubjectAssignment(data.assignment);
      setTasks(data.tasks);
      setStep("tasks");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to fetch subject tasks");
      setTimeout(() => router.back(), 1500);
    } finally {
      setLoading(false);
    }
  };

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const data = await getHodSemesters();
      setSemesters(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch semesters");
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterSelect = async (semester) => {
    setSelectedSemester(semester);
    setLoading(true);
    try {
      const data = await getHodSemesterSubjects(semester.id);
      setSubjects(data);
      setStep("subjects");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSelect = async (assignment) => {
    setSelectedAssignment(assignment);
    setLoading(true);
    try {
      const data = await getHodReviewableTasks(assignment.assignmentId);
      setTasks(data.tasks);
      setStep("tasks");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to fetch tasks");
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
      if (subjectId) {
        fetchSubjectTasks(); // Refresh subject tasks
      } else {
        handleAssignmentSelect(selectedAssignment); // Refresh assignment tasks
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (subjectId) {
      // Coming from subject details - just go back
      router.back();
    } else if (step === "subjects") {
      setStep("semester");
    } else if (step === "tasks") {
      setStep("subjects");
    } else {
      router.back();
    }
  };

  const fetchLogs = async (assignmentId) => {
    setLogsLoading(true);
    try {
      const data = await getCourseFileLogs(assignmentId);
      setLogs(data);
      setLogsModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleClearLogs = async (assignmentId) => {
    Alert.alert(
      "Clear Logs",
      "Are you sure you want to clear all logs for this course file?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              setLogsLoading(true);
              await clearCourseFileLogs(assignmentId);
              Alert.alert("Success", "Logs cleared successfully");
              setLogs([]);
              setLogsModalVisible(false);
            } catch (error) {
              Alert.alert("Error", "Failed to clear logs");
            } finally {
              setLogsLoading(false);
            }
          },
        },
      ],
    );
  };

  const TaskCard = ({ task }) => {
    const ccReviewed = task.ccStatus !== null;
    const hodCanReview = ccReviewed && !task.hodReviewed;
    const hodAlreadyReviewed = task.hodReviewed;

    return (
      <View
        style={[
          styles.taskCard,
          {
            borderLeftColor: hodCanReview
              ? COLORS.warning
              : hodAlreadyReviewed
                ? COLORS.success
                : COLORS.info,
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

        {/* CC Review Status */}
        {ccReviewed ? (
          <View style={styles.reviewSection}>
            <AppText variant="small" style={styles.sectionTitle}>
              CC Review
            </AppText>
            <View style={styles.reviewRow}>
              <Ionicons
                name={
                  task.ccStatus === "YES" ? "checkmark-circle" : "close-circle"
                }
                size={16}
                color={task.ccStatus === "YES" ? COLORS.success : COLORS.error}
              />
              <AppText variant="small" style={styles.reviewStatus}>
                {task.ccStatus === "YES" ? "Approved" : "Rejected"}
              </AppText>
              {task.ccRemarks && (
                <AppText variant="caption" style={styles.remarks}>
                  📝 {task.ccRemarks}
                </AppText>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.reviewSection}>
            <AppText variant="small" style={styles.sectionTitle}>
              CC Review
            </AppText>
            <View style={styles.reviewRow}>
              <Ionicons name="hourglass" size={16} color={COLORS.warning} />
              <AppText
                variant="small"
                style={[styles.reviewStatus, { color: COLORS.warning }]}
              >
                Pending CC Review
              </AppText>
            </View>
          </View>
        )}

        {/* HOD Review Status */}
        {hodAlreadyReviewed && (
          <View style={styles.reviewSection}>
            <AppText variant="small" style={styles.sectionTitle}>
              Your Review
            </AppText>
            <View style={styles.reviewRow}>
              <Ionicons
                name={
                  task.hodStatus === "YES" ? "checkmark-circle" : "close-circle"
                }
                size={16}
                color={task.hodStatus === "YES" ? COLORS.success : COLORS.error}
              />
              <AppText variant="small" style={styles.reviewStatus}>
                {task.hodStatus === "YES" ? "Approved" : "Rejected"}
              </AppText>
              {task.hodRemarks && (
                <AppText variant="caption" style={styles.remarks}>
                  📝 {task.hodRemarks}
                </AppText>
              )}
            </View>
          </View>
        )}

        {/* Approve/Reject Buttons - Show after CC review or if already reviewed */}
        {ccReviewed && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.approveBtn,
                hodAlreadyReviewed && { opacity: 0.6 },
              ]}
              onPress={() => handleReview(task, "YES")}
              disabled={false}
            >
              <Ionicons name="checkmark" size={16} color={COLORS.white} />
              <AppText style={styles.btnText}>Approve</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.rejectBtn,
                hodAlreadyReviewed && { opacity: 0.6 },
              ]}
              onPress={() => handleReview(task, "NO")}
              disabled={false}
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
        <TouchableOpacity
          onPress={handleBack}
          style={step !== "semester" && { flex: 0 }}
        >
          <Ionicons
            name={step === "semester" ? "arrow-back" : "chevron-back"}
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <AppText variant="h3">
            {step === "semester" && "Review Course Files"}
            {step === "subjects" && `Sem ${selectedSemester?.sem} - Subjects`}
            {step === "tasks" && (subjectId ? subjectName : "Review Tasks")}
          </AppText>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Step 1: Semesters */}
        {step === "semester" && (
          <>
            {/* Compliance Summary */}
            {compliance && (
              <View style={styles.complianceCard}>
                <AppText variant="h4" style={styles.complianceTitle}>
                  {compliance.departmentName}
                </AppText>

                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <AppText variant="small" style={styles.statLabel}>
                      Completion
                    </AppText>
                    <AppText style={styles.statValue}>
                      {compliance.completedTasks.percent}%
                    </AppText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <AppText variant="small" style={styles.statLabel}>
                      CC Reviewed
                    </AppText>
                    <AppText style={styles.statValue}>
                      {compliance.ccReviewedTasks.percent}%
                    </AppText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <AppText variant="small" style={styles.statLabel}>
                      Your Review
                    </AppText>
                    <AppText style={styles.statValue}>
                      {compliance.hodReviewedTasks.percent}%
                    </AppText>
                  </View>
                </View>
              </View>
            )}

            <AppText variant="h4" style={styles.sectionTitle}>
              Available Semesters
            </AppText>
            {loading ? (
              <ActivityIndicator
                size="large"
                color={COLORS.primary}
                style={{ marginVertical: 50 }}
              />
            ) : semesters.length === 0 ? (
              <AppText
                style={{
                  textAlign: "center",
                  marginVertical: 50,
                  color: COLORS.textSecondary,
                }}
              >
                No semesters found
              </AppText>
            ) : (
              semesters.map((dept) => (
                <View key={dept.id}>
                  <AppText variant="body2" style={styles.deptName}>
                    {dept.name}
                  </AppText>
                  {dept.semesters.map((sem) => (
                    <TouchableOpacity
                      key={sem.id}
                      style={styles.semesterCard}
                      onPress={() => handleSemesterSelect(sem)}
                    >
                      <View>
                        <AppText style={styles.semesterTitle}>
                          Semester {sem.sem}
                        </AppText>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </>
        )}

        {/* Step 2: Subjects */}
        {step === "subjects" && (
          <>
            <AppText variant="h4" style={styles.sectionTitle}>
              Subjects with Course Files
            </AppText>
            {loading ? (
              <ActivityIndicator
                size="large"
                color={COLORS.primary}
                style={{ marginVertical: 50 }}
              />
            ) : subjects.length === 0 ? (
              <AppText
                style={{
                  textAlign: "center",
                  marginVertical: 50,
                  color: COLORS.textSecondary,
                }}
              >
                No subjects found
              </AppText>
            ) : (
              subjects.map((subject) => (
                <View key={subject.subjectId} style={styles.subjectSection}>
                  <AppText variant="h4" style={styles.subjectName}>
                    {subject.subjectName}
                  </AppText>
                  {subject.assignments.map((assign) => (
                    <View
                      key={assign.assignmentId}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: SPACING.m,
                      }}
                    >
                      <TouchableOpacity
                        style={[styles.assignmentCard, { flex: 1 }]}
                        onPress={() => handleAssignmentSelect(assign)}
                      >
                        <View>
                          <AppText style={styles.assignmentFaculty}>
                            {assign.facultyName}
                          </AppText>
                          <AppText
                            variant="caption"
                            style={styles.assignmentClass}
                          >
                            {assign.className}
                          </AppText>
                          <AppText variant="small" style={styles.taskCount}>
                            {assign.totalTasks} tasks
                          </AppText>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={COLORS.textLight}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.logsButton}
                        onPress={() => fetchLogs(assign.assignmentId)}
                      >
                        <Ionicons
                          name="document-text"
                          size={18}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))
            )}
          </>
        )}

        {/* Step 3: Tasks */}
        {step === "tasks" && (
          <>
            <View style={styles.assignmentHeader}>
              <AppText variant="h3" style={styles.sectionTitle}>
                {subjectAssignment?.faculty || selectedAssignment?.facultyName}
              </AppText>
              <AppText variant="caption" style={styles.subjectInfo}>
                {subjectAssignment?.className || selectedAssignment?.className}
              </AppText>
              {subjectAssignment && (
                <AppText variant="caption" style={styles.subjectInfo}>
                  Subject: {subjectAssignment?.subject}
                </AppText>
              )}
            </View>

            {loading ? (
              <ActivityIndicator
                size="large"
                color={COLORS.primary}
                style={{ marginVertical: 50 }}
              />
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
          </>
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
                  disabled={loading}
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

      {/* Logs Modal */}
      <Modal visible={logsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">Course File Logs</AppText>
              <TouchableOpacity onPress={() => setLogsModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: SPACING.l }}>
              {logsLoading ? (
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                  style={{ marginVertical: 50 }}
                />
              ) : logs && logs.length > 0 ? (
                <View style={{ paddingVertical: SPACING.l }}>
                  {logs.map((log, index) => (
                    <View key={index} style={styles.logItem}>
                      <View style={styles.logTimeline}>
                        <View style={styles.logDot} />
                        {index !== logs.length - 1 && (
                          <View style={styles.logLine} />
                        )}
                      </View>
                      <View style={styles.logContent}>
                        <AppText style={styles.logTitle}>{log.action}</AppText>
                        <AppText variant="small" style={styles.logUser}>
                          {log.createdBy}
                        </AppText>
                        <AppText variant="caption" style={styles.logDate}>
                          {new Date(log.createdAt).toLocaleString()}
                        </AppText>
                        {log.remarks && (
                          <AppText variant="caption" style={styles.logRemarks}>
                            Remarks: {log.remarks}
                          </AppText>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View
                  style={{ paddingVertical: SPACING.l, alignItems: "center" }}
                >
                  <AppText
                    variant="caption"
                    style={{ color: COLORS.textSecondary }}
                  >
                    No logs available
                  </AppText>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setLogsModalVisible(false)}
              >
                <AppText style={styles.cancelBtnText}>Close</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.rejectModalBtn]}
                onPress={() =>
                  handleClearLogs(selectedAssignment?.assignmentId)
                }
                disabled={logsLoading}
              >
                <AppText style={styles.submitBtnText}>Clear Logs</AppText>
              </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: SPACING.l,
  },
  complianceCard: {
    backgroundColor: COLORS.primary,
    padding: SPACING.l,
    borderRadius: 12,
    marginBottom: SPACING.l,
  },
  complianceTitle: {
    color: COLORS.white,
    marginBottom: SPACING.m,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: SPACING.xs,
  },
  statValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  sectionTitle: {
    marginBottom: SPACING.m,
    marginTop: SPACING.l,
    fontWeight: "600",
  },
  deptName: {
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  semesterCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  semesterTitle: {
    fontWeight: "600",
    fontSize: 16,
  },
  subjectSection: {
    marginBottom: SPACING.l,
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: 8,
  },
  subjectName: {
    marginBottom: SPACING.m,
    fontWeight: "600",
    color: COLORS.primary,
  },
  assignmentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  assignmentFaculty: {
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  assignmentClass: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  taskCount: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  assignmentHeader: {
    marginBottom: SPACING.m,
  },
  subjectInfo: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
  reviewSection: {
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.m,
    borderRadius: 6,
    marginBottom: SPACING.m,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  reviewStatus: {
    marginLeft: SPACING.s,
    fontWeight: "600",
  },
  remarks: {
    marginLeft: SPACING.m,
    marginTop: SPACING.xs,
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
  logsButton: {
    padding: SPACING.m,
    marginLeft: SPACING.s,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  logItem: {
    flexDirection: "row",
    marginBottom: SPACING.l,
  },
  logTimeline: {
    alignItems: "center",
    marginRight: SPACING.l,
  },
  logDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  logLine: {
    width: 2,
    height: 60,
    backgroundColor: COLORS.border,
    marginTop: SPACING.s,
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  logUser: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  logDate: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  logRemarks: {
    color: COLORS.warning,
    fontStyle: "italic",
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
});

export default HodCourseFileReviewScreen;
