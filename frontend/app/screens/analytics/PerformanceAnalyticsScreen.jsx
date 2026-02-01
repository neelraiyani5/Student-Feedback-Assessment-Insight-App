import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';

const PerformanceAnalyticsScreen = () => {
    const router = useRouter();
    const [selectedSegment, setSelectedSegment] = useState('CSE'); // 'CSE' | 'Internal'

    return (
        <ScreenWrapper backgroundColor={COLORS.white} withPadding={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h2" style={styles.screenTitle}>Where Do I Stand?</AppText>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Segment Control */}
                <View style={styles.segmentContainer}>
                    <TouchableOpacity 
                        style={[styles.segmentButton, selectedSegment === 'CSE' && styles.segmentActive]}
                        onPress={() => setSelectedSegment('CSE')}
                    >
                        <AppText style={[styles.segmentText, selectedSegment === 'CSE' && styles.segmentTextActive]}>CSE</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.segmentButton, selectedSegment === 'Internal' && styles.segmentActive]}
                        onPress={() => setSelectedSegment('Internal')}
                    >
                        <AppText style={[styles.segmentText, selectedSegment === 'Internal' && styles.segmentTextActive]}>IA</AppText>
                    </TouchableOpacity>
                </View>

                {/* Gauge Chart Section */}
                <View style={styles.gaugeContainer}>
                    <View style={styles.gaugeOuter}>
                        {/* Simulated Gauge Arc using borders */}
                        <View style={styles.gaugeArc} />
                        <View style={styles.gaugeInner}>
                             <AppText variant="h1" style={styles.percentileText}>85th</AppText>
                             <AppText variant="body2" style={styles.percentileLabel}>Your Percentile</AppText>
                        </View>
                    </View>
                    <View style={styles.rankBadge}>
                        <AppText variant="body2" style={styles.rankText}>Rank Range: Top 15-20%</AppText>
                    </View>
                </View>

                {/* Comparison Graph Section */}
                <View style={styles.graphCard}>
                    <AppText variant="h3" style={styles.graphTitle}>Performance Comparison</AppText>
                    
                    <View style={styles.graphContainer}>
                        {/* Class Average Bar */}
                        <View style={styles.barGroup}>
                            <AppText variant="caption" style={styles.barLabel}>65%</AppText>
                            <View style={[styles.bar, styles.barGrey, { height: hp(20) * 0.65 }]} />
                            <AppText variant="caption" style={styles.barAxisLabel}>Class Avg</AppText>
                        </View>

                        {/* Your Score Bar */}
                        <View style={styles.barGroup}>
                            <AppText variant="caption" style={[styles.barLabel, { color: COLORS.primary }]}>78%</AppText>
                            <View style={[styles.bar, styles.barBlue, { height: hp(20) * 0.78 }]} />
                            <AppText variant="caption" style={[styles.barAxisLabel, { color: COLORS.primary, fontWeight: 'bold' }]}>You</AppText>
                        </View>
                    </View>
                </View>

                {/* Additional Stats Grid (Optional based on design feel) */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <AppText variant="h2" style={styles.statValue}>12</AppText>
                        <AppText variant="caption" style={styles.statLabel}>Assignments</AppText>
                    </View>
                    <View style={styles.statBox}>
                        <AppText variant="h2" style={styles.statValue}>92%</AppText>
                        <AppText variant="caption" style={styles.statLabel}>Attendance</AppText>
                    </View>
                    <View style={styles.statBox}>
                        <AppText variant="h2" style={styles.statValue}>A</AppText>
                        <AppText variant="caption" style={styles.statLabel}>Grade</AppText>
                    </View>
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.m,
        paddingBottom: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surface,
    },
    backButton: {
        marginRight: SPACING.m,
    },
    screenTitle: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.l,
        paddingBottom: hp(10),
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.m,
        padding: 4,
        marginBottom: SPACING.xl,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: SPACING.s,
        alignItems: 'center',
        borderRadius: LAYOUT.radius.s,
    },
    segmentActive: {
        backgroundColor: COLORS.white,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    segmentText: {
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    segmentTextActive: {
        color: COLORS.textPrimary,
        fontWeight: '700',
    },
    gaugeContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    gaugeOuter: {
        width: 200,
        height: 100, // Half circle height
        overflow: 'hidden', // Hide bottom half
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: SPACING.m,
    },
    gaugeArc: {
        width: 200,
        height: 200, // Full circle
        borderRadius: 100,
        borderWidth: 20,
        borderColor: COLORS.surface,
        borderTopColor: COLORS.success, // Active color
        borderRightColor: COLORS.success, // partially active
        borderLeftColor: COLORS.success,
        borderBottomColor: COLORS.surface, // Hidden part
        position: 'absolute',
        top: 0,
        transform: [{ rotate: '-45deg' }] // Adjust rotation to make it look like 85%
    },
    gaugeInner: {
        alignItems: 'center',
    },
    percentileText: {
        fontSize: 40,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    percentileLabel: {
        color: COLORS.textSecondary,
    },
    rankBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.xs,
        borderRadius: LAYOUT.radius.round,
    },
    rankText: {
        color: COLORS.success,
        fontWeight: '600',
    },
    graphCard: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.l,
        padding: SPACING.l,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    graphTitle: {
        marginBottom: SPACING.l,
        color: COLORS.textPrimary,
    },
    graphContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: hp(25),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: SPACING.s,
    },
    barGroup: {
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    bar: {
        width: 40,
        borderRadius: LAYOUT.radius.s,
        marginVertical: SPACING.xs,
    },
    barGrey: {
        backgroundColor: COLORS.textLight,
    },
    barBlue: {
        backgroundColor: COLORS.primary,
    },
    barLabel: {
        marginBottom: 4,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    barAxisLabel: {
        marginTop: 4,
        color: COLORS.textSecondary,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: SPACING.m,
    },
    statBox: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        alignItems: 'center',
    },
    statValue: {
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    statLabel: {
        color: COLORS.textSecondary,
    }
});

export default PerformanceAnalyticsScreen;
