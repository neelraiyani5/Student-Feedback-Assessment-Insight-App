import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { updateUser } from '../../services/api';

const FacultyDetailScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    // params contains user data passed as string or individual fields. 
    // Best practice: Pass ID and fetch, but for simplicity/speed we can pass object.
    
    // Parse params (Expo router passes strings)
    const initialUser = {
        id: params.id,
        userId: params.userId,
        name: params.name,
        email: params.email,
        role: params.role
    };

    const [formData, setFormData] = useState(initialUser);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);

    const handleUpdate = async () => {
        if (!formData.name || !formData.email || !formData.userId) {
            Alert.alert("Error", "All fields are required");
            return;
        }

        setLoading(true);
        try {
            await updateUser(formData.id, {
                name: formData.name,
                email: formData.email,
                userId: formData.userId
            });
            Alert.alert("Success", "Faculty details updated successfully");
            setEditing(false);
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to update faculty");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3">Faculty Details</AppText>
                <TouchableOpacity 
                    onPress={() => setEditing(!editing)} 
                    style={styles.editButton}
                >
                    <AppText style={styles.editButtonText}>{editing ? "Cancel" : "Edit"}</AppText>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Profile Avatar */}
                <View style={styles.avatarCard}>
                    <View style={styles.avatar}>
                        <AppText variant="h1" style={styles.avatarText}>{formData.name?.[0]?.toUpperCase()}</AppText>
                    </View>
                    <AppText variant="h2">{formData.name}</AppText>
                    <AppText style={styles.roleBadge}>{formData.role}</AppText>
                </View>

                {/* Details Form */}
                <View style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <AppText style={styles.label}>Full Name</AppText>
                        <TextInput 
                            style={[styles.input, !editing && styles.disabledInput]}
                            value={formData.name}
                            onChangeText={(t) => setFormData({...formData, name: t})}
                            editable={editing}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <AppText style={styles.label}>Faculty ID</AppText>
                        <TextInput 
                            style={[styles.input, !editing && styles.disabledInput]}
                            value={formData.userId}
                            onChangeText={(t) => setFormData({...formData, userId: t})}
                            editable={editing}
                            autoCapitalize="characters"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <AppText style={styles.label}>Email Address</AppText>
                        <TextInput 
                            style={[styles.input, !editing && styles.disabledInput]}
                            value={formData.email}
                            onChangeText={(t) => setFormData({...formData, email: t})}
                            editable={editing}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {editing && (
                        <TouchableOpacity 
                            style={[styles.saveButton, loading && { opacity: 0.7 }]}
                            onPress={handleUpdate}
                            disabled={loading}
                        >
                            <AppText style={styles.saveButtonText}>
                                {loading ? "Saving..." : "Save Changes"}
                            </AppText>
                        </TouchableOpacity>
                    )}
                </View>
                
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
                    <AppText style={styles.infoText}>
                        Password can only be reset by the user or via a reset request.
                    </AppText>
                </View>

            </ScrollView>
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
    backButton: {
        padding: SPACING.xs,
    },
    editButton: {
        paddingHorizontal: SPACING.m,
        paddingVertical: 6,
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.m,
    },
    editButtonText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    content: {
        padding: SPACING.m,
    },
    avatarCard: {
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarText: {
        color: COLORS.primary,
        fontSize: 32,
    },
    roleBadge: {
        marginTop: SPACING.xs,
        backgroundColor: '#E0F7FA',
        color: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: '600',
    },
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.l,
        padding: SPACING.l,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputGroup: {
        marginBottom: SPACING.m,
    },
    label: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.m,
        fontSize: 16,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    disabledInput: {
        backgroundColor: COLORS.surfaceLight,
        color: COLORS.textSecondary,
        borderColor: 'transparent',
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.round,
        alignItems: 'center',
        marginTop: SPACING.s,
    },
    saveButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 16,
    },
    infoBox: {
        flexDirection: 'row',
        marginTop: SPACING.l,
        padding: SPACING.m,
        alignItems: 'center',
    },
    infoText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginLeft: SPACING.s,
        fontStyle: 'italic',
        flex: 1,
    }
});

export default FacultyDetailScreen;
