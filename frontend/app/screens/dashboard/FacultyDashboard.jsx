import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';
import { getMyProfile, getMyCourseAssignments } from '../../services/api';

const FacultyDashboard = () => {
    const router = useRouter();
    const { name } = useLocalSearchParams();
    const [subjects, setSubjects] = useState([]);
    const [user, setUser] = useState(null);
    const [courseAssignments, setCourseAssignments] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]); // Dynamic Deadlines
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Placeholder for activities until API is ready
    const ACTIVITIES = [
        { id: '1', title: 'Lecture Feedback Generated', description: 'Class 5A - Data Structures', time: '1 hour ago', type: 'success' },
    ];

    useEffect(() => {
        fetchProfile();
        fetchCourseAssignments();
        fetchMyTasks();
    }, []);

    const fetchMyTasks = async () => {
        try {
             // We need an API for this. getCourseTasks returns all tasks.
             // We will filter pending.
             const { getCourseTasks } = require('../../services/api');
             const tasks = await getCourseTasks();
             const pending = tasks.filter(t => t.status === 'PENDING')
                                  .sort((a,b) => new Date(a.deadline) - new Date(b.deadline))
                                  .slice(0, 5); // Start with top 5
             
             setUpcomingTasks(pending);
        } catch (e) {
            console.log("Error fetching tasks", e);
        }
    }

    const fetchProfile = async () => {
        try {
            const data = await getMyProfile();
            if (data.user) {
                setUser(data.user);
                if (data.user.subjects) {
                     const formatted = data.user.subjects.map((s, index) => ({
                        id: s.id,
                        name: s.name,
                        code: s.name.substring(0, 4).toUpperCase(),
                        icon: 'book',
                        color: index % 2 === 0 ? '#4F46E5' : '#7C3AED' // Alternating colors
                    }));
                    setSubjects(formatted);
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    };

    const fetchCourseAssignments = async () => {
        setLoading(true);
        try {
            const data = await getMyCourseAssignments();
            setCourseAssignments(data || []);
        } catch (error) {
            console.log("Failed to fetch course assignments", error);
        } finally {
            setLoading(false);
        }
    };

    const renderSubjectCard = ({ item }) => (
        <TouchableOpacity style={[styles.subjectCard, { backgroundColor: item.color }]} onPress={() => router.push('/course-checklist')}>
            <View style={styles.subjectIconContainer}>
                <Ionicons name={item.icon} size={24} color={COLORS.white} />
            </View>
            <View>
                <AppText variant="h3" style={styles.subjectName}>{item.name}</AppText>
                <AppText variant="caption" style={styles.subjectCode}>{item.code}</AppText>
            </View>
        </TouchableOpacity>
    );



    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
           await Promise.all([fetchProfile(), fetchCourseAssignments(), fetchMyTasks()]);
        } finally {
           setRefreshing(false);
        }
    }, []);

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <AppText variant="h2" style={styles.greeting}>Hello,</AppText>
                        <AppText variant="h2" style={styles.userName}>{user?.name || name || 'Faculty'}.</AppText>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <Image 
                            source="https://randomuser.me/api/portraits/women/44.jpg" 
                            style={styles.profileImage}
                            contentFit="cover"
                        />
                    </TouchableOpacity>
                </View>


                <View style={[styles.section, { paddingHorizontal: SPACING.l, marginTop: SPACING.m }]}>
                    <TouchableOpacity 
                        style={[styles.taskCard, { backgroundColor: '#10B98120', borderColor: '#10B981', marginHorizontal: 0 }]}
                        onPress={() => router.push('/feedback/monitoring')}
                    >
                        <View style={{flexDirection:'row', alignItems:'center', gap: 12}}>
                            <View style={{padding:8, backgroundColor: '#10B981', borderRadius:8}}>
                                <Ionicons name="stats-chart" size={24} color={COLORS.white} />
                            </View>
                            <View>
                                <AppText style={{fontSize:16, fontWeight:'600'}}>Feedback Reports</AppText>
                                <AppText variant="caption" style={{color: COLORS.textSecondary}}>View results of your feedback sessions</AppText>
                            </View>
                            <View style={{flex:1, alignItems:'flex-end'}}>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Course File Compliance Section */}
                <View style={styles.section}>
                    <AppText variant="h3" style={styles.sectionTitle}>Course File Status</AppText>
                    {courseAssignments.length > 0 ? (
                        courseAssignments.map(assign => {
                            const total = assign?.progress?.total || 0;
                            const completed = assign?.progress?.completed || 0;
                            const percent = total > 0 ? (completed / total) * 100 : 0;
                            const isComplianceRisk = percent < 50; // Simple logic

                            return (
                                <TouchableOpacity 
                                    key={assign.id} 
                                    style={styles.taskCard}
                                    onPress={() => router.push(`/course-checklist?assignmentId=${assign.id}`)}
                                >
                                    <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 8}}>
                                        <AppText style={{fontWeight:'600'}}>{assign.subject.name}</AppText>
                                        <AppText style={{color: COLORS.textSecondary}}>{assign.class.name}</AppText>
                                    </View>
                                    
                                    <View style={{height: 6, backgroundColor: COLORS.surface, borderRadius: 3, marginVertical: 8, overflow:'hidden'}}>
                                        <View style={{height:'100%', width: `${percent}%`, backgroundColor: isComplianceRisk ? COLORS.warning : COLORS.success}} />
                                    </View>

                                    <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                                        <AppText variant="caption" style={{color: isComplianceRisk ? COLORS.warning : COLORS.success}}>
                                            {completed}/{total} Tasks Completed
                                        </AppText>
                                        <AppText variant="caption" style={{color: COLORS.textLight}}>
                                            {Math.round(percent)}%
                                        </AppText>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <View style={{paddingHorizontal: SPACING.l}}>
                            <AppText style={{color: COLORS.textSecondary, fontStyle: 'italic'}}>No course files assigned.</AppText>
                        </View>
                    )}
                </View>

                {/* Assessments Section */}
                <View style={[styles.section, {paddingHorizontal: SPACING.l}]}>
                     <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: SPACING.m}}>
                        <AppText variant="h3">Assessments</AppText>
                        <TouchableOpacity onPress={() => router.push('/assessments')}>
                            <AppText style={{color: COLORS.primary}}>View All</AppText>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                        style={[styles.taskCard, {borderColor: COLORS.primary}]}
                        onPress={() => router.push('/assessments')}
                    >
                         <View style={{flexDirection:'row', alignItems:'center', gap: 12}}>
                             <View style={{padding:8, backgroundColor: COLORS.primary+'20', borderRadius:8}}>
                                <Ionicons name="clipboard" size={24} color={COLORS.primary} />
                             </View>
                             <View>
                                 <AppText style={{fontSize:16, fontWeight:'600'}}>Review & Add Marks</AppText>
                                 <AppText variant="caption" style={{color: COLORS.textSecondary}}>Manage IA, CSE, and ESE marks</AppText>
                             </View>
                             <View style={{flex:1, alignItems:'flex-end'}}>
                                 <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                             </View>
                         </View>
                    </TouchableOpacity>
                </View>

                {/* Pending Deadlines Section */}
                <View style={styles.section}>
                    <AppText variant="h3" style={styles.sectionTitle}>Pending Deadlines</AppText>
                    {upcomingTasks.length > 0 ? upcomingTasks.map(task => {
                        const isUrgent = new Date(task.deadline) < new Date(Date.now() + 3*24*60*60*1000); // 3 days
                        return (
                            <View key={task.id} style={styles.taskCard}>
                                <View style={styles.taskHeader}>
                                    <View style={[
                                        styles.statusDot, 
                                        { backgroundColor: isUrgent ? COLORS.error : COLORS.warning }
                                    ]} />
                                    <AppText style={[
                                        styles.taskTitle,
                                        { color: isUrgent ? COLORS.error : COLORS.warning }
                                    ]}>
                                        {task.template && task.template.title ? task.template.title : "Task"}
                                    </AppText>
                                </View>
                                <View style={styles.taskFooter}>
                                    <AppText variant="caption" style={styles.taskDate}>
                                        Due: {new Date(task.deadline).toLocaleDateString('en-US', {month:'short', day:'numeric'})}
                                    </AppText>
                                    <TouchableOpacity style={styles.actionButton}>
                                        <AppText variant="caption" style={styles.actionButtonText}>
                                            {isUrgent ? 'Action Required' : 'View Details'}
                                        </AppText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }) : (
                        <View style={{paddingHorizontal: SPACING.l}}>
                            <AppText style={{color: COLORS.textSecondary, fontStyle:'italic'}}>No pending deadlines.</AppText>
                        </View>
                    )}
                </View>

                {/* Recent Activity Section */}
                <View style={[styles.section, styles.lastSection]}>
                    <AppText variant="h3" style={styles.sectionTitle}>Recent Activity</AppText>
                    {ACTIVITIES.map(activity => (
                        <View key={activity.id} style={styles.activityCard}>
                            <View style={styles.activityContent}>
                                <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
                                <View style={styles.activityTextContainer}>
                                    <AppText style={styles.activityTitle}>{activity.title}</AppText>
                                    <AppText variant="caption" style={styles.activityDesc}>{activity.description}</AppText>
                                </View>
                            </View>
                            <View style={styles.activityFooter}>
                                <AppText variant="caption" style={styles.timeText}>{activity.time}</AppText>
                                <TouchableOpacity style={styles.viewReportButton}>
                                     <AppText variant="caption" style={styles.viewReportText}>View Report</AppText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>

            {/* Floating Action Button for creating feedback session */}
            {subjects.length > 0 && ( /* Updated to use local subjects derived from profile */
                <TouchableOpacity 
                    style={styles.fab} 
                    onPress={() => router.push('/feedback/session/start')}
                >
                    <Ionicons name="add" size={30} color={COLORS.white} />
                </TouchableOpacity>
            )}

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.l,
    },
    greeting: {
        color: COLORS.textSecondary,
        fontWeight: '400',
    },
    userName: {
        color: COLORS.textPrimary,
        fontWeight: '700',
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.gray,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.m,
        color: COLORS.textPrimary,
    },
    subjectsList: {
        paddingHorizontal: SPACING.l,
        paddingRight: SPACING.m, // Extra padding for last item
    },
    subjectCard: {
        width: wp(40),
        height: hp(15),
        borderRadius: LAYOUT.radius.l,
        padding: SPACING.m,
        marginRight: SPACING.m,
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    subjectIconContainer: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: SPACING.s,
        borderRadius: LAYOUT.radius.m,
    },
    subjectName: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        marginTop: SPACING.s,
    },
    subjectCode: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    taskCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.l,
        marginBottom: SPACING.m,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: SPACING.s,
    },
    taskTitle: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: SPACING.m + 4, // Indent to align with text
    },
    taskDate: {
        color: COLORS.textSecondary,
    },
    actionButton: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.xs,
        borderRadius: LAYOUT.radius.s,
    },
    actionButtonText: {
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    activityCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.l,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
    },
    activityContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.s,
    },
    activityTextContainer: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    activityDesc: {
        color: COLORS.textSecondary,
    },
    activityFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: SPACING.m + 4,
        marginTop: SPACING.xs,
    },
    timeText: {
        color: COLORS.textLight,
    },
    viewReportButton: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.xs,
        borderRadius: LAYOUT.radius.s,
    },
    viewReportText: {
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    lastSection: {
        marginBottom: SPACING.xxl,
    },
    fab: {
        position: 'absolute',
        bottom: SPACING.xl,
        right: SPACING.l,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    }
});

export default FacultyDashboard;
