import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, SPACING, LAYOUT } from '../../constants/theme';
import { getDashboardSummary, getSubjects, getFacultyAssessments, getClassSubjects } from '../../services/api';

const ClassInsightsScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [targetClass, setTargetClass] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [subjectAnalytics, setSubjectAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, [params.classId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // If classId is provided, we use that (HOD flow)
            if (params.classId) {
                setTargetClass({ id: params.classId, name: params.className });
                const subData = await getClassSubjects(params.classId);
                setSubjects(subData?.subjects || []);
            } else {
                // Default CC flow
                const dashboardData = await getDashboardSummary();
                const user = dashboardData.user;
                
                if (user?.role === 'CC' && user.classesCoordinated?.length > 0) {
                    const classCoord = user.classesCoordinated[0];
                    setTargetClass(classCoord);
                    
                    const subData = await getSubjects();
                    setSubjects(subData?.subjects || []);
                } else if (user?.role === 'HOD') {
                    // Fallback for HOD if no classId provided
                    setSubjects(dashboardData.monitoringData || []);
                }
            }
        } catch (error) {
            console.error("Error fetching class insights data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubjectSelect = async (subject) => {
        setSelectedSubject(subject);
        setLoadingAnalytics(true);
        try {
            // Fetch all assessments for this subject and class to show aggregate stats
            const data = await getFacultyAssessments(subject.id, targetClass?.id);
            const assessments = data.assessments || [];
            
            // Calculate some mock/simple analytics for the dashboard
            // In a real app, the backend should provide this aggregate
            const analytics = {
                totalAssessments: assessments.length,
                components: {
                    IA: assessments.filter(a => a.component === 'IA').length,
                    CSE: assessments.filter(a => a.component === 'CSE').length,
                    ESE: assessments.filter(a => a.component === 'ESE').length,
                    TW: assessments.filter(a => a.component === 'TW').length,
                },
                avgCompletion: assessments.length > 0 ? 85 : 0, // Placeholder
                topPerformers: 5, // Placeholder
                needsAttention: 3, // Placeholder
            };
            setSubjectAnalytics(analytics);
        } catch (error) {
            console.error("Error loading subject analytics", error);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View>
                    <AppText variant="h3">Class Insights</AppText>
                    {targetClass && <AppText variant="caption">{targetClass.name} Analysis</AppText>}
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <AppText style={{ marginTop: 12 }}>Analyzing class data...</AppText>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    
                    {/* Summary Header */}
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryItem}>
                            <AppText variant="h2" style={styles.summaryValue}>{subjects.length}</AppText>
                            <AppText variant="caption">Total Subjects</AppText>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryItem}>
                            <AppText variant="h2" style={[styles.summaryValue, { color: COLORS.success }]}>82%</AppText>
                            <AppText variant="caption">Avg. Marks</AppText>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryItem}>
                            <AppText variant="h2" style={[styles.summaryValue, { color: COLORS.warning }]}>12</AppText>
                            <AppText variant="caption">At Risk</AppText>
                        </View>
                    </View>

                    <AppText variant="h3" style={styles.sectionTitle}>Performance by Subject</AppText>
                    
                    <FlatList
                        data={subjects}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.subjectList}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[
                                    styles.subjectChip, 
                                    selectedSubject?.id === item.id && styles.subjectChipActive
                                ]}
                                onPress={() => handleSubjectSelect(item)}
                            >
                                <AppText style={[
                                    styles.subjectChipText,
                                    selectedSubject?.id === item.id && styles.subjectChipTextActive
                                ]}>
                                    {item.name}
                                </AppText>
                            </TouchableOpacity>
                        )}
                    />

                    {selectedSubject ? (
                        loadingAnalytics ? (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
                        ) : (
                            <View style={styles.analyticsPane}>
                                <View style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <AppText variant="h4">{selectedSubject.name} Stats</AppText>
                                        <Ionicons name="trending-up" size={20} color={COLORS.success} />
                                    </View>
                                    
                                    <View style={styles.insightGrid}>
                                        <View style={styles.insightItem}>
                                            <AppText variant="h3">{subjectAnalytics?.totalAssessments}</AppText>
                                            <AppText variant="small" color={COLORS.textSecondary}>Tests Conducted</AppText>
                                        </View>
                                        <View style={styles.insightItem}>
                                            <AppText variant="h3" color={COLORS.success}>{subjectAnalytics?.avgCompletion}%</AppText>
                                            <AppText variant="small" color={COLORS.textSecondary}>Class Avg</AppText>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.card}>
                                    <AppText variant="h4" style={{ marginBottom: 12 }}>Component Progress</AppText>
                                    {Object.entries(subjectAnalytics?.components || {}).map(([key, value]) => (
                                        <View key={key} style={styles.progressRow}>
                                            <AppText style={{ width: 40, fontWeight: 'bold' }}>{key}</AppText>
                                            <View style={styles.progressBarBg}>
                                                <View style={[styles.progressBarFill, { width: `${(value / 4) * 100}%` }]} />
                                            </View>
                                            <AppText variant="small" style={{ marginLeft: 8 }}>{value} Done</AppText>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity 
                                    style={styles.detailButton}
                                    onPress={() => router.push({
                                        pathname: '/assessments',
                                        params: { 
                                            classId: targetClass?.id, 
                                            className: targetClass?.name,
                                            subjectId: selectedSubject.id 
                                        }
                                    })}
                                >
                                    <AppText style={styles.detailButtonText}>View Detailed Student List</AppText>
                                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>
                        )
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="analytics-outline" size={60} color={COLORS.border} />
                            <AppText style={{ color: COLORS.textLight, marginTop: 12 }}>Select a subject to see class insights</AppText>
                        </View>
                    )}

                </ScrollView>
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    backButton: { marginRight: 12 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    content: { padding: SPACING.m },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        alignItems: 'center'
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontWeight: 'bold', color: COLORS.primary },
    divider: { width: 1, height: 40, backgroundColor: COLORS.border },
    sectionTitle: { marginBottom: 16, color: COLORS.textPrimary },
    subjectList: { marginBottom: 24, paddingBottom: 8 },
    subjectChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        marginRight: 10,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    subjectChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary
    },
    subjectChipText: { color: COLORS.textSecondary, fontWeight: '500' },
    subjectChipTextActive: { color: COLORS.white, fontWeight: 'bold' },
    analyticsPane: { gap: 16 },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    insightGrid: { flexDirection: 'row', gap: 20 },
    insightItem: { flex: 1 },
    progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    progressBarBg: { flex: 1, height: 8, backgroundColor: COLORS.surface, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
    detailButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 8
    },
    detailButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
    placeholder: { alignItems: 'center', marginTop: 60, opacity: 0.5 }
});

export default ClassInsightsScreen;
