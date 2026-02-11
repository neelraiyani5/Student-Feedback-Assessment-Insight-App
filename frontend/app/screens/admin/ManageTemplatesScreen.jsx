import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getTemplates, deleteTemplate } from '../../services/api';

const ManageTemplatesScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState([]);

    useFocusEffect(
        React.useCallback(() => {
            fetchTemplates();
        }, [])
    );

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await getTemplates();
            setTemplates(data || []);
        } catch (error) {
            console.log("Error fetching templates", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (template) => {
        Alert.alert(
            "Delete Template",
            `Are you sure you want to delete "${template.title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: 'destructive', onPress: async () => {
                    try {
                        await deleteTemplate(template.id);
                        fetchTemplates(); // Refresh
                        Alert.alert("Success", "Template deleted");
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete template");
                    }
                }}
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={{flex: 1}}>
                <AppText style={styles.title}>{item.title}</AppText>
                <AppText variant="caption" style={styles.desc} numberOfLines={2}>
                    {item.description || 'No description'}
                </AppText>
                <AppText variant="caption" style={{color: COLORS.textLight, marginTop: 4}}>
                    {item.questions?.length || 0} Questions
                </AppText>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity 
                    onPress={() => router.push({ pathname: '/feedback/template/create', params: { id: item.id } })}
                    style={[styles.iconBtn, {backgroundColor: COLORS.surface}]}
                >
                    <Ionicons name="pencil" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => handleDelete(item)}
                    style={[styles.iconBtn, {backgroundColor: COLORS.error + '10'}]}
                >
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                     <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h3">Manage Templates</AppText>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <AppText style={{marginTop: 12, color: COLORS.textSecondary}}>Loading templates...</AppText>
                </View>
            ) : (
                <FlatList 
                    data={templates}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <AppText style={styles.emptyText}>No templates found. Create one!</AppText>
                        </View>
                    }
                />
            )}

            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => router.push('/feedback/template/create')}
            >
                <Ionicons name="add" size={30} color={COLORS.white} />
            </TouchableOpacity>

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
    listContent: {
        padding: SPACING.m,
        paddingBottom: 80
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
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
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4
    },
    desc: {
        color: COLORS.textSecondary
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginLeft: 12
    },
    iconBtn: {
        padding: 8,
        borderRadius: 8
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50
    },
    emptyText: {
        color: COLORS.textSecondary
    }
});

export default ManageTemplatesScreen;
