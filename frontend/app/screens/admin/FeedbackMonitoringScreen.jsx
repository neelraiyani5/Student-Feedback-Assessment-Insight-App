import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getAllFeedbackSessions } from '../../services/api';

const FeedbackMonitoringScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const data = await getAllFeedbackSessions();
            setSessions(data || []);
        } catch (error) {
            console.log("Error fetching sessions", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push(`/feedback/monitoring/${item.id}`)}
        >
            <View style={styles.cardHeader}>
                <View style={{flex: 1, paddingRight: 8}}>
                    <AppText style={styles.title} numberOfLines={2}>{item.title}</AppText>
                    <AppText variant="caption" style={styles.subtitle}>
                        {item.class?.name} • {item.subject?.name}
                    </AppText>
                </View>
                <View style={[styles.badge, { marginLeft: 'auto' }]}>
                    <AppText style={styles.badgeText}>{item._count?.responses || 0} Resp.</AppText>
                </View>
            </View>
            
            <View style={styles.footer}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
                    <AppText variant="caption" style={{color: COLORS.textSecondary, marginLeft: 4}}>
                         Created by {item.faculty?.name}
                    </AppText>
                </View>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                     <AppText variant="caption" style={{color: COLORS.textLight, marginRight: 8}}>
                         {new Date(item.createdAt).toLocaleDateString()}
                     </AppText>
                     <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
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
                <AppText variant="h3">Feedback Monitoring</AppText>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <AppText style={{marginTop: 12, color: COLORS.textSecondary}}>Loading sessions...</AppText>
                </View>
            ) : (
                <FlatList 
                    data={sessions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <AppText style={styles.emptyText}>No feedback sessions found.</AppText>
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4
    },
    subtitle: {
        color: COLORS.textSecondary
    },
    badge: {
        backgroundColor: COLORS.success + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.success
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 12
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50
    },
    emptyText: {
        color: COLORS.textSecondary
    }
});

export default FeedbackMonitoringScreen;
