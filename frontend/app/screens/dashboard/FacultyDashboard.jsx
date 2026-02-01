import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';

// Mock Data
const SUBJECTS = [
  { id: '1', name: 'Data Structures', code: 'CS301', icon: 'server', color: '#4F46E5' },
  { id: '2', name: 'Operating Systems', code: 'IT402', icon: 'desktop', color: '#7C3AED' },
  { id: '3', name: 'AI', code: 'CS505', icon: 'hardware-chip', color: '#059669' },
];

const DEADLINES = [
  { id: '1', title: 'CO-PO Mapping - Due Tomorrow', date: 'Oct 16, 11:59 PM', type: 'urgent' },
  { id: '2', title: 'Upload Assignment 1 - Due Oct 20', date: 'Data Structures - Class 3B', type: 'warning' },
];

const ACTIVITIES = [
  { id: '1', title: 'Lecture Feedback Generated', description: 'Class 5A - Data Structures', time: '1 hour ago', type: 'success' },
];

const FacultyDashboard = () => {
    const router = useRouter();
    const { name } = useLocalSearchParams();

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

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <AppText variant="h2" style={styles.greeting}>Hello,</AppText>
                        <AppText variant="h2" style={styles.userName}>{name || 'Prof. Sharma'}.</AppText>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <Image 
                            source="https://randomuser.me/api/portraits/women/44.jpg" // Placeholder
                            style={styles.profileImage}
                            contentFit="cover"
                        />
                    </TouchableOpacity>
                </View>

                {/* My Subjects Section */}
                <View style={styles.section}>
                    <AppText variant="h3" style={styles.sectionTitle}>My Subjects</AppText>
                    <FlatList 
                        data={SUBJECTS}
                        renderItem={renderSubjectCard}
                        keyExtractor={item => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.subjectsList}
                    />
                </View>

                {/* Pending Deadlines Section */}
                <View style={styles.section}>
                    <AppText variant="h3" style={styles.sectionTitle}>Pending Deadlines</AppText>
                    {DEADLINES.map(task => (
                        <View key={task.id} style={styles.taskCard}>
                            <View style={styles.taskHeader}>
                                <View style={[
                                    styles.statusDot, 
                                    { backgroundColor: task.type === 'urgent' ? COLORS.error : COLORS.warning }
                                ]} />
                                <AppText style={[
                                    styles.taskTitle,
                                    { color: task.type === 'urgent' ? COLORS.error : COLORS.warning }
                                ]}>
                                    {task.title}
                                </AppText>
                            </View>
                            <View style={styles.taskFooter}>
                                <AppText variant="caption" style={styles.taskDate}>{task.date}</AppText>
                                <TouchableOpacity style={styles.actionButton}>
                                    <AppText variant="caption" style={styles.actionButtonText}>
                                        {task.type === 'urgent' ? 'Action Required' : 'View Details'}
                                    </AppText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
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
            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => router.push('/create-feedback')}
            >
                <Ionicons name="add" size={30} color={COLORS.white} />
            </TouchableOpacity>

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
