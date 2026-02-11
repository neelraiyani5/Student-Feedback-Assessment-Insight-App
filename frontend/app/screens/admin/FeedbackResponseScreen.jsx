import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getSessionResponses, getMyProfile } from '../../services/api';

const FeedbackResponseScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // Session ID
    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState([]);
    const [stats, setStats] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [showIndividual, setShowIndividual] = useState(false);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchData();
    }, [id]);

    // Role fetching logic moved to fetchData for performance

    // We now receive stats pre-calculated from backend

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getSessionResponses(id);
            setResponses(data.responses || []);
            setStats(data.stats || []);
            setTotal(data.total || 0);
            setUserRole(data.requesterRole);
        } catch (error) {
            console.log("Error fetching responses", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <View style={styles.avatar}>
                        <AppText style={{color: COLORS.white, fontWeight:'bold'}}>
                             {item.student?.name?.charAt(0) || 'S'}
                        </AppText>
                    </View>
                    <View style={{marginLeft: 10}}>
                        <AppText style={styles.studentName}>{item.student?.name || 'Unknown Student'}</AppText>
                        <AppText variant="caption" style={{color: COLORS.textLight}}>{item.student?.userId}</AppText>
                    </View>
                </View>
                <AppText variant="caption" style={{color: COLORS.textLight}}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </AppText>
            </View>

            <View style={styles.answersContainer}>
                {item.answers && Array.isArray(item.answers) ? item.answers.map((ans, index) => (
                    <View key={index} style={styles.answerRow}>
                        <AppText style={styles.questionText}>Q: {ans.question}</AppText>
                        <AppText style={styles.answerText}>A: <AppText style={{fontWeight:'600', color: COLORS.primary}}>{ans.answer}</AppText></AppText>
                    </View>
                )) : (
                     <AppText style={{fontStyle:'italic', color: COLORS.textLight}}>Invalid Answer Format</AppText>
                )}
            </View>
        </View>
    );

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                     <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3">Feedback Responses</AppText>
            </View>

            <View style={styles.summaryBar}>
                <AppText style={{fontWeight:'600', color: COLORS.textSecondary}}>Total Responses: {total}</AppText>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList 
                    data={userRole === 'HOD' && showIndividual ? responses : []}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        stats.length > 0 && (
                            <View style={styles.statsContainer}>
                                <AppText variant="h3" style={styles.statsHeader}>Summary Analysis</AppText>
                                {stats.map((s, idx) => (
                                    <View key={idx} style={styles.statCard}>
                                        <AppText style={styles.statQuestion}>{s.question}</AppText>
                                        {Object.entries(s.options).map(([opt, count], iidx) => {
                                            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                                            return (
                                                <View key={iidx} style={styles.barRow}>
                                                    <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 4}}>
                                                        <AppText variant="caption" style={{fontWeight:'600'}}>{opt}</AppText>
                                                        <AppText variant="caption">{count} ({percent}%)</AppText>
                                                    </View>
                                                    <View style={styles.progressBarBg}>
                                                        <View style={[styles.progressBarFill, {width: `${percent}%`}]} />
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))}
                                <View style={styles.divider} />
                                {userRole === 'HOD' && !showIndividual && (
                                    <TouchableOpacity 
                                        style={styles.showButton} 
                                        onPress={() => setShowIndividual(true)}
                                    >
                                        <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
                                        <AppText style={styles.showButtonText}>View Individual Responses</AppText>
                                    </TouchableOpacity>
                                )}
                                {(userRole === 'HOD' && showIndividual) && (
                                    <AppText variant="h3" style={styles.statsHeader}>Individual Responses</AppText>
                                )}
                            </View>
                        )
                    }
                    ListEmptyComponent={
                        total === 0 ? (
                            <View style={styles.emptyContainer}>
                                <AppText style={styles.emptyText}>No responses yet.</AppText>
                            </View>
                        ) : null
                    }
                />
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
        borderBottomWidth:1,
        borderBottomColor: COLORS.border
    },
    backButton: {marginRight: 10},
    summaryBar: {
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    listContent: {
        padding: SPACING.m
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surface
    },
    avatar: {
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        backgroundColor: COLORS.primary, 
        justifyContent: 'center', 
        alignItems: 'center'
    },
    studentName: {
        fontWeight: '600',
        color: COLORS.textPrimary
    },
    answersContainer: {
        gap: 12
    },
    answerRow: {
        backgroundColor: COLORS.surface,
        padding: 10,
        borderRadius: 8
    },
    questionText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4
    },
    answerText: {
        fontSize: 14,
        color: COLORS.textPrimary
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50
    },
    emptyText: {
        color: COLORS.textSecondary
    },
    statsContainer: {
        marginBottom: 20
    },
    statsHeader: {
        marginBottom: 12,
        color: COLORS.textPrimary
    },
    statCard: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border + '50'
    },
    statQuestion: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12,
        color: COLORS.textPrimary
    },
    barRow: {
        marginBottom: 10
    },
    progressBarBg: {
        height: 6,
        backgroundColor: COLORS.surface,
        borderRadius: 3,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 20
    },
    showButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
        marginBottom: 20
    },
    showButtonText: {
        marginLeft: 8,
        color: COLORS.primary,
        fontWeight: '600'
    }
});

export default FeedbackResponseScreen;
