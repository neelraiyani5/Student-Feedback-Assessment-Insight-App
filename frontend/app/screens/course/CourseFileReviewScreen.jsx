import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, SPACING, LAYOUT } from '../../constants/theme';
import { hp } from '../../utils/responsive';
import { 
    getAssignmentTasks, 
    getReviewableTasks,
    reviewCourseTask, 
    updateCourseFileTaskDeadline,
    batchReviewCourseTasks,
    getMyProfile
} from '../../services/api';

const CourseFileReviewScreen = () => {
    const router = useRouter();
    const { assignmentId } = useLocalSearchParams();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignmentDetails, setAssignmentDetails] = useState({ faculty: '', subject: '' });
    const [userRole, setUserRole] = useState(null);
    
    // Remark Modal State
    const [remarkModal, setRemarkModal] = useState({ visible: false, taskId: null, text: '' });

    // Deadline Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [newDeadline, setNewDeadline] = useState('');

    useEffect(() => {
        fetchData();
        fetchProfile();
    }, [assignmentId]);

    const fetchProfile = async () => {
        try {
            const data = await getMyProfile();
            setUserRole(data.user.role); // 'HOD' or 'CC' or 'FACULTY'
        } catch (error) {
            console.log("Failed to load profile", error);
        }
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            // Use getReviewableTasks for CC and HOD to only see what needs action
            const data = await getReviewableTasks(assignmentId);
            
            // Backend returns { assignment, tasks }
            setTasks(data.tasks || []);
            
            if (data.assignment) {
                setAssignmentDetails({
                    faculty: data.assignment.faculty,
                    subject: data.assignment.subject,
                    className: data.assignment.className
                });
            }
        } catch (error) {
            console.log("Failed to fetch review tasks", error);
            // Don't show Alert for 404 or empty if it's just "not found" meaning nothing to review
            if (error?.message !== "Assignment not found") {
                Alert.alert("Error", "Could not load tasks for review.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (taskId, status) => {
        // Use saved remarks from the task
        const task = tasks.find(t => t.id === taskId);
        let remark = "";
        if (userRole === 'CC') remark = task.ccRemarks;
        if (userRole === 'HOD') remark = task.hodRemarks;

        try {
            setTasks(current => current.map(t => t.id === taskId ? { ...t, processing: true } : t));
            const updatedTask = await reviewCourseTask(taskId, status, remark || ""); // Send saved remark
            setTasks(current => current.map(t => t.id === taskId ? updatedTask : t));
            Alert.alert("Success", `Task ${status === 'YES' ? 'Approved' : 'Rejected'}.`);
        } catch (error) {
            Alert.alert("Error", "Failed to submit review.");
            fetchData();
        }
    };
    
    const handleBatchApprove = async () => {
        Alert.alert(
            "Approve All Verified",
            "Are you sure you want to approve all tasks that have been verified by the CC?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Approve All", 
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const res = await batchReviewCourseTasks(assignmentId, 'YES', "Batch Approved");
                            if (res.count === 0) {
                                Alert.alert("Info", "No new tasks to approve.");
                            } else {
                                Alert.alert("Success", `Approved ${res.count} tasks.`);
                                fetchData();
                            }
                        } catch(e) {
                            Alert.alert("Error", "Batch approval failed.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Remark Logic
    const openRemarkModal = (task) => {
        let existing = "";
        if (userRole === 'CC') existing = task.ccRemarks;
        if (userRole === 'HOD') existing = task.hodRemarks;
        setRemarkModal({ visible: true, taskId: task.id, text: existing || '' });
    };

    const saveRemark = async () => {
        try {
            const task = tasks.find(t => t.id === remarkModal.taskId);
            let status = 'PENDING'; 
            if (userRole === 'CC') status = task.ccStatus;
            if (userRole === 'HOD') status = task.hodStatus; // Keep existing status

            const updated = await reviewCourseTask(remarkModal.taskId, status || 'PENDING', remarkModal.text);
            
            setTasks(current => current.map(t => t.id === remarkModal.taskId ? updated : t));
            setRemarkModal({ ...remarkModal, visible: false });
            Alert.alert("Saved", "Remarks saved.");
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to save remarks.");
        }
    };

    // Deadline Logic
    const openDeadlineModal = (task) => {
        setSelectedTask(task);
        const date = new Date(task.deadline);
        const formatted = isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
        setNewDeadline(formatted);
        setModalVisible(true);
    };

    const saveDeadline = async () => {
        if (!newDeadline.match(/^\d{4}-\d{2}-\d{2}$/)) {
            Alert.alert("Invalid Format", "Use YYYY-MM-DD");
            return;
        }
        try {
            const updated = await updateCourseFileTaskDeadline(selectedTask.id, newDeadline);
            setTasks(current => current.map(t => t.id === selectedTask.id ? { ...t, deadline: updated.deadline } : t));
            setModalVisible(false);
            Alert.alert("Success", "Deadline updated");
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to update deadline");
        }
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <View>
                        <AppText variant="caption" style={styles.eyebrow}>Reviewing Course File</AppText>
                        <AppText variant="h3" style={styles.headerTitle}>{assignmentDetails.faculty || 'Faculty'} - {assignmentDetails.subject || 'Subject'}</AppText>
                    </View>
                </View>
                
                {/* HOD Batch Approve Button */}
                {userRole === 'HOD' && (
                    <TouchableOpacity style={styles.batchBtn} onPress={handleBatchApprove}>
                        <Ionicons name="checkmark-done-circle" size={20} color={COLORS.white} />
                        <AppText variant="small" style={{color: COLORS.white, marginLeft: 4, fontWeight:'bold'}}>Approve All</AppText>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {tasks.length > 0 ? tasks.map((item) => {
                        const isCompleted = item.status === 'COMPLETED';
                        const ccApproved = item.ccStatus === 'YES';
                        const ccRejected = item.ccStatus === 'NO';
                        const hodApproved = item.hodStatus === 'YES';
                        
                        return (
                            <View key={item.id} style={styles.reviewCard}>
                                {/* Header: Title & Deadline Button */}
                                <View style={styles.cardHeader}>
                                    <View style={{flex: 1}}>
                                        <AppText style={styles.itemTitle}>{item.template.title}</AppText>
                                        
                                        {/* Distinct Deadline Button */}
                                        <TouchableOpacity 
                                            style={styles.deadlineBtn} 
                                            onPress={() => openDeadlineModal(item)}
                                        >
                                            <Ionicons name="calendar" size={14} color={COLORS.primary} />
                                            <AppText variant="caption" style={{color: COLORS.primary, marginLeft: 4, fontWeight:'600'}}>
                                                Due: {new Date(item.deadline).toLocaleDateString()}
                                            </AppText>
                                            <View style={styles.editBadge}>
                                                <Ionicons name="pencil" size={10} color={COLORS.white} />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    
                                    <View style={[
                                        styles.statusBadge, 
                                        isCompleted ? styles.statusSuccess : styles.statusPending
                                    ]}>
                                        <AppText variant="small" style={[
                                            styles.statusText,
                                            isCompleted ? styles.textSuccess : styles.textPending
                                        ]}>
                                            {isCompleted ? 'Done' : 'Pending'}
                                        </AppText>
                                    </View>
                                </View>

                                {/* Timestamp if completed */}
                                {item.completedAt && (
                                    <AppText variant="caption" style={styles.timestamp}>Submitted: {new Date(item.completedAt).toLocaleString()}</AppText>
                                )}

                                {/* Review Controls */}
                                {isCompleted ? (
                                    <View style={styles.controlsContainer}>
                                        
                                        {/* 2-Level Status Display with Sequential Logic */}
                                        <View style={styles.reviewStatusRow}>
                                            {/* CC Status Block */}
                                            <View style={styles.statusBlock}>
                                                <AppText variant="caption" style={styles.statusLabel}>CC Verification</AppText>
                                                <View style={[styles.statusIndicator, ccApproved ? styles.bgSuccess : ccRejected ? styles.bgError : styles.bgPending]}>
                                                    <Ionicons name={ccApproved ? "checkmark" : ccRejected ? "close" : "time"} size={14} color={COLORS.white} />
                                                    <AppText variant="small" style={{color: COLORS.white, marginLeft: 4}}>
                                                        {ccApproved ? 'Verified' : ccRejected ? 'Returned' : 'Pending'}
                                                    </AppText>
                                                </View>
                                                {item.ccRemarks && <AppText variant="caption" style={styles.remarksText}>"{item.ccRemarks}"</AppText>}
                                            </View>

                                            <View style={styles.arrowBlock}>
                                                <Ionicons name="arrow-forward" size={16} color={COLORS.textLight} />
                                            </View>

                                            {/* HOD Status Block */}
                                            <View style={styles.statusBlock}>
                                                <AppText variant="caption" style={styles.statusLabel}>HOD Approval</AppText>
                                                <View style={[styles.statusIndicator, hodApproved ? styles.bgSuccess : item.hodStatus === 'NO' ? styles.bgError : styles.bgPending]}>
                                                    <Ionicons name={hodApproved ? "checkmark" : item.hodStatus === 'NO' ? "close" : "time"} size={14} color={COLORS.white} />
                                                    <AppText variant="small" style={{color: COLORS.white, marginLeft: 4}}>
                                                        {hodApproved ? 'Approved' : item.hodStatus === 'NO' ? 'Rejected' : 'Pending'}
                                                    </AppText>
                                                </View>
                                                {item.hodRemarks && <AppText variant="caption" style={styles.remarksText}>"{item.hodRemarks}"</AppText>}
                                            </View>
                                        </View>

                                        {/* Action Section */}
                                        <View style={styles.actionSection}>
                                            <AppText variant="caption" style={{marginBottom: 8, marginTop: 12, fontWeight: '600'}}>Your Review:</AppText>
                                            
                                            <View style={styles.actionButtonsRow}>
                                                <TouchableOpacity 
                                                    style={[styles.actionBtn, styles.btnApprove]}
                                                    onPress={() => handleAction(item.id, 'YES')}
                                                >
                                                    <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
                                                    <AppText variant="small" style={styles.btnTextSuccess}>Approve</AppText>
                                                </TouchableOpacity>

                                                <TouchableOpacity 
                                                    style={[styles.actionBtn, styles.btnReject]}
                                                    onPress={() => handleAction(item.id, 'NO')}
                                                >
                                                    <Ionicons name="close-circle-outline" size={20} color={COLORS.error} />
                                                    <AppText variant="small" style={styles.btnTextError}>Return</AppText>
                                                </TouchableOpacity>
                                            </View>

                                            {/* Add Remark Button */}
                                            <TouchableOpacity style={styles.addRemarkBtn} onPress={() => openRemarkModal(item)}>
                                                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                                                <AppText style={{color: COLORS.primary, marginLeft: 6}}>
                                                    {(userRole === 'CC' ? item.ccRemarks : item.hodRemarks) ? 'Edit Remarks' : 'Add Remarks'}
                                                </AppText>
                                            </TouchableOpacity>

                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.pendingMessage}>
                                        <AppText variant="caption" style={{color: COLORS.textLight}}>Waiting for faculty submission...</AppText>
                                    </View>
                                )}
                            </View>
                        );
                    }) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="checkmark-done-circle-outline" size={80} color={COLORS.success + '40'} />
                            <AppText variant="h3" style={styles.emptyTitle}>All Caught Up!</AppText>
                            <AppText style={styles.emptySubtitle}>There are no tasks pending for your review at the moment.</AppText>
                            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                                <AppText style={styles.backBtnText}>Go Back</AppText>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Remarks Modal */}
            <Modal
                transparent={true}
                visible={remarkModal.visible}
                animationType="fade"
                onRequestClose={() => setRemarkModal({...remarkModal, visible: false})}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <AppText variant="h3" style={{marginBottom: SPACING.m}}>Add Remarks</AppText>
                        
                        <TextInput
                            style={styles.modalInput}
                            value={remarkModal.text}
                            onChangeText={(text) => setRemarkModal({...remarkModal, text})}
                            placeholder="Type your remarks here..."
                            multiline
                            textAlignVertical="top"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setRemarkModal({...remarkModal, visible: false})} style={styles.modalBtnCancel}>
                                <AppText style={{color: COLORS.textSecondary}}>Cancel</AppText>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveRemark} style={styles.modalBtnSave}>
                                <AppText style={{color: COLORS.white, fontWeight: '600'}}>Save</AppText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Deadline Edit Modal */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <AppText variant="h3" style={{marginBottom: SPACING.m}}>Set Deadline</AppText>
                        <AppText variant="body2" style={{marginBottom: SPACING.s}}>For: {selectedTask?.template?.title}</AppText>
                        
                        <AppText variant="caption" style={{marginBottom: 4, color: COLORS.textSecondary}}>Format: YYYY-MM-DD</AppText>
                        <TextInput
                            style={styles.modalInput}
                            value={newDeadline}
                            onChangeText={setNewDeadline}
                            placeholder="YYYY-MM-DD"
                            keyboardType="numbers-and-punctuation"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBtnCancel}>
                                <AppText style={{color: COLORS.textSecondary}}>Cancel</AppText>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveDeadline} style={styles.modalBtnSave}>
                                <AppText style={{color: COLORS.white, fontWeight: '600'}}>Save</AppText>
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
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.m,
        paddingBottom: SPACING.l,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        marginRight: SPACING.m,
    },
    eyebrow: {
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        fontSize: 10,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        color: COLORS.textPrimary,
    },
    batchBtn: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: LAYOUT.radius.m,
        alignItems: 'center',
    },
    scrollContent: {
        padding: SPACING.m,
        paddingBottom: hp(12),
    },
    reviewCard: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    deadlineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#EFF6FF',
        borderRadius: 4,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    editBadge: {
        marginLeft: 6,
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        width: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    statusSuccess: { backgroundColor: '#ECFDF5' }, // light green
    statusPending: { backgroundColor: '#F3F4F6' }, // light grey
    statusText: { fontWeight: '600', fontSize: 10 },
    textSuccess: { color: COLORS.success },
    textPending: { color: COLORS.textSecondary },
    timestamp: {
        color: COLORS.textLight,
        marginBottom: SPACING.m,
    },
    controlsContainer: {
        marginTop: SPACING.s,
        paddingTop: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.surface,
    },
    reviewStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.m,
        backgroundColor: COLORS.surfaceLight,
        padding: SPACING.s,
        borderRadius: LAYOUT.radius.s,
    },
    statusBlock: {
        flex: 1,
        alignItems: 'center',
    },
    arrowBlock: {
        paddingHorizontal: SPACING.s,
    },
    statusLabel: {
        marginBottom: 4,
        fontSize: 10,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 80,
        justifyContent: 'center',
    },
    bgSuccess: { backgroundColor: COLORS.success },
    bgError: { backgroundColor: COLORS.error },
    bgPending: { backgroundColor: COLORS.textLight },
    
    remarksText: {
        marginTop: 4,
        fontStyle: 'italic',
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    actionSection: {
        marginTop: SPACING.s,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
        marginTop: SPACING.s,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: 8,
        borderRadius: LAYOUT.radius.round,
        borderWidth: 1,
        marginRight: SPACING.s,
        flex: 1,
        justifyContent: 'center',
    },
    btnApprove: {
        backgroundColor: '#ECFDF5', 
        borderColor: COLORS.success,
    },
    btnReject: {
        backgroundColor: '#FEF2F2',
        borderColor: COLORS.error,
    },
    btnTextSuccess: {
        marginLeft: 4,
        fontWeight: '600',
        color: COLORS.success,
    },
    btnTextError: {
        marginLeft: 4,
        fontWeight: '600',
        color: COLORS.error,
    },
    remarksInput: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.s,
        paddingHorizontal: SPACING.m,
        paddingVertical: 8,
        fontSize: 14,
        color: COLORS.textPrimary,
        minHeight: 40,
        textAlignVertical: 'center',
    },
    pendingMessage: {
        marginTop: SPACING.s,
        fontStyle: 'italic',
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
    addRemarkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary, // or borderStyle: 'dashed'
        borderRadius: LAYOUT.radius.s,
        marginTop: 8,
        borderStyle: 'dashed',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: LAYOUT.radius.s,
        padding: SPACING.m,
        fontSize: 16,
        marginBottom: SPACING.m,
        minHeight: 100, // Taller for remarks
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.m,
    },
    modalBtnCancel: {
        padding: SPACING.m,
    },
    modalBtnSave: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        borderRadius: LAYOUT.radius.s,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        marginTop: hp(10),
    },
    emptyTitle: {
        marginTop: SPACING.m,
        color: COLORS.textPrimary,
    },
    emptySubtitle: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: SPACING.s,
        marginBottom: SPACING.xl,
    },
    backBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.m,
        borderRadius: LAYOUT.radius.m,
    },
    backBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
    }
});

export default CourseFileReviewScreen;
