import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';
import { getMyProfile, clearToken } from '../../services/api';

const ProfileScreen = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await getMyProfile();
            setUser(data.user);
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            Alert.alert("Error", "Could not load profile data");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Logout", 
                    style: "destructive",
                    onPress: async () => {
                        await clearToken();
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3">Profile</AppText>
                <View style={{ width: 24 }} /> 
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Profile Header */}
                <View style={styles.profileHeaderCard}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={50} color={COLORS.primary} />
                    </View>
                    <AppText variant="h2" style={styles.nameText}>{user?.name || 'User'}</AppText>
                    <AppText style={styles.roleText}>{user?.role || 'Role'}</AppText>
                </View>

                {/* Info Section */}
                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>Information</AppText>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="card-outline" size={20} color={COLORS.textSecondary} />
                        </View>
                        <View style={styles.infoContent}>
                            <AppText style={styles.infoLabel}>User ID</AppText>
                            <AppText style={styles.infoValue}>{user?.userId || '-'}</AppText>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                        </View>
                        <View style={styles.infoContent}>
                            <AppText style={styles.infoLabel}>Email</AppText>
                            <AppText style={styles.infoValue}>{user?.email || '-'}</AppText>
                        </View>
                    </View>
                </View>

                {/* Actions Section */}
                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>Account Settings</AppText>
                    
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => router.push('/change-password')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                            <Ionicons name="key-outline" size={20} color={COLORS.primary} />
                        </View>
                        <AppText style={styles.actionText}>Change Password</AppText>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={handleLogout}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                        </View>
                        <AppText style={[styles.actionText, { color: COLORS.error }]}>Logout</AppText>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
    },
    backButton: {
        padding: SPACING.xs,
    },
    content: {
        padding: SPACING.m,
        paddingBottom: SPACING.xxl,
    },
    profileHeaderCard: {
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.l,
        padding: SPACING.l,
        marginBottom: SPACING.l,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    nameText: {
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    roleText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '500',
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.m,
        paddingVertical: 4,
        borderRadius: LAYOUT.radius.round,
        overflow: 'hidden',
    },
    section: {
        marginBottom: SPACING.l,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.m,
        marginLeft: SPACING.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        marginBottom: SPACING.s,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        marginBottom: SPACING.s,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    actionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
});

export default ProfileScreen;
