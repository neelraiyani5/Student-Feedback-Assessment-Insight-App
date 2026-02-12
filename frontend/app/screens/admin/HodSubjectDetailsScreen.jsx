import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Alert, ActivityIndicator } from "react-native";

import { ScrollView } from "react-native";
import { 
    uploadSyllabus, 
    getSyllabus, 
    updateChapter, 
    deleteChapter, 
    updateTopic, 
    deleteTopic,
    getUserInfoFromToken 
} from "../../services/api";

import AppText from "../../components/AppText";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS, SPACING, LAYOUT } from "../../constants/theme";

const HodSubjectDetailsScreen = () => {
  const router = useRouter();
  const { subjectId, subjectName } = useLocalSearchParams();

  const [uploading, setUploading] = React.useState(false);
  const [syllabus, setSyllabus] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [userRole, setUserRole] = React.useState(null);

  React.useEffect(() => {
    fetchSyllabus();
    getUserRole();
  }, [subjectId]);

  const getUserRole = async () => {
    try {
      const userInfo = await getUserInfoFromToken();
      if (userInfo && userInfo.role) {
          setUserRole(userInfo.role);
          console.log("Current user role:", userInfo.role);
      }
    } catch (e) {
      console.error("error fetching role", e);
    }
  };

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const data = await getSyllabus(subjectId);
      setSyllabus(data);
    } catch (error) {
      console.error("Failed to fetch syllabus", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateCourseFile = () => {
    if (userRole === "FACULTY") {
        router.push("/my-course-files");
    } else {
        router.push({
          pathname: "/hod-course-file-review",
          params: { subjectId, subjectName },
        });
    }
  };

  const handleNavigateAssessment = () => {
    router.push({
      pathname: "/assessments",
      params: { subjectId, subjectName },
    });
  };

  const handleUploadSyllabus = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setUploading(true);
      const file = result.assets[0];
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/pdf",
      });

      await uploadSyllabus(subjectId, formData);
      Alert.alert("Success", "Syllabus uploaded and extracted successfully!");
      fetchSyllabus(); // Refresh list
    } catch (error) {
       console.error("Upload failed", error);
       Alert.alert("Error", "Failed to upload syllabus. Make sure it's a valid PDF.");
    } finally {
      setUploading(false);
    }
  };

  const handleEditChapter = (chapter) => {
    Alert.prompt(
      "Edit Chapter",
      "Enter new chapter title:",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Update", 
          onPress: async (newTitle) => {
            if (!newTitle) return;
            try {
              await updateChapter(chapter.id, { title: newTitle });
              fetchSyllabus();
            } catch (error) {
              Alert.alert("Error", "Failed to update chapter");
            }
          }
        }
      ],
      "plain-text",
      chapter.title
    );
  };

  const handleDeleteChapter = (chapterId) => {
    Alert.alert(
      "Delete Chapter",
      "Are you sure you want to delete this chapter and all its topics?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteChapter(chapterId);
              fetchSyllabus();
            } catch (error) {
              Alert.alert("Error", "Failed to delete chapter");
            }
          }
        }
      ]
    );
  };

  const handleEditTopic = (topic) => {
    Alert.prompt(
      "Edit Topic",
      "Enter new topic name:",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Update", 
          onPress: async (newName) => {
            if (!newName) return;
            try {
              await updateTopic(topic.id, { name: newName });
              fetchSyllabus();
            } catch (error) {
              Alert.alert("Error", "Failed to update topic");
            }
          }
        }
      ],
      "plain-text",
      topic.name
    );
  };

  const handleDeleteTopic = (topicId) => {
    Alert.alert(
      "Delete Topic",
      "Are you sure you want to delete this topic?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTopic(topicId);
              fetchSyllabus();
            } catch (error) {
              Alert.alert("Error", "Failed to delete topic");
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.surfaceLight} withPadding={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: SPACING.m }}>
          <AppText variant="h2" style={styles.headerTitle}>
            {subjectName}
          </AppText>
          <AppText variant="body2" color={COLORS.textSecondary}>
            Subject Details & Syllabus
          </AppText>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <AppText variant="h3" style={styles.sectionTitle}>
          Manage Subject
        </AppText>

        <View style={styles.optionsRow}>
            {/* Course File Card */}
            <TouchableOpacity
            style={styles.miniCard}
            onPress={handleNavigateCourseFile}
            >
            <View style={[styles.miniIconContainer, { backgroundColor: "#3B82F6" }]}>
                <Ionicons name="document-text" size={24} color={COLORS.white} />
            </View>
            <AppText style={styles.miniCardTitle}>Course File</AppText>
            </TouchableOpacity>

            {/* Manage Assessment Card */}
            <TouchableOpacity
            style={styles.miniCard}
            onPress={handleNavigateAssessment}
            >
            <View
                style={[styles.miniIconContainer, { backgroundColor: COLORS.primary }]}
            >
                <Ionicons name="clipboard" size={24} color={COLORS.white} />
            </View>
            <AppText style={styles.miniCardTitle}>Assessment</AppText>
            </TouchableOpacity>

            {/* Upload Syllabus Card */}
            <TouchableOpacity
            style={styles.miniCard}
            onPress={handleUploadSyllabus}
            disabled={uploading}
            >
            <View
                style={[styles.miniIconContainer, { backgroundColor: COLORS.secondary }]}
            >
                {uploading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                <Ionicons name="cloud-upload" size={24} color={COLORS.white} />
                )}
            </View>
            <AppText style={styles.miniCardTitle}>Upload</AppText>
            </TouchableOpacity>
        </View>

        <View style={styles.syllabusSection}>
            <View style={styles.sectionHeader}>
                <AppText variant="h3">Current Syllabus</AppText>
                {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
            </View>

            {syllabus.length === 0 ? (
                <View style={styles.emptySyllabus}>
                    <Ionicons name="book-outline" size={48} color={COLORS.textLight} />
                    <AppText color={COLORS.textSecondary} style={{ marginTop: SPACING.s }}>
                        No syllabus content found.
                    </AppText>
                    <AppText variant="body2" color={COLORS.textLight}>
                        Upload a PDF to extract chapters and topics.
                    </AppText>
                </View>
            ) : (
                syllabus.map((chapter) => (
                    <View key={chapter.id} style={styles.chapterCard}>
                        <View style={styles.chapterHeader}>
                            <View style={{ flex: 1 }}>
                                <AppText style={styles.chapterTitle}>
                                    Unit {chapter.number}: {chapter.title}
                                </AppText>
                            </View>
                            <View style={styles.actionButtons}>
                                <TouchableOpacity onPress={() => handleEditChapter(chapter)}>
                                    <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteChapter(chapter.id)}>
                                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        <View style={styles.topicsList}>
                            {chapter.topics.map((topic) => (
                                <View key={topic.id} style={styles.topicItem}>
                                    <View style={styles.topicBullet} />
                                    <AppText style={styles.topicName}>{topic.name}</AppText>
                                    <View style={styles.topicActions}>
                                        <TouchableOpacity onPress={() => handleEditTopic(topic)}>
                                            <Ionicons name="pencil-outline" size={16} color={COLORS.textSecondary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteTopic(topic.id)}>
                                            <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                ))
            )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  container: {
    flex: 1,
  },
  sectionTitle: {
    margin: SPACING.m,
    color: COLORS.textPrimary,
  },
  optionsRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.m,
    gap: SPACING.m,
    marginBottom: SPACING.l,
  },
  miniCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.radius.m,
    padding: SPACING.m,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  miniIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.s,
  },
  miniCardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  syllabusSection: {
    paddingHorizontal: SPACING.m,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  emptySyllabus: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.radius.m,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
  },
  chapterCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.radius.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    elevation: 1,
  },
  chapterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.s,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: SPACING.m,
  },
  topicsList: {
    marginTop: SPACING.s,
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    gap: SPACING.s,
  },
  topicBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  topicName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  topicActions: {
    flexDirection: "row",
    gap: SPACING.s,
  },
});

export default HodSubjectDetailsScreen;
