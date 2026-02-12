import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getTemplates, getSubjectClasses, startFeedbackSession, getMyProfile, getSubjects, getSyllabus, getMyCourseAssignments, getDepartmentCourseAssignments } from '../../services/api';

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
    
    // Syllabus Selection
    const [chapters, setChapters] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [loadingSyllabus, setLoadingSyllabus] = useState(false);
    
    // UI Helpers for Dropdowns
    const [showTemps, setShowTemps] = useState(false);
    const [showSubs, setShowSubs] = useState(false);
    const [showClasses, setShowClasses] = useState(false);
    const [showChapters, setShowChapters] = useState(false);
    const [showTopics, setShowTopics] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [coordinatedClassId, setCoordinatedClassId] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [tmplData, profileData] = await Promise.all([
                getTemplates(),
                getMyProfile()
            ]);
            setTemplates(tmplData || []);
            const user = profileData?.user;

            let subjectsList = [];
            
            if (user?.role === 'CC') {
                const classCoord = user.classesCoordinated?.[0];
                if (classCoord) {
                    setCoordinatedClassId(classCoord.id);
                    setSelectedClass(classCoord); // Pre-select for CC
                    try {
                        const subjectsData = await getSubjects();
                        subjectsList = (subjectsData?.subjects || []).map(s => ({
                            ...s,
                            subjectId: s.id,
                            display: s.name
                        }));
                    } catch (e) { console.error("CC subjects fetch error", e); }
                }
            } else if (user?.role === 'FACULTY') {
                try {
                    const assignments = await getMyCourseAssignments();
                    subjectsList = assignments.map(a => ({
                        id: a.subjectId, 
                        subjectId: a.subjectId,
                        classId: a.classId,
                        name: a.subject.name,
                        display: `${a.subject.name} (${a.class.name})`,
                        className: a.class.name,
                        rawClass: a.class
                    }));
                } catch (e) { console.error("Faculty assignments fetch error", e); }
            } else if (user?.role === 'HOD') {
                try {
                    const assignments = await getDepartmentCourseAssignments();
                    subjectsList = assignments.map(a => ({
                        id: a.subjectId,
                        subjectId: a.subjectId,
                        classId: a.classId,
                        name: a.subject.name,
                        display: `${a.subject.name} (${a.class.name})`,
                        className: a.class.name,
                        rawClass: a.class
                    }));
                } catch (e) { console.error("HOD assignments fetch error", e); }
            }
            
            setSubjects(subjectsList);
            
            // Auto-select first template for convenience
            if (tmplData && tmplData.length > 0) {
                setSelectedTemplate(tmplData[0]);
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
        setSelectedClass(subject.rawClass || null); 
        setShowSubs(false);
        
        // Reset syllabus states
        setChapters([]);
        setSelectedChapter(null);
        setSelectedTopics([]);

        // 1. Fetch classes for this subject if not already known
        if (!subject.rawClass) {
            setLoadingClasses(true);
            try {
                const data = await getSubjectClasses(subject.id);
                setClasses(data?.classes || []);
            } catch (error) {
                console.log("Error fetching classes", error);
            } finally {
                setLoadingClasses(false);
            }
        }

        // 2. Fetch Syllabus (New)
        setLoadingSyllabus(true);
        try {
            const syllabusId = subject.subjectId || subject.id;
            const syllabusData = await getSyllabus(syllabusId);
            setChapters(syllabusData || []);
        } catch (error) {
            console.log("Syllabus fetch error", error);
        } finally {
            setLoadingSyllabus(false);
        }
    };

    const handleChapterSelect = (chapter) => {
        setSelectedChapter(chapter);
        setSelectedTopics([]);
        setShowChapters(false);
    };

    const handleTopicSelect = (topic) => {
        if (selectedTopics.find(t => t.id === topic.id)) {
            setSelectedTopics(selectedTopics.filter(t => t.id !== topic.id));
        } else {
            setSelectedTopics([...selectedTopics, topic]);
        }
    };

    const handleStartSession = async () => {
        if (!title.trim() && !selectedChapter) return Alert.alert("Required", "Please enter a session title or select a unit/chapter");
        if (!selectedTemplate) return Alert.alert("Required", "Please select a template");
        if (!selectedSubject) return Alert.alert("Required", "Please select a subject");
        if (!selectedClass) return Alert.alert("Required", "Please select a class");

        setSubmitting(true);
        try {
             const payload = {
                 title: selectedChapter ? `${selectedChapter.title}: ${selectedTopics.map(t => t.name).join(', ')}` : title,
                 templateId: selectedTemplate.id,
                 subjectId: selectedSubject.subjectId || selectedSubject.id,
                 classId: selectedClass.id,
                 topicIds: selectedTopics.map(t => t.id)
             };
             await startFeedbackSession(payload);
             Alert.alert("Success", "Feedback session started successfully!", [
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
                    {renderDropdown(subjects, handleSubjectSelect, selectedSubject, showSubs, setShowSubs, 'display', 'Select Subject')}

                    {coordinatedClassId ? (
                        <View style={styles.infoBoxSmall}>
                            <AppText variant="caption">Coordinates Class: {selectedClass?.name || 'Class assigned'}</AppText>
                        </View>
                    ) : (
                        <>
                            <AppText style={styles.label}>Select Class</AppText>
                            {loadingClasses ? (
                                <ActivityIndicator size="small" color={COLORS.primary} style={{alignSelf:'flex-start', marginBottom: 16}} />
                            ) : (
                                renderDropdown(classes, setSelectedClass, selectedClass, showClasses, setShowClasses, 'name', 'Select Class')
                            )}
                        </>
                    )}

                    <AppText style={styles.label}>Unit / Chapter</AppText>
                    <View style={{marginBottom: 16}}>
                        <TouchableOpacity 
                            style={[styles.dropdownTrigger, (!selectedSubject || chapters.length === 0) && { opacity: 0.6 }]} 
                            onPress={() => chapters.length > 0 && setShowChapters(true)}
                            disabled={!selectedSubject || loadingSyllabus || chapters.length === 0}
                        >
                             <AppText style={{color: selectedChapter ? COLORS.textPrimary : COLORS.textLight}}>
                                 {loadingSyllabus ? "Loading syllabus..." : 
                                  chapters.length > 0 ? (selectedChapter ? `Unit ${selectedChapter.number}: ${selectedChapter.title}` : "Select Unit") : 
                                  selectedSubject ? "No syllabus found" : "Waiting for subject..."}
                             </AppText>
                             {loadingSyllabus ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Ionicons name="apps" size={20} color={COLORS.textSecondary} />}
                        </TouchableOpacity>
                        
                        <Modal visible={showChapters} transparent animationType="fade">
                            <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowChapters(false)}>
                                <View style={styles.dropdownModal}>
                                    <ScrollView>
                                        {chapters.map((item, index) => (
                                            <TouchableOpacity key={item.id} style={styles.dropdownItem} onPress={() => handleChapterSelect(item)}>
                                                <AppText>Unit {item.number}: {item.title}</AppText>
                                                {selectedChapter?.id === item.id && <Ionicons name="checkmark" size={16} color={COLORS.primary}/>}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    </View>

                    <AppText style={styles.label}>Subtopics</AppText>
                    <View style={{marginBottom: 16}}>
                        <TouchableOpacity 
                            style={[styles.dropdownTrigger, !selectedChapter && { opacity: 0.6 }]} 
                            onPress={() => selectedChapter && setShowTopics(true)}
                            disabled={!selectedChapter}
                        >
                             <View style={{flex: 1, flexDirection: 'row', flexWrap: 'wrap'}}>
                                 {selectedTopics.length > 0 ? (
                                     selectedTopics.map(t => (
                                         <View key={t.id} style={styles.chip}>
                                             <AppText variant="caption" style={{color: COLORS.primary}}>{t.name}</AppText>
                                         </View>
                                     ))
                                 ) : (
                                     <AppText style={{color: COLORS.textLight}}>
                                         {selectedChapter ? "Select Subtopics" : "Select a Unit first"}
                                     </AppText>
                                 )}
                             </View>
                             <Ionicons name="list" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        
                        <Modal visible={showTopics} transparent animationType="fade">
                            <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowTopics(false)}>
                                <View style={styles.dropdownModal}>
                                    <ScrollView>
                                        {selectedChapter?.topics?.map((item) => (
                                            <TouchableOpacity key={item.id} style={styles.dropdownItem} onPress={() => handleTopicSelect(item)}>
                                                <AppText>{item.name}</AppText>
                                                {selectedTopics.find(t => t.id === item.id) && <Ionicons name="checkbox" size={18} color={COLORS.primary}/>}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                    <TouchableOpacity style={styles.closeBtn} onPress={() => setShowTopics(false)}>
                                        <AppText style={{color: COLORS.white, fontWeight:'bold'}}>Done</AppText>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    </View>

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
    },
    chip: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 6,
        marginBottom: 4
    },
    infoBoxSmall: {
        backgroundColor: COLORS.surface,
        padding: 10,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
        marginBottom: 16
    },
    closeBtn: {
        backgroundColor: COLORS.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        margin: 10
    }
});

export default StartSessionScreen;
