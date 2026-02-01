import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';

// Mock Data
const UPCOMING_CLASSES = [
  { id: '1', time: '10:00 AM', subject: 'Data Structures', location: 'Room 302' },
  { id: '2', time: '11:30 AM', subject: 'Operating Systems', location: 'Lab 4' },
  { id: '3', time: '02:00 PM', subject: 'Artificial Intelligence', location: 'Room 305' },
];

const StudentDashboard = () => {
    const router = useRouter();
    const { name } = useLocalSearchParams();

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <AppText variant="h2" style={styles.greeting}>Welcome,</AppText>
                        <AppText variant="h2" style={styles.userName}>{name || 'Neel'}</AppText>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <Image 
                            source="https://randomuser.me/api/portraits/men/32.jpg" // Placeholder for Neel
                            style={styles.profileImage}
                            contentFit="cover"
                        />
                    </TouchableOpacity>
                </View>

                {/* Hero Notification Card */}
                <View style={styles.heroCard}>
                    <View style={styles.heroContent}>
                        <Ionicons name="alert-circle" size={32} color={COLORS.accent} style={styles.heroIcon} />
                        <View style={styles.heroTextContainer}>
                            <AppText variant="h3" style={styles.heroTitle}>Action Required</AppText>
                            <AppText style={styles.heroSubtitle}>2 Pending Feedback Requests</AppText>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.completeButton} onPress={() => router.push('/lecture-feedback')}>
                        <AppText style={styles.completeButtonText}>Complete Now</AppText>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    {/* Attendance Card */}
                    <View style={[styles.statCard, { backgroundColor: '#E0F2FE' }]}> 
                        <View style={styles.statIconBg}>
                            <Ionicons name="calendar" size={20} color="#0284C7" />
                        </View>
                        <AppText variant="caption" style={{ color: '#0284C7' }}>Attendance</AppText>
                        <AppText variant="h2" style={{ color: '#0C4A6E', marginTop: SPACING.xs }}>85%</AppText>
                    </View>

                    {/* Rank Card */}
                    <TouchableOpacity  style={[styles.statCard, { backgroundColor: '#DBEAFE' }]} onPress={() => router.push('/performance-analytics')}>
                        <View style={[styles.statIconBg, { backgroundColor: 'rgba(37, 99, 235, 0.2)' }]}>
                            <Ionicons name="trophy" size={20} color="#2563EB" />
                        </View>
                        <AppText variant="caption" style={{ color: '#2563EB' }}>Current Rank</AppText>
                        <AppText variant="h2" style={{ color: '#1E3A8A', marginTop: SPACING.xs }}>Top 15%</AppText>
                    </TouchableOpacity >
                </View>

                {/* Upcoming Classes List */}
                <View style={styles.section}>
                    <AppText variant="h3" style={styles.sectionTitle}>Upcoming Classes</AppText>
                    
                    {UPCOMING_CLASSES.map((item, index) => (
                        <View key={item.id} style={styles.classCard}>
                            <View style={styles.timeContainer}>
                                <AppText style={styles.timeText}>{item.time}</AppText>
                                <View style={styles.timeLine} />
                            </View>
                            <View style={styles.classDetails}>
                                <AppText style={styles.className}>{item.subject}</AppText>
                                <View style={styles.locationContainer}>
                                    <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                                    <AppText variant="caption" style={styles.locationText}>{item.location}</AppText>
                                </View>
                            </View>
                            {index === 0 && (
                                <View style={styles.nowBadge}>
                                    <AppText variant="small" style={styles.nowText}>NOW</AppText>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

            </ScrollView>
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
    heroCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.l,
        borderRadius: LAYOUT.radius.l,
        padding: SPACING.l,
        marginBottom: SPACING.xl,
        shadowColor: COLORS.accent, // Orange shadow hint
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accent,
    },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    heroIcon: {
        marginRight: SPACING.m,
    },
    heroTextContainer: {
        flex: 1,
    },
    heroTitle: {
        color: COLORS.textPrimary,
        fontSize: 18,
    },
    heroSubtitle: {
        color: COLORS.textSecondary,
    },
    completeButton: {
        backgroundColor: COLORS.accent, // Orange
        borderRadius: LAYOUT.radius.m,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    completeButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        marginRight: SPACING.s,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.l,
        gap: SPACING.m,
        marginBottom: SPACING.xl,
    },
    statCard: {
        flex: 1,
        padding: SPACING.l,
        borderRadius: LAYOUT.radius.xl,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    statIconBg: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: SPACING.s,
        borderRadius: LAYOUT.radius.m,
        marginBottom: SPACING.m,
    },
    section: {
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        marginBottom: SPACING.m,
        color: COLORS.textPrimary,
    },
    classCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.l,
        marginBottom: SPACING.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    timeContainer: {
        alignItems: 'center',
        marginRight: SPACING.m,
        width: 70,
    },
    timeText: {
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    timeLine: {
        width: 2,
        height: 20,
        backgroundColor: COLORS.surface,
    },
    classDetails: {
        flex: 1,
    },
    className: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    nowBadge: {
        backgroundColor: '#DCFCE7', // Light green
        paddingHorizontal: SPACING.s,
        paddingVertical: 2,
        borderRadius: LAYOUT.radius.s,
    },
    nowText: {
        color: '#166534', // Green text
        fontWeight: 'bold',
        fontSize: 10,
    }
});

export default StudentDashboard;
