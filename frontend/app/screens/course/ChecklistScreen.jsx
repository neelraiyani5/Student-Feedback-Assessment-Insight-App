import React, { useState } from 'react';
import { StyleSheet, View, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';

// Mock Data
const TASKS_DATA = [
  { id: '1', title: '1. Vision & Mission Alignment', completed: true, dueDate: null },
  { id: '2', title: '2. CO-PO-PSO Mapping', completed: false, dueDate: 'Oct 20' },
  { id: '3', title: '3. Lesson Plan', completed: true, dueDate: null },
  { id: '4', title: '4. Question Bank', completed: false, dueDate: 'Oct 25' },
  { id: '5', title: '5. Assignment 1', completed: false, dueDate: 'Nov 01' },
];

const ChecklistScreen = () => {
    const router = useRouter();
    const [tasks, setTasks] = useState(TASKS_DATA);

    // Calculate progress
    const completedCount = tasks.filter(t => t.completed).length;
    const progressPercent = Math.round((completedCount / tasks.length) * 100);

    const toggleTask = (id) => {
        setTasks(currentTasks => 
            currentTasks.map(task => 
                task.id === id ? { ...task, completed: !task.completed } : task
            )
        );
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            
            {/* Header Section */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                
                <View style={styles.headerContent}>
                    <AppText variant="h2" style={styles.title}>Data Structures (CSE-501)</AppText>
                    
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
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {tasks.map((task) => (
                    <View key={task.id} style={styles.taskCard}>
                        {/* Task Title Row */}
                        <View style={styles.taskRow}>
                            <AppText style={[
                                styles.taskTitle, 
                                task.completed && styles.taskTitleCompleted
                            ]}>
                                {task.title}
                            </AppText>
                            <Switch
                                trackColor={{ false: COLORS.inputBorder, true: COLORS.success }}
                                thumbColor={COLORS.white}
                                ios_backgroundColor={COLORS.inputBorder}
                                onValueChange={() => toggleTask(task.id)}
                                value={task.completed}
                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                            />
                        </View>

                        {/* Task Details Row (Status/Action) */}
                        <View style={styles.taskFooter}>
                            {task.completed ? (
                                <View style={styles.statusBadgeCompleted}>
                                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                                    <AppText variant="small" style={styles.statusTextCompleted}>Completed</AppText>
                                </View>
                            ) : (
                                <View style={styles.actionsContainer}>
                                    {task.dueDate && (
                                        <View style={styles.dueDateBadge}>
                                            <AppText variant="small" style={styles.dueDateText}>Due: {task.dueDate}</AppText>
                                        </View>
                                    )}
                                    <TouchableOpacity style={styles.uploadButton}>
                                        <Ionicons name="cloud-upload-outline" size={18} color={COLORS.primary} />
                                        <AppText variant="small" style={styles.uploadText}>Upload</AppText>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Sticky Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.saveButton}>
                    <AppText style={styles.saveButtonText}>Save Progress</AppText>
                </TouchableOpacity>
            </View>

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
        flex: 1,
        marginRight: SPACING.s,
    },
    taskTitleCompleted: {
        color: COLORS.textSecondary,
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
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.s,
        paddingVertical: 4,
    },
    uploadText: {
        color: COLORS.primary,
        marginLeft: 4,
        fontWeight: '500',
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
        elevation: 10,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: LAYOUT.radius.round,
        paddingVertical: SPACING.m,
        alignItems: 'center',
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    }
});

export default ChecklistScreen;
