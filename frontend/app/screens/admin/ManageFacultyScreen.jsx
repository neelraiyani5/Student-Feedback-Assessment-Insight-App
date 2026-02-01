import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getUsers, createUser } from '../../services/api';

const ManageFacultyScreen = () => {
  const router = useRouter();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Created User Credentials
  const [createdUser, setCreatedUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    email: '',
    role: 'FACULTY'
  });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const data = await getUsers('FACULTY,CC');
      setFaculty(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch faculty list');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.userId || !formData.name || !formData.email) {
      Alert.alert('Validation Error', 'All fields are required');
      return;
    }

    setCreating(true);
    try {
      const response = await createUser(formData);
      setCreatedUser({
          userId: formData.userId,
          password: response.Credentials.password
      });
      setModalVisible(false);
      setSuccessModalVisible(true);
      setFormData({ userId: '', name: '', email: '', role: 'FACULTY' });
      fetchFaculty();
    } catch (error) {
        Alert.alert('Error', error.message || 'Failed to create faculty');
    } finally {
        setCreating(false);
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
            pathname: '/faculty-detail',
            params: {
                id: item.id,
                userId: item.userId,
                name: item.name,
                email: item.email,
                role: item.role
            }
        })}
    >
      <View style={styles.avatar}>
        <AppText style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</AppText>
      </View>
      <View style={styles.cardContent}>
        <AppText style={styles.name}>{item.name}</AppText>
        <AppText style={styles.subtitle}>{item.userId} • {item.email}</AppText>
        <AppText style={styles.roleBadge}>{item.role}</AppText>
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
            <AppText variant="h3">Manage Faculty</AppText>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                <Ionicons name="add" size={24} color={COLORS.primary} />
            </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={faculty}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <AppText style={styles.emptyText}>No faculty members found.</AppText>
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
                    <AppText variant="h3">Add New Faculty</AppText>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.inputGroup}>
                    <AppText style={styles.label}>Full Name</AppText>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. Dr. John Doe"
                        value={formData.name}
                        onChangeText={(t) => setFormData({...formData, name: t})}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <AppText style={styles.label}>Faculty ID</AppText>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. FAC001"
                        value={formData.userId}
                        onChangeText={(t) => setFormData({...formData, userId: t})}
                        autoCapitalize="characters"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <AppText style={styles.label}>Email</AppText>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. john@uni.edu"
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
                    <AppText style={styles.submitText}>{creating ? 'Creating...' : 'Create Faculty'}</AppText>
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
                  <AppText variant="h3" style={{ marginBottom: SPACING.s }}>Faculty Created!</AppText>
                  <AppText style={{ textAlign: 'center', color: COLORS.textSecondary, marginBottom: SPACING.l }}>
                      Please copy the temporary password below. It will not be shown again.
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
  addButton: {
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
  roleBadge: {
      fontSize: 10,
      color: COLORS.primary,
      backgroundColor: '#E0F7FA',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginTop: 4,
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
  }
});

export default ManageFacultyScreen;
