import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, TextInput, Alert, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getSubjects, createSubject, assignFacultyToSubject, getUsers, updateSubject, deleteSubject } from '../../services/api';

const ManageSubjectsScreen = () => {
    const router = useRouter();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modals
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    
    // Data
    const [newSubjectName, setNewSubjectName] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [facultyList, setFacultyList] = useState([]);
    const [facultyLoading, setFacultyLoading] = useState(false);

    // Edit Mode
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Multi-Select State
    const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getSubjects();
            setSubjects(data.subjects || []);
        } catch (error) {
            Alert.alert("Error", "Failed to fetch subjects");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSubject = async () => {
        if (!newSubjectName.trim()) {
            Alert.alert("Validation", "Subject Name is required");
            return;
        }

        try {
            if (isEditing) {
                await updateSubject(editId, { name: newSubjectName });
                Alert.alert("Success", "Subject updated");
            } else {
                await createSubject(newSubjectName);
                Alert.alert("Success", "Subject added successfully");
            }
            setCreateModalVisible(false);
            setNewSubjectName('');
            setIsEditing(false);
            setEditId(null);
            fetchData();
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to save subject");
        }
    };

    const handleDeleteSubject = (item) => {
        Alert.alert(
            "Delete Subject", 
            `Delete ${item.name}? This will remove it from all assigned faculties.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: 'destructive', onPress: async () => {
                    try {
                        await deleteSubject(item.id);
                        fetchData();
                        Alert.alert("Success", "Subject deleted");
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete subject");
                    }
                }}
            ]
        );
    };

    const openCreateModal = () => {
        setNewSubjectName('');
        setIsEditing(false);
        setEditId(null);
        setCreateModalVisible(true);
    };

    const openEditModal = (item) => {
        setNewSubjectName(item.name);
        setIsEditing(true);
        setEditId(item.id);
        setCreateModalVisible(true);
    };

    // ... (rest of logic: openAssignModal, etc)

    const openAssignModal = async (subject) => {
        setSelectedSubject(subject);
        // Initialize selection with existing faculties
        const initialIds = subject.faculties ? subject.faculties.map(f => f.id) : [];
        setSelectedFacultyIds(initialIds);
        
        setAssignModalVisible(true);
        setFacultyLoading(true);
        try {
            const users = await getUsers('FACULTY,CC,HOD'); // Allow all teaching staff
            setFacultyList(users || []);
        } catch (error) {
            Alert.alert("Error", "Failed to fetch faculty list");
        } finally {
            setFacultyLoading(false);
        }
    };

    const toggleFacultySelection = (id) => {
        if (selectedFacultyIds.includes(id)) {
            setSelectedFacultyIds(prev => prev.filter(fid => fid !== id));
        } else {
            setSelectedFacultyIds(prev => [...prev, id]);
        }
    };

    const handleSaveAssignment = async () => {
        try {
            await assignFacultyToSubject(selectedSubject.id, selectedFacultyIds);
            setAssignModalVisible(false);
            fetchData();
            Alert.alert("Success", "Faculty assigned to subject.");
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to assign faculty");
        }
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3">Manage Subjects</AppText>
                <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
                    <Ionicons name="add" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
            ) : (
                <FlatList 
                    data={subjects}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                                    <Ionicons name="book-outline" size={20} color={COLORS.primary} />
                                    <AppText style={styles.subjectName}>{item.name}</AppText>
                                </View>
                                <View style={{flexDirection:'row', gap: 12}}>
                                     <TouchableOpacity onPress={() => openEditModal(item)}>
                                         <Ionicons name="pencil" size={20} color={COLORS.textSecondary} />
                                     </TouchableOpacity>
                                     <TouchableOpacity onPress={() => handleDeleteSubject(item)}>
                                         <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                                     </TouchableOpacity>
                                </View>
                            </View>
                            
                            <View style={styles.divider} />
                            
                            <View style={styles.facultyRow}>
                                <View style={{flex: 1}}>
                                    <AppText style={styles.label}>Assigned Faculty:</AppText>
                                    {item.faculties && item.faculties.length > 0 ? (
                                        <AppText style={styles.facultyName}>
                                            {item.faculties.map(f => f.name).join(', ')}
                                        </AppText>
                                    ) : (
                                        <AppText style={styles.unassigned}>Unassigned</AppText>
                                    )}
                                </View>
                                <TouchableOpacity onPress={() => openAssignModal(item)} style={styles.assignBtn}>
                                    <AppText style={styles.assignBtnText}>Assign</AppText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <AppText style={styles.emptyText}>No subjects created yet.</AppText>
                        </View>
                    }
                />
            )}

            {/* Create/Edit Subject Modal */}
            <Modal visible={createModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <AppText variant="h3" style={{marginBottom: 16}}>{isEditing ? 'Edit Subject' : 'Add New Subject'}</AppText>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Subject Name (e.g. Mathematics)" 
                            value={newSubjectName}
                            onChangeText={setNewSubjectName}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)}><AppText>Cancel</AppText></TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveSubject}>
                                <AppText style={{color: COLORS.primary, fontWeight: 'bold'}}>
                                    {isEditing ? 'Update' : 'Create'}
                                </AppText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Assign Faculty Modal (Multi-Select) */}
            <Modal visible={assignModalVisible} transparent animationType="slide">
                 <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: 600 }]}>
                        <AppText variant="h3" style={{marginBottom: 8}}>Assign Faculty</AppText>
                        <AppText style={{marginBottom: 16, color: COLORS.textSecondary}}>Subject: {selectedSubject?.name}</AppText>
                        <AppText style={{marginBottom: 10, fontSize: 12, color: COLORS.textSecondary}}>Select multiple faculty members if needed.</AppText>

                        {facultyLoading ? (
                             <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <FlatList 
                                data={facultyList}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => {
                                    const isSelected = selectedFacultyIds.includes(item.id);
                                    return (
                                        <TouchableOpacity 
                                            style={[styles.facultyOption, isSelected && styles.selectedOption]}
                                            onPress={() => toggleFacultySelection(item.id)}
                                        >
                                            <View>
                                                <AppText style={[styles.optionName, isSelected && {color: COLORS.white}]}>{item.name}</AppText>
                                                <AppText style={[styles.optionEmail, isSelected && {color: COLORS.white}]}>{item.email}</AppText>
                                            </View>
                                            <View style={[styles.checkbox, isSelected && styles.checkedCheckbox]}>
                                                {isSelected && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}
                         <View style={[styles.modalActions, { marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 }]}>
                            <TouchableOpacity onPress={() => setAssignModalVisible(false)}><AppText>Cancel</AppText></TouchableOpacity>
                             <TouchableOpacity 
                                style={{backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8}}
                                onPress={handleSaveAssignment}
                            >
                                <AppText style={{color: COLORS.white, fontWeight: 'bold'}}>Save Assignment</AppText>
                            </TouchableOpacity>
                        </View>
                    </View>
                 </View>
            </Modal>

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
    },
    listContent: {
        padding: SPACING.m
    },
    addButton: {
        backgroundColor: COLORS.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    subjectName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.m
    },
    facultyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    label: {
        fontSize: 12,
        color: COLORS.textSecondary
    },
    facultyName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: 2
    },
    unassigned: {
        fontSize: 16,
        fontStyle: 'italic',
        color: COLORS.error,
        marginTop: 2
    },
    assignBtn: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.primary
    },
    assignBtnText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold'
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50
    },
    emptyText: {
        color: COLORS.textSecondary
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
       maxHeight: '90%'
    },
    input: {
       borderWidth: 1,
       borderColor: COLORS.border,
       borderRadius: 8,
       padding: 12,
       fontSize: 16,
       marginBottom: 16,
       backgroundColor: COLORS.surface
    },
    modalActions: {
       flexDirection: 'row',
       justifyContent: 'flex-end',
       alignItems: 'center',
       gap: 20
    },
    facultyOption: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    selectedOption: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        borderBottomWidth: 0
    },
    optionName: {
        fontWeight: '600',
        fontSize: 16,
        color: COLORS.textPrimary
    },
    optionEmail: {
        fontSize: 12,
        color: COLORS.textSecondary
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white
    },
    checkedCheckbox: {
        borderColor: COLORS.white // When selected, border white?
        // Actually the button bg is primary, so white checkbox looks good
    }
});

export default ManageSubjectsScreen;
