import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getTemplates, getSubjectClasses, startFeedbackSession, getMyProfile, getSubjects } from '../../services/api';

const StartSessionScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState([]);
    
    // Data
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(false);

    // Form
    const [title, setTitle] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    
    // UI Helpers for Dropdowns
    const [showTemps, setShowTemps] = useState(false);
    const [showSubs, setShowSubs] = useState(false);
    const [showClasses, setShowClasses] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [tmplData, userData] = await Promise.all([
                getTemplates(),
                getMyProfile()
            ]);
            setTemplates(tmplData || []);
            
            // For CCs, show all subjects in their class
            // For others, show their assigned subjects
            if (userData.user?.role === 'CC') {
                try {
                    const subjectsData = await getSubjects();
                    setSubjects(subjectsData?.subjects || []);
                } catch (e) {
                    console.error("Failed to fetch class subjects", e);
                    setSubjects(userData.user?.subjects || []);
                }
            } else {
                setSubjects(userData.user?.subjects || []);
            }
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to load initial data");
        } finally {
            setLoading(false);
        }
    };

    const handleSubjectSelect = async (subject) => {
        setSelectedSubject(subject);
        setSelectedClass(null); // Reset class
        setShowSubs(false);
        
        // Fetch classes for this subject
        setLoadingClasses(true);
        try {
            const data = await getSubjectClasses(subject.id);
            // data might be array of classes directly or { classes: [] }
            // API return: res.status(200).json(classes); which is array.
            setClasses(data?.classes || []);
        } catch (error) {
            console.log("Error fetching classes", error);
            Alert.alert("Error", "Failed to fetch classes for this subject");
        } finally {
            setLoadingClasses(false);
        }
    };

    const handleStartSession = async () => {
        if (!title.trim()) return Alert.alert("Required", "Please enter a session title");
        if (!selectedTemplate) return Alert.alert("Required", "Please select a template");
        if (!selectedSubject) return Alert.alert("Required", "Please select a subject");
        if (!selectedClass) return Alert.alert("Required", "Please select a class");

        setSubmitting(true);
        try {
             const payload = {
                 title,
                 templateId: selectedTemplate.id,
                 subjectId: selectedSubject.id,
                 classId: selectedClass.id
             };
             await startFeedbackSession(payload);
             Alert.alert("Success", "Feedback session started! 3-2-1 strategy applied.", [
                 { text: "OK", onPress: () => router.back() } 
             ]);
        } catch (error) {
             Alert.alert("Error", error.message || "Failed to start session");
        } finally {
             setSubmitting(false);
        }
    };

    const renderDropdown = (items, onSelect, currentItem, visible, setVisible, labelKey='name', placeholder='Select...') => {
        return (
            <View style={{marginBottom: 16}}>
                <TouchableOpacity 
                    style={styles.dropdownTrigger} 
                    onPress={() => setVisible(true)}
                >
                     <AppText style={{color: currentItem ? COLORS.textPrimary : COLORS.textLight}}>
                         {currentItem ? (currentItem[labelKey] || currentItem.title) : placeholder}
                     </AppText>
                     <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <Modal visible={visible} transparent animationType="fade">
                    <TouchableOpacity style={styles.modalOverlay} onPress={() => setVisible(false)}>
                        <View style={styles.dropdownModal}>
                            <ScrollView>
                                {items.length > 0 ? items.map((item, index) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            onSelect(item);
                                            setVisible(false);
                                        }}
                                    >
                                        <AppText>{item[labelKey] || item.title}</AppText>
                                        {currentItem?.id === item.id && <Ionicons name="checkmark" size={16} color={COLORS.primary}/>}
                                    </TouchableOpacity>
                                )) : (
                                    <View style={{padding:20, alignItems:'center'}}><AppText>No items found</AppText></View>
                                )}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        );
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                     <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3">Start Feedback Session</AppText>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <AppText style={{ marginTop: 12, color: COLORS.textSecondary }}>Loading setup data...</AppText>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <AppText style={styles.label}>Session Title</AppText>
                    <TextInput 
                        style={styles.input}
                        placeholder="e.g. Unit 1 Feedback"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <AppText style={styles.label}>Select Feedback Template</AppText>
                    {renderDropdown(templates, setSelectedTemplate, selectedTemplate, showTemps, setShowTemps, 'title', 'Select Template')}

                    <AppText style={styles.label}>Select Subject</AppText>
                    {renderDropdown(subjects, handleSubjectSelect, selectedSubject, showSubs, setShowSubs, 'name', 'Select Subject')}

                    <AppText style={styles.label}>Select Class</AppText>
                    {loadingClasses ? (
                        <ActivityIndicator size="small" color={COLORS.primary} style={{alignSelf:'flex-start', marginBottom: 16}} />
                    ) : (
                        renderDropdown(classes, setSelectedClass, selectedClass, showClasses, setShowClasses, 'name', 'Select Class')
                    )}

                    <View style={styles.infoBox}>
                         <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                         <AppText style={styles.infoText}>
                             Starts a 3-2-1 randomized feedback session. Expires at midnight today.
                         </AppText>
                    </View>

                    <TouchableOpacity 
                        style={[styles.submitButton, submitting && {opacity: 0.7}]}
                        onPress={handleStartSession}
                        disabled={submitting}
                    >
                         {submitting ? <ActivityIndicator color={COLORS.white} /> : <AppText style={styles.submitText}>Start Session</AppText>}
                    </TouchableOpacity>
                </ScrollView>
            )}
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
        padding: SPACING.m
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
        color: COLORS.textSecondary
    },
    input: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    dropdownTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    dropdownModal: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        maxHeight: '50%',
        padding: 10
    },
    dropdownItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surface,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E0F2FE',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 24,
        gap: 8
    },
    infoText: {
        color: '#0369A1',
        flex: 1,
        fontSize: 12
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: LAYOUT.radius.round,
        alignItems: 'center'
    },
    submitText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default StartSessionScreen;
