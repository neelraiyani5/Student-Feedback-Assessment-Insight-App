import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { createTemplate, updateTemplate, getTemplateById } from '../../services/api';

const CreateTemplateScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([
        { question: '', options: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'] }
    ]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isEditing) {
            fetchTemplate();
        }
    }, [id]);

    const fetchTemplate = async () => {
        try {
            const data = await getTemplateById(id);
            setTitle(data.title);
            setDescription(data.description || '');
            if (data.questions && Array.isArray(data.questions)) {
                setQuestions(data.questions);
            }
        } catch (error) {
            console.log("Error fetching template", error);
            Alert.alert("Error", "Failed to load template");
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = () => {
        setQuestions([...questions, { 
            question: '', 
            options: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'] 
        }]);
    };

    const handleRemoveQuestion = (index) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const updateQuestionText = (text, index) => {
        const newQuestions = [...questions];
        newQuestions[index].question = text;
        setQuestions(newQuestions);
    };

    const updateOption = (text, qIndex, oIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = text;
        setQuestions(newQuestions);
    };

    const addOption = (qIndex) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options.length >= 6) {
             Alert.alert("Limit", "Max 6 options allowed per question.");
             return;
        }
        newQuestions[qIndex].options.push('');
        setQuestions(newQuestions);
    };

    const removeOption = (qIndex, oIndex) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options.length <= 2) {
            Alert.alert("Limit", "Min 2 options required.");
            return;
        }
        newQuestions[qIndex].options.splice(oIndex, 1);
        setQuestions(newQuestions);
    };

    const handleSubmit = async () => {
        if (!title.trim()) return Alert.alert("Required", "Please enter a template title.");
        if (questions.length === 0) return Alert.alert("Required", "Add at least one question.");
        
        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].question.trim()) return Alert.alert("Missing Data", `Question ${i + 1} is empty.`);
            for (let opt of questions[i].options) {
                if (!opt.trim()) return Alert.alert("Missing Data", `An option in Question ${i + 1} is empty.`);
            }
        }

        setSubmitting(true);
        try {
            const payload = { title, description, questions };
            
            if (isEditing) {
                await updateTemplate(id, payload);
                 Alert.alert("Success", "Template Updated!", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                await createTemplate(payload);
                Alert.alert("Success", "Feedback Template Created!", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to save template");
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

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                     <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3">{isEditing ? 'Edit Template' : 'Create Feedback Template'}</AppText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                <View style={styles.section}>
                    <AppText style={styles.label}>Template Title</AppText>
                    <TextInput 
                        style={styles.input}
                        placeholder="e.g. Mid-Semester Feedback"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <AppText style={styles.label}>Description (Optional)</AppText>
                    <TextInput 
                        style={[styles.input, {height: 80, textAlignVertical: 'top'}]}
                        placeholder="Enter description..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                </View>

                <AppText variant="h4" style={{marginBottom: 10, marginTop: 10}}>Questions</AppText>
                
                {questions.map((q, qIndex) => (
                    <View key={qIndex} style={styles.questionCard}>
                        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 8}}>
                            <AppText variant="caption" style={{color: COLORS.primary}}>Question {qIndex + 1}</AppText>
                            <TouchableOpacity onPress={() => handleRemoveQuestion(qIndex)}>
                                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                            </TouchableOpacity>
                        </View>
                        
                        <TextInput 
                            style={styles.questionInput}
                            placeholder="Enter your question here..."
                            value={q.question}
                            onChangeText={(t) => updateQuestionText(t, qIndex)}
                        />

                        <AppText variant="caption" style={{marginTop: 8, marginBottom: 4}}>Options (Radio Buttons)</AppText>
                        {q.options.map((opt, oIndex) => (
                            <View key={oIndex} style={styles.optionRow}>
                                <View style={styles.radioCircle} />
                                <TextInput 
                                    style={styles.optionInput}
                                    value={opt}
                                    onChangeText={(t) => updateOption(t, qIndex, oIndex)}
                                    placeholder={`Option ${oIndex + 1}`}
                                />
                                <TouchableOpacity onPress={() => removeOption(qIndex, oIndex)}>
                                    <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity onPress={() => addOption(qIndex)} style={styles.addOptionBtn}>
                            <Ionicons name="add" size={16} color={COLORS.primary} />
                            <AppText style={{color: COLORS.primary, fontSize: 12, marginLeft: 4}}>Add Option</AppText>
                        </TouchableOpacity>

                    </View>
                ))}

                <TouchableOpacity onPress={handleAddQuestion} style={styles.addQuestionBtn}>
                    <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                    <AppText style={styles.addQuestionText}>Add New Question</AppText>
                </TouchableOpacity>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.submitButton, submitting && {opacity: 0.7}]} 
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? <ActivityIndicator color={COLORS.white} /> : <AppText style={styles.submitText}>Save Template</AppText>}
                </TouchableOpacity>
            </View>

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
        paddingBottom: 100
    },
    section: {
        backgroundColor: COLORS.white,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        marginBottom: SPACING.m
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
        color: COLORS.textSecondary
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    questionCard: {
        backgroundColor: COLORS.white,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        marginBottom: SPACING.m,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary
    },
    questionInput: {
        fontSize: 16,
        fontWeight: '500',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 8,
        marginBottom: 8
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    radioCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.textLight,
        marginRight: 8
    },
    optionInput: {
        flex: 1,
        backgroundColor: COLORS.surface,
        padding: 8,
        borderRadius: 6,
        marginRight: 8,
        fontSize: 14,
        color: COLORS.textSecondary
    },
    addOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        alignSelf: 'flex-start'
    },
    addQuestionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.m,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: LAYOUT.radius.m,
        backgroundColor: COLORS.white
    },
    addQuestionText: {
        color: COLORS.primary,
        fontWeight: '600',
        marginLeft: 8
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.m,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.round,
        alignItems: 'center'
    },
    submitText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default CreateTemplateScreen;
