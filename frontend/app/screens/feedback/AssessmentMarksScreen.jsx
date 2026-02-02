import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getAssessmentMarks, updateAssessmentMarks } from '../../services/api';

const AssessmentMarksScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assessment, setAssessment] = useState(null);
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({}); // { studentId: string_value }

    useEffect(() => {
        if(id) fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const data = await getAssessmentMarks(id);
            setAssessment(data.assessment);
            const studentList = data.assessment.class?.students || [];
            
            // Map existing marks
            const initialMarks = {};
            if (data.assessment.marks) {
                data.assessment.marks.forEach(m => {
                    initialMarks[m.studentId] = String(m.marksObtained);
                });
            }
            // Initialize for all students (default empty)
            studentList.forEach(s => {
                if (!initialMarks[s.id]) initialMarks[s.id] = '';
            });

            setStudents(studentList);
            setMarks(initialMarks);
        } catch (error) {
            console.log("Error fetching details", error);
            Alert.alert("Error", "Failed to load assessment details");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId, value) => {
        // Validate numeric
        // Allow empty string to clear
        if (value === '' || /^\d+$/.test(value)) {
             // Check max marks
             if (value !== '' && parseInt(value) > (assessment?.maxMarks || 100)) {
                 // Maybe show warning toast? For now just restrict or allow.
                 // Let's allow but color it red? better restrict.
                 // Alert.alert("Limit", `Max marks is ${assessment?.maxMarks}`);
                 // Don't block typing, just validate on save? 
             }
             setMarks(prev => ({ ...prev, [studentId]: value }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Prepare payload
            const marksData = Object.keys(marks)
                .filter(sid => marks[sid] !== '') // Send only entered marks
                .map(sid => ({
                    studentId: sid,
                    marksObtained: marks[sid]
                }));

            // Validate max marks
            const max = assessment?.maxMarks || 100;
            const invalid = marksData.find(m => parseInt(m.marksObtained) > max);
            if (invalid) {
                Alert.alert("Validation", `Some marks exceed the maximum of ${max}. Please correct them.`);
                setSaving(false);
                return;
            }

            await updateAssessmentMarks(id, marksData);
            Alert.alert("Success", "Marks saved successfully");
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to save marks");
        } finally {
            setSaving(false);
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
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={{flex:1}}>
                     <AppText variant="h3" numberOfLines={1}>{assessment?.title}</AppText>
                     <AppText variant="caption">{assessment?.subject?.name} • Max: {assessment?.maxMarks}</AppText>
                </View>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveHeaderBtn}>
                    {saving ? <ActivityIndicator color={COLORS.primary} size="small" /> : <AppText style={{color: COLORS.primary, fontWeight:'bold'}}>Save</AppText>}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
                <FlatList 
                    data={students}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                         <View style={styles.studentRow}>
                             <View style={styles.studentInfo}>
                                 <View style={styles.avatar}>
                                     <Ionicons name="person" size={16} color={COLORS.white} />
                                 </View>
                                 <View>
                                    <AppText style={styles.studentName}>{item.name}</AppText>
                                    <AppText variant="caption" style={{color: COLORS.textSecondary}}>{item.userId}</AppText>
                                 </View>
                             </View>
                             <TextInput 
                                style={styles.markInput}
                                keyboardType="numeric"
                                placeholder="-"
                                value={marks[item.id]}
                                onChangeText={(text) => handleMarkChange(item.id, text)}
                                maxLength={3}
                             />
                         </View>
                    )}
                />
            </KeyboardAvoidingView>

             {/* Floating Save Button */}
             <View style={styles.footer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color={COLORS.white} /> : <AppText style={styles.saveButtonText}>Save All Marks</AppText>}
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
        gap: SPACING.m,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    saveHeaderBtn: {
        padding: 8
    },
    listContent: {
        padding: SPACING.m,
        paddingBottom: 100 // Space for footer
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    studentName: {
        fontWeight: '600',
        color: COLORS.textPrimary
    },
    markInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 6,
        width: 60,
        padding: 8,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        backgroundColor: COLORS.surface
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
    saveButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    saveButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default AssessmentMarksScreen;
