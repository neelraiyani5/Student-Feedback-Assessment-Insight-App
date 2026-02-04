import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';
import { getStudentSubjects, getStudentSessions } from '../../services/api';

const StudentDashboard = () => {
    const router = useRouter();
    const { name } = useLocalSearchParams();
    const [subjects, setSubjects] = useState([]);
    const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subjectsData, sessionsData] = await Promise.all([
                getStudentSubjects(),
                getStudentSessions()
            ]);
            setSubjects(subjectsData.subjects || []);
            setPendingFeedbackCount(sessionsData ? sessionsData.length : 0);
        } catch (error) {
            console.log("Error fetching dashboard data", error);
        }
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <AppText variant="h2" style={styles.greeting}>Welcome,</AppText>
                        <AppText variant="h2" style={styles.userName}>{name || 'Student'}</AppText>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <Image 
                            source="https://randomuser.me/api/portraits/men/32.jpg" // Placeholder
                            style={styles.profileImage}
                            contentFit="cover"
                        />
                    </TouchableOpacity>
                </View>

                {/* Hero Notification Card */}
                {pendingFeedbackCount > 0 && (
                    <View style={styles.heroCard}>
                        <View style={styles.heroContent}>
                            <Ionicons name="alert-circle" size={32} color={COLORS.accent} style={styles.heroIcon} />
                            <View style={styles.heroTextContainer}>
                                <AppText variant="h3" style={styles.heroTitle}>Feedback Required</AppText>
                                <AppText style={styles.heroSubtitle}>You have {pendingFeedbackCount} pending feedback sessions.</AppText>
                            </View>
                        </View>
                    </View>
                )}

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: '#E0F2FE' }]}> 
                        <View style={styles.statIconBg}>
                            <Ionicons name="calendar" size={20} color="#0284C7" />
                        </View>
                        <AppText variant="caption" style={{ color: '#0284C7' }}>Attendance</AppText>
                        <AppText variant="h2" style={{ color: '#0C4A6E', marginTop: SPACING.xs }}>85%</AppText>
                    </View>

                    <TouchableOpacity  
                        style={[styles.statCard, { backgroundColor: '#DBEAFE' }]} 
                        onPress={() => {}}
                    >
                        <View style={[styles.statIconBg, { backgroundColor: 'rgba(37, 99, 235, 0.2)' }]}>
                            <Ionicons name="trophy" size={20} color="#2563EB" />
                        </View>
                        <AppText variant="caption" style={{ color: '#2563EB' }}>Overall Rank</AppText>
                        <AppText variant="h2" style={{ color: '#1E3A8A', marginTop: SPACING.xs }}>-</AppText>
                    </TouchableOpacity >
                </View>

                {/* Feedback Action */}
                <TouchableOpacity 
                    style={{
                        backgroundColor: COLORS.primary,
                        marginHorizontal: SPACING.l,
                        borderRadius: LAYOUT.radius.l,
                        padding: SPACING.l,
                        marginBottom: SPACING.xl,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        elevation: 4,
                        shadowColor: COLORS.primary,
                        shadowOffset: {width:0, height:4},
                        shadowOpacity:0.3,
                        shadowRadius:8
                    }}
                    onPress={() => router.push('/student/feedback/list')}
                >
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <View style={{padding:8, backgroundColor:'rgba(255,255,255,0.2)', borderRadius:8, marginRight:12}}>
                             <Ionicons name="chatbubbles" size={24} color={COLORS.white} />
                        </View>
                        <View>
                            <AppText variant="h3" style={{color: COLORS.white}}>Give Feedback</AppText>
                            <AppText style={{color: 'rgba(255,255,255,0.8)'}}>
                                {pendingFeedbackCount > 0 ? `${pendingFeedbackCount} Sessions Pending` : 'No pending feedback'}
                            </AppText>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
                </TouchableOpacity>

                {/* My Subjects List */}
                <View style={styles.section}>
                    <AppText variant="h3" style={styles.sectionTitle}>My Subjects</AppText>
                    
                    {subjects.length > 0 ? subjects.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.classCard}
                            onPress={() => router.push(`/student/subject/${item.id}`)}
                        >
                             <View style={{padding:12, backgroundColor: COLORS.primary + '15', borderRadius:10, marginRight:16}}>
                                 <Ionicons name="book" size={24} color={COLORS.primary} />
                             </View>
                            <View style={styles.classDetails}>
                                <AppText style={styles.className}>{item.name}</AppText>
                                <AppText variant="caption" style={{color: COLORS.textSecondary}}>View Performance & Insights</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                        </TouchableOpacity>
                    )) : (
                        <View style={{paddingVertical: 20, alignItems: 'center'}}>
                            <AppText style={{color: COLORS.textSecondary}}>No subjects assigned yet.</AppText>
                        </View>
                    )}
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
        shadowColor: COLORS.accent, 
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
        height: 120
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
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {width:0, height:2},
        shadowOpacity:0.05,
        shadowRadius:4,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    classDetails: {
        flex: 1,
    },
    className: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    }
});

export default StudentDashboard;
