import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, SPACING, LAYOUT } from '../../constants/theme';
import { hp } from '../../utils/responsive';

const LectureFeedbackScreen = () => {
    const router = useRouter();
    const [q1Rating, setQ1Rating] = useState(0);
    const [q2Rating, setQ2Rating] = useState(0);
    const [notes, setNotes] = useState('');
    const [understood, setUnderstood] = useState(null); // null, 'yes', 'no'

    const renderStars = (rating, setRating) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton}>
                        <Ionicons 
                            name={star <= rating ? "star" : "star-outline"} 
                            size={32} 
                            color={star <= rating ? COLORS.secondary : COLORS.textLight} 
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            {/* Header / Nav */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h2" style={styles.screenTitle}>Lecture Feedback</AppText>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Lecture Details Card */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Ionicons name="book" size={20} color={COLORS.primary} style={styles.detailIcon}/>
                        <View>
                            <AppText variant="caption" style={styles.detailLabel}>Subject</AppText>
                            <AppText variant="body1" style={styles.detailValue}>Algorithms</AppText>
                        </View>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                        <Ionicons name="easel" size={20} color={COLORS.primary} style={styles.detailIcon}/>
                        <View>
                            <AppText variant="caption" style={styles.detailLabel}>Topic</AppText>
                            <AppText variant="body1" style={styles.detailValue}>Sorting</AppText>
                        </View>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                         <Ionicons name="person" size={20} color={COLORS.primary} style={styles.detailIcon}/>
                         <View>
                            <AppText variant="caption" style={styles.detailLabel}>Faculty</AppText>
                            <AppText variant="body1" style={styles.detailValue}>Prof. X</AppText>
                        </View>
                    </View>
                </View>

                {/* Survey Form */}
                <View style={styles.formContainer}>
                    
                    {/* Q1 */}
                    <View style={styles.questionCard}>
                        <AppText variant="h3" style={styles.questionText}>How clear was the explanation?</AppText>
                        {renderStars(q1Rating, setQ1Rating)}
                    </View>

                    {/* Q2 */}
                    <View style={styles.questionCard}>
                        <AppText variant="h3" style={styles.questionText}>Was the pace appropriate?</AppText>
                        {renderStars(q2Rating, setQ2Rating)}
                    </View>

                    {/* Q3 - Yes/No Toggle */}
                    <View style={styles.questionCard}>
                        <AppText variant="h3" style={styles.questionText}>Did you understand the examples?</AppText>
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity 
                                style={[styles.toggleButton, understood === 'yes' && styles.toggleActiveYes]}
                                onPress={() => setUnderstood('yes')}
                            >
                                <AppText style={[styles.toggleText, understood === 'yes' && styles.toggleTextActive]}>Yes</AppText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.toggleButton, understood === 'no' && styles.toggleActiveNo]}
                                onPress={() => setUnderstood('no')}
                            >
                                <AppText style={[styles.toggleText, understood === 'no' && styles.toggleTextActive]}>No</AppText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Additional Remarks */}
                    <View style={styles.questionCard}>
                        <AppText variant="body1" style={styles.inputLabel}>Additional Remarks</AppText>
                        <TextInput
                            style={styles.textInput}
                            multiline
                            numberOfLines={4}
                            placeholder="Any specific comments..."
                            textAlignVertical="top"
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>

                </View>

            </ScrollView>

            {/* Submit Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.submitButton} onPress={() => { console.log('Feedback submitted'); router.back(); }}>
                    <AppText style={styles.submitButtonText}>Submit Feedback</AppText>
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
    screenTitle: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.m,
        paddingBottom: hp(15),
    },
    detailsCard: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.l,
        padding: SPACING.m,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.l,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    detailRow: {
        alignItems: 'center',
        flex: 1,
    },
    detailIcon: {
        marginBottom: SPACING.xs,
        backgroundColor: COLORS.surface,
        padding: 8,
        borderRadius: LAYOUT.radius.round,
    },
    detailLabel: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        textAlign: 'center',
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    detailDivider: {
        width: 1,
        height: '80%',
        backgroundColor: COLORS.border,
        alignSelf: 'center',
    },
    formContainer: {
        gap: SPACING.m,
    },
    questionCard: {
        backgroundColor: COLORS.white,
        padding: SPACING.l,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    questionText: {
        marginBottom: SPACING.m,
        color: COLORS.textPrimary,
        fontSize: 16,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.m,
    },
    starButton: {
        padding: SPACING.xs,
    },
    toggleContainer: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    toggleActiveYes: {
        backgroundColor: '#DCFCE7', // Light green
        borderColor: COLORS.success,
    },
    toggleActiveNo: {
        backgroundColor: '#FEE2E2', // Light red
        borderColor: COLORS.error,
    },
    toggleText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    toggleTextActive: {
        color: COLORS.textPrimary,
        fontWeight: '700',
    },
    inputLabel: {
        marginBottom: SPACING.s,
        color: COLORS.textSecondary,
    },
    textInput: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.s,
        padding: SPACING.m,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        padding: SPACING.l,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        borderRadius: LAYOUT.radius.l,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 18,
    }
});

export default LectureFeedbackScreen;
