import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import AppText from "./components/AppText";
import ScreenWrapper from "./components/ScreenWrapper";
import { COLORS, SPACING, LAYOUT } from "./constants/theme";
import { getDepartmentCourseAssignments } from "./services/api";

const HodDepartmentStatusScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deptStatus, setDeptStatus] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const adminAssignments = await getDepartmentCourseAssignments();
      
      const processedAdminList = adminAssignments.map((a) => {
        const total = a?.progress?.total || 0;
        const completed = a?.progress?.completed || 0;
        const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          id: a.id,
          subjectId: a.subjectId,
          classId: a.classId,
          name: a.subject.name,
          className: a.class.name,
          progress: progressPercent,
          faculty: a.faculty.name,
          facultyId: a.facultyId,
          isAssigned: true
        };
      });

      setDeptStatus(processedAdminList);
    } catch (error) {
      console.error("Failed to fetch department status", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <ScreenWrapper title="Department Course Files" withScroll={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.section}>
          <AppText variant="h3" style={styles.sectionTitle}>
             Monitoring Summary
          </AppText>
          {deptStatus.length > 0 ? (
            deptStatus.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.subjectItemCard}
                onPress={() => router.push(`/course-file-review?assignmentId=${item.id}`)}
              >
                <View style={styles.subjectItemContent}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <AppText style={styles.subjectItemName}>{item.name}</AppText>
                    <View style={[styles.badge, { backgroundColor: COLORS.primary + '20' }]}>
                      <AppText style={{ color: COLORS.primary, fontSize: 10, fontWeight: '700' }}>MONITORING</AppText>
                    </View>
                  </View>
                  
                  <AppText variant="caption" style={styles.subjectItemMeta}>
                    Faculty: {item.faculty}
                  </AppText>
                  <AppText variant="caption" style={styles.subjectItemMeta}>
                    Class: {item.className}
                  </AppText>

                  <View style={{ marginTop: 8 }}>
                    <View style={styles.progressBarBg}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            width: `${item.progress}%`,
                            backgroundColor: item.progress >= 90 ? COLORS.success : item.progress >= 50 ? COLORS.warning : COLORS.error
                          }
                        ]} 
                      />
                    </View>
                    <AppText variant="caption" style={{ color: COLORS.textSecondary, marginTop: 4 }}>
                      Progress: {item.progress}%
                    </AppText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <AppText style={styles.emptyText}>No subjects tracked yet.</AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.m,
  },
  section: {
    paddingBottom: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.m,
    color: COLORS.textPrimary,
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
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  }
});

export default HodDepartmentStatusScreen;
