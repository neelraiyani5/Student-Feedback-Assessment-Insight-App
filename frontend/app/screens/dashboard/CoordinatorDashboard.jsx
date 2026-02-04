import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import AppText from "../../components/AppText";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS, FONTS, SPACING, LAYOUT } from "../../constants/theme";
import { wp, hp } from "../../utils/responsive";
import {
  getMyProfile,
  getDepartmentCourseAssignments,
  getClassCourseAssignments,
  getComplianceAlerts,
  getMyCourseAssignments,
  getSubjects,
} from "../../services/api";

const CoordinatorDashboard = () => {
  const router = useRouter();
  const { name } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [complianceStats, setComplianceStats] = useState({
    completed: 0,
    inProgress: 0,
    pending: 0,
  });
  const [deptStatus, setDeptStatus] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const profile = await getMyProfile();
      if (profile && profile.user) {
        setUser(profile.user);

        let adminAssignments = [];
        if (profile.user.role === "HOD") {
          adminAssignments = await getDepartmentCourseAssignments();
        } else if (profile.user.role === "CC") {
          // 1. Fetch Assignments (the ones with progress)
          if (
            profile.user.classesCoordinated &&
            profile.user.classesCoordinated.length > 0
          ) {
            for (const cls of profile.user.classesCoordinated) {
              const clsAssign = await getClassCourseAssignments(cls.id);
              adminAssignments = [...adminAssignments, ...clsAssign];
            }
          }

          // 2. Fetch all Subjects for the CC's class (to identify unassigned ones)
          try {
            const subjectsData = await getSubjects();
            const classSubjects = subjectsData.subjects || [];

            const combinedList = classSubjects.map((subject) => {
              const assignment = adminAssignments.find(
                (a) => a.subjectId === subject.id
              );

              const globalFaculty = subject.faculties && subject.faculties.length > 0
                  ? subject.faculties.map(f => f.name).join(', ')
                  : "Unassigned";

              if (assignment) {
                return {
                  id: assignment.id,
                  subjectId: subject.id,
                  name: subject.name,
                  faculty: assignment.faculty.name,
                  class: assignment.class.name,
                  progress: assignment.progress,
                  isAssigned: true,
                };
              } else {
                return {
                  id: `unassigned-${subject.id}`,
                  subjectId: subject.id,
                  name: subject.name,
                  faculty: globalFaculty,
                  class: profile.user.classesCoordinated[0]?.name || "N/A",
                  progress: { completed: 0, total: 0 },
                  isAssigned: false,
                };
              }
            });

            setDeptStatus(combinedList);
          } catch (e) {
            console.log("Error merging class subjects", e);
          }
        }

        // 3. Fetch Personal Teaching Assignments (for "My Subjects" section)
        try {
          const myAssign = await getMyCourseAssignments();
          setMyAssignments(myAssign || []);
        } catch (e) {
          console.log("Error fetching my assignments", e);
        }

        // 4. Process Administrative Assignments for Stats (HOD/CC level)
        let totalTasks = 0;
        let completedTasks = 0;

        const processedAdminList = adminAssignments.map((a) => {
          const total = a?.progress?.total || 0;
          const completed = a?.progress?.completed || 0;
          totalTasks += total;
          completedTasks += completed;

          const progressPercent =
            total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            id: a.id,
            name: a.subject.name,
            className: a.class.name,
            progress: progressPercent,
            faculty: a.faculty.name,
            status:
              progressPercent >= 90
                ? "Good"
                : progressPercent >= 50
                  ? "Warning"
                  : "Risk",
          };
        });

        // For HOD, deptStatus is just the processed list
        if (profile.user.role === "HOD") {
          setDeptStatus(processedAdminList);
        }

        // Calculate Aggregate Compliance for the Top Status Card
        const completedPercent =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setComplianceStats({
          completed: completedPercent,
          inProgress: 0, // Simplified for now
          pending: 100 - completedPercent,
        });
      }
    } catch (err) {
      console.log("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
  }, []);

  return (
    <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <AppText variant="h2" style={styles.headerTitle}>
            {user?.name || name || "Coordinator"}
          </AppText>
          <AppText variant="body2" color={COLORS.textSecondary}>
            {user?.role === "HOD" ? "Head of Department" : "Class Coordinator"}
          </AppText>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push("/profile")}
        >
          <Ionicons name="person-circle" size={40} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Main Visual: Compliance Overview */}
        <View style={styles.chartCard}>
          <AppText variant="h3" style={styles.cardTitle}>
            {user?.role === "HOD" ? "Department" : "Class"} Compliance
          </AppText>

          <View style={styles.chartContent}>
            <View
              style={{
                width: "100%",
                alignItems: "center",
                paddingVertical: SPACING.m,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  marginBottom: SPACING.s,
                }}
              >
                <AppText
                  variant="h1"
                  style={{ color: COLORS.primary, fontSize: 48 }}
                >
                  {complianceStats.completed}
                </AppText>
                <AppText
                  variant="h3"
                  style={{ color: COLORS.textSecondary, marginBottom: 8 }}
                >
                  %
                </AppText>
              </View>
              <AppText
                variant="body2"
                style={{ color: COLORS.textSecondary, marginBottom: SPACING.m }}
              >
                Overall Completion
              </AppText>

              {/* Linear Progress Bar */}
              <View
                style={{
                  width: "100%",
                  height: 12,
                  backgroundColor: COLORS.surface,
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${complianceStats.completed}%`,
                    backgroundColor:
                      complianceStats.completed >= 90
                        ? COLORS.success
                        : complianceStats.completed >= 50
                          ? COLORS.warning
                          : COLORS.error,
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* My Subjects Section - HOD & CC */}
        {(user?.role === "HOD" || user?.role === "CC") &&
          myAssignments &&
          myAssignments.length > 0 && (
            <View style={styles.section}>
              <AppText variant="h3" style={styles.sectionTitle}>
                My Subjects (Teaching)
              </AppText>
              <FlatList
                data={myAssignments}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item: assignment }) => (
                  <TouchableOpacity
                    style={styles.subjectItemCard}
                    onPress={() =>
                      router.push({
                        pathname: "/course-checklist",
                        params: {
                          assignmentId: assignment.id,
                        },
                      })
                    }
                  >
                    <View style={styles.subjectItemContent}>
                      <AppText style={styles.subjectItemName}>
                        {assignment.subject.name}
                      </AppText>
                      {assignment.class && (
                        <AppText
                          variant="caption"
                          style={styles.subjectItemMeta}
                        >
                          Class: {assignment.class.name}
                        </AppText>
                      )}
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={COLORS.textLight}
                    />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

        {/* Administration Section */}
        <View style={styles.section}>
          <AppText variant="h3" style={styles.sectionTitle}>
            Administration
          </AppText>

          {/* HOD Features */}
          {(user?.role === "HOD" || !user) && (
            <>
              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push("/manage-faculty")}
              >
                <View style={styles.adminIconContainer}>
                  <Ionicons name="people" size={24} color={COLORS.white} />
                </View>
                <View style={styles.adminContent}>
                  <AppText style={styles.adminTitle}>Manage Faculty</AppText>
                  <AppText variant="caption" style={styles.adminSubtitle}>
                    Add faculty, View list, Promote to CC
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push("/manage-templates")}
              >
                <View
                  style={[
                    styles.adminIconContainer,
                    { backgroundColor: "#9333EA" },
                  ]}
                >
                  <Ionicons name="list" size={24} color={COLORS.white} />
                </View>
                <View style={styles.adminContent}>
                  <AppText style={styles.adminTitle}>
                    Course File Format
                  </AppText>
                  <AppText variant="caption" style={styles.adminSubtitle}>
                    Edit Task Templates & Checklists
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push("/manage-curriculum")}
              >
                <View
                  style={[
                    styles.adminIconContainer,
                    { backgroundColor: COLORS.secondary },
                  ]}
                >
                  <Ionicons name="school" size={24} color={COLORS.white} />
                </View>
                <View style={styles.adminContent}>
                  <AppText style={styles.adminTitle}>
                    Semester Management
                  </AppText>
                  <AppText variant="caption" style={styles.adminSubtitle}>
                    Manage Dept, Semesters, Promote Classes
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push("/feedback/template/manage")}
              >
                <View
                  style={[
                    styles.adminIconContainer,
                    { backgroundColor: "#8B5CF6" },
                  ]}
                >
                  <Ionicons
                    name="document-text"
                    size={24}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.adminContent}>
                  <AppText style={styles.adminTitle}>
                    Feedback Templates
                  </AppText>
                  <AppText variant="caption" style={styles.adminSubtitle}>
                    Create & Manage Feedback Forms
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push("/feedback/monitoring")}
              >
                <View
                  style={[
                    styles.adminIconContainer,
                    { backgroundColor: "#10B981" },
                  ]}
                >
                  <Ionicons name="stats-chart" size={24} color={COLORS.white} />
                </View>
                <View style={styles.adminContent}>
                  <AppText style={styles.adminTitle}>Feedback Reports</AppText>
                  <AppText variant="caption" style={styles.adminSubtitle}>
                    View Session Responses
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push("/hod-manage-subjects")}
              >
                <View
                  style={[
                    styles.adminIconContainer,
                    { backgroundColor: COLORS.warning },
                  ]}
                >
                  <Ionicons name="book" size={24} color={COLORS.white} />
                </View>
                <View style={styles.adminContent}>
                  <AppText style={styles.adminTitle}>Manage Subjects</AppText>
                  <AppText variant="caption" style={styles.adminSubtitle}>
                    Create & Assign Faculty to Subjects
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push("/hod-course-file-review")}
              >
                <View
                  style={[
                    styles.adminIconContainer,
                    { backgroundColor: "#3B82F6" },
                  ]}
                >
                  <Ionicons
                    name="document-text"
                    size={24}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.adminContent}>
                  <AppText style={styles.adminTitle}>
                    Review Course Files
                  </AppText>
                  <AppText variant="caption" style={styles.adminSubtitle}>
                    Review Faculty Course File Submissions
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              {user?.subjects && user.subjects.length > 0 && (
                <TouchableOpacity
                  style={styles.adminCard}
                  onPress={() => router.push("/feedback/session/start")}
                >
                  <View
                    style={[
                      styles.adminIconContainer,
                      { backgroundColor: COLORS.accent },
                    ]}
                  >
                    <Ionicons
                      name="chatbox-ellipses"
                      size={24}
                      color={COLORS.white}
                    />
                  </View>
                  <View style={styles.adminContent}>
                    <AppText style={styles.adminTitle}>
                      Start Feedback Session
                    </AppText>
                    <AppText variant="caption" style={styles.adminSubtitle}>
                      Initiate for your subjects
                    </AppText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* CC Features */}
          {user?.role === "CC" && (
            <>
              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push("/manage-students")}
              >
                <View
                  style={[
                    styles.adminIconContainer,
                    { backgroundColor: COLORS.info },
                  ]}
                >
                  <Ionicons
                    name="people-circle"
                    size={24}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.adminContent}>
                  <AppText style={styles.adminTitle}>
                    My Class & Students
                  </AppText>
                  <AppText variant="caption" style={styles.adminSubtitle}>
                    Manage Students, View Class Details
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push("/manage-subjects")}
              >
                <View
                  style={[
                    styles.adminIconContainer,
                    { backgroundColor: COLORS.warning },
                  ]}
                >
                  <Ionicons name="book" size={24} color={COLORS.white} />
                </View>
                <View style={styles.adminContent}>
                  <AppText style={styles.adminTitle}>Manage Subjects</AppText>
                  <AppText variant="caption" style={styles.adminSubtitle}>
                    Add Subjects, Assign Faculty
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push("/feedback/monitoring")}
              >
                <View
                  style={[
                    styles.adminIconContainer,
                    { backgroundColor: "#10B981" },
                  ]}
                >
                  <Ionicons name="stats-chart" size={24} color={COLORS.white} />
                </View>
                <View style={styles.adminContent}>
                  <AppText style={styles.adminTitle}>Feedback Reports</AppText>
                  <AppText variant="caption" style={styles.adminSubtitle}>
                    View Session Responses
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push("/cc-course-file-review")}
              >
                <View
                  style={[
                    styles.adminIconContainer,
                    { backgroundColor: "#06B6D4" },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.adminContent}>
                  <AppText style={styles.adminTitle}>
                    Review Course Files
                  </AppText>
                  <AppText variant="caption" style={styles.adminSubtitle}>
                    Review Faculty Course File Submissions
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              {user?.subjects && user.subjects.length > 0 && (
                <TouchableOpacity
                  style={styles.adminCard}
                  onPress={() => router.push("/feedback/session/start")}
                >
                  <View
                    style={[
                      styles.adminIconContainer,
                      { backgroundColor: COLORS.accent },
                    ]}
                  >
                    <Ionicons
                      name="chatbox-ellipses"
                      size={24}
                      color={COLORS.white}
                    />
                  </View>
                  <View style={styles.adminContent}>
                    <AppText style={styles.adminTitle}>
                      Start Feedback Session
                    </AppText>
                    <AppText variant="caption" style={styles.adminSubtitle}>
                      Initiate for your subjects
                    </AppText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* View Course File Review Status */}
        {user?.role === "FACULTY" && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.adminCard}
              onPress={() => router.push("/my-course-files")}
            >
              <View
                style={[
                  styles.adminIconContainer,
                  { backgroundColor: "#F59E0B" },
                ]}
              >
                <Ionicons
                  name="document-attach"
                  size={24}
                  color={COLORS.white}
                />
              </View>
              <View style={styles.adminContent}>
                <AppText style={styles.adminTitle}>
                  My Submitted Course Files
                </AppText>
                <AppText variant="caption" style={styles.adminSubtitle}>
                  View CC & HOD Review Status with Remarks
                </AppText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* My Assessments */}
        {/* <View style={styles.section}>
          <TouchableOpacity
            style={styles.adminCard}
            onPress={() => router.push("/assessments")}
          >
            <View
              style={[
                styles.adminIconContainer,
                { backgroundColor: COLORS.primary },
              ]}
            >
              <Ionicons name="clipboard" size={24} color={COLORS.white} />
            </View>
            <View style={styles.adminContent}>
              <AppText style={styles.adminTitle}>My Assessments</AppText>
              <AppText variant="caption" style={styles.adminSubtitle}>
                Manage Marks for your subjects
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
        </View> */}

        {/* Class/Department Status View - Only for CC */}
        {user?.role === "CC" && (
          <View style={styles.section}>
            <AppText variant="h3" style={styles.sectionTitle}>
              Class Course Files
            </AppText>
            {deptStatus.length > 0 ? (
              deptStatus.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={styles.subjectCard}
                  onPress={() => {
                    if (subject.isAssigned) {
                      router.push(
                        `/course-file-review?assignmentId=${subject.id}`,
                      );
                    } else {
                      router.push("/manage-subjects");
                    }
                  }}
                >
                  <View style={styles.subjectHeader}>
                    <View style={{ flex: 1 }}>
                      <AppText style={styles.subjectName}>
                        {subject.name}
                      </AppText>
                      <AppText
                        variant="caption"
                        style={{
                          color: subject.isAssigned
                            ? COLORS.textSecondary
                            : COLORS.error,
                        }}
                      >
                        Faculty: {subject.faculty}
                      </AppText>
                    </View>
                    {subject.isAssigned ? (
                      <View style={styles.progressBadge}>
                        <AppText style={styles.progressText}>
                          {subject.progress.total > 0
                            ? Math.round(
                                (subject.progress.completed /
                                  subject.progress.total) *
                                  100,
                              )
                            : 0}
                          %
                        </AppText>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.progressBadge,
                          { backgroundColor: COLORS.error + "20" },
                        ]}
                      >
                        <AppText style={{ color: COLORS.error, fontSize: 10 }}>
                          Unassigned
                        </AppText>
                      </View>
                    )}
                  </View>

                  {subject.isAssigned ? (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${
                                subject.progress.total > 0
                                  ? (subject.progress.completed /
                                      subject.progress.total) *
                                    100
                                  : 0
                              }%`,
                              backgroundColor:
                                subject.progress.completed /
                                  subject.progress.total >=
                                0.9
                                  ? COLORS.success
                                  : subject.progress.completed /
                                      subject.progress.total >=
                                    0.5
                                    ? COLORS.warning
                                    : COLORS.error,
                            },
                          ]}
                        />
                      </View>
                      <AppText variant="caption" style={styles.progressText}>
                        {subject.progress.completed}/{subject.progress.total}
                      </AppText>
                    </View>
                  ) : (
                    <View style={{ marginTop: 10 }}>
                      <AppText
                        variant="caption"
                        style={{ color: COLORS.primary, fontWeight: '600' }}
                      >
                        {subject.faculty !== "Unassigned" 
                          ? "Initialize Course File →" 
                          : "Tap to assign faculty →"}
                      </AppText>
                    </View>
                  )}

                  {subject.isAssigned && (
                    <View
                      style={{
                        marginTop: 8,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="eye-outline"
                        size={14}
                        color={COLORS.primary}
                        style={{ marginRight: 4 }}
                      />
                      <AppText
                        variant="small"
                        style={{ color: COLORS.primary }}
                      >
                        Review Tasks
                      </AppText>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ padding: SPACING.m }}>
                <AppText
                  style={{ color: COLORS.textSecondary, fontStyle: "italic" }}
                >
                  No assignments found for your class.
                </AppText>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.l,
  },
  headerTitle: {
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: hp(10),
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.radius.l,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: SPACING.l,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  chartContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  donutContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  donutOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  donutProgress: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 15,
    borderLeftColor: "transparent",
    borderTopColor: "transparent", // Revealing half circle roughly
    position: "absolute",
  },
  donutInner: {
    position: "absolute",
    alignItems: "center",
  },
  donutPercent: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  donutLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  legendContainer: {
    justifyContent: "center",
    gap: SPACING.m,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.s,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  legendValue: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  section: {
    marginTop: SPACING.m,
  },
  sectionTitle: {
    marginBottom: SPACING.m,
    paddingHorizontal: SPACING.s,
    color: COLORS.textPrimary,
  },
  subjectCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.radius.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.m,
  },
  subjectName: {
    fontWeight: "600",
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  facultyName: {
    color: COLORS.textSecondary,
  },
  reminderButton: {
    flexDirection: "row",
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.s,
    paddingVertical: 6,
    borderRadius: LAYOUT.radius.s,
    alignItems: "center",
  },
  reminderText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 10,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    marginRight: SPACING.m,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    width: 30,
    textAlign: "right",
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  adminCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.radius.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  adminIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
  },
  adminContent: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  adminSubtitle: {
    color: COLORS.textSecondary,
  },
  subjectItemCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.radius.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
  },
  subjectItemContent: {
    flex: 1,
  },
  subjectItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subjectItemMeta: {
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
});

export default CoordinatorDashboard;
