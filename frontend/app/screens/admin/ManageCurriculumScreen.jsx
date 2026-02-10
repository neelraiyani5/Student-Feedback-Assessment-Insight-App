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
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import AppText from "../../components/AppText";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS, FONTS, SPACING, LAYOUT } from "../../constants/theme";
import {
  getMyProfile,
  getDepartmentOverview,
  createDepartment,
  createSemester,
  createClass,
  updateClass,
  deleteSemester,
  deleteClass,
  getUsers,
  assignCC,
} from "../../services/api";

const ManageCurriculumScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [department, setDepartment] = useState(null);
  const [user, setUser] = useState(null);

  // Modals
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [semModalVisible, setSemModalVisible] = useState(false);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [editClassModalVisible, setEditClassModalVisible] = useState(false);
  const [ccModalVisible, setCcModalVisible] = useState(false);
  const [stage, setStage] = useState("semester"); // 'semester' | 'class'

  // Forms
  const [deptName, setDeptName] = useState("");
  const [semNumber, setSemNumber] = useState("");
  const [className, setClassName] = useState("");
  const [selectedSemId, setSelectedSemId] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // CC Logic
  const [facultyList, setFacultyList] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isRefreshingCall = false) => {
    if (!isRefreshingCall && !department) setLoading(true);
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
        
        // If we are in class stage, update the selected semester data
        if (stage === 'class' && selectedSemId) {
            const updatedSem = deptData.semesters.find(s => s.id === selectedSemId);
            if (updatedSem) setSelectedSemester(updatedSem);
        }
      } else {
        console.log("No department found for HOD");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load curriculum data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!deptName) return Alert.alert("Error", "Name required");
    try {
      await createDepartment({ name: deptName, hodId: user.id });
      setDeptModalVisible(false);
      fetchData(); // Refresh to see it
    } catch (error) {
      Alert.alert("Error", error.message || "Failed");
    }
  };

  const handleCreateSemester = async () => {
    if (!semNumber || isNaN(semNumber))
      return Alert.alert("Error", "Valid number required");
    try {
      await createSemester({
        sem: parseInt(semNumber),
        departmentId: department.id,
      });
      setSemModalVisible(false);
      setSemNumber("");
      fetchData();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed");
    }
  };

  const handleCreateClass = async () => {
    if (!className) return Alert.alert("Error", "Name required");
    try {
      await createClass({ name: className, semesterId: selectedSemId });
      setClassModalVisible(false);
      setClassName("");
      fetchData();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed"); // Error message shown here
    }
  };

  const handleUpdateClass = async () => {
    if (!className || !selectedSemId)
      return Alert.alert("Error", "Fields required");
    try {
      await updateClass(selectedClass.id, {
        name: className,
        semesterId: selectedSemId,
      });
      setEditClassModalVisible(false);
      setClassName("");
      setSelectedClass(null);
      fetchData();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteSemester = (semId) => {
    Alert.alert(
      "Delete Semester",
      "Are you sure you want to delete this semester? All classes in this semester will be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSemester(semId);
              Alert.alert("Success", "Semester deleted");
              fetchData();
            } catch (error) {
              Alert.alert(
                "Error",
                error.message || "Failed to delete semester",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteClass = (classId) => {
    Alert.alert("Delete Class", "Are you sure you want to delete this class?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteClass(classId);
            Alert.alert("Success", "Class deleted");
            fetchData();
          } catch (error) {
            Alert.alert("Error", error.message || "Failed to delete class");
          }
        },
      },
    ]);
  };

  const handleAssignCC = async (facultyId) => {
    try {
      await assignCC({ classId: selectedClass.id, facultyId });
      setCcModalVisible(false);
      fetchData();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed");
    }
  };

  const openAddClass = (semId) => {
    setSelectedSemId(semId);
    setClassModalVisible(true);
  };

  const openEditClass = (cls, currentSemId) => {
    setSelectedClass(cls);
    setClassName(cls.name);
    setSelectedSemId(currentSemId); // Default to current
    setEditClassModalVisible(true);
  };

  const openAssignCC = async (cls) => {
    setSelectedClass(cls);
    setLoading(true);
    try {
      const faculties = await getUsers("FACULTY,CC");
      setFacultyList(faculties || []);
      setCcModalVisible(true);
    } catch (e) {
      Alert.alert("Error", "Failed to fetch faculty list");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (stage === "class") {
        setStage("semester");
        setSelectedSemester(null);
        setSelectedSemId(null);
    } else {
        router.back();
    }
  }

  const handleSelectSemester = (sem) => {
    setSelectedSemester(sem);
    setSelectedSemId(sem.id);
    setStage("class");
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [department, stage]);


  return (
    <ScreenWrapper backgroundColor="#F1F5F9" withPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBack}
        >
          <Ionicons
            name={stage === "semester" ? "arrow-back" : "chevron-back"}
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
            <AppText variant="h3">
                {stage === 'semester' ? 'Semester Management' : `Semester ${selectedSemester?.sem}`}
            </AppText>
            {stage === 'class' && (
                <AppText variant="caption" color={COLORS.textSecondary}>Class Management</AppText>
            )}
        </View>

        {!loading && department && stage === 'semester' && (
          <TouchableOpacity
            onPress={() => setSemModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        
        {!loading && stage === 'class' && (
             <TouchableOpacity
             onPress={() => openAddClass(selectedSemId)}
           >
             <Ionicons name="add-circle" size={28} color={COLORS.primary} />
           </TouchableOpacity>
        )}

        {!loading && !department && (
          <TouchableOpacity
            onPress={() => setDeptModalVisible(true)}
            style={styles.addButton}
          >
            <AppText style={styles.addButtonText}>Create Dept</AppText>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} color={COLORS.primary} />
        }
      >
        {loading && !department ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : !department ? (
          <View style={styles.emptyContainer}>
            <AppText style={styles.emptyText}>
              You haven't created a department yet.
            </AppText>
            <TouchableOpacity
              style={styles.bigButton}
              onPress={() => setDeptModalVisible(true)}
            >
              <AppText style={styles.bigButtonText}>Create Department</AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <AppText variant="h2" style={styles.deptTitle}>
              {department.name}
            </AppText>

            {stage === 'semester' ? (
                <FlatList 
                    data={department.semesters?.sort((a, b) => a.sem - b.sem)}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                    renderItem={({ item: sem }) => (
                        <TouchableOpacity 
                            style={styles.semItem}
                            onPress={() => handleSelectSemester(sem)}
                        >
                            <View>
                                <AppText style={styles.semTitle}>Semester {sem.sem}</AppText>
                                <AppText variant="caption" style={{color: COLORS.textSecondary}}>{sem.classes?.length || 0} classes</AppText>
                            </View>
                            <View style={{flexDirection:'row', alignItems:'center', gap: 12}}>
                                <TouchableOpacity onPress={() => handleDeleteSemester(sem.id)}>
                                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                                </TouchableOpacity>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                            </View>
                        </TouchableOpacity>
                    )}
                />
            ) : (
                <View style={styles.classesGrid}>
                    {selectedSemester?.classes?.length === 0 && (
                        <View style={styles.emptyCentered}>
                            <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
                            <AppText style={styles.noData}>No classes created yet</AppText>
                        </View>
                    )}
                    {selectedSemester?.classes?.map((cls) => (
                      <View key={cls.id} style={styles.classCard}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: SPACING.m,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => openEditClass(cls, selectedSemId)}
                            style={{ flex: 1 }}
                          >
                            <AppText style={styles.className}>
                              {cls.name}
                            </AppText>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleDeleteClass(cls.id)}
                            style={[
                              styles.assignCCBtn,
                              {
                                backgroundColor: COLORS.error,
                                marginLeft: SPACING.s,
                              },
                            ]}
                          >
                            <Ionicons
                              name="trash"
                              size={14}
                              color={COLORS.white}
                            />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.ccContainer}>
                          {cls.cc ? (
                            <View style={styles.ccInfo}>
                              <Ionicons
                                name="person"
                                size={12}
                                color={COLORS.textSecondary}
                              />
                              <AppText variant="caption" style={styles.ccName}>
                                {cls.cc.name}
                              </AppText>
                            </View>
                          ) : (
                            <AppText variant="caption" style={styles.noCC}>
                              No CC assigned
                            </AppText>
                          )}

                          <TouchableOpacity
                            onPress={() => openAssignCC(cls)}
                            style={styles.assignCCBtn}
                          >
                            <Ionicons
                              name="person-add"
                              size={14}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                </View>
            )}
          </View>
        )}
      </ScrollView>

      {loading && department && (
        <View style={styles.centeredLoader}>
           <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* Create Department Modal */}
      <Modal visible={deptModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText variant="h3" style={{ marginBottom: 16 }}>
              New Department
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="Department Name (e.g. Computer Engineering)"
              value={deptName}
              onChangeText={setDeptName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setDeptModalVisible(false)}>
                <AppText>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateDepartment}>
                <AppText style={{ color: COLORS.primary, fontWeight: "bold" }}>
                  Create
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Semester Modal */}
      <Modal visible={semModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText variant="h3" style={{ marginBottom: 16 }}>
              New Semester
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="Semester Number (e.g. 1)"
              keyboardType="numeric"
              value={semNumber}
              onChangeText={setSemNumber}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setSemModalVisible(false)}>
                <AppText>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateSemester}>
                <AppText style={{ color: COLORS.primary, fontWeight: "bold" }}>
                  Create
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Class Modal */}
      <Modal visible={classModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText variant="h3" style={{ marginBottom: 16 }}>
              New Class
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="Class Name (e.g. CSA)"
              value={className}
              onChangeText={setClassName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setClassModalVisible(false)}>
                <AppText>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateClass}>
                <AppText style={{ color: COLORS.primary, fontWeight: "bold" }}>
                  Create
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Class (Promote) Modal */}
      <Modal visible={editClassModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText variant="h3" style={{ marginBottom: 16 }}>
              Edit Class / Promote
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="Class Name"
              value={className}
              onChangeText={setClassName}
            />
            <AppText style={styles.label}>Move to Semester:</AppText>
            <ScrollView style={{ maxHeight: 150, marginBottom: 16 }}>
              {department?.semesters
                ?.sort((a, b) => a.sem - b.sem)
                .map((sem) => (
                  <TouchableOpacity
                    key={sem.id}
                    style={[
                      styles.semOption,
                      selectedSemId === sem.id && styles.semOptionSelected,
                    ]}
                    onPress={() => setSelectedSemId(sem.id)}
                  >
                    <AppText
                      style={{
                        color:
                          selectedSemId === sem.id
                            ? COLORS.white
                            : COLORS.textPrimary,
                      }}
                    >
                      Semester {sem.sem}
                    </AppText>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditClassModalVisible(false)}>
                <AppText>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateClass}>
                <AppText style={{ color: COLORS.primary, fontWeight: "bold" }}>
                  Update
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign CC Modal */}
      <Modal visible={ccModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: 400 }]}>
            <AppText variant="h3" style={{ marginBottom: 16 }}>
              Assign Class Coordinator
            </AppText>
            <AppText style={{ marginBottom: 10 }}>
              For Class: {selectedClass?.name}
            </AppText>

            <FlatList
              data={facultyList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.facultyOption,
                    item.role === "CC" && { opacity: 0.6 },
                  ]}
                  onPress={() => {
                    if (item.role !== "CC") handleAssignCC(item.id);
                  }}
                  disabled={item.role === "CC"}
                >
                  <View>
                    <AppText style={{ fontWeight: "600" }}>{item.name}</AppText>
                    <AppText variant="caption">{item.email}</AppText>
                  </View>
                  {item.role === "CC" && (
                    <AppText
                      style={{
                        color: COLORS.error,
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    >
                      Already Engaged
                    </AppText>
                  )}
                </TouchableOpacity>
              )}
              style={{ marginBottom: 16 }}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setCcModalVisible(false)}>
                <AppText>Cancel</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(241, 245, 249, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.m,
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    padding: SPACING.xs,
  },
  content: {
    padding: SPACING.l,
    paddingBottom: 50,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  deptTitle: {
    textAlign: "center",
    marginBottom: SPACING.m,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  semItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: LAYOUT.radius.m,
    marginBottom: SPACING.s,
    elevation: 1,
  },
  semTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  classesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  emptyCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    width: '100%',
  },
  semCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: LAYOUT.radius.m,
    marginBottom: SPACING.m,
    elevation: 2,
  },
  semHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  addClassBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addClassText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  classesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  classCard: {
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: "45%",
    flex: 1,
  },
  className: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  ccContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 4,
  },
  ccInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ccName: {
    color: COLORS.textSecondary,
    maxWidth: 80,
  },
  noCC: {
    color: COLORS.error,
    fontSize: 10,
  },
  assignCCBtn: {
    padding: 4,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
  },
  label: {
    marginBottom: 8,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  semOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  semOptionSelected: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    marginBottom: 20,
    color: COLORS.textSecondary,
  },
  bigButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bigButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  facultyOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default ManageCurriculumScreen;
