import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, SPACING, LAYOUT } from '../../constants/theme';
import { hp } from '../../utils/responsive';
import { getCourseFileTemplates, updateCourseFileTemplate } from '../../services/api';

const ManageTemplatesScreen = () => {
    const router = useRouter();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Edit Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '' });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await getCourseFileTemplates();
            setTemplates(data);
        } catch (error) {
            Alert.alert("Error", "Failed to fetch course file format.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (template) => {
        setCurrentTemplate(template);
        setEditForm({ title: template.title, description: template.description || '' });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if(!currentTemplate) return;
        
        try {
            await updateCourseFileTemplate(currentTemplate.id, editForm);
            
            // Local update
            setTemplates(prev => prev.map(t => 
                t.id === currentTemplate.id ? { ...t, ...editForm } : t
            ));
            
            setModalVisible(false);
            Alert.alert("Success", "Format updated.");
        } catch (error) {
            Alert.alert("Error", "Failed to update format.");
        }
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3" style={styles.headerTitle}>Course File Format</AppText>
            </View>

            {loading ? (
                <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <AppText style={{marginBottom: SPACING.m, color: COLORS.textSecondary}}>
                        These tasks define the standard course file checklist for all faculty.
                    </AppText>
                    
                    {templates.map((item, index) => (
                         <TouchableOpacity key={item.id} style={styles.card} onPress={() => handleEdit(item)}>
                            <View style={styles.indexCircle}>
                                <AppText style={{color: COLORS.primary, fontWeight:'bold'}}>{index + 1}</AppText>
                            </View>
                            <View style={{flex: 1}}>
                                <AppText style={styles.cardTitle}>{item.title}</AppText>
                                {item.description && <AppText variant="caption" style={styles.cardDesc} numberOfLines={2}>{item.description}</AppText>}
                            </View>
                            <Ionicons name="pencil" size={16} color={COLORS.textLight} />
                         </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <AppText variant="h3" style={{marginBottom: SPACING.m}}>Edit Task</AppText>
                        
                        <AppText variant="caption" style={styles.label}>Task Title</AppText>
                        <TextInput 
                            style={styles.input}
                            value={editForm.title}
                            onChangeText={t => setEditForm(prev => ({...prev, title: t}))}
                        />

                        <AppText variant="caption" style={styles.label}>Description (Optional)</AppText>
                        <TextInput 
                            style={[styles.input, {height: 80, textAlignVertical:'top'}]}
                            value={editForm.description}
                            onChangeText={t => setEditForm(prev => ({...prev, description: t}))}
                            multiline
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, styles.btnCancel]} onPress={() => setModalVisible(false)}>
                                <AppText style={{color: COLORS.textPrimary}}>Cancel</AppText>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.btnSave]} onPress={handleSave}>
                                <AppText style={{color: COLORS.white, fontWeight:'600'}}>Save</AppText>
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
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.m,
        paddingBottom: SPACING.l,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: { marginRight: SPACING.m },
    headerTitle: { fontSize: 18, color: COLORS.textPrimary },
    scrollContent: { padding: SPACING.m, paddingBottom: hp(5) },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: SPACING.m,
        marginBottom: SPACING.s,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    indexCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
    },
    cardTitle: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    cardDesc: {
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.l,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.l,
        padding: SPACING.l,
    },
    label: { marginBottom: 6, color: COLORS.textSecondary },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: LAYOUT.radius.s,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: SPACING.s,
    },
    modalBtn: {
        paddingVertical: 10,
        paddingHorizontal: SPACING.l,
        borderRadius: LAYOUT.radius.s,
        marginLeft: SPACING.s,
    },
    btnCancel: { backgroundColor: COLORS.surface },
    btnSave: { backgroundColor: COLORS.primary },
});

export default ManageTemplatesScreen;
