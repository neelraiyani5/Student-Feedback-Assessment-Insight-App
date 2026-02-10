import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';
import { getDashboardSummary } from '../../services/api';

const FacultyDashboard = () => {
    const router = useRouter();
    const { name } = useLocalSearchParams();
    const [subjects, setSubjects] = useState([]);
    const [user, setUser] = useState(null);
    const [courseAssignments, setCourseAssignments] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]); // Dynamic Deadlines
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);


    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const data = await getDashboardSummary();
            
            // Set Profile & Subjects
            if (data.user) {
                setUser(data.user);
                if (data.user.subjects) {
                    const formatted = data.user.subjects.map((s, index) => ({
                        id: s.id,
                        name: s.name,
                        code: s.name.substring(0, 4).toUpperCase(),
                        icon: 'book',
                        color: index % 2 === 0 ? '#4F46E5' : '#7C3AED'
                    }));
                    setSubjects(formatted);
                }
            }

            // Set Assignments
            setCourseAssignments(data.myAssignments || []);

            // Set Tasks (Already limited/sorted by server)
            setUpcomingTasks(data.upcomingTasks || []);

        } catch (e) {
            console.error("Dashboard error", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
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



    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchDashboardData(true);
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
                        <Ionicons name="person-circle" size={50} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>



                {/* Course File Compliance Section */}
                <View style={styles.section}>
                    <View style={{paddingHorizontal: SPACING.l, marginBottom: SPACING.m}}>
                        <AppText variant="h3">Course File Status</AppText>
                    </View>
                    <TouchableOpacity 
                        style={[styles.taskCard, {borderColor: COLORS.success}]}
                        onPress={() => router.push('/my-course-files')}
                    >
                         <View style={{flexDirection:'row', alignItems:'center', gap: 12}}>
                             <View style={{padding:8, backgroundColor: COLORS.success+'20', borderRadius:8}}>
                                <Ionicons name="folder-open" size={24} color={COLORS.success} />
                             </View>
                             <View style={{flex: 1}}>
                                 <AppText style={{fontSize:16, fontWeight:'600'}}>My Subject Course Files</AppText>
                                 <AppText variant="caption" style={{color: COLORS.textSecondary}}>Manage submissions and track compliance</AppText>
                             </View>
                             <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                         </View>
                    </TouchableOpacity>
                </View>

                {/* Assessments Section */}
                <View style={styles.section}>
                    <View style={{paddingHorizontal: SPACING.l, marginBottom: SPACING.m}}>
                        <AppText variant="h3">Assessments</AppText>
                    </View>
                    <TouchableOpacity 
                        style={[styles.taskCard, {borderColor: COLORS.primary}]}
                        onPress={() => router.push('/assessments')}
                    >
                         <View style={{flexDirection:'row', alignItems:'center', gap: 12}}>
                             <View style={{padding:8, backgroundColor: COLORS.primary+'20', borderRadius:8}}>
                                <Ionicons name="clipboard" size={24} color={COLORS.primary} />
                             </View>
                             <View style={{flex: 1}}>
                                 <AppText style={{fontSize:16, fontWeight:'600'}}>Review & Add Marks</AppText>
                                 <AppText variant="caption" style={{color: COLORS.textSecondary}}>Manage IA, CSE, and ESE marks</AppText>
                             </View>
                             <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                         </View>
                    </TouchableOpacity>
                </View>

                {/* Feedback Section */}
                <View style={styles.section}>
                    <View style={{paddingHorizontal: SPACING.l, marginBottom: SPACING.m}}>
                        <AppText variant="h3">Feedback Analysis</AppText>
                    </View>
                    <TouchableOpacity 
                        style={[styles.taskCard, {borderColor: '#10B981'}]}
                        onPress={() => router.push('/feedback/monitoring')}
                    >
                         <View style={{flexDirection:'row', alignItems:'center', gap: 12}}>
                             <View style={{padding:8, backgroundColor: '#10B98120', borderRadius:8}}>
                                <Ionicons name="stats-chart" size={24} color="#10B981" />
                             </View>
                             <View style={{flex: 1}}>
                                 <AppText style={{fontSize:16, fontWeight:'600'}}>Feedback Reports</AppText>
                                 <AppText variant="caption" style={{color: COLORS.textSecondary}}>View results of your feedback sessions</AppText>
                             </View>
                             <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
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
                                        {task.template?.title || "Task"}
                                    </AppText>
                                    <AppText variant="caption" style={{color: COLORS.textSecondary}}>
                                        {task.assignment?.subject?.name} • {task.assignment?.class?.name}
                                    </AppText>
                                </View>
                                <View style={styles.taskFooter}>
                                    <AppText variant="caption" style={styles.taskDate}>
                                        {task.deadline 
                                            ? `Due: ${new Date(task.deadline).toLocaleDateString('en-US', {month:'short', day:'numeric'})}`
                                            : "No Deadline Set"
                                        }
                                    </AppText>
                                    <TouchableOpacity 
                                        style={styles.actionButton}
                                        onPress={() => router.push(`/course-checklist?assignmentId=${task.assignmentId}`)}
                                    >
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
        marginBottom: SPACING.s,
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
