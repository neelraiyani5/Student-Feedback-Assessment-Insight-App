import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getMyProfile, getClassStudents, createStudent, bulkUploadStudents } from '../../services/api';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const ManageStudentsScreen = () => {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [user, setUser] = useState(null);
  const [userClassId, setUserClassId] = useState(null);

  // Created User Credentials
  const [createdUser, setCreatedUser] = useState(null);
  
  // Bulk Import State
  const [importing, setImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    email: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userClassId) {
        fetchStudents(userClassId);
      }
    }, [userClassId])
  );

  const fetchProfile = async () => {
    setLoading(true);
    try {
        const profile = await getMyProfile();
        setUser(profile.user);
        
        const ccClassId = profile.user.classId;
        
        if (!ccClassId) {
            Alert.alert("Error", "You are not assigned to any class.");
            return;
        }

        setUserClassId(ccClassId);
        // fetchStudents triggered by useFocusEffect
        
    } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load profile");
    } finally {
        setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const data = await getClassStudents(classId);
      setStudents(data.Students || []);
      setClassInfo(data.Class);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch student list');
    }
  };

  const handleCreate = async () => {
    if (!formData.userId || !formData.name || !formData.email) {
      Alert.alert('Validation Error', 'All fields are required');
      return;
    }

    setCreating(true);
    try {
      const response = await createStudent({ ...formData, classId: userClassId });
      setCreatedUser({
          userId: formData.userId,
          password: response.Credentials.password
      });
      setModalVisible(false);
      setSuccessModalVisible(true);
      setFormData({ userId: '', name: '', email: '' });
      fetchStudents(userClassId);
    } catch (error) {
        Alert.alert('Error', error.message || 'Failed to create student');
    } finally {
        setCreating(false);
    }
  };

  const handleBulkImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv'
        ],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const file = result.assets[0];
      
      setImporting(true);
      const formData = new FormData();

      if (Platform.OS === 'web') {
        // On web, result.file is the actual File object
        formData.append('file', file.file);
      } else {
        // On native, we need to provide the URI and name
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }

      const response = await bulkUploadStudents(formData);
      setBulkResult(response);
      setBulkModalVisible(true);
      fetchStudents(userClassId);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to process bulk upload');
    } finally {
      setImporting(false);
    }
  };

  const copyToClipboard = async () => {
      if (createdUser?.password) {
          await Clipboard.setStringAsync(createdUser.password);
          Alert.alert("Copied!", "Password copied to clipboard.");
      }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push({
            pathname: '/student-detail',
            params: {
                id: item.id,
                userId: item.userId,
                name: item.name,
                email: item.email,
                role: item.role || 'STUDENT',
                poolId: item.poolId, 
                className: classInfo?.name,
                semester: classInfo?.semester?.sem,
                pools: JSON.stringify(classInfo?.pools || [])
            }
        })}
    >
      <View style={styles.avatar}>
        <AppText style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</AppText>
      </View>
      <View style={styles.cardContent}>
        <AppText style={styles.name}>{item.name}</AppText>
        <AppText style={styles.subtitle}>{item.userId} • {item.email}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
      <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View>
                <AppText variant="h3">Manage Students</AppText>
                {classInfo && <AppText variant="caption">{classInfo.name} • Sem {classInfo.semester?.sem}</AppText>}
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity 
                    onPress={handleBulkImport} 
                    style={[styles.actionButton, { marginRight: SPACING.s }]}
                    disabled={importing}
                >
                    {importing ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.actionButton}>
                    <Ionicons name="add" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={students}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <AppText style={styles.emptyText}>No students in this class.</AppText>
          }
        />
      )}

      {/* Create User Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <AppText variant="h3">Add New Student</AppText>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.inputGroup}>
                    <AppText style={styles.label}>Full Name</AppText>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. Jane Doe"
                        value={formData.name}
                        onChangeText={(t) => setFormData({...formData, name: t})}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <AppText style={styles.label}>Student ID</AppText>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. STU001"
                        value={formData.userId}
                        onChangeText={(t) => setFormData({...formData, userId: t})}
                        autoCapitalize="characters"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <AppText style={styles.label}>Email</AppText>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. jane@uni.edu"
                        value={formData.email}
                        onChangeText={(t) => setFormData({...formData, email: t})}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.submitButton, creating && { opacity: 0.7 }]}
                    onPress={handleCreate}
                    disabled={creating}
                >
                    <AppText style={styles.submitText}>{creating ? 'Creating...' : 'Create Student'}</AppText>
                </TouchableOpacity>

            </View>
        </View>
      </Modal>

      {/* Success Modal with Copy Password */}
      <Modal
        visible={successModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { alignItems: 'center' }]}>
                  <View style={styles.successIcon}>
                      <Ionicons name="checkmark" size={40} color={COLORS.white} />
                  </View>
                  <AppText variant="h3" style={{ marginBottom: SPACING.s }}>Student Created!</AppText>
                  <AppText style={{ textAlign: 'center', color: COLORS.textSecondary, marginBottom: SPACING.l }}>
                      Please copy the temporary password below.
                  </AppText>

                  <View style={styles.passwordBox}>
                      <AppText style={styles.passwordLabel}>User ID: <AppText style={{fontWeight: 'bold'}}>{createdUser?.userId}</AppText></AppText>
                      <View style={styles.passwordRow}>
                          <AppText style={styles.passwordText}>{createdUser?.password}</AppText>
                          <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                              <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
                          </TouchableOpacity>
                      </View>
                  </View>

                  <TouchableOpacity 
                      style={[styles.submitButton, { width: '100%', marginTop: SPACING.l }]}
                      onPress={() => setSuccessModalVisible(false)}
                  >
                      <AppText style={styles.submitText}>Done</AppText>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      {/* Bulk Import Result Modal */}
      <Modal
        visible={bulkModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setBulkModalVisible(false)}
      >
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <AppText variant="h3">Import Results</AppText>
                      <TouchableOpacity onPress={() => setBulkModalVisible(false)}>
                          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                  </View>

                  <View style={styles.resultSummary}>
                      <View style={styles.summaryItem}>
                          <AppText style={styles.summaryValue}>{bulkResult?.successCount || 0}</AppText>
                          <AppText style={styles.summaryLabel}>Success</AppText>
                      </View>
                      <View style={[styles.summaryItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border }]}>
                          <AppText style={[styles.summaryValue, { color: COLORS.error }]}>{bulkResult?.failureCount || 0}</AppText>
                          <AppText style={styles.summaryLabel}>Failed</AppText>
                      </View>
                      <View style={styles.summaryItem}>
                          <AppText style={styles.summaryValue}>{bulkResult?.totalProcessed || 0}</AppText>
                          <AppText style={styles.summaryLabel}>Total</AppText>
                      </View>
                  </View>

                  {bulkResult?.errors?.length > 0 && (
                      <View style={styles.errorListContainer}>
                          <AppText style={styles.errorTitle}>Errors ({bulkResult.errors.length})</AppText>
                          <ScrollView style={styles.errorList} nestedScrollEnabled={true}>
                              {bulkResult.errors.map((err, idx) => (
                                  <View key={idx} style={styles.errorItem}>
                                      <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                                      <AppText style={styles.errorText}>
                                          <AppText style={{ fontWeight: 'bold' }}>{err.userid || err.name || 'Row'}: </AppText>
                                          {err.error}
                                      </AppText>
                                  </View>
                              ))}
                          </ScrollView>
                      </View>
                  )}

                  <TouchableOpacity 
                      style={[styles.submitButton, { width: '100%', marginTop: SPACING.l }]}
                      onPress={() => setBulkModalVisible(false)}
                  >
                      <AppText style={styles.submitText}>Close</AppText>
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
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.m
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
      padding: SPACING.xs,
      backgroundColor: COLORS.surface,
      borderRadius: LAYOUT.radius.m,
  },
  listContent: {
      padding: SPACING.m,
  },
  card: {
      flexDirection: 'row',
      backgroundColor: COLORS.white,
      padding: SPACING.m,
      borderRadius: LAYOUT.radius.m,
      marginBottom: SPACING.m,
      alignItems: 'center',
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
  },
  avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: COLORS.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SPACING.m,
  },
  avatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.primary,
  },
  cardContent: {
      flex: 1,
  },
  name: {
      fontWeight: '600',
      fontSize: 16,
      color: COLORS.textPrimary,
  },
  subtitle: {
      fontSize: 12,
      color: COLORS.textSecondary,
      marginTop: 2,
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 50,
      color: COLORS.textSecondary,
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
  inputGroup: {
      marginBottom: SPACING.m,
  },
  label: {
      fontSize: 12,
      fontWeight: '600',
      color: COLORS.textSecondary,
      marginBottom: 4,
  },
  input: {
      backgroundColor: COLORS.surface,
      borderRadius: LAYOUT.radius.m,
      padding: SPACING.m,
      fontSize: 16,
      color: COLORS.textPrimary,
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
  successIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: COLORS.success,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.m,
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
      marginTop: SPACING.s,
      backgroundColor: COLORS.white,
      padding: SPACING.s,
      borderRadius: LAYOUT.radius.s,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
  },
  passwordLabel: {
      fontSize: 12,
      color: COLORS.textSecondary,
  },
  passwordText: {
      fontSize: 16,
      fontFamily: 'monospace',
      color: COLORS.textPrimary,
      fontWeight: '600',
  },
  copyButton: {
      padding: 4,
  },
  resultSummary: {
      flexDirection: 'row',
      backgroundColor: COLORS.surface,
      borderRadius: LAYOUT.radius.m,
      padding: SPACING.m,
      marginBottom: SPACING.l,
  },
  summaryItem: {
      flex: 1,
      alignItems: 'center',
  },
  summaryValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.primary,
  },
  summaryLabel: {
      fontSize: 12,
      color: COLORS.textSecondary,
      marginTop: 2,
  },
  errorListContainer: {
      maxHeight: 200,
  },
  errorTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.textPrimary,
      marginBottom: SPACING.s,
  },
  errorList: {
      backgroundColor: COLORS.surface,
      borderRadius: LAYOUT.radius.m,
      padding: SPACING.s,
  },
  errorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      gap: SPACING.s,
  },
  errorText: {
      fontSize: 12,
      color: COLORS.textSecondary,
      flex: 1,
  }
});

export default ManageStudentsScreen;
