import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
  ActivityIndicator,
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
    totalCount: 0,
    completedCount: 0,
  });
  const [deptStatus, setDeptStatus] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
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
              try {
                const clsAssign = await getClassCourseAssignments(cls.id);
                adminAssignments = [...adminAssignments, ...clsAssign];
              } catch (e) {
                console.log(`Error fetching assignments for class ${cls.id}`, e);
              }
            }
          }

          // 2. Fetch all Subjects for the CC's class (to identify unassigned ones)
          try {
            const subjectsData = await getSubjects();
            const classSubjects = subjectsData.subjects || [];

            const combinedList = classSubjects.map((subject) => {
              const assignment = adminAssignments.find(
                (a) => a.subjectId === subject.id,
              );

              const globalFaculty =
                subject.faculties && subject.faculties.length > 0
                  ? subject.faculties.map((f) => f.name).join(", ")
                  : "Unassigned";

              if (assignment) {
                const total = assignment.progress?.total || 0;
                const completed = assignment.progress?.completed || 0;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return {
                  id: assignment.id,
                  subjectId: subject.id,
                  classId: assignment.classId,
                  name: subject.name,
                  faculty: globalFaculty, // Use all faculties, not just the assignment's faculty
                  facultyId: assignment.facultyId,
                  class: assignment.class.name,
                  className: assignment.class.name,
                  progress: percent,
                  isAssigned: true,
                };
              } else {
                return {
                  id: `unassigned-${subject.id}`,
                  subjectId: subject.id,
                  name: subject.name,
                  faculty: globalFaculty,
                  class: profile.user.classesCoordinated[0]?.name || "N/A",
                  className: profile.user.classesCoordinated[0]?.name || "N/A",
                  progress: 0,
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
        let myAssign = [];
        try {
          myAssign = await getMyCourseAssignments();
          setMyAssignments(myAssign || []);
        } catch (e) {
          console.error("Error fetching my assignments", e);
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
            subjectId: a.subjectId,
            classId: a.classId,
            name: a.subject.name,
            className: a.class.name,
            progress: progressPercent,
            faculty: a.faculty.name,
            facultyId: a.facultyId,
            isAssigned: true,
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

        // 5. Consolidate "My Subjects" logic for Dashboard
        // For CC/HOD, "My Subjects" should include subjects they teach across ANY class
        setMyAssignments(myAssign || []);

        // Calculate Aggregate Compliance for the Top Status Card
        const completedPercent =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const getStatusColor = (percent) => {
          if (percent >= 75) return COLORS.success;
          if (percent >= 40) return COLORS.warning;
          return COLORS.error;
        };

        const statusColor = getStatusColor(completedPercent);

        setComplianceStats({
          completed: completedPercent,
          inProgress: 0,
          pending: 100 - completedPercent,
          totalCount: totalTasks,
          completedCount: completedTasks,
          color: statusColor,
        });
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData(true).finally(() => {
      setRefreshing(false);
    });
  }, []);

  return (
    <ScreenWrapper backgroundColor="#F1F5F9" withPadding={false}>
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
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText style={{ marginTop: SPACING.m, color: COLORS.textSecondary }}>
            Loading Dashboard...
          </AppText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {/* Main Visual: Compliance Overview */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <AppText variant="h3" style={styles.cardTitle}>
                {user?.role === "HOD" ? "Department" : "Class"} Compliance
              </AppText>
              <AppText variant="caption" style={styles.cardSubtitle}>
                Based on Course File Submissions
              </AppText>
            </View>
            <View style={[styles.complianceBadge, { 
              backgroundColor: (complianceStats.color || COLORS.success) + '15',
              paddingHorizontal: 8,
              paddingVertical: 3
            }]}>
              <Ionicons name="ribbon" size={14} color={complianceStats.color || COLORS.success} />
              <AppText style={{ 
                color: complianceStats.color || COLORS.success, 
                fontWeight: '800', 
                marginLeft: 4,
                fontSize: 9
              }}>
                {complianceStats.completed >= 75 ? 'GOOD' : complianceStats.completed >= 40 ? 'AVERAGE' : 'LOW'}
              </AppText>
            </View>
          </View>
          
          <View style={styles.chartContent}>
            {/* Smooth Fluid Circular Gauge */}
            <View style={styles.gaugeContainer}>
              <View style={styles.gaugeBackgroundTrack} />
              <View style={styles.gaugeHalfWrapper}>
                {/* Right Half: Handles 0-50% */}
                <View style={[styles.gaugeHalf, { overflow: 'hidden' }]}>
                  <View 
                    style={[
                      styles.gaugeProgressHalf, 
                      { 
                        backgroundColor: complianceStats.color || COLORS.error,
                        transform: [
                          { translateX: -32.5 },
                          { rotate: `${Math.min(complianceStats.completed, 50) * 3.6}deg` },
                          { translateX: 32.5 }
                        ],
                        borderTopRightRadius: 65,
                        borderBottomRightRadius: 65,
                        left: 65
                      }
                    ]} 
                  />
                </View>
                {/* Left Half: Handles 51-100% */}
                <View style={[styles.gaugeHalf, { overflow: 'hidden', transform: [{ scaleX: -1 }] }]}>
                  {complianceStats.completed > 50 && (
                    <View 
                      style={[
                        styles.gaugeProgressHalf, 
                        { 
                          backgroundColor: complianceStats.color || COLORS.error,
                          transform: [
                            { translateX: -32.5 },
                            { rotate: `${(complianceStats.completed - 50) * 3.6}deg` },
                            { translateX: 32.5 }
                          ],
                          borderTopRightRadius: 65,
                          borderBottomRightRadius: 65,
                          left: 65
                        }
                      ]} 
                    />
                  )}
                </View>
              </View>
              
              <View style={styles.gaugeInnerCircle}>
                <AppText style={styles.gaugePercent}>
                  {complianceStats.completed}<AppText style={styles.gaugeSymbol}>%</AppText>
                </AppText>
                <AppText variant="small" style={styles.gaugeLabel}>COMPLIANCE</AppText>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsOverview}>
              <View style={styles.statSubItem}>
                <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
                <View>
                  <AppText style={styles.statValueText}>{complianceStats.completedCount}</AppText>
                  <AppText variant="small" style={styles.statLabelText}>Completed</AppText>
                </View>
              </View>
              <View style={styles.statSubItem}>
                <View style={[styles.statDot, { backgroundColor: COLORS.warning }]} />
                <View>
                  <AppText style={styles.statValueText}>{complianceStats.totalCount - complianceStats.completedCount}</AppText>
                  <AppText variant="small" style={styles.statLabelText}>Pending</AppText>
                </View>
              </View>
            </View>
          </View>
        </View>
{/* Administration Section */}
        <View style={styles.section}>
          <AppText variant="h3" style={styles.sectionTitle}>
            Administration
          </AppText>

          <View style={styles.adminGrid}>
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
                      Faculty & CCs
                    </AppText>
                  </View>
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
                      Checklists
                    </AppText>
                  </View>
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
                      Curriculum
                    </AppText>
                    <AppText variant="caption" style={styles.adminSubtitle}>
                      Semesters & Dept
                    </AppText>
                  </View>
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
                      Manage Forms
                    </AppText>
                  </View>
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
                      View Results
                    </AppText>
                  </View>
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
                      Assign Faculty
                    </AppText>
                  </View>
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
                      Monitor Submissions
                    </AppText>
                  </View>
                </TouchableOpacity>

                {myAssignments.length > 0 && (
                  <>
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
                          Manage Marks
                        </AppText>
                      </View>
                    </TouchableOpacity>

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
                          Start Feedback
                        </AppText>
                        <AppText variant="caption" style={styles.adminSubtitle}>
                          For your subjects
                        </AppText>
                      </View>
                    </TouchableOpacity>
                  </>
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
                      My students
                    </AppText>
                    <AppText variant="caption" style={styles.adminSubtitle}>
                       View Class Overview
                    </AppText>
                  </View>
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
                      Assign Faculty
                    </AppText>
                  </View>
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
                      View Results
                    </AppText>
                  </View>
                </TouchableOpacity>

                {myAssignments.length > 0 && (
                  <>
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
                          Manage Marks
                        </AppText>
                      </View>
                    </TouchableOpacity>

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
                          Start Feedback
                        </AppText>
                        <AppText variant="caption" style={styles.adminSubtitle}>
                          For your subjects
                        </AppText>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </View>
        {/* Class/Department Subjects Section */}
        <View style={styles.section}>
          {user?.role === "CC" && (
            <AppText variant="h3" style={styles.sectionTitle}>
              My Class Subjects
            </AppText>
          )}
          {user?.role === "CC" && deptStatus.length > 0 ? (
            deptStatus.map((item) => {
              // Check if the current user is the faculty for this item
              const isMe = item.isAssigned && (
                item.facultyId === user.id || 
                (item.faculty && item.faculty.includes(user.name))
              );

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.subjectItemCard,
                    isMe && { borderLeftColor: COLORS.success }
                  ]}
                  onPress={() => {
                    if (item.isAssigned) {
                      if (isMe) {
                        router.push(`/course-checklist?assignmentId=${item.id}`);
                      } else {
                        router.push(`/course-file-review?assignmentId=${item.id}`);
                      }
                    } else {
                      router.push("/hod-manage-subjects");
                    }
                  }}
                >
                  <View style={styles.subjectItemContent}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <AppText style={styles.subjectItemName}>
                        {item.name}
                      </AppText>
                      {isMe && (
                        <View style={[styles.badge, { backgroundColor: COLORS.success + '20' }]}>
                          <AppText style={{ color: COLORS.success, fontSize: 10, fontWeight: '700' }}>TEACHING</AppText>
                        </View>
                      )}
                      {!isMe && item.isAssigned && (
                        <View style={[styles.badge, { backgroundColor: COLORS.primary + '20' }]}>
                          <AppText style={{ color: COLORS.primary, fontSize: 10, fontWeight: '700' }}>MONITORING</AppText>
                        </View>
                      )}
                    </View>
                    
                    <AppText variant="caption" style={styles.subjectItemMeta}>
                      Faculty: {item.faculty}
                    </AppText>
                    {item.className && (
                      <AppText variant="caption" style={styles.subjectItemMeta}>
                        Class: {item.className || item.class}
                      </AppText>
                    )}

                    {item.isAssigned ? (
                      <View style={{ marginTop: 8 }}>
                        <View style={styles.progressBarBg}>
                          <View 
                            style={[
                              styles.progressBarFill, 
                              { 
                                width: `${item.progress || 0}%`,
                                backgroundColor: (item.progress || 0) >= 90 ? COLORS.success : (item.progress || 0) >= 50 ? COLORS.warning : COLORS.error
                              }
                            ]} 
                          />
                        </View>
                        <AppText variant="caption" style={{ color: COLORS.textSecondary, marginTop: 4 }}>
                          Progress: {item.progress || 0}%
                        </AppText>
                      </View>
                    ) : (
                      <AppText variant="caption" style={{ color: COLORS.error, marginTop: 4 }}>
                        Not Assigned - Setup Required
                      </AppText>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              );
            })
          ) : user?.role === "CC" ? (
            <View style={styles.emptyContainer}>
              <AppText style={styles.emptyText}>No subjects tracked yet.</AppText>
            </View>
          ) : null}
        </View>

        {/* My Assignments from other classes (if HOD/CC teaches elsewhere) */}
        {myAssignments.length > 0 && (
          <View style={styles.section}>
            <AppText variant="h3" style={styles.sectionTitle}>
              My Subject Course Files
            </AppText>
            {myAssignments
              .map((assignment) => (
              <TouchableOpacity
                key={assignment.id}
                style={styles.subjectItemCard}
                onPress={() =>
                  router.push(`/course-checklist?assignmentId=${assignment.id}`)
                }
              >
                <View style={styles.subjectItemContent}>
                  <AppText style={styles.subjectItemName}>
                    {assignment.subject.name}
                  </AppText>
                  <AppText variant="caption" style={styles.subjectItemMeta}>
                    Class: {assignment.class.name}
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        

        </ScrollView>
      )}
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.l,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  chartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  gaugeContainer: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.m,
  },
  gaugeBackgroundTrack: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 12,
    borderColor: COLORS.surface,
  },
  gaugeHalfWrapper: {
    position: 'absolute',
    width: 130,
    height: 130,
    flexDirection: 'row',
  },
  gaugeHalf: {
    width: 65,
    height: 130,
  },
  gaugeProgressHalf: {
    position: 'absolute',
    width: 65,
    height: 130,
    borderTopRightRadius: 65,
    borderBottomRightRadius: 65,
  },
  gaugeInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  gaugePercent: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gaugeSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  gaugeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  statsOverview: {
    gap: SPACING.l,
  },
  statSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statValueText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabelText: {
    color: COLORS.textSecondary,
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
  adminGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  adminCard: {
    width: "48.5%",
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.radius.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
  },
  adminIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.s,
  },
  adminContent: {
    alignItems: "center",
  },
  adminTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 1,
  },
  adminSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: "center",
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default CoordinatorDashboard;
