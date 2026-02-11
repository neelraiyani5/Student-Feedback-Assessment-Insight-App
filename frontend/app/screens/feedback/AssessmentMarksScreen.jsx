import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getAssessmentMarks, updateAssessmentMarks, bulkUploadMarks } from '../../services/api';
import * as DocumentPicker from 'expo-document-picker';

const AssessmentMarksScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assessment, setAssessment] = useState(null);
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({}); // { studentId: string_value }
    const [searchQuery, setSearchQuery] = useState('');
    
    // Bulk Import State
    const [bulkModalVisible, setBulkModalVisible] = useState(false);
    const [importing, setImporting] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);
    const [bulkResultModalVisible, setBulkResultModalVisible] = useState(false);
    const [columnConfig, setColumnConfig] = useState({
        studentIdColumn: 'ID',
        marksColumn: 'Marks'
    });

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

    const handleBulkUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'text/csv'
                ],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setImporting(true);
            
            const formData = new FormData();
            formData.append('assessmentId', id);
            formData.append('studentIdColumn', columnConfig.studentIdColumn);
            formData.append('marksColumn', columnConfig.marksColumn);

            if (Platform.OS === 'web') {
                formData.append('file', file.file);
            } else {
                formData.append('file', {
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
            }

            const response = await bulkUploadMarks(formData);
            setBulkResult(response);
            setBulkModalVisible(false);
            setBulkResultModalVisible(true);
            
            // Refresh marks after successful upload
            fetchDetails();
        } catch (error) {
            console.log('Bulk upload error details:', error);
            const errorMessage = typeof error === 'string' ? error : (error?.message || 'Failed to process bulk upload');
            Alert.alert('Upload Failed', errorMessage);
        } finally {
            setImporting(false);
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
                     <AppText variant="caption">{assessment?.subject?.name} • {assessment?.component} • Max: {assessment?.maxMarks}</AppText>
                </View>
                <TouchableOpacity onPress={() => setBulkModalVisible(true)} style={styles.bulkHeaderBtn}>
                    <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveHeaderBtn}>
                    {saving ? <ActivityIndicator color={COLORS.primary} size="small" /> : <AppText style={{color: COLORS.primary, fontWeight:'bold'}}>Save</AppText>}
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={COLORS.textLight} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search student by name or ID..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={COLORS.textLight}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
                <FlatList 
                    data={students.filter(s => 
                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        s.userId.toLowerCase().includes(searchQuery.toLowerCase())
                    )}
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

            <BulkUploadModal 
                visible={bulkModalVisible}
                onClose={() => setBulkModalVisible(false)}
                onUpload={handleBulkUpload}
                config={columnConfig}
                setConfig={setColumnConfig}
                importing={importing}
            />

            <BulkResultModal 
                visible={bulkResultModalVisible}
                result={bulkResult}
                onClose={() => setBulkResultModalVisible(false)}
            />

        </ScreenWrapper>
    );
};

const BulkUploadModal = ({ visible, onClose, onUpload, config, setConfig, importing }) => (
    <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <AppText variant="h3">Bulk Upload Marks</AppText>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                <AppText style={styles.modalSubtitle}>
                    Upload an Excel or CSV file. Please specify the column names exactly as they appear in your file header.
                </AppText>

                <View style={styles.inputGroup}>
                    <AppText style={styles.label}>Student ID Column Name</AppText>
                    <TextInput 
                        style={styles.input}
                        value={config.studentIdColumn}
                        onChangeText={(t) => setConfig({...config, studentIdColumn: t})}
                        placeholder="e.g. ID or Roll No"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <AppText style={styles.label}>Marks Column Name</AppText>
                    <TextInput 
                        style={styles.input}
                        value={config.marksColumn}
                        onChangeText={(t) => setConfig({...config, marksColumn: t})}
                        placeholder="e.g. Marks or Score"
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.primaryButton, importing && { opacity: 0.7 }]}
                    onPress={onUpload}
                    disabled={importing}
                >
                    {importing ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <Ionicons name="document-attach" size={20} color={COLORS.white} style={{marginRight: 8}} />
                            <AppText style={styles.primaryButtonText}>Select File & Upload</AppText>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

const BulkResultModal = ({ visible, result, onClose }) => (
    <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <AppText variant="h3">Upload Summary</AppText>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.resultSummary}>
                    <View style={styles.summaryItem}>
                        <AppText style={styles.summaryValue}>{result?.successCount || 0}</AppText>
                        <AppText style={styles.summaryLabel}>Success</AppText>
                    </View>
                    <View style={[styles.summaryItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border }]}>
                        <AppText style={[styles.summaryValue, { color: COLORS.error }]}>{result?.failureCount || 0}</AppText>
                        <AppText style={styles.summaryLabel}>Failed</AppText>
                    </View>
                    <View style={styles.summaryItem}>
                        <AppText style={styles.summaryValue}>{result?.totalProcessed || 0}</AppText>
                        <AppText style={styles.summaryLabel}>Total</AppText>
                    </View>
                </View>

                {result?.errors?.length > 0 && (
                    <View style={{maxHeight: 250}}>
                        <AppText style={styles.errorTitle}>Errors ({result.errors.length})</AppText>
                        <ScrollView style={styles.errorList}>
                            {result.errors.map((err, idx) => (
                                <View key={idx} style={styles.errorItem}>
                                    <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                                    <AppText style={styles.errorText}>
                                        {err.studentUserid ? `${err.studentUserid}: ` : ''}{err.error}
                                    </AppText>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <TouchableOpacity style={[styles.primaryButton, {marginTop: 20}]} onPress={onClose}>
                    <AppText style={styles.primaryButtonText}>Close</AppText>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

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
    bulkHeaderBtn: {
        padding: 8,
        marginRight: 4
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
        fontSize: 16,
        fontWeight: 'bold'
    },
    // 5. Update styles to accommodate the search bar
    searchContainer: {
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.m,
        paddingTop: SPACING.s,
        backgroundColor: COLORS.surfaceLight,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 45,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 16
    },
    modalSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 20,
        lineHeight: 18
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginBottom: 6
    },
    inputGroup: {
        marginBottom: 20
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center'
    },
    primaryButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16
    },
    // Result Modal
    resultSummary: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.primary,
    },
    summaryLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10
    },
    errorList: {
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        padding: 10,
    },
    errorItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
        gap: 8
    },
    errorText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        flex: 1
    }
});

export default AssessmentMarksScreen;
