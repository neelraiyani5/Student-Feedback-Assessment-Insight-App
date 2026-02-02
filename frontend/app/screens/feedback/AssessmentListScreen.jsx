import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getFacultyAssessments, deleteAssessment, updateAssessment } from '../../services/api';

const TABS = ['IA', 'CSE', 'ESE'];

const AssessmentListScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [assessments, setAssessments] = useState([]);
    const [activeTab, setActiveTab] = useState('IA');

    // Edit State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', maxMarks: '' });

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        setLoading(true);
        try {
            const data = await getFacultyAssessments();
            setAssessments(data.assessments || []);
        } catch (error) {
            console.log("Error fetching assessments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAssessment = (item) => {
        Alert.alert(
            "Delete Assessment",
            `Delete ${item.title}? This will delete all student marks associated with it.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: 'destructive', onPress: async () => {
                    try {
                        await deleteAssessment(item.id);
                        fetchAssessments();
                        Alert.alert("Success", "Assessment deleted");
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete assessment");
                    }
                }}
            ]
        );
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setEditForm({ title: item.title, maxMarks: String(item.maxMarks) });
        setEditModalVisible(true);
    };

    const handleUpdateAssessment = async () => {
        if (!editForm.title || !editForm.maxMarks) {
             Alert.alert("Validation", "Fields cannot be empty");
             return;
        }

        try {
            await updateAssessment(editingItem.id, {
                title: editForm.title,
                maxMarks: editForm.maxMarks,
                component: editingItem.component // Keep same component
            });
            setEditModalVisible(false);
            setEditingItem(null);
            fetchAssessments();
            Alert.alert("Success", "Assessment updated");
        } catch (error) {
            Alert.alert("Error", "Failed to update assessment");
        }
    }

    const filteredAssessments = assessments.filter(a => a.component === activeTab);

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3">My Assessments</AppText>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {/* ... existing tabs ... */}
                {TABS.map(tab => (
                    <TouchableOpacity 
                        key={tab} 
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <AppText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</AppText>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
            ) : (
                <FlatList 
                    data={filteredAssessments}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                         <View style={styles.card}>
                            <TouchableOpacity 
                                onPress={() => router.push(`/assessment/${item.id}`)}
                                style={styles.cardHeader}
                            >
                                <View style={{flex:1}}>
                                    <AppText style={styles.assessmentTitle}>{item.title}</AppText>
                                    <AppText variant="caption" style={styles.detailText}>
                                        {item.subject?.name} • {item.class?.name}
                                    </AppText>
                                </View>
                                <View style={styles.marksBadge}>
                                    <AppText style={styles.marksText}>{item.maxMarks} Marks</AppText>
                                </View>
                            </TouchableOpacity>

                            <View style={styles.cardFooter}>
                                <AppText variant="caption" style={{color: COLORS.textLight}}>
                                    Created: {new Date(item.createdAt).toLocaleDateString()}
                                </AppText>
                                <View style={{flexDirection:'row', gap: 16}}>
                                     <TouchableOpacity onPress={() => openEditModal(item)}>
                                         <Ionicons name="pencil" size={20} color={COLORS.textSecondary} />
                                     </TouchableOpacity>
                                     <TouchableOpacity onPress={() => handleDeleteAssessment(item)}>
                                         <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                                     </TouchableOpacity>
                                     <TouchableOpacity onPress={() => router.push(`/assessment/${item.id}`)}>
                                         <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                                     </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <AppText style={styles.emptyText}>No {activeTab} assessments found.</AppText>
                        </View>
                    }
                />
            )}

             <TouchableOpacity 
                style={styles.fab} 
                onPress={() => router.push('/create-assessment')}
            >
                <Ionicons name="add" size={30} color={COLORS.white} />
            </TouchableOpacity>

            {/* Edit Modal */}
            <Modal visible={editModalVisible} transparent animationType="slide">
                 <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                         <AppText variant="h3" style={{marginBottom:16}}>Edit Assessment</AppText>
                         <View style={styles.inputGroup}>
                            <AppText variant="caption">Title</AppText>
                            <TextInput 
                                style={styles.textInput} 
                                value={editForm.title} 
                                onChangeText={t => setEditForm({...editForm, title: t})} 
                            />
                         </View>
                         <View style={styles.inputGroup}>
                            <AppText variant="caption">Max Marks</AppText>
                            <TextInput 
                                style={styles.textInput} 
                                value={editForm.maxMarks} 
                                onChangeText={t => setEditForm({...editForm, maxMarks: t})} 
                                keyboardType="numeric"
                            />
                         </View>
                         <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}><AppText>Cancel</AppText></TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateAssessment} style={{marginLeft: 20}}>
                                <AppText style={{color: COLORS.primary, fontWeight: 'bold'}}>Save</AppText>
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
        alignItems: 'center',
        padding: SPACING.m,
        gap: SPACING.m
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.m,
        marginBottom: SPACING.m
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: COLORS.border // Default
    },
    activeTab: {
        borderBottomColor: COLORS.primary
    },
    tabText: {
        color: COLORS.textSecondary,
        fontWeight: '600'
    },
    activeTabText: {
        color: COLORS.primary
    },
    listContent: {
        padding: SPACING.m
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    assessmentTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4
    },
    detailText: {
        color: COLORS.textSecondary
    },
    marksBadge: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    marksText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textPrimary
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 12
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50
    },
    emptyText: {
        color: COLORS.textSecondary
    },
    fab: {
        position: 'absolute',
        bottom: SPACING.xl,
        right: SPACING.l,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6
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
        padding: 20
    },
    inputGroup: {
        marginBottom: 16
    },
    textInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 10,
        marginTop: 4,
        backgroundColor: COLORS.surface
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 10
    }
});

export default AssessmentListScreen;
