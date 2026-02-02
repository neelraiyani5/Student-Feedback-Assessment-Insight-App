import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getMyProfile, getSubjectClasses, createAssessment } from '../../services/api';

const COMPONENT_TYPES = ['CSE', 'IA', 'ESE'];

const CreateAssessmentScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Data
    const [mySubjects, setMySubjects] = useState([]);
    const [availableClasses, setAvailableClasses] = useState([]);

    // Form State
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [title, setTitle] = useState('');
    const [component, setComponent] = useState('IA');
    const [maxMarks, setMaxMarks] = useState('');

    // Modals
    const [subjectModalVisible, setSubjectModalVisible] = useState(false);
    const [classModalVisible, setClassModalVisible] = useState(false);
    const [componentModalVisible, setComponentModalVisible] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            fetchClasses(selectedSubject.id);
            setSelectedClass(null); // Reset class selection
        }
    }, [selectedSubject]);

    const fetchProfile = async () => {
        try {
            const data = await getMyProfile();
            if (data.user?.subjects) setMySubjects(data.user.subjects);
        } catch (error) {
            console.log("Profile fetch error", error);
        }
    };

    const fetchClasses = async (subjectId) => {
        try {
            const data = await getSubjectClasses(subjectId);
            setAvailableClasses(data.classes || []);
        } catch (error) {
            console.log("Class fetch error", error);
            Alert.alert("Error", "Failed to fetch classes for this subject");
        }
    };

    const handleCreate = async () => {
        if (!selectedSubject || !selectedClass || !title || !maxMarks) {
            Alert.alert("Validation", "Please fill all fields");
            return;
        }

        setLoading(true);
        try {
            await createAssessment({
                title,
                component,
                maxMarks,
                subjectId: selectedSubject.id,
                classId: selectedClass.id
            });
            Alert.alert("Success", "Assessment Created Successfully", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to create assessment");
        } finally {
            setLoading(false);
        }
    };

    // Helper for Dropdowns
    const renderDropdown = (label, value, placeholder, onPress) => (
        <View style={styles.inputGroup}>
            <AppText variant="caption" style={styles.label}>{label}</AppText>
            <TouchableOpacity style={styles.dropdownInput} onPress={onPress}>
                <AppText style={[styles.inputText, !value && { color: COLORS.textLight }]}>
                    {value || placeholder}
                </AppText>
                <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
        </View>
    );

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3">Add Assessment</AppText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {renderDropdown("Subject", selectedSubject?.name, "Select Subject", () => setSubjectModalVisible(true))}
                
                {renderDropdown("Class", selectedClass?.name, "Select Class", () => {
                    if(!selectedSubject) Alert.alert("Wait", "Select a Subject first");
                    else setClassModalVisible(true);
                })}

                <View style={styles.inputGroup}>
                    <AppText variant="caption" style={styles.label}>Assessment Title</AppText>
                    <TextInput 
                        style={styles.textInput} 
                        placeholder="e.g. Unit Test 1" 
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {renderDropdown("Component", component, "Select Component", () => setComponentModalVisible(true))}

                <View style={styles.inputGroup}>
                    <AppText variant="caption" style={styles.label}>Max Marks</AppText>
                    <TextInput 
                        style={styles.textInput} 
                        placeholder="e.g. 20" 
                        value={maxMarks}
                        onChangeText={setMaxMarks}
                        keyboardType="numeric"
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.createButton, loading && { opacity: 0.7 }]} 
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color={COLORS.white} /> : (
                        <AppText style={styles.createButtonText}>Create Assessment</AppText>
                    )}
                </TouchableOpacity>

            </ScrollView>

            {/* Subject Modal */}
            <Modal visible={subjectModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <AppText variant="h3" style={{marginBottom: 10}}>Select Subject</AppText>
                        <FlatList 
                            data={mySubjects}
                            keyExtractor={item => item.id}
                            renderItem={({item}) => (
                                <TouchableOpacity style={styles.optionItem} onPress={() => { setSelectedSubject(item); setSubjectModalVisible(false); }}>
                                    <AppText>{item.name}</AppText>
                                    {selectedSubject?.id === item.id && <Ionicons name="checkmark" size={20} color={COLORS.primary}/>}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setSubjectModalVisible(false)}><AppText>Close</AppText></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Class Modal */}
            <Modal visible={classModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <AppText variant="h3" style={{marginBottom: 10}}>Select Class</AppText>
                        {availableClasses.length === 0 ? <AppText style={{fontStyle:'italic', color: COLORS.textSecondary}}>No classes found.</AppText> : null}
                        <FlatList 
                            data={availableClasses}
                            keyExtractor={item => item.id}
                            renderItem={({item}) => (
                                <TouchableOpacity style={styles.optionItem} onPress={() => { setSelectedClass(item); setClassModalVisible(false); }}>
                                    <AppText>{item.name}</AppText>
                                    {selectedClass?.id === item.id && <Ionicons name="checkmark" size={20} color={COLORS.primary}/>}
                                </TouchableOpacity>
                            )}
                        />
                         <TouchableOpacity style={styles.closeBtn} onPress={() => setClassModalVisible(false)}><AppText>Close</AppText></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Component Modal */}
            <Modal visible={componentModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                     <View style={[styles.modalContent, {maxHeight: 300}]}>
                        <AppText variant="h3" style={{marginBottom: 10}}>Select Type</AppText>
                        {COMPONENT_TYPES.map(type => (
                             <TouchableOpacity key={type} style={styles.optionItem} onPress={() => { setComponent(type); setComponentModalVisible(false); }}>
                                <AppText>{type}</AppText>
                                {component === type && <Ionicons name="checkmark" size={20} color={COLORS.primary}/>}
                            </TouchableOpacity>
                        ))}
                     </View>
                </View>
            </Modal>

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        gap: SPACING.m
    },
    content: {
        padding: SPACING.m
    },
    inputGroup: {
        marginBottom: SPACING.l
    },
    label: {
        color: COLORS.textSecondary,
        marginBottom: 8,
        fontWeight: '600'
    },
    dropdownInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        backgroundColor: COLORS.white
    },
    textInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        backgroundColor: COLORS.white,
        fontSize: 16,
        color: COLORS.textPrimary
    },
    inputText: {
        fontSize: 16,
        color: COLORS.textPrimary
    },
    createButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20
    },
    createButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 20,
        maxHeight: '60%'
    },
    optionItem: {
        paddingVertical: 16,
        borderBottomWidth:1,
        borderBottomColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    closeBtn: {
        marginTop: 16,
        alignSelf: 'center'
    }
});

export default CreateAssessmentScreen;
