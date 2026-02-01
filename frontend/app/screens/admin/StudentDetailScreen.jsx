import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { resetStudentPassword, updateStudentDetails, assignStudentPool } from '../../services/api';

const StudentDetailScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Local State for Display
    const [student, setStudent] = useState({
        id: params.id,
        userId: params.userId,
        name: params.name,
        email: params.email,
        role: params.role || 'STUDENT'
    });

    const [currentPoolId, setCurrentPoolId] = useState(params.poolId || null);
    const [availablePools, setAvailablePools] = useState([]);
    
    // Pool UI State
    const [isEditingPool, setIsEditingPool] = useState(false);
    const [showPoolDropdown, setShowPoolDropdown] = useState(false);

    // Reset Password Logic
    const [newPassword, setNewPassword] = useState(null);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);

    // Edit Logic
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editData, setEditData] = useState({
        userId: params.userId,
        name: params.name,
        email: params.email
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (params.pools) {
            try {
                const parsedPools = JSON.parse(params.pools);
                setAvailablePools(parsedPools);
            } catch (e) {
                console.log("Error parsing pools", e);
            }
        }
    }, [params.pools]);

    const handleResetPassword = async () => {
        Alert.alert(
            "Confirm Reset",
            "Are you sure you want to regenerate the password for this student? The old password will stop working.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Reset", style: "destructive", onPress: confirmReset }
            ]
        );
    };

    const confirmReset = async () => {
        try {
            const response = await resetStudentPassword(student.id);
            setNewPassword(response.password);
            setPasswordModalVisible(true);
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to reset password");
        }
    };

    const copyToClipboard = async () => {
        if (newPassword) {
            await Clipboard.setStringAsync(newPassword);
            Alert.alert("Copied!", "Password copied to clipboard.");
        }
    };

    const openEditModal = () => {
        setEditData({
            userId: student.userId,
            name: student.name,
            email: student.email
        });
        setEditModalVisible(true);
    };

    const handleUpdate = async () => {
        if (!editData.userId || !editData.name || !editData.email) {
            Alert.alert("Error", "All fields are required");
            return;
        }
        
        setSaving(true);
        try {
            const response = await updateStudentDetails({
                studentId: student.id,
                ...editData
            });
            
            // Update local state
            setStudent(prev => ({ ...prev, ...editData }));
            setEditModalVisible(false);
            Alert.alert("Success", "Student details updated.");
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to update details");
        } finally {
            setSaving(false);
        }
    };

    const handlePoolAssign = async (poolId) => {
        try {
            await assignStudentPool(student.id, poolId);
            setCurrentPoolId(poolId);
            setIsEditingPool(false);
            setShowPoolDropdown(false);
            Alert.alert("Updated", "Student learning pace updated successfully.");
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to assign pool");
        }
    };

    const getPoolName = (id) => {
        const pool = availablePools.find(p => p.id === id);
        return pool ? pool.type : 'Select Type';
    };

    // Derived state
    const hasPool = !!currentPoolId;
    const showEditMode = !hasPool || isEditingPool;

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3">Student Details</AppText>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <AppText style={styles.avatarText}>{student.name?.[0]?.toUpperCase()}</AppText>
                    </View>
                    <AppText variant="h2" style={styles.name}>{student.name}</AppText>
                    <AppText style={styles.role}>{student.role}</AppText>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="id-card-outline" size={20} color={COLORS.textSecondary} />
                        <View style={styles.infoContent}>
                            <AppText style={styles.label}>Student ID</AppText>
                            <AppText style={styles.value}>{student.userId}</AppText>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                        <View style={styles.infoContent}>
                            <AppText style={styles.label}>Email Address</AppText>
                            <AppText style={styles.value}>{student.email}</AppText>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Ionicons name="business-outline" size={20} color={COLORS.textSecondary} />
                        <View style={styles.infoContent}>
                            <AppText style={styles.label}>Class / Semester</AppText>
                            <AppText style={styles.value}>
                                {params.className || 'Unknown Class'} • Semester {params.semester || 'N/A'}
                            </AppText>
                        </View>
                    </View>
                </View>

                {/* Learning Pool Assessment */}
                <View style={styles.infoCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m }}>
                        <AppText variant="h4">Learning Pace Assessment</AppText>
                        {!showEditMode && (
                            <TouchableOpacity onPress={() => setIsEditingPool(true)} style={styles.editIcon}>
                                <Ionicons name="pencil" size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    {availablePools.length > 0 ? (
                        <View>
                            {!showEditMode ? (
                                // Static Display
                                <View style={styles.staticPoolRow}>
                                    <View style={[styles.badge, styles.badgeActive]}>
                                        <AppText style={styles.badgeText}>{getPoolName(currentPoolId)}</AppText>
                                    </View>
                                </View>
                            ) : (
                                // Editing / Selection Mode (Dropdown)
                                <View style={styles.dropdownContainer}>
                                    <TouchableOpacity 
                                        style={styles.dropdownHeader} 
                                        onPress={() => setShowPoolDropdown(!showPoolDropdown)}
                                    >
                                        <AppText style={currentPoolId ? styles.dropdownText : styles.placeholderText}>
                                            {getPoolName(currentPoolId)}
                                        </AppText>
                                        <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                                    </TouchableOpacity>

                                    {showPoolDropdown && (
                                        <View style={styles.dropdownList}>
                                            {availablePools.map((pool, index) => (
                                                <TouchableOpacity 
                                                    key={pool.id}
                                                    style={[
                                                        styles.dropdownItem,
                                                        index === availablePools.length - 1 && { borderBottomWidth: 0 }
                                                    ]}
                                                    onPress={() => handlePoolAssign(pool.id)}
                                                >
                                                    <AppText style={styles.dropdownItemText}>{pool.type}</AppText>
                                                    {currentPoolId === pool.id && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                    
                                    {isEditingPool && currentPoolId && (
                                        <TouchableOpacity onPress={() => setIsEditingPool(false)} style={{marginTop: 10, alignSelf: 'flex-end'}}>
                                            <AppText style={{color: COLORS.textSecondary, fontSize: 12}}>Cancel Edit</AppText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    ) : (
                        <AppText style={{ color: COLORS.textSecondary }}>
                            No assessment pools defined for this class.
                        </AppText>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actionSection}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleResetPassword}>
                        <Ionicons name="key-outline" size={20} color={COLORS.white} />
                        <AppText style={styles.actionText}>Regenerate Password</AppText>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.info, marginTop: SPACING.m }]} onPress={openEditModal}>
                        <Ionicons name="pencil-outline" size={20} color={COLORS.white} />
                        <AppText style={styles.actionText}>Edit Details</AppText>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Password Reset Modal */}
            <Modal transparent visible={passwordModalVisible} animationType="fade" onRequestClose={() => setPasswordModalVisible(false)}>
                 <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { alignItems: 'center' }]}>
                        <View style={styles.successIcon}>
                             <Ionicons name="checkmark" size={40} color={COLORS.white} />
                        </View>
                        <AppText variant="h3" style={{ marginBottom: SPACING.s }}>Password Reset!</AppText>
                        <AppText style={styles.modalText}>Please share this new password with the student.</AppText>
                        
                        <View style={styles.passwordBox}>
                             <View style={styles.passwordRow}>
                                  <AppText style={styles.passwordText}>{newPassword}</AppText>
                                  <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                                      <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
                                  </TouchableOpacity>
                             </View>
                        </View>

                        <TouchableOpacity style={[styles.submitButton, { marginTop: SPACING.l, width: '100%' }]} onPress={() => setPasswordModalVisible(false)}>
                             <AppText style={styles.submitText}>Done</AppText>
                        </TouchableOpacity>
                    </View>
                 </View>
            </Modal>

            {/* Edit Modal */}
            <Modal transparent visible={editModalVisible} animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                             <AppText variant="h3">Edit Student</AppText>
                             <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                 <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                             </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <AppText style={styles.label}>Full Name</AppText>
                            <TextInput 
                                style={styles.input} 
                                value={editData.name}
                                onChangeText={(t) => setEditData({...editData, name: t})}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <AppText style={styles.label}>Student ID (Unique)</AppText>
                            <TextInput 
                                style={styles.input} 
                                value={editData.userId}
                                onChangeText={(t) => setEditData({...editData, userId: t})}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <AppText style={styles.label}>Email (Unique)</AppText>
                            <TextInput 
                                style={styles.input} 
                                value={editData.email}
                                onChangeText={(t) => setEditData({...editData, email: t})}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.submitButton, saving && { opacity: 0.7 }]} 
                            onPress={handleUpdate}
                            disabled={saving}
                        >
                             <AppText style={styles.submitText}>{saving ? "Saving..." : "Save Changes"}</AppText>
                        </TouchableOpacity>
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
    content: {
        padding: SPACING.l,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    name: {
        marginTop: SPACING.s,
        textAlign: 'center',
    },
    role: {
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 4,
        backgroundColor: '#E0F7FA',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden'
    },
    infoCard: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.l,
        padding: SPACING.l,
        marginBottom: SPACING.xl,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.s,
    },
    infoContent: {
        marginLeft: SPACING.m,
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    value: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.s,
    },
    actionSection: {
        marginTop: SPACING.m,
    },
    actionButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.secondary,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 16,
        marginLeft: SPACING.s,
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
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    successIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    modalText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginBottom: SPACING.l,
    },
    passwordBox: {
        width: '100%',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.s,
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.s,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    passwordText: {
        fontSize: 18,
        fontFamily: 'monospace',
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    copyButton: {
        padding: 4,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.round,
        alignItems: 'center',
        marginTop: SPACING.m,
    },
    submitText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 16,
    },
    inputGroup: {
        marginBottom: SPACING.m,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.m,
        fontSize: 16,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    badge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        alignSelf: 'flex-start'
    },
    badgeActive: {
        backgroundColor: COLORS.primary + '15', // Transparent primary
        borderWidth: 1,
        borderColor: COLORS.primary
    },
    badgeText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 16
    },
    staticPoolRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editIcon: {
        padding: 4
    },
    dropdownContainer: {
        width: '100%',
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    dropdownText: {
        color: COLORS.textPrimary,
        fontSize: 16
    },
    placeholderText: {
        color: COLORS.textLight,
        fontSize: 16
    },
    dropdownList: {
        marginTop: SPACING.s,
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surface
    },
    dropdownItemText: {
        color: COLORS.textSecondary,
        fontSize: 16
    }
});

export default StudentDetailScreen;
