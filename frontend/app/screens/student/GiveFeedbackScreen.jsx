import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getFeedbackSessionById, submitFeedback } from '../../services/api';

const GiveFeedbackScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Answers: { questionIndex: optionText }
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        fetchSessionDetails();
    }, [id]);

    const fetchSessionDetails = async () => {
        setLoading(true);
        try {
            const found = await getFeedbackSessionById(id);
            if (found) {
                setSession(found);
            } else {
                Alert.alert("Error", "Session not found or expired.", [
                    { text: "Go Back", onPress: () => router.back() }
                ]);
            }
        } catch (error) {
           console.log("Error loading session", error);
           Alert.alert("Error", "Failed to load session functionality.");
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (qIndex, option) => {
        setAnswers(prev => ({
            ...prev,
            [qIndex]: option
        }));
    };

    const handleSubmit = async () => {
        if (!session) return;
        
        // Validation: All questions answered?
        const templateCount = session.template.questions.length;
        const topicCount = session.topics?.length || 0;
        const totalExpected = templateCount + topicCount;

        if (Object.keys(answers).length < totalExpected) {
             Alert.alert("Incomplete", "Please answer all questions, including syllabus coverage, before submitting.");
             return;
        }

        setSubmitting(true);
        try {
            // Standard questions
            const formattedAnswers = session.template.questions.map((q, i) => ({
                question: q.question,
                answer: answers[i]
            }));

            // Topic questions
            if (session.topics) {
                session.topics.forEach(topic => {
                    formattedAnswers.push({
                        question: `Is topic covered: ${topic.name}`,
                        answer: answers[`topic_${topic.id}`]
                    });
                });
            }

            await submitFeedback({
                sessionId: session.id,
                answers: formattedAnswers
            });

            Alert.alert("Thank You!", "Your feedback has been submitted.", [
                { text: "Home", onPress: () => router.push('/student-dashboard') }
            ]);

        } catch (error) {
             Alert.alert("Error", error.message || "Submission failed");
        } finally {
             setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
                 <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
            </ScreenWrapper>
        );
    }

    if (!session) return null;

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                     <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3" numberOfLines={1} style={{flex:1}}>{session.title}</AppText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoCard}>
                     <AppText style={styles.infoTitle}>{session.template.title}</AppText>
                     <AppText style={styles.infoDesc}>{session.template.description}</AppText>
                     <View style={styles.infoRow}>
                         <View style={styles.badge}><AppText style={styles.badgeText}>{session.subject.name}</AppText></View>
                         <AppText style={{color: COLORS.textSecondary}}>•</AppText>
                         <AppText style={{color: COLORS.textSecondary}}>Prof. {session.faculty.name}</AppText>
                     </View>
                </View>

                {session.template.questions.map((q, index) => (
                    <View key={index} style={styles.questionCard}>
                        <AppText style={styles.questionText}>{index + 1}. {q.question}</AppText>
                        
                        <View style={styles.optionsContainer}>
                            {q.options.map((opt, optIndex) => {
                                const isSelected = answers[index] === opt;
                                return (
                                    <TouchableOpacity 
                                        key={optIndex} 
                                        style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                                        onPress={() => handleOptionSelect(index, opt)}
                                    >
                                        <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                        <AppText style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                            {opt}
                                        </AppText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {/* Topic Coverage Questions */}
                {session.topics && session.topics.length > 0 && (
                    <>
                        <View style={styles.sectionDivider}>
                            <AppText variant="h3" color={COLORS.primary}>Syllabus Coverage</AppText>
                            <AppText variant="small" color={COLORS.textSecondary}>Was this topic covered in the lecture?</AppText>
                        </View>

                        {session.topics.map((topic, index) => {
                            const qKey = `topic_${topic.id}`;
                            const isSelected = (val) => answers[qKey] === val;
                            return (
                                <View key={topic.id} style={styles.questionCard}>
                                    <AppText style={styles.questionText}>Is the topic "{topic.name}" actually covered?</AppText>
                                    
                                    <View style={styles.boolContainer}>
                                        <TouchableOpacity 
                                            style={[styles.boolBtn, isSelected('Yes') && styles.boolBtnYes]}
                                            onPress={() => handleOptionSelect(qKey, 'Yes')}
                                        >
                                            <Ionicons name="checkmark-circle" size={20} color={isSelected('Yes') ? COLORS.white : '#4ADE80'} />
                                            <AppText style={[styles.boolBtnText, isSelected('Yes') && {color: COLORS.white}]}>Yes</AppText>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={[styles.boolBtn, isSelected('No') && styles.boolBtnNo]}
                                            onPress={() => handleOptionSelect(qKey, 'No')}
                                        >
                                            <Ionicons name="close-circle" size={20} color={isSelected('No') ? COLORS.white : '#F87171'} />
                                            <AppText style={[styles.boolBtnText, isSelected('No') && {color: COLORS.white}]}>No</AppText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}

                <TouchableOpacity 
                    style={[styles.submitButton, submitting && {opacity: 0.7}]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                     {submitting ? <ActivityIndicator color={COLORS.white} /> : <AppText style={styles.submitText}>Submit Feedback</AppText>}
                </TouchableOpacity>

            </ScrollView>
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
    content: {
        padding: SPACING.m,
        paddingBottom: 40
    },
    infoCard: {
        backgroundColor: COLORS.white,
        padding: SPACING.m,
        borderRadius: 12,
        marginBottom: SPACING.l,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.secondary
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4
    },
    infoDesc: {
        color: COLORS.textSecondary,
        marginBottom: 12
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    badge: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600'
    },
    questionCard: {
        backgroundColor: COLORS.white,
        padding: SPACING.m,
        borderRadius: 12,
        marginBottom: SPACING.m,
        elevation: 1
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12
    },
    optionsContainer: {
        gap: 8
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface
    },
    optionBtnSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10'
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.textLight,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    radioSelected: {
        borderColor: COLORS.primary
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary
    },
    optionText: {
        fontSize: 14,
        color: COLORS.textPrimary
    },
    optionTextSelected: {
        color: COLORS.primary,
        fontWeight: '600'
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: LAYOUT.radius.round,
        alignItems: 'center',
        marginTop: 16
    },
    submitText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16
    },
    sectionDivider: {
        marginTop: SPACING.l,
        marginBottom: SPACING.m,
        paddingHorizontal: SPACING.xs
    },
    boolContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4
    },
    boolBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        gap: 8
    },
    boolBtnYes: {
        backgroundColor: '#4ADE80',
        borderColor: '#4ADE80'
    },
    boolBtnNo: {
        backgroundColor: '#F87171',
        borderColor: '#F87171'
    },
    boolBtnText: {
        fontWeight: '600',
        fontSize: 15,
        color: COLORS.textPrimary
    }
});

export default GiveFeedbackScreen;
