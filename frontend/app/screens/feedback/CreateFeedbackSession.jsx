import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';

// Mock Student Data for the visual pool
const STUDENT_POOL = [
  { id: '1', type: 'Fast Learner', color: COLORS.success },
  { id: '2', type: 'Fast Learner', color: COLORS.success },
  { id: '3', type: 'Fast Learner', color: COLORS.success },
  { id: '4', type: 'Medium Learner', color: COLORS.warning },
  { id: '5', type: 'Medium Learner', color: COLORS.warning },
  { id: '6', type: 'Slow Learner', color: COLORS.error },
];

const CreateFeedbackSession = () => {
    const router = useRouter();
    const [subject, setSubject] = useState('Data Structures');
    const [date, setDate] = useState('Today, Oct 15');
    const [topic, setTopic] = useState('Graph Traversal');

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h2" style={styles.headerTitle}>Create Feedback Session</AppText>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Form Section */}
                <View style={styles.card}>
                    <AppText variant="h3" style={styles.cardTitle}>Session Details</AppText>
                    
                    {/* Subject Input (Mock Dropdown) */}
                    <View style={styles.inputGroup}>
                        <AppText variant="caption" style={styles.label}>Subject</AppText>
                        <TouchableOpacity style={styles.dropdownInput}>
                            <AppText style={styles.inputText}>{subject}</AppText>
                            <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Date Input (Mock Dropdown) */}
                    <View style={styles.inputGroup}>
                        <AppText variant="caption" style={styles.label}>Date</AppText>
                        <TouchableOpacity style={styles.dropdownInput}>
                            <AppText style={styles.inputText}>{date}</AppText>
                            <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                     {/* Topic Input */}
                     <View style={styles.inputGroup}>
                        <AppText variant="caption" style={styles.label}>Topic</AppText>
                        <View style={styles.textInputContainer}>
                            <TextInput 
                                style={styles.textInput}
                                value={topic}
                                onChangeText={setTopic}
                            />
                        </View>
                    </View>
                </View>

                {/* Randomized Pool Section */}
                <View style={[styles.card, styles.poolCard]}>
                    <View style={styles.poolHeader}>
                        <AppText variant="h3">Randomized Student Pool</AppText>
                        <Ionicons name="shuffle" size={24} color={COLORS.primary} />
                    </View>
                    <AppText variant="body2" color={COLORS.textSecondary} style={styles.poolSubtitle}>
                        AI has selected a diverse group for unbiased feedback.
                    </AppText>

                    <View style={styles.poolGrid}>
                        {STUDENT_POOL.map((student, index) => (
                            <View key={student.id} style={styles.studentItem}>
                                <View style={[styles.avatarContainer, { backgroundColor: student.color + '20' }]}>
                                    <Ionicons name="person" size={24} color={student.color} />
                                </View>
                                <View style={[styles.badge, { backgroundColor: student.color }]}>
                                    <AppText variant="small" style={styles.badgeText}>
                                        {student.type.split(' ')[0]} {/* "Fast", "Medium", "Slow" */}
                                    </AppText>
                                </View>
                            </View>
                        ))}
                    </View>
                    
                    <TouchableOpacity style={styles.regenerateLink}>
                        <Ionicons name="refresh" size={16} color={COLORS.primary} />
                        <AppText variant="caption" color={COLORS.primary} style={styles.regenerateText}>Regenerate Pool</AppText>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.generateButton} onPress={() => console.log('Generate')}>
                    <AppText style={styles.generateButtonText}>Generate Feedback Request</AppText>
                </TouchableOpacity>
            </View>

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.m,
        paddingBottom: SPACING.l,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        marginRight: SPACING.m,
    },
    headerTitle: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.m,
        paddingBottom: hp(12),
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.l,
        marginBottom: SPACING.l,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        marginBottom: SPACING.l,
        color: COLORS.textPrimary,
    },
    inputGroup: {
        marginBottom: SPACING.m,
    },
    label: {
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
        fontWeight: '500',
    },
    dropdownInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: LAYOUT.radius.s,
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
    },
    textInputContainer: {
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: LAYOUT.radius.s,
        padding: SPACING.m,
        backgroundColor: COLORS.white,
    },
    inputText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    textInput: {
        fontSize: 16,
        color: COLORS.textPrimary,
        padding: 0,
    },
    poolCard: {
        alignItems: 'center',
    },
    poolHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    poolSubtitle: {
        textAlign: 'center',
        marginBottom: SPACING.l,
    },
    poolGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: SPACING.l,
        marginBottom: SPACING.l,
    },
    studentItem: {
        alignItems: 'center',
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: -10, // Overlap effect
        zIndex: 1,
    },
    badge: {
        paddingHorizontal: SPACING.s,
        paddingVertical: 2,
        borderRadius: 10,
        zIndex: 2,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    regenerateLink: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.s,
    },
    regenerateText: {
        marginLeft: 4,
        fontWeight: '600',
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
    },
    generateButton: {
        backgroundColor: COLORS.primary,
        borderRadius: LAYOUT.radius.round,
        paddingVertical: SPACING.m,
        alignItems: 'center',
    },
    generateButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
    }

});

export default CreateFeedbackSession;
