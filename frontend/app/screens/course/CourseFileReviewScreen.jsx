import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, SPACING, LAYOUT } from '../../constants/theme';
import { hp } from '../../utils/responsive';

// Mock Data for the review
const ITEM_DATA = [
    { id: '1', title: '1. Vision & Mission Alignment', facultyStatus: 'Completed', timestamp: 'Oct 15, 10:00 AM' },
    { id: '2', title: '2. CO-PO-PSO Mapping', facultyStatus: 'Completed', timestamp: 'Oct 16, 2:30 PM' },
    { id: '3', title: '3. Lesson Plan', facultyStatus: 'Pending', timestamp: null }, // Example of non-completed
    { id: '4', title: '4. Question Bank', facultyStatus: 'Completed', timestamp: 'Oct 18, 9:15 AM' },
];

const CourseFileReviewScreen = () => {
    const router = useRouter();
    
    // State to track review actions
    // Structure: { [id]: { status: 'approved' | 'rejected', remarks: '' } }
    const [reviews, setReviews] = useState({});

    const handleAction = (id, status) => {
        setReviews(prev => ({
            ...prev,
            [id]: { ...prev[id], status }
        }));
    };

    const handleRemarksChange = (id, text) => {
        setReviews(prev => ({
            ...prev,
            [id]: { ...prev[id], remarks: text }
        }));
    };

    const finalizeReview = () => {
        // Logic to submit review
        Alert.alert("Review Finalized", "The feedback has been sent to the faculty.", [
            { text: "OK", onPress: () => router.back() }
        ]);
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View>
                    <AppText variant="caption" style={styles.eyebrow}>Reviewing Course File</AppText>
                    <AppText variant="h3" style={styles.headerTitle}>Prof. Sharma - Data Structures</AppText>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {ITEM_DATA.map((item) => {
                    const review = reviews[item.id] || { status: null, remarks: '' };
                    const isApproved = review.status === 'approved';
                    const isRejected = review.status === 'rejected';

                    return (
                        <View key={item.id} style={styles.reviewCard}>
                            {/* Header: Title & Faculty Status */}
                            <View style={styles.cardHeader}>
                                <AppText style={styles.itemTitle}>{item.title}</AppText>
                                <View style={[
                                    styles.statusBadge, 
                                    item.facultyStatus === 'Completed' ? styles.statusSuccess : styles.statusPending
                                ]}>
                                    <AppText variant="small" style={[
                                        styles.statusText,
                                        item.facultyStatus === 'Completed' ? styles.textSuccess : styles.textPending
                                    ]}>
                                        {item.facultyStatus}
                                    </AppText>
                                </View>
                            </View>

                            {/* Timestamp (Read-only info) */}
                            {item.timestamp && (
                                <AppText variant="caption" style={styles.timestamp}>Uploaded: {item.timestamp}</AppText>
                            )}

                            {/* Review Controls (Only shown if faculty has completed) */}
                            {item.facultyStatus === 'Completed' ? (
                                <View style={styles.controlsContainer}>
                                    <View style={styles.actionButtonsRow}>
                                        <AppText variant="caption" style={styles.actionLabel}>Action:</AppText>
                                        
                                        {/* Approve Button */}
                                        <TouchableOpacity 
                                            style={[styles.actionBtn, isApproved && styles.btnApproveActive]}
                                            onPress={() => handleAction(item.id, 'approved')}
                                        >
                                            <Ionicons 
                                                name={isApproved ? "checkmark-circle" : "checkmark-circle-outline"} 
                                                size={20} 
                                                color={isApproved ? COLORS.white : COLORS.success} 
                                            />
                                            <AppText variant="small" style={[styles.btnText, isApproved ? {color: COLORS.white} : {color: COLORS.success}]}>Approve</AppText>
                                        </TouchableOpacity>

                                        {/* Reject Button */}
                                        <TouchableOpacity 
                                            style={[styles.actionBtn, isRejected && styles.btnRejectActive]}
                                            onPress={() => handleAction(item.id, 'rejected')}
                                        >
                                            <Ionicons 
                                                name={isRejected ? "close-circle" : "close-circle-outline"} 
                                                size={20} 
                                                color={isRejected ? COLORS.white : COLORS.error} 
                                            />
                                            <AppText variant="small" style={[styles.btnText, isRejected ? {color: COLORS.white} : {color: COLORS.error}]}>Reject</AppText>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Remarks Input */}
                                    <View style={styles.remarksContainer}>
                                        <TextInput 
                                            style={styles.remarksInput}
                                            placeholder="Reviewer Remarks (Optional)"
                                            placeholderTextColor={COLORS.textLight}
                                            value={review.remarks}
                                            onChangeText={(text) => handleRemarksChange(item.id, text)}
                                            multiline
                                        />
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.pendingMessage}>
                                    <AppText variant="caption" style={{color: COLORS.textLight}}>Waiting for faculty submission...</AppText>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            {/* Sticky Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.finalizeButton} onPress={finalizeReview}>
                    <AppText style={styles.finalizeButtonText}>Finalize Review</AppText>
                </TouchableOpacity>
            </View>

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
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        marginRight: SPACING.m,
    },
    eyebrow: {
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        fontSize: 10,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        color: COLORS.textPrimary,
    },
    scrollContent: {
        padding: SPACING.m,
        paddingBottom: hp(12),
    },
    reviewCard: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        flex: 1,
        marginRight: SPACING.s,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusSuccess: { backgroundColor: '#ECFDF5' }, // light green
    statusPending: { backgroundColor: '#F3F4F6' }, // light grey
    statusText: { fontWeight: '600', fontSize: 10 },
    textSuccess: { color: COLORS.success },
    textPending: { color: COLORS.textSecondary },
    timestamp: {
        color: COLORS.textLight,
        marginBottom: SPACING.m,
    },
    controlsContainer: {
        marginTop: SPACING.s,
        paddingTop: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.surface,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    actionLabel: {
        marginRight: SPACING.m,
        color: COLORS.textSecondary,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: 6,
        borderRadius: LAYOUT.radius.round,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.s,
        backgroundColor: COLORS.white,
    },
    btnApproveActive: {
        backgroundColor: COLORS.success,
        borderColor: COLORS.success,
    },
    btnRejectActive: {
        backgroundColor: COLORS.error,
        borderColor: COLORS.error,
    },
    btnText: {
        marginLeft: 4,
        fontWeight: '500',
    },
    remarksContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.s,
        paddingHorizontal: SPACING.s,
        paddingVertical: 2,
    },
    remarksInput: {
        fontSize: 14,
        color: COLORS.textPrimary,
        minHeight: 30, // small height as requested
        textAlignVertical: 'center',
    },
    pendingMessage: {
        marginTop: SPACING.s,
        fontStyle: 'italic',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        padding: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        elevation: 10,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    finalizeButton: {
        backgroundColor: COLORS.primary,
        borderRadius: LAYOUT.radius.round,
        paddingVertical: SPACING.m,
        alignItems: 'center',
    },
    finalizeButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    }
});

export default CourseFileReviewScreen;
