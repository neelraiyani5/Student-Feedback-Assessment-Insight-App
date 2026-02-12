import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';
import { getMyProfile, getSubjects, getSyllabus, startFeedbackSession, getMyCourseAssignments, getDepartmentCourseAssignments } from '../../services/api';
import { Alert, ActivityIndicator } from 'react-native';

// Mock Student Data for the visual pool
const STUDENT_POOL = [
  { id: '1', type: 'Fast Learner', color: '#4ADE80' }, // Green
  { id: '2', type: 'Fast Learner', color: '#4ADE80' },
  { id: '3', type: 'Fast Learner', color: '#4ADE80' },
  { id: '4', type: 'Medium Learner', color: '#FACC15' }, // Yellow
  { id: '5', type: 'Medium Learner', color: '#FACC15' },
  { id: '6', type: 'Slow Learner', color: '#F87171' }, // Red
];


const CreateFeedbackSession = () => {
    const router = useRouter();
    
    // State
    const [loading, setLoading] = useState(true);
    const [mySubjects, setMySubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [date, setDate] = useState('Today, Oct 15'); // Keep static for now
    const [topic, setTopic] = useState('');
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [coordinatedClassId, setCoordinatedClassId] = useState(null);
    
    // Syllabus State
    const [chapters, setChapters] = useState([]);
    const [loadingSyllabus, setLoadingSyllabus] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState(null);

    // Modals
    const [subjectModalVisible, setSubjectModalVisible] = useState(false);
    const [chapterModalVisible, setChapterModalVisible] = useState(false);
    const [topicModalVisible, setTopicModalVisible] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getMyProfile();
            const user = data.user;
            
            if (!user) {
                Alert.alert("Error", "User session not found. Please log in again.");
                return;
            }

            let subjectsList = [];

            if (user.role === 'CC') {
                const classCoord = user.classesCoordinated?.[0];
                if (classCoord) {
                    setCoordinatedClassId(classCoord.id);
                    try {
                        const subjectsData = await getSubjects();
                        subjectsList = (subjectsData?.subjects || []).map(s => ({
                            id: s.id, // Subject ID
                            subjectId: s.id,
                            name: s.name,
                            display: `${s.name} (${classCoord.name})`,
                            className: classCoord.name,
                            classId: classCoord.id
                        }));
                    } catch (e) { console.error("CC subjects fetch error", e); }
                }
            } else if (user.role === 'FACULTY') {
                try {
                    const assignments = await getMyCourseAssignments();
                    subjectsList = assignments.map(a => ({
                        id: a.id, // Assignment ID
                        subjectId: a.subjectId,
                        classId: a.classId,
                        name: a.subject.name,
                        display: `${a.subject.name} (${a.class.name})`,
                        className: a.class.name
                    }));
                } catch (e) { console.error("Faculty assignments fetch error", e); }
            } else if (user.role === 'HOD') {
                try {
                    const assignments = await getDepartmentCourseAssignments();
                    subjectsList = assignments.map(a => ({
                        id: a.id,
                        subjectId: a.subjectId,
                        classId: a.classId,
                        name: a.subject.name,
                        display: `${a.subject.name} (${a.class.name})`,
                        className: a.class.name
                    }));
                } catch (e) { console.error("HOD assignments fetch error", e); }
            }

            setMySubjects(subjectsList);
        } catch (error) {
            console.log("Error fetching profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSubject = async (subject) => {
        console.log("Subject selected:", subject);
        setSelectedSubject(subject);
        setSubjectModalVisible(false);
        
        // Reset dependent states
        setSelectedTopics([]);
        setSelectedChapter(null);
        setChapters([]);
        setTopic('');
        
        // Fetch syllabus using Subject ID
        const finalSubjectId = subject.subjectId || subject.id;
        if (!finalSubjectId) {
            console.error("No Subject ID found for selection");
            return;
        }

        setLoadingSyllabus(true);
        try {
            console.log("Fetching syllabus for:", finalSubjectId);
            const syllabusData = await getSyllabus(finalSubjectId);
            console.log("Syllabus received:", syllabusData?.length, "chapters");
            setChapters(syllabusData || []);
        } catch (error) {
            console.error("Error fetching syllabus", error);
            Alert.alert("Syllabus Error", "Could not load syllabus for this subject.");
        } finally {
            setLoadingSyllabus(false);
        }
    };

    const handleSelectChapter = (chapter) => {
        setSelectedChapter(chapter);
        setChapterModalVisible(false);
        setSelectedTopics([]); // Reset topics when chapter changes
    };

    const handleSelectTopic = (topicObj) => {
        if (!selectedTopics.find(t => t.id === topicObj.id)) {
            setSelectedTopics([...selectedTopics, topicObj]);
        } else {
            setSelectedTopics(selectedTopics.filter(t => t.id !== topicObj.id));
        }
    };

    const handleGenerateRequest = async () => {
        if (!selectedSubject) {
            Alert.alert("Error", "Please select a subject.");
            return;
        }
        if (selectedTopics.length === 0) {
            Alert.alert("Error", "Please select at least one topic.");
            return;
        }

        setGenerating(true);
        try {
            // !HARDCODED TEMPLATE ID FOR DEMO!
            const TEMPLATE_ID = "cm6ztv7l10003u8240ln6e3w6"; 

            let sessionTitle = "";
            if (selectedChapter) {
                const topicNames = selectedTopics.map(t => t.name).join(', ');
                sessionTitle = `${selectedChapter.title}: ${topicNames}`;
            } else if (topic) {
                sessionTitle = topic;
            } else {
                sessionTitle = "Academic Feedback";
            }

            const payload = {
                title: sessionTitle,
                templateId: TEMPLATE_ID, 
                classId: selectedSubject.classId || coordinatedClassId,
                subjectId: selectedSubject.subjectId || selectedSubject.id || selectedSubject.id,
                topicIds: selectedTopics.map(t => t.id).filter(id => id !== 'manual')
            };

            if (!payload.classId) {
                throw new Error("Class ID missing. Please ensure subject is correctly assigned.");
            }

            await startFeedbackSession(payload);
            Alert.alert("Success", "Feedback session created successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error("Creation failed", error);
            Alert.alert("Error", error.message || "Failed to create session.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h2" style={styles.headerTitle}>Create Feedback Session</AppText>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <AppText style={{marginTop: 12, color: COLORS.textSecondary}}>Loading dashboard...</AppText>
                </View>
            ) : (
                <>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Main Entry Card */}
                <View style={styles.card}>
                    <AppText variant="h3" style={styles.cardTitle}>Academic Details</AppText>
                    
                    {/* 1. Subject Identifier */}
                    <View style={styles.inputGroup}>
                        <AppText variant="caption" style={styles.label}>Select Subject & Class</AppText>
                        <TouchableOpacity 
                            style={styles.dropdownInput}
                            onPress={() => setSubjectModalVisible(true)}
                        >
                            <AppText style={[styles.inputText, !selectedSubject && {color: COLORS.textLight}]}>
                                {selectedSubject ? selectedSubject.display : "Select Subject"}
                            </AppText>
                            <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        {selectedSubject && (
                            <AppText variant="small" color={COLORS.primary} style={{marginTop: 4, fontWeight: '500'}}>
                                Mode: {selectedSubject.className}
                            </AppText>
                        )}
                    </View>

                    {/* 2. Chapter / Unit Selection */}
                    <View style={styles.inputGroup}>
                        <AppText variant="caption" style={styles.label}>Chapter / Unit</AppText>
                        <TouchableOpacity 
                            style={[styles.dropdownInput, (!selectedSubject || chapters.length === 0) && { opacity: 0.6 }]}
                            onPress={() => chapters.length > 0 && setChapterModalVisible(true)}
                            disabled={!selectedSubject || loadingSyllabus || chapters.length === 0}
                        >
                            <AppText style={[styles.inputText, !selectedChapter && {color: COLORS.textLight}, loadingSyllabus && {color: COLORS.primary}]}>
                                {loadingSyllabus ? "Reading syllabus..." : 
                                 chapters.length > 0 ? (selectedChapter ? `${selectedChapter.number}. ${selectedChapter.title}` : "Select Chapter") : 
                                 selectedSubject ? "No syllabus metadata found" : "Waiting for subject..."}
                            </AppText>
                            {loadingSyllabus ? (
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                                <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* 3. Subtopics Selection */}
                    <View style={styles.inputGroup}>
                        <AppText variant="caption" style={styles.label}>List of Topics</AppText>
                        <TouchableOpacity 
                            style={[styles.dropdownInput, !selectedChapter && { opacity: 0.6 }]}
                            onPress={() => selectedChapter && setTopicModalVisible(true)}
                            disabled={!selectedChapter}
                        >
                            <View style={{flex: 1}}>
                                {selectedTopics.length > 0 && selectedTopics[0].id !== 'manual' ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection: 'row'}}>
                                        {selectedTopics.map(t => (
                                            <View key={t.id} style={styles.topicChip}>
                                                <AppText style={styles.topicChipText}>{t.name}</AppText>
                                                <TouchableOpacity onPress={() => handleSelectTopic(t)}>
                                                    <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                ) : (
                                    <AppText style={{color: COLORS.textLight}}>
                                        {selectedChapter ? "Select Subtopics" : "Select a Chapter above"}
                                    </AppText>
                                )}
                            </View>
                            <Ionicons name="list" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* 4. Manual Entry Fallback */}
                    {selectedSubject && !loadingSyllabus && chapters.length === 0 && (
                        <View style={styles.inputGroup}>
                            <AppText variant="caption" style={styles.label}>Manual Topic Entry</AppText>
                            <View style={styles.textInputContainer}>
                                <TextInput 
                                    style={styles.textInput}
                                    value={topic}
                                    onChangeText={(val) => {
                                        setTopic(val);
                                        if (val) {
                                            setSelectedTopics([{ id: 'manual', name: val }]);
                                        } else {
                                            setSelectedTopics([]);
                                        }
                                    }}
                                    placeholder="Enter topic name manually..."
                                />
                            </View>
                            <AppText variant="small" style={{marginTop: 4, color: COLORS.textSecondary, fontStyle: 'italic'}}>
                                No digitized syllabus found for this subject.
                            </AppText>
                        </View>
                    )}

                    {/* Date Identifier */}
                    <View style={styles.inputGroup}>
                        <AppText variant="caption" style={styles.label}>Execution Date</AppText>
                        <View style={[styles.dropdownInput, { opacity: 0.8, backgroundColor: COLORS.border + '30' }]}>
                            <AppText style={styles.inputText}>{date}</AppText>
                            <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
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
                
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.generateButton, generating && { opacity: 0.7 }]} 
                        onPress={handleGenerateRequest}
                        disabled={generating}
                    >
                        {generating ? (
                             <ActivityIndicator color={COLORS.white} />
                        ) : (
                             <AppText style={styles.generateButtonText}>Generate Feedback Request</AppText>
                        )}
                    </TouchableOpacity>
                </View>
                </>
            )}

            {/* Subject Selection Modal */}
            <Modal visible={subjectModalVisible} transparent animationType="slide">
                 <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <AppText variant="h3" style={{marginBottom: 16}}>Select Subject</AppText>
                        
                        {mySubjects.length > 0 ? (
                            <FlatList 
                                data={mySubjects}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.modalOption} 
                                        onPress={() => handleSelectSubject(item)}
                                    >
                                        <AppText style={styles.modalOptionText}>{item.display || item.name}</AppText>
                                        {selectedSubject?.id === item.id && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                                    </TouchableOpacity>
                                )}
                            />
                        ) : (
                            <AppText style={{color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: 20}}>
                                No assigned subjects found. Please contact your coordinator.
                            </AppText>
                        )}

                        <TouchableOpacity 
                            style={[styles.generateButton, {marginTop: 10}]} 
                            onPress={() => setSubjectModalVisible(false)}
                        >
                            <AppText style={{color: COLORS.white, fontWeight: 'bold'}}>Close</AppText>
                        </TouchableOpacity>
                    </View>
                 </View>
            </Modal>

            {/* Chapter Selection Modal */}
            <Modal visible={chapterModalVisible} transparent animationType="slide">
                 <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <AppText variant="h3" style={{marginBottom: 16}}>Select Chapter</AppText>
                        <FlatList 
                            data={chapters}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.modalOption} 
                                    onPress={() => handleSelectChapter(item)}
                                >
                                    <AppText style={styles.modalOptionText}>{item.number}. {item.title}</AppText>
                                    {selectedChapter?.id === item.id && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity 
                            style={[styles.generateButton, {marginTop: 10}]} 
                            onPress={() => setChapterModalVisible(false)}
                        >
                            <AppText style={{color: COLORS.white, fontWeight: 'bold'}}>Close</AppText>
                        </TouchableOpacity>
                    </View>
                 </View>
            </Modal>

            {/* Topic Selection Modal */}
            <Modal visible={topicModalVisible} transparent animationType="slide">
                 <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <AppText variant="h3" style={{marginBottom: 16}}>Select Topic</AppText>
                        {selectedChapter?.topics && selectedChapter.topics.length > 0 ? (
                            <FlatList 
                                data={selectedChapter.topics}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => {
                                    const isSelected = selectedTopics.find(t => t.id === item.id);
                                    return (
                                        <TouchableOpacity 
                                            style={styles.modalOption} 
                                            onPress={() => handleSelectTopic(item)}
                                        >
                                            <AppText style={[styles.modalOptionText, isSelected && {color: COLORS.primary, fontWeight: '600'}]}>
                                                {item.name}
                                            </AppText>
                                            {isSelected && <Ionicons name="checkbox" size={20} color={COLORS.primary} />}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        ) : (
                            <AppText style={{ textAlign: 'center', color: COLORS.textSecondary, marginBottom: 20 }}>
                                No topics found for this chapter.
                            </AppText>
                        )}
                        <TouchableOpacity 
                            style={[styles.generateButton, {marginTop: 10}]} 
                            onPress={() => setTopicModalVisible(false)}
                        >
                            <AppText style={{color: COLORS.white, fontWeight: 'bold'}}>Close</AppText>
                        </TouchableOpacity>
                    </View>
                 </View>
            </Modal>

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
       padding: 24,
       maxHeight: '50%'
    },
    modalOption: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    modalOptionText: {
        fontSize: 16,
        color: COLORS.textPrimary
    },
    topicChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        borderColor: COLORS.primary + '30',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
        gap: 6,
    },
    topicChipText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    }
});

export default CreateFeedbackSession;
