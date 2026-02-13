import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Switch, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, SPACING, LAYOUT } from '../../constants/theme';
import { hp } from '../../utils/responsive';
import { getCourseTasks, completeCourseTask, revertCourseTask, getMyProfile, getAssignmentTasks } from '../../services/api';

const ChecklistScreen = () => {
    const router = useRouter();
    const { assignmentId } = useLocalSearchParams();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignmentInfo, setAssignmentInfo] = useState({ subject: '', class: '' });
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, [assignmentId]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            // Get user profile for role checks if not already fetched
            if (!userRole) {
                const profile = await getMyProfile();
                setUserRole(profile.user.role);
            }

            // Optimization: Fetch only tasks for the specific assignment instead of all tasks
            const data = await getAssignmentTasks(assignmentId);
            setTasks(data);
            
            if (data.length > 0) {
                setAssignmentInfo({
                    subject: data[0].assignment.subject.name,
                    class: data[0].assignment.class.name
                });
            }
        } catch (error) {
            console.log("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskCompletion = async (taskId, currentStatus, ccStatus, hodStatus) => {
        const isRejected = ccStatus === 'NO' || hodStatus === 'NO';
        
        // If unchecking (Reverting to Pending)
        if (currentStatus === 'COMPLETED' && !isRejected) {
             // Check if already reviewed by HOD (most locked state)
             // EXCEPTION: If the current user IS the HOD or CC, they can revert their OWN tasks 
             // even if auto-approved because they own the subject.
             const canRevert = (userRole === 'HOD') || (userRole === 'CC') || (hodStatus === 'PENDING');

             if (!canRevert) {
                Alert.alert("Locked", "This task has already been reviewed by HOD and cannot be changed.");
                return;
             }

             Alert.alert(
                "Confirm Undo",
                "Do you want to mark this task as NOT COMPLETED? This will reset all approvals.",
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Yes, Revert", 
                        onPress: async () => {
                            try {
                                setTasks(current => current.map(t => t.id === taskId ? { ...t, processing: true } : t));
                                await revertCourseTask(taskId);
                                Alert.alert("Success", "Task status reverted to pending");
                                fetchTasks();
                            } catch (error) {
                                Alert.alert("Error", error.message || "Failed to revert task status");
                                setTasks(current => current.map(t => t.id === taskId ? { ...t, processing: false } : t));
                            }
                        } 
                    }
                ]
             );
             return; 
        }

        Alert.alert(
            "Confirm Completion",
            "Mark this task as completed?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Confirm", 
                    onPress: async () => {
                        try {
                            setTasks(current => current.map(t => t.id === taskId ? { ...t, processing: true } : t));
                            await completeCourseTask(taskId);
                            Alert.alert("Success", "Task submitted successfully");
                            fetchTasks();
                        } catch (error) {
                            Alert.alert("Error", error.message || "Failed to update task status");
                            setTasks(current => current.map(t => t.id === taskId ? { ...t, processing: false } : t));
                        }
                    } 
                }
            ]
        );
    };

    // Calculate progress
    const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
    const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            
            {/* Header Section */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                
                <View style={styles.headerContent}>
                    <AppText variant="h2" style={styles.title}>{assignmentInfo.subject || 'Course File'}</AppText>
                    <AppText variant="body2" style={{marginBottom: SPACING.m, color: COLORS.textSecondary}}>{assignmentInfo.class}</AppText>
                    
                    <View style={styles.progressContainer}>
                        <View style={styles.progressInfo}>
                            <AppText variant="caption" style={styles.progressLabel}>Course File Progress</AppText>
                            <AppText variant="caption" style={styles.progressValue}>{progressPercent}% Completed</AppText>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                        </View>
                    </View>
                </View>
            </View>

            {/* Tasks List */}
            {loading ? (
                <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {tasks.map((task) => {
                        const isRejected = task.ccStatus === 'NO' || task.hodStatus === 'NO';
                        const isCompleted = task.status === 'COMPLETED';

                        return (
                            <View key={task.id} style={[styles.taskCard, isRejected && { borderLeftColor: COLORS.error, borderLeftWidth: 4 }]}>
                                {isRejected && (
                                    <View style={styles.returnedBanner}>
                                        <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                                        <AppText variant="small" style={{ color: COLORS.error, marginLeft: 4, fontWeight: '700' }}>
                                            RETURNED FOR REVISION
                                        </AppText>
                                    </View>
                                )}
                                
                                {/* Task Title Row */}
                                <View style={styles.taskRow}>
                                    <View style={{flex: 1, marginRight: SPACING.s}}>
                                        <AppText style={[
                                            styles.taskTitle, 
                                            isCompleted && !isRejected && styles.taskTitleCompleted
                                        ]}>
                                            {task.template.title}
                                        </AppText>
                                        {task.template.description && (
                                            <AppText variant="caption" style={{color: COLORS.textLight, marginTop: 2}}>
                                                {task.template.description}
                                            </AppText>
                                        )}
                                    </View>
                                    
                                    {task.processing ? (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    ) : !isRejected && (
                                        <Switch
                                            trackColor={{ false: COLORS.inputBorder, true: COLORS.success }}
                                            thumbColor={COLORS.white}
                                            ios_backgroundColor={COLORS.inputBorder}
                                            onValueChange={() => handleTaskCompletion(task.id, task.status, task.ccStatus, task.hodStatus)}
                                            value={isCompleted}
                                            disabled={isCompleted && !((userRole === 'HOD') || (userRole === 'CC') || (task.hodStatus === 'PENDING'))} 
                                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                        />
                                    )}
                                </View>

                                {/* Task Details Row (Status/Action) */}
                                <View style={styles.taskFooter}>
                                    {isCompleted && !isRejected ? (
                                        <View style={styles.statusBadgeCompleted}>
                                            <Ionicons 
                                                name="checkmark-circle" 
                                                size={14} 
                                                color={COLORS.success} 
                                            />
                                            <AppText variant="small" style={styles.statusTextCompleted}>
                                                Submitted
                                            </AppText>
                                        </View>
                                    ) : isRejected ? (
                                        <TouchableOpacity 
                                            style={[styles.resubmitBtn, task.processing && { opacity: 0.7 }]}
                                            onPress={() => !task.processing && handleTaskCompletion(task.id, task.status, task.ccStatus, task.hodStatus)}
                                            disabled={task.processing}
                                        >
                                            {task.processing ? (
                                                <ActivityIndicator size="small" color={COLORS.white} />
                                            ) : (
                                                <>
                                                    <Ionicons name="reload" size={14} color={COLORS.white} />
                                                    <AppText variant="small" style={styles.resubmitText}>Mark as Resolve & Re-submit</AppText>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.actionsContainer}>
                                            {task.deadline ? (
                                                <View style={styles.dueDateBadge}>
                                                    <AppText variant="small" style={styles.dueDateText}>
                                                        Due: {new Date(task.deadline).toLocaleDateString('en-US', {month:'short', day:'numeric'})}
                                                    </AppText>
                                                </View>
                                            ) : (
                                                <View style={[styles.dueDateBadge, {borderColor: COLORS.border, backgroundColor: COLORS.surface}]}>
                                                    <AppText variant="small" style={{color: COLORS.textSecondary}}>No Deadline</AppText>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                                
                                {/* Review Status Info */}
                                {(task.ccStatus !== 'PENDING' || task.hodStatus !== 'PENDING') && (
                                    <View style={{marginTop: 8, padding: 8, backgroundColor: COLORS.surface, borderRadius: 4, flexDirection: 'row', flexWrap:'wrap', gap: 12}}>
                                        {task.ccStatus !== 'PENDING' && (
                                            <View style={{flexDirection:'row', alignItems:'center'}}>
                                                <AppText variant="caption" style={{marginRight: 4, fontWeight:'600', color: COLORS.textSecondary}}>CC:</AppText>
                                                {task.ccStatus === 'YES' ? (
                                                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} /> 
                                                ) : (
                                                    <View style={{flexDirection:'row', alignItems:'center'}}>
                                                        <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                                                        <AppText variant="caption" style={{color: COLORS.error, marginLeft: 2}}>Returned</AppText>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                        
                                        {task.hodStatus !== 'PENDING' && (
                                            <View style={{flexDirection:'row', alignItems:'center'}}>
                                                <AppText variant="caption" style={{marginRight: 4, fontWeight:'600', color: COLORS.textSecondary}}>HOD:</AppText>
                                                {task.hodStatus === 'YES' ? (
                                                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} /> 
                                                ) : (
                                                    <View style={{flexDirection:'row', alignItems:'center'}}>
                                                        <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                                                        <AppText variant="caption" style={{color: COLORS.error, marginLeft: 2}}>Returned</AppText>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                        
                                        {(task.ccRemarks || task.hodRemarks) && (
                                            <View style={{width: '100%', marginTop: 4, padding: 8, backgroundColor: '#FEF2F2', borderRadius: 4, borderLeftWidth: 3, borderLeftColor: COLORS.error}}>
                                                <AppText variant="caption" style={{color: COLORS.textPrimary, fontWeight: '600'}}>Remarks:</AppText>
                                                <AppText variant="caption" style={{color: COLORS.error, fontStyle: 'italic', marginTop: 2}}>
                                                    "{task.ccRemarks || task.hodRemarks}"
                                                </AppText>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                    {tasks.length === 0 && (
                        <View style={{padding: SPACING.l, alignItems:'center'}}>
                             <AppText style={{color: COLORS.textSecondary}}>No tasks found for this assignment.</AppText>
                        </View>
                    )}
                </ScrollView>
            )}

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.m,
        paddingBottom: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        marginBottom: SPACING.s,
    },
    title: {
        marginBottom: SPACING.m,
    },
    progressContainer: {
        width: '100%',
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    progressLabel: {
        color: COLORS.textSecondary,
    },
    progressValue: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: COLORS.surface,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    scrollContent: {
        padding: SPACING.m,
        paddingBottom: hp(12), // Space for footer
    },
    taskCard: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    taskRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    taskTitle: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '500'
    },
    taskTitleCompleted: {
        color: COLORS.textSecondary,
        textDecorationLine: 'line-through'
    },
    taskFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadgeCompleted: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5', // Light green bg
        paddingHorizontal: SPACING.s,
        paddingVertical: 4,
        borderRadius: LAYOUT.radius.s,
    },
    statusTextCompleted: {
        color: COLORS.success,
        marginLeft: 4,
        fontWeight: '600',
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-between'
    },
    dueDateBadge: {
        backgroundColor: '#FEF2F2', // Light red bg
        paddingHorizontal: SPACING.s,
        paddingVertical: 4,
        borderRadius: LAYOUT.radius.s,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    dueDateText: {
        color: COLORS.error,
        fontWeight: '600',
    },
    returnedBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        padding: 6,
        borderRadius: 4,
        marginBottom: SPACING.s,
    },
    resubmitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.m,
        paddingVertical: 6,
        borderRadius: 4,
        gap: 6
    },
    resubmitText: {
        color: COLORS.white,
        fontWeight: '600',
    }
});

export default ChecklistScreen;
