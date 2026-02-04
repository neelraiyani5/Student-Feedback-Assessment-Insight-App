import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import AppText from "../../components/AppText";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS, FONTS, SPACING, LAYOUT } from "../../constants/theme";
import {
  getMyProfile,
  getDepartmentOverview,
  getClassSubjects,
  createClassSubject,
  updateClassSubject,
  deleteClassSubject,
  assignFacultyToClassSubject,
  getUsers,
} from "../../services/api";

const HodManageSubjectsScreen = () => {
  const router = useRouter();

  // UI States
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState("semester"); // 'semester' | 'class' | 'manage'

  // Data
  const [department, setDepartment] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  // Modals
  const [createSubjectModalVisible, setCreateSubjectModalVisible] =
    useState(false);
  const [assignFacultyModalVisible, setAssignFacultyModalVisible] =
    useState(false);

  // Form States
  const [subjectName, setSubjectName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const userData = await getMyProfile();
      setUser(userData.user);

      if (
        userData.user.hodDepartments &&
        userData.user.hodDepartments.length > 0
      ) {
        const deptId = userData.user.hodDepartments[0].id;
        const deptData = await getDepartmentOverview(deptId);
        setDepartment(deptData);
      }

      // Load faculty list (FACULTY, CC, and HOD)
      try {
        const facultyResponse = await getUsers("FACULTY");
        const ccResponse = await getUsers("CC");
        const hodResponse = await getUsers("HOD");

        const facultyList = facultyResponse.users || facultyResponse || [];
        const ccList = ccResponse.users || ccResponse || [];
        const hodList = hodResponse.users || hodResponse || [];

        // Combine all lists
        const allFaculty = [...facultyList, ...ccList, ...hodList];
        setFacultyList(allFaculty);
      } catch (err) {
        console.error("Failed to load faculty:", err);
        setFacultyList([]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSemester = (semester) => {
    setSelectedSemester(semester);
    setSelectedClass(null);
    setSubjects([]);
    setStage("class");
  };

  const handleSelectClass = async (cls) => {
    setSelectedClass(cls);
    setStage("manage");
    await fetchSubjects(cls.id);
  };

  const fetchSubjects = async (classId) => {
    setLoading(true);
    try {
      const data = await getClassSubjects(classId);
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error(error);
      // Silently handle error - show empty state instead
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!subjectName.trim()) {
      Alert.alert("Validation", "Subject name is required");
      return;
    }

    try {
      await createClassSubject(selectedClass.id, subjectName);
      setCreateSubjectModalVisible(false);
      setSubjectName("");
      await fetchSubjects(selectedClass.id);
      Alert.alert("Success", "Subject created successfully");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create subject");
    }
  };

  const handleUpdateSubject = async () => {
    if (!subjectName.trim()) {
      Alert.alert("Validation", "Subject name is required");
      return;
    }

    try {
      await updateClassSubject(selectedSubject.id, subjectName);
      setCreateSubjectModalVisible(false);
      setSubjectName("");
      setSelectedSubject(null);
      await fetchSubjects(selectedClass.id);
      Alert.alert("Success", "Subject updated successfully");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update subject");
    }
  };

  const handleDeleteSubject = (subject) => {
    Alert.alert("Delete Subject", `Delete "${subject.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteClassSubject(subject.id);
            await fetchSubjects(selectedClass.id);
            Alert.alert("Success", "Subject deleted");
          } catch (error) {
            Alert.alert("Error", "Failed to delete subject");
          }
        },
      },
    ]);
  };

  const openCreateModal = () => {
    setSubjectName("");
    setSelectedSubject(null);
    setCreateSubjectModalVisible(true);
  };

  const openEditModal = (subject) => {
    setSubjectName(subject.name);
    setSelectedSubject(subject);
    setCreateSubjectModalVisible(true);
  };

  const openAssignFacultyModal = (subject) => {
    setSelectedSubject(subject);
    setSelectedFacultyIds((subject.faculties || []).map((f) => f.id));
    setAssignFacultyModalVisible(true);
  };

  const handleAssignFaculty = async () => {
    try {
      await assignFacultyToClassSubject(selectedSubject.id, selectedFacultyIds);
      setAssignFacultyModalVisible(false);
      await fetchSubjects(selectedClass.id);
      Alert.alert("Success", "Faculty assigned");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to assign faculty");
    }
  };

  const toggleFacultySelection = (facultyId) => {
    setSelectedFacultyIds((prev) =>
      prev.includes(facultyId)
        ? prev.filter((id) => id !== facultyId)
        : [...prev, facultyId],
    );
  };

  const goBack = async () => {
    if (stage === "manage") {
      setStage("class");
      setSelectedClass(null);
      // Refresh semester data to update subject counts
      if (user && user.hodDepartments && user.hodDepartments.length > 0) {
        const deptId = user.hodDepartments[0].id;
        const deptData = await getDepartmentOverview(deptId);
        setDepartment(deptData);
        // Update selectedSemester with fresh data
        const updatedSemester = deptData.semesters.find(
          (s) => s.id === selectedSemester.id,
        );
        if (updatedSemester) {
          setSelectedSemester(updatedSemester);
        }
      }
    } else if (stage === "class") {
      setStage("semester");
      setSelectedSemester(null);
    }
  };

  if (loading && stage === "semester") {
    return (
      <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBack}
          style={stage !== "semester" && styles.backButton}
        >
          {stage !== "semester" && (
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          )}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <AppText variant="h2" style={styles.headerTitle}>
            {stage === "semester" && "Select Semester"}
            {stage === "class" && "Select Class"}
            {stage === "manage" && "Manage Subjects"}
          </AppText>
          {stage === "class" && selectedSemester && (
            <AppText variant="body2" color={COLORS.textSecondary}>
              Semester {selectedSemester.sem}
            </AppText>
          )}
          {stage === "manage" && selectedClass && (
            <AppText variant="body2" color={COLORS.textSecondary}>
              {selectedClass.name} - Semester {selectedSemester?.sem}
            </AppText>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SEMESTER SELECTION STAGE */}
        {stage === "semester" && (
          <View style={styles.container}>
            {!department || !department.semesters?.length ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={COLORS.textLight}
                />
                <AppText style={styles.emptyText}>No semesters found</AppText>
              </View>
            ) : (
              <FlatList
                data={department.semesters}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item: semester }) => (
                  <TouchableOpacity
                    style={styles.semesterCard}
                    onPress={() => handleSelectSemester(semester)}
                  >
                    <View>
                      <AppText style={styles.semesterTitle}>
                        Semester {semester.sem}
                      </AppText>
                      <AppText
                        variant="caption"
                        style={styles.semesterSubtitle}
                      >
                        {semester.classes?.length || 0} classes
                      </AppText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* CLASS SELECTION STAGE */}
        {stage === "class" && selectedSemester && (
          <View style={styles.container}>
            {!selectedSemester.classes ||
            selectedSemester.classes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="layers-outline"
                  size={48}
                  color={COLORS.textLight}
                />
                <AppText style={styles.emptyText}>
                  No classes in this semester
                </AppText>
              </View>
            ) : (
              <FlatList
                data={selectedSemester.classes}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item: cls }) => (
                  <TouchableOpacity
                    style={styles.classCard}
                    onPress={() => handleSelectClass(cls)}
                  >
                    <View>
                      <AppText style={styles.className}>{cls.name}</AppText>
                      <AppText variant="caption" style={styles.classSubtitle}>
                        {subjects.length} subjects
                      </AppText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* MANAGE SUBJECTS STAGE */}
        {stage === "manage" && selectedClass && (
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={openCreateModal}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.white} />
              <AppText style={styles.createButtonText}>Create Subject</AppText>
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : subjects.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="book-outline"
                  size={48}
                  color={COLORS.textLight}
                />
                <AppText style={styles.emptyText}>No subjects yet</AppText>
              </View>
            ) : (
              <FlatList
                data={subjects}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item: subject }) => (
                  <View style={styles.subjectCard}>
                    <View style={{ flex: 1, marginRight: SPACING.m }}>
                      <AppText style={styles.subjectName}>
                        {subject.name}
                      </AppText>
                      {subject.faculties && subject.faculties.length > 0 ? (
                        <AppText
                          variant="caption"
                          style={styles.facultyList}
                          numberOfLines={2}
                        >
                          {subject.faculties.map((f) => f.name).join(", ")}
                        </AppText>
                      ) : (
                        <AppText variant="caption" style={styles.noFaculty}>
                          No faculty assigned
                        </AppText>
                      )}
                    </View>
                    <View style={{ flexDirection: "row", gap: SPACING.xs }}>
                      <TouchableOpacity
                        onPress={() => openAssignFacultyModal(subject)}
                        style={styles.actionButton}
                      >
                        <Ionicons
                          name="person"
                          size={18}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => openEditModal(subject)}
                        style={styles.actionButton}
                      >
                        <Ionicons
                          name="pencil"
                          size={18}
                          color={COLORS.warning}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteSubject(subject)}
                        style={styles.actionButton}
                      >
                        <Ionicons name="trash" size={18} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* CREATE/EDIT SUBJECT MODAL */}
      <Modal
        visible={createSubjectModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText variant="h3" style={{ marginBottom: SPACING.m }}>
              {selectedSubject ? "Edit Subject" : "Create Subject"}
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="Subject Name"
              value={subjectName}
              onChangeText={setSubjectName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setCreateSubjectModalVisible(false);
                  setSubjectName("");
                  setSelectedSubject(null);
                }}
              >
                <AppText style={{ color: COLORS.textSecondary }}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={
                  selectedSubject ? handleUpdateSubject : handleCreateSubject
                }
              >
                <AppText style={styles.saveButtonText}>
                  {selectedSubject ? "Update" : "Create"}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ASSIGN FACULTY MODAL */}
      <Modal
        visible={assignFacultyModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText variant="h3" style={{ marginBottom: SPACING.m }}>
              Assign Faculty to {selectedSubject?.name}
            </AppText>
            <ScrollView style={{ maxHeight: 300, marginBottom: SPACING.m }}>
              {facultyList && facultyList.length > 0 ? (
                facultyList.map((faculty) => (
                  <TouchableOpacity
                    key={faculty.id}
                    style={styles.facultyOption}
                    onPress={() => toggleFacultySelection(faculty.id)}
                  >
                    <AppText>{faculty.name}</AppText>
                    <Ionicons
                      name={
                        selectedFacultyIds.includes(faculty.id)
                          ? "checkbox"
                          : "checkbox-outline"
                      }
                      size={24}
                      color={
                        selectedFacultyIds.includes(faculty.id)
                          ? COLORS.primary
                          : COLORS.border
                      }
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ padding: SPACING.m, alignItems: "center" }}>
                  <AppText style={{ color: COLORS.textSecondary }}>
                    No faculty available
                  </AppText>
                </View>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setAssignFacultyModalVisible(false);
                  setSelectedFacultyIds([]);
                }}
              >
                <AppText style={{ color: COLORS.textSecondary }}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAssignFaculty}
              >
                <AppText style={styles.saveButtonText}>Assign</AppText>
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
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING.m,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.m,
  },
  container: {
    flex: 1,
  },
  semesterCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: LAYOUT.radius.m,
    marginBottom: SPACING.m,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  semesterTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  semesterSubtitle: {
    color: COLORS.textSecondary,
  },
  classCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: LAYOUT.radius.m,
    marginBottom: SPACING.m,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  className: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  classSubtitle: {
    color: COLORS.textSecondary,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    padding: SPACING.m,
    borderRadius: LAYOUT.radius.m,
    marginBottom: SPACING.m,
    gap: SPACING.s,
  },
  createButtonText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: LAYOUT.radius.m,
    marginBottom: SPACING.m,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    gap: SPACING.s,
  },
  subjectName: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  facultyList: {
    color: COLORS.textSecondary,
    maxWidth: 200,
  },
  noFaculty: {
    color: COLORS.error,
    fontStyle: "italic",
    fontSize: 12,
  },
  actionButton: {
    padding: SPACING.m,
    borderRadius: LAYOUT.radius.s,
    backgroundColor: COLORS.surface,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: SPACING.m,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.radius.m,
    padding: SPACING.m,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: LAYOUT.radius.s,
    padding: SPACING.m,
    fontSize: 16,
    marginBottom: SPACING.m,
    backgroundColor: COLORS.surface,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SPACING.m,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: LAYOUT.radius.s,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  facultyOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
});

export default HodManageSubjectsScreen;
