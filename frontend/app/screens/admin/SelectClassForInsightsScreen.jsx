import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import AppText from "../../components/AppText";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS, SPACING, LAYOUT } from "../../constants/theme";
import { getMyProfile, getDepartmentOverview } from "../../services/api";

const SelectClassForInsightsScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [department, setDepartment] = useState(null);
    const [selectionStage, setSelectionStage] = useState("semester"); // 'semester' | 'class'
    const [selectedSemester, setSelectedSemester] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const userData = await getMyProfile();
            if (userData.user.hodDepartments?.length > 0) {
                const deptId = userData.user.hodDepartments[0].id;
                const deptData = await getDepartmentOverview(deptId);
                setDepartment(deptData);
            }
        } catch (error) {
            console.error("Error fetching management data", error);
        } finally {
            setLoading(false);
            setRefreshing(true);
        }
    };

    const handleBack = () => {
        if (selectionStage === "class") {
            setSelectionStage("semester");
            setSelectedSemester(null);
        } else {
            router.back();
        }
    };

    const handleSelectSemester = (sem) => {
        setSelectedSemester(sem);
        setSelectionStage("class");
    };

    const handleSelectClass = (cls) => {
        router.push({
            pathname: "/class-insights",
            params: { classId: cls.id, className: cls.name }
        });
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View>
                    <AppText variant="h3">Class Insights</AppText>
                    <AppText variant="caption">
                        {selectionStage === "semester" ? "Select Semester" : `Select Class (Sem ${selectedSemester.sem})`}
                    </AppText>
                </View>
            </View>

            {loading ? (
                <View style={[styles.centered, {marginTop: 100}]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.content}
                >
                    {selectionStage === "semester" ? (
                        <View style={styles.grid}>
                            {department?.semesters?.sort((a,b) => a.sem - b.sem).map((sem) => (
                                <TouchableOpacity 
                                    key={sem.id} 
                                    style={styles.card}
                                    onPress={() => handleSelectSemester(sem)}
                                >
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="school-outline" size={32} color={COLORS.primary} />
                                    </View>
                                    <AppText variant="h3" style={styles.cardTitle}>Semester {sem.sem}</AppText>
                                    <AppText variant="caption">{sem.classes?.length || 0} Classes</AppText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.list}>
                            {selectedSemester?.classes?.map((cls) => (
                                <TouchableOpacity 
                                    key={cls.id} 
                                    style={styles.listItem}
                                    onPress={() => handleSelectClass(cls)}
                                >
                                    <View style={styles.listContent}>
                                        <AppText variant="h3">{cls.name}</AppText>
                                        <AppText variant="caption">{cls.cc?.name || "No CC Assigned"}</AppText>
                                    </View>
                                    <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    backButton: { marginRight: 12 },
    content: { padding: SPACING.m },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    card: {
        width: '47%',
        backgroundColor: COLORS.white,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    cardTitle: { marginBottom: 4 },
    list: { gap: 12 },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 12,
        elevation: 1
    },
    listContent: { flex: 1 },
    centered: { alignItems: 'center', justifyContent: 'center' }
});

export default SelectClassForInsightsScreen;
