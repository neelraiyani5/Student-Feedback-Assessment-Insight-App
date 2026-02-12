import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';
import { getStudentSubjectPerformance, getStudentSubjects } from '../../services/api';

const SubjectPerformanceScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // Subject ID
    const [loading, setLoading] = useState(true);
    const [performance, setPerformance] = useState(null);
    const [subjectName, setSubjectName] = useState('Subject Analysis');

    // Drill-down state
    const [selectedComponentKey, setSelectedComponentKey] = useState(null);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [showAssessmentsModal, setShowAssessmentsModal] = useState(false);
    const [showMetricsModal, setShowMetricsModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [perfData, subData] = await Promise.all([
                getStudentSubjectPerformance(id),
                getStudentSubjects()
            ]);

            setPerformance(perfData);
            const sub = subData.subjects?.find(s => s.id === id);
            if (sub) setSubjectName(sub.name);

        } catch (error) {
            console.log("Error loading performance", error);
        } finally {
            setLoading(false);
        }
    };

    const handleComponentPress = (key) => {
        setSelectedComponentKey(key);
        setShowAssessmentsModal(true);
    };

    const handleAssessmentPress = (ass) => {
        setSelectedAssessment(ass);
        setShowMetricsModal(true);
    };

    if (loading) {
        return (
            <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <AppText style={{marginTop: 12}}>Analyzing performance...</AppText>
                </View>
            </ScreenWrapper>
        );
    }

    const COMPONENT_STYLES = {
        IA: { label: 'Internal', bg: '#DBEAFE', color: '#1E40AF' },
        CSE: { label: 'CSE', bg: '#DCFCE7', color: '#166534' },
        ESE: { label: 'End Sem', bg: '#F3E8FF', color: '#6B21A8' },
        TW: { label: 'Term Work', bg: '#FEF3C7', color: '#92400E' }
    };

    const selectedComponentData = selectedComponentKey ? performance?.components[selectedComponentKey] : null;

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3" style={{ flex: 1 }} numberOfLines={1}>{subjectName}</AppText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Rank Badge */}
                <View style={styles.rankCard}>
                    <View>
                        <AppText variant="caption" style={{ color: COLORS.white }}>Current Rank</AppText>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <AppText style={styles.rankText}>#{performance?.rank}</AppText>
                            <AppText style={{ color: 'rgba(255,255,255,0.8)', marginLeft: 5 }}>
                                / {performance?.totalStudents} Students
                            </AppText>
                        </View>
                    </View>
                    <Ionicons name="trophy" size={40} color="rgba(255,255,255,0.3)" />
                </View>

                {/* Overall Performance */}
                <View style={styles.card}>
                    <AppText variant="h3" style={styles.cardTitle}>Overall Performance</AppText>

                    <View style={styles.comparisonRow}>
                        <View style={styles.compItem}>
                            <AppText style={styles.compValue}>{performance?.totalObtained}</AppText>
                            <AppText variant="caption">Your Total</AppText>
                        </View>
                        <View style={{ width: 1, height: 30, backgroundColor: COLORS.border }} />
                        <View style={styles.compItem}>
                            <AppText style={[styles.compValue, { color: COLORS.textSecondary }]}>{Math.round(performance?.classAverage)}</AppText>
                            <AppText variant="caption">Class Avg</AppText>
                        </View>
                    </View>

                    <View style={{ marginTop: 16 }}>
                        <AppText variant="caption" style={{ marginBottom: 8 }}>Performance Meter</AppText>
                        <View style={styles.meterContainer}>
                            <View style={[styles.meterBar, {
                                width: `${Math.min(100, (performance?.totalObtained / (performance?.classAverage * 1.5 || 100)) * 100)}%`
                            }]} />
                        </View>
                        <AppText variant="small" style={{ textAlign: 'right', marginTop: 4, color: COLORS.textSecondary }}>
                            {performance?.totalObtained >= performance?.classAverage ? "Above Average" : "Needs Improvement"}
                        </AppText>
                    </View>
                </View>

                {/* Component Breakdown */}
                <View style={styles.sectionTitleRow}>
                    <AppText variant="h3">Component Breakdown</AppText>
                    <AppText variant="caption" style={{color: COLORS.textSecondary}}>Tap to view assessments</AppText>
                </View>

                <View style={styles.grid}>
                    {Object.keys(COMPONENT_STYLES).map((key) => {
                        const style = COMPONENT_STYLES[key];
                        const data = performance?.components[key];
                        return (
                            <TouchableOpacity 
                                key={key} 
                                style={styles.componentCard}
                                onPress={() => handleComponentPress(key)}
                            >
                                <View style={[styles.iconBg, { backgroundColor: style.bg }]}>
                                    <AppText style={{ fontWeight: 'bold', color: style.color }}>{key}</AppText>
                                </View>
                                <AppText style={styles.compTitle}>{style.label}</AppText>
                                <AppText style={styles.scoreText}>
                                    {data?.scored || 0} <AppText variant="small" style={{ color: COLORS.textSecondary }}>/ {data?.total || 0}</AppText>
                                </AppText>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Detailed Analysis Callout */}
                <View style={[styles.card, { marginTop: SPACING.l, padding: SPACING.m, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', borderWidth: 1 }]}>
                    <Ionicons name="information-circle" size={24} color="#0284C7" />
                    <AppText style={{ marginLeft: 10, flex: 1, color: '#0369A1' }}>Click on any component above to see individual assessment marks and class stats.</AppText>
                </View>

            </ScrollView>

            {/* Assessments List Modal */}
            {showAssessmentsModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h3">{COMPONENT_STYLES[selectedComponentKey]?.label} Assessments</AppText>
                            <TouchableOpacity onPress={() => setShowAssessmentsModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={{maxHeight: hp(60)}}>
                            {selectedComponentData?.assessments?.length > 0 ? (
                                selectedComponentData.assessments.map((ass) => (
                                    <TouchableOpacity 
                                        key={ass.id} 
                                        style={styles.assessmentItem}
                                        onPress={() => handleAssessmentPress(ass)}
                                    >
                                        <View style={{flex: 1}}>
                                            <AppText style={styles.assessmentTitle}>{ass.title}</AppText>
                                            <AppText variant="caption" style={{color: COLORS.textSecondary}}>Max Marks: {ass.maxMarks}</AppText>
                                        </View>
                                        <View style={styles.marksBadge}>
                                            <AppText style={styles.marksBadgeText}>{ass.ownMarks}</AppText>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={{paddingVertical: 30, alignItems: 'center'}}>
                                    <AppText style={{color: COLORS.textSecondary}}>No assessments found in this category.</AppText>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            )}

            {/* Detailed Metrics Modal */}
            {showMetricsModal && (
                <View style={[styles.modalOverlay, {backgroundColor: 'rgba(0,0,0,0.7)'}]}>
                    <View style={[styles.modalContent, {paddingBottom: 20, maxHeight: hp(85)}]}>
                         <View style={styles.modalHeader}>
                            <AppText variant="h3">Performance Details</AppText>
                            <TouchableOpacity onPress={() => setShowMetricsModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <AppText style={styles.metricAssTitle}>{selectedAssessment?.title}</AppText>
                            
                            {/* Unified Grid using explicit rows to guarantee layout */}
                            <View style={{gap: SPACING.m, marginBottom: SPACING.l}}>
                                <View style={{flexDirection: 'row', gap: SPACING.m}}>
                                    <View style={[styles.metricCard, {backgroundColor: COLORS.primary + '15'}]}>
                                        <AppText variant="caption" style={{color: COLORS.primary, fontWeight: '600'}}>Your Mark</AppText>
                                        <AppText style={[styles.metricValue, {color: COLORS.primary}]}>{selectedAssessment?.ownMarks}</AppText>
                                        <AppText variant="small" style={{color: COLORS.textSecondary}}>/{selectedAssessment?.maxMarks}</AppText>
                                    </View>

                                    <View style={[styles.metricCard, {backgroundColor: '#FEF3C7'}]}>
                                        <AppText variant="caption" style={{color: '#92400E', fontWeight: '600'}}>Class Mean</AppText>
                                        <AppText style={[styles.metricValue, {color: '#92400E'}]}>{selectedAssessment?.mean}</AppText>
                                        <AppText variant="small" style={{color: COLORS.textSecondary}}>Average</AppText>
                                    </View>
                                </View>

                                <View style={{flexDirection: 'row', gap: SPACING.m}}>
                                    <View style={[styles.metricCard, {backgroundColor: '#DCFCE7'}]}>
                                        <AppText variant="caption" style={{color: '#166534', fontWeight: '600'}}>Highest</AppText>
                                        <AppText style={[styles.metricValue, {color: '#166534'}]}>{selectedAssessment?.highest}</AppText>
                                        <AppText variant="small" style={{color: COLORS.textSecondary}}>Top Score</AppText>
                                    </View>

                                    <View style={[styles.metricCard, {backgroundColor: '#FEE2E2'}]}>
                                        <AppText variant="caption" style={{color: '#991B1B', fontWeight: '600'}}>Lowest</AppText>
                                        <AppText style={[styles.metricValue, {color: '#991B1B'}]}>{selectedAssessment?.lowest}</AppText>
                                        <AppText variant="small" style={{color: COLORS.textSecondary}}>Min Score</AppText>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.metricSummary}>
                                <View style={[styles.summaryIndicator, { backgroundColor: selectedAssessment?.ownMarks >= selectedAssessment?.mean ? COLORS.success : COLORS.error }]}>
                                    <Ionicons 
                                        name={selectedAssessment?.ownMarks >= selectedAssessment?.mean ? "trending-up" : "trending-down"} 
                                        size={20} 
                                        color={COLORS.white} 
                                    />
                                </View>
                                <View style={{marginLeft: 12, flex: 1}}>
                                    <AppText style={{fontWeight: '700', fontSize: 16, color: COLORS.textPrimary}}>
                                        {selectedAssessment?.ownMarks >= selectedAssessment?.mean ? "Great Job!" : "Needs Improvement"}
                                    </AppText>
                                    <AppText variant="caption" style={{color: COLORS.textSecondary, marginTop: 2}}>
                                        Your score is {Math.abs(selectedAssessment?.ownMarks - selectedAssessment?.mean).toFixed(1)} marks {selectedAssessment?.ownMarks >= selectedAssessment?.mean ? "above" : "below"} the class average.
                                    </AppText>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={styles.modalDoneBtn} 
                                onPress={() => setShowMetricsModal(false)}
                            >
                                <AppText style={styles.modalDoneBtnText}>Dismiss</AppText>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        gap: SPACING.m,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    content: {
        padding: SPACING.m
    },
    rankCard: {
        backgroundColor: COLORS.primary,
        borderRadius: LAYOUT.radius.l,
        padding: SPACING.l,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
        elevation: 4
    },
    rankText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.white
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.l,
        marginBottom: SPACING.l,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05
    },
    cardTitle: {
        marginBottom: SPACING.l,
        color: COLORS.textPrimary
    },
    comparisonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 10
    },
    compItem: {
        alignItems: 'center'
    },
    compValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary
    },
    meterContainer: {
        height: 10,
        backgroundColor: COLORS.surface,
        borderRadius: 5,
        overflow: 'hidden'
    },
    meterBar: {
        height: '100%',
        backgroundColor: COLORS.warning, // Dynamic color later
        borderRadius: 5
    },
    sectionTitleRow: {
        marginBottom: SPACING.m
    },
    grid: {
        flexDirection: 'row',
        gap: SPACING.m,
        flexWrap: 'wrap'
    },
    componentCard: {
        flex: 1, // Equal width
        minWidth: '30%',
        backgroundColor: COLORS.white,
        padding: SPACING.m,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 1,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    compTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4
    },
    scoreText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary
    },
    // Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: SPACING.l,
        paddingBottom: 40,
        width: '100%',
        elevation: 10
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: SPACING.m
    },
    assessmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surface,
        gap: SPACING.m
    },
    assessmentTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2
    },
    marksBadge: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 40,
        alignItems: 'center'
    },
    marksBadgeText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 16
    },
    metricAssTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.l,
        textAlign: 'center'
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.m,
        marginBottom: SPACING.l
    },
    metricCard: {
        flex: 1,
        minWidth: '45%',
        padding: SPACING.m,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    metricValue: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 4
    },
    metricSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    summaryIndicator: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2
    },
    modalDoneBtn: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.s
    },
    modalDoneBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default SubjectPerformanceScreen;
