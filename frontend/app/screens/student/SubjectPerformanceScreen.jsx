import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp } from '../../utils/responsive';
import { getStudentSubjectPerformance, getStudentSubjects } from '../../services/api';

const SubjectPerformanceScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // Subject ID
    const [loading, setLoading] = useState(true);
    const [performance, setPerformance] = useState(null);
    const [subjectName, setSubjectName] = useState('Subject Analysis');

    useEffect(() => {
        // Fetch subject name separately or pass it. 
        // For now, we assume we might need to fetch subjects again to get name or just use generic title.
        // Or performance API return subject name? It currently doesn't.
        // Let's fetch list and find name for better UX.
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Parallel fetch
            const [perfData, subData] = await Promise.all([
                getStudentSubjectPerformance(id),
                getStudentSubjects()
            ]);
            
            setPerformance(perfData);
            
            const sub = subData.subjects?.find(s => s.id === id);
            if(sub) setSubjectName(sub.name);

        } catch (error) {
            console.log("Error loading performance", error);
        } finally {
            setLoading(false);
        }
    };

    const renderProgressBar = (value, total, color) => {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return (
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: color }]} />
            </View>
        );
    }

    if (loading) {
        return (
            <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
            </ScreenWrapper>
        );
    }

    /* Logic for Comparison */
    // performance: { rank, totalStudents, totalObtained, classAverage, components: { IA: {scored, total}, ... } }
    
    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3" style={{flex:1}} numberOfLines={1}>{subjectName}</AppText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Rank Badge */}
                <View style={styles.rankCard}>
                    <View>
                        <AppText variant="caption" style={{color: COLORS.white}}>Current Rank</AppText>
                        <View style={{flexDirection:'row', alignItems:'baseline'}}>
                            <AppText style={styles.rankText}>#{performance?.rank}</AppText>
                            <AppText style={{color:'rgba(255,255,255,0.8)', marginLeft:5}}>
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
                         <View style={{width: 1, height: 30, backgroundColor: COLORS.border}} />
                         <View style={styles.compItem}>
                             <AppText style={[styles.compValue, {color: COLORS.textSecondary}]}>{Math.round(performance?.classAverage)}</AppText>
                             <AppText variant="caption">Class Avg</AppText>
                         </View>
                    </View>

                    <View style={{marginTop: 16}}>
                        <AppText variant="caption" style={{marginBottom: 8}}>Performance Meter</AppText>
                        {/* Mock Visual representation */}
                        <View style={styles.meterContainer}>
                            <View style={[styles.meterBar, { 
                                width: `${(performance?.totalObtained / (performance?.components?.IA?.total * 3 || 100)) * 100}%` 
                                // Ideally total marks should be summed from assessment max. 
                                // But bar logic is purely visual for now.
                            }]} />
                        </View>
                        <AppText variant="small" style={{textAlign:'right', marginTop:4, color: COLORS.textSecondary}}>
                            {performance?.totalObtained > performance?.classAverage ? "Above Average" : "Needs Improvement"}
                        </AppText>
                    </View>
                </View>

                {/* Component Breakdown */}
                <View style={styles.sectionTitleRow}>
                    <AppText variant="h3">Component Breakdown</AppText>
                </View>

                <View style={styles.grid}>
                    {/* IA */}
                    <View style={styles.componentCard}>
                        <View style={[styles.iconBg, {backgroundColor: '#DBEAFE'}]}>
                            <AppText style={{fontWeight:'bold', color: '#1E40AF'}}>IA</AppText>
                        </View>
                        <AppText style={styles.compTitle}>Internal</AppText>
                        <AppText style={styles.scoreText}>
                            {performance?.components?.IA?.scored} <AppText variant="small" style={{color:COLORS.textSecondary}}>/ {performance?.components?.IA?.total}</AppText>
                        </AppText>
                    </View>

                    {/* CSE */}
                     <View style={styles.componentCard}>
                        <View style={[styles.iconBg, {backgroundColor: '#DCFCE7'}]}>
                            <AppText style={{fontWeight:'bold', color: '#166534'}}>CSE</AppText>
                        </View>
                        <AppText style={styles.compTitle}>CSE</AppText>
                        <AppText style={styles.scoreText}>
                            {performance?.components?.CSE?.scored} <AppText variant="small" style={{color:COLORS.textSecondary}}>/ {performance?.components?.CSE?.total}</AppText>
                        </AppText>
                    </View>

                    {/* ESE */}
                     <View style={styles.componentCard}>
                        <View style={[styles.iconBg, {backgroundColor: '#F3E8FF'}]}>
                            <AppText style={{fontWeight:'bold', color: '#6B21A8'}}>ESE</AppText>
                        </View>
                        <AppText style={styles.compTitle}>End Sem</AppText>
                        <AppText style={styles.scoreText}>
                            {performance?.components?.ESE?.scored} <AppText variant="small" style={{color:COLORS.textSecondary}}>/ {performance?.components?.ESE?.total}</AppText>
                        </AppText>
                    </View>
                </View>
                
                {/* Detailed Analysis (Coming Soon placeholder) */}
                <View style={[styles.card, {marginTop: SPACING.l, alignItems:'center', paddingVertical: 30}]}>
                    <Ionicons name="analytics" size={40} color={COLORS.textLight} />
                    <AppText style={{marginTop: 10, color: COLORS.textSecondary}}>Detailed question-wise analysis coming soon.</AppText>
                </View>

            </ScrollView>
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
        borderBottomWidth:1,
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
        shadowOffset: {width:0,height:2},
        shadowOpacity:0.05
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
        borderWidth:1,
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
    }
});

export default SubjectPerformanceScreen;
