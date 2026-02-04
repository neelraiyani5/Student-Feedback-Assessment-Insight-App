import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getStudentSessions } from '../../services/api';

const FeedbackListScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const data = await getStudentSessions();
            setSessions(data || []);
        } catch (error) {
            console.log("Error fetching feedback sessions", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchSessions();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push(`/student/feedback/${item.id}`)} // Navigate to Give Feedback
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, {backgroundColor: COLORS.primary + '15'}]}>
                    <Ionicons name="chatbubbles" size={24} color={COLORS.primary} />
                </View>
                <View style={{flex: 1, marginLeft: 12}}>
                    <AppText style={styles.title}>{item.title}</AppText>
                    <AppText variant="caption" style={styles.subtitle}>
                        {item.subject?.name} • {item.faculty?.name}
                    </AppText>
                </View>
            </View>
            
            <View style={styles.footer}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Ionicons name="time-outline" size={14} color={COLORS.error} />
                    <AppText variant="caption" style={{color: COLORS.error, marginLeft: 4}}>
                        Expires Tonight
                    </AppText>
                </View>
                <View style={styles.actionBtn}>
                    <AppText style={styles.actionText}>Give Feedback</AppText>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                     <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3">Pending Feedback</AppText>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
            ) : (
                <FlatList 
                    data={sessions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="checkmark-circle-outline" size={60} color={COLORS.success} />
                            <AppText style={styles.emptyText}>All caught up! No pending feedback.</AppText>
                        </View>
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
    listContent: {
        padding: SPACING.m
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    iconBox: {
        width: 40, 
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary
    },
    subtitle: {
        color: COLORS.textSecondary
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.surface,
        paddingTop: 12
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },
    actionText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
        marginRight: 4
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
        opacity: 0.7
    },
    emptyText: {
        marginTop: 16,
        color: COLORS.textSecondary,
        fontSize: 16
    }
});

export default FeedbackListScreen;
