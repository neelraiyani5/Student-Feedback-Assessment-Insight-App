import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';
import { getMyProfile } from '../../services/api';

// Mock Data
const COMPLIANCE_DATA = {
  completed: 60,
  inProgress: 30,
  pending: 10,
};

const SUBJECTS_STATUS = [
  { id: '1', name: 'Cloud Computing', progress: 90, faculty: 'Prof. A. Smith', status: 'Good' },
  { id: '2', name: 'Compiler Design', progress: 40, faculty: 'Prof. B. Jones', status: 'Risk' },
  { id: '3', name: 'Information Security', progress: 75, faculty: 'Prof. C. Davis', status: 'Warning' },
];

const CoordinatorDashboard = () => {
    const router = useRouter();
    const { name } = useLocalSearchParams();
    const [user, setUser] = useState(null);

    useEffect(() => {
        getMyProfile().then(data => {
            if(data && data.user) setUser(data.user);
        }).catch(err => console.log("Failed to load profile", err));
    }, []);

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            {/* Header */}
            <View style={styles.header}>
                 <View>
                    <AppText variant="h2" style={styles.headerTitle}>{user?.name || name || 'Coordinator'}</AppText>
                    <AppText variant="body2" color={COLORS.textSecondary}>
                        {user?.role === 'HOD' ? 'Head of Department' : 'Class Coordinator'}
                    </AppText>
                 </View>
                 <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
                    <Ionicons name="person-circle" size={40} color={COLORS.primary} />
                 </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Main Visual: Compliance Overview (Simulated Donut Chart Card) */}
                <View style={styles.chartCard}>
                    <AppText variant="h3" style={styles.cardTitle}>Department Compliance</AppText>
                    
                    <View style={styles.chartContent}>
                        {/* Circular Indicator */}
                        <View style={styles.donutContainer}>
                            <View style={[styles.donutOuter, { borderColor: COLORS.surface }]}>
                                <View style={[styles.donutProgress, { 
                                    borderRightColor: COLORS.success, 
                                    borderBottomColor: COLORS.success,
                                    transform: [{ rotate: '45deg' }] 
                                }]} />
                            </View>
                            <View style={styles.donutInner}>
                                <AppText variant="h1" style={styles.donutPercent}>{COMPLIANCE_DATA.completed}%</AppText>
                                <AppText variant="caption" style={styles.donutLabel}>Completed</AppText>
                            </View>
                        </View>

                        {/* Legend / Breakdown */}
                        <View style={styles.legendContainer}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                                <View>
                                    <AppText variant="body2" style={styles.legendText}>Completed</AppText>
                                    <AppText variant="caption" style={styles.legendValue}>{COMPLIANCE_DATA.completed}%</AppText>
                                </View>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                                <View>
                                    <AppText variant="body2" style={styles.legendText}>In Progress</AppText>
                                    <AppText variant="caption" style={styles.legendValue}>{COMPLIANCE_DATA.inProgress}%</AppText>
                                </View>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
                                <View>
                                    <AppText variant="body2" style={styles.legendText}>Pending</AppText>
                                    <AppText variant="caption" style={styles.legendValue}>{COMPLIANCE_DATA.pending}%</AppText>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Administration Section */}
                <View style={styles.section}>
                    <AppText variant="h3" style={styles.sectionTitle}>Administration</AppText>
                    
                    {/* HOD Features */}
                    {(user?.role === 'HOD' || !user) && (
                        <>
                            <TouchableOpacity 
                                style={styles.adminCard} 
                                onPress={() => router.push('/manage-faculty')}
                            >
                                <View style={styles.adminIconContainer}>
                                    <Ionicons name="people" size={24} color={COLORS.white} />
                                </View>
                                <View style={styles.adminContent}>
                                    <AppText style={styles.adminTitle}>Manage Faculty</AppText>
                                    <AppText variant="caption" style={styles.adminSubtitle}>Add faculty, View list, Promote to CC</AppText>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.adminCard} 
                                onPress={() => router.push('/manage-curriculum')}
                            >
                                <View style={[styles.adminIconContainer, { backgroundColor: COLORS.secondary }]}>
                                    <Ionicons name="school" size={24} color={COLORS.white} />
                                </View>
                                <View style={styles.adminContent}>
                                    <AppText style={styles.adminTitle}>Semester Management</AppText>
                                    <AppText variant="caption" style={styles.adminSubtitle}>Manage Dept, Semesters, Promote Classes</AppText>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* CC Features */}
                    {user?.role === 'CC' && (
                         <TouchableOpacity 
                            style={styles.adminCard} 
                            onPress={() => router.push('/manage-students')}
                        >
                            <View style={[styles.adminIconContainer, { backgroundColor: COLORS.info }]}>
                                <Ionicons name="people-circle" size={24} color={COLORS.white} />
                            </View>
                            <View style={styles.adminContent}>
                                <AppText style={styles.adminTitle}>My Class & Students</AppText>
                                <AppText variant="caption" style={styles.adminSubtitle}>Manage Students, View Class Details</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
                        </TouchableOpacity>
                    )}

                </View>

                 {/* Subject List Section (For Everyone?) */}
                 <View style={styles.section}>
                    <AppText variant="h3" style={styles.sectionTitle}>Subject Status</AppText>
                    {SUBJECTS_STATUS.map((subject) => (
                        <TouchableOpacity key={subject.id} style={styles.subjectCard} onPress={() => router.push('/course-file-review')}>
                            {/* ... render card ... */}
                             <View style={styles.subjectHeader}>
                                <View>
                                    <AppText style={styles.subjectName}>{subject.name}</AppText>
                                    <AppText variant="caption" style={styles.facultyName}>{subject.faculty}</AppText>
                                </View>
                                {subject.status === 'Risk' && (
                                    <TouchableOpacity style={styles.reminderButton} onPress={() => alert(`Reminder sent to ${subject.faculty}`)}>
                                        <AppText variant="small" style={styles.reminderText}>Send Reminder</AppText>
                                        <Ionicons name="mail-outline" size={12} color={COLORS.white} style={{marginLeft: 4}} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBarBg}>
                                    <View style={[
                                        styles.progressBarFill, 
                                        { 
                                            width: `${subject.progress}%`,
                                            backgroundColor: subject.progress >= 90 ? COLORS.success : 
                                                           subject.progress >= 50 ? COLORS.warning : COLORS.error
                                        }
                                    ]} />
                                </View>
                                <AppText variant="caption" style={styles.progressText}>{subject.progress}%</AppText>
                            </View>
                        </TouchableOpacity>
                    ))}
                 </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        textAlign: 'center',
    },
    chartContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    donutContainer: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    donutOuter: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    donutProgress: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 15,
        borderLeftColor: 'transparent',
        borderTopColor: 'transparent', // Revealing half circle roughly
        position: 'absolute',
    },
    donutInner: {
        position: 'absolute',
        alignItems: 'center',
    },
    donutPercent: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    donutLabel: {
        color: COLORS.textSecondary,
        fontSize: 10,
    },
    legendContainer: {
        justifyContent: 'center',
        gap: SPACING.m,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: SPACING.s,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '600',
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.m,
    },
    subjectName: {
        fontWeight: '600',
        fontSize: 15,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    facultyName: {
        color: COLORS.textSecondary,
    },
    reminderButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.error,
        paddingHorizontal: SPACING.s,
        paddingVertical: 6,
        borderRadius: LAYOUT.radius.s,
        alignItems: 'center',
    },
    reminderText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 10,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: COLORS.surface,
        borderRadius: 3,
        marginRight: SPACING.m,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        width: 30,
        textAlign: 'right',
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    adminCard: {
        flexDirection: 'row',
        alignItems: 'center',
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    adminContent: {
        flex: 1,
    },
    adminTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    adminSubtitle: {
        color: COLORS.textSecondary,
    }
});

export default CoordinatorDashboard;
