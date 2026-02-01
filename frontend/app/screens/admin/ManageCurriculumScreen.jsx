import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { getMyProfile, getDepartmentOverview, createDepartment, createSemester, createClass, updateClass, getUsers, assignCC } from '../../services/api';

const ManageCurriculumScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [department, setDepartment] = useState(null);
  const [user, setUser] = useState(null);

  // Modals
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [semModalVisible, setSemModalVisible] = useState(false);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [editClassModalVisible, setEditClassModalVisible] = useState(false);
  const [ccModalVisible, setCcModalVisible] = useState(false);

  // Forms
  const [deptName, setDeptName] = useState('');
  const [semNumber, setSemNumber] = useState('');
  const [className, setClassName] = useState('');
  const [selectedSemId, setSelectedSemId] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // CC Logic
  const [facultyList, setFacultyList] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
        const userData = await getMyProfile();
        setUser(userData.user);

        if (userData.user.hodDepartments && userData.user.hodDepartments.length > 0) {
            const deptId = userData.user.hodDepartments[0].id;
            const deptData = await getDepartmentOverview(deptId);
            setDepartment(deptData);
        } else {
            console.log("No department found for HOD");
        }
    } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load curriculum data");
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  const handleCreateDepartment = async () => {
      if (!deptName) return Alert.alert("Error", "Name required");
      try {
          await createDepartment({ name: deptName, hodId: user.id });
          setDeptModalVisible(false);
          fetchData(); // Refresh to see it
      } catch (error) {
          Alert.alert("Error", error.message || "Failed");
      }
  };

  const handleCreateSemester = async () => {
    if (!semNumber || isNaN(semNumber)) return Alert.alert("Error", "Valid number required");
    try {
        await createSemester({ sem: parseInt(semNumber), departmentId: department.id });
        setSemModalVisible(false);
        setSemNumber('');
        fetchData();
    } catch (error) {
        Alert.alert("Error", error.message || "Failed");
    }
  };

  const handleCreateClass = async () => {
      if (!className) return Alert.alert("Error", "Name required");
      try {
          await createClass({ name: className, semesterId: selectedSemId });
          setClassModalVisible(false);
          setClassName('');
          fetchData();
      } catch (error) {
          Alert.alert("Error", error.message || "Failed"); // Error message shown here
      }
  };

  const handleUpdateClass = async () => {
    if (!className || !selectedSemId) return Alert.alert("Error", "Fields required");
    try {
        await updateClass(selectedClass.id, { name: className, semesterId: selectedSemId });
        setEditClassModalVisible(false);
        setClassName('');
        setSelectedClass(null);
        fetchData();
    } catch (error) {
        Alert.alert("Error", error.message);
    }
  };

  const handleAssignCC = async (facultyId) => {
    try {
        await assignCC({ classId: selectedClass.id, facultyId });
        setCcModalVisible(false);
        fetchData();
    } catch (error) {
        Alert.alert("Error", error.message || "Failed");
    }
  };

  const openAddClass = (semId) => {
      setSelectedSemId(semId);
      setClassModalVisible(true);
  };

  const openEditClass = (cls, currentSemId) => {
      setSelectedClass(cls);
      setClassName(cls.name);
      setSelectedSemId(currentSemId); // Default to current
      setEditClassModalVisible(true);
  };

  const openAssignCC = async (cls) => {
      setSelectedClass(cls);
      setLoading(true);
      try {
          const faculties = await getUsers('FACULTY,CC');
          setFacultyList(faculties || []); 
          setCcModalVisible(true);
      } catch (e) {
          Alert.alert("Error", "Failed to fetch faculty list");
      } finally {
          setLoading(false);
      }
  };

  if (loading) {
      return (
          <ScreenWrapper>
              <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
          </ScreenWrapper>
      );
  }

  return (
    <ScreenWrapper backgroundColor={COLORS.surfaceLight}>
      <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <AppText variant="h3">Semester Management</AppText>
            {!department && (
                <TouchableOpacity onPress={() => setDeptModalVisible(true)} style={styles.addButton}>
                    <AppText style={styles.addButtonText}>Create Dept</AppText>
                </TouchableOpacity>
            )}
            {department && (
                <TouchableOpacity onPress={() => setSemModalVisible(true)} style={styles.iconButton}>
                    <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
            )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
          
          {!department ? (
               <View style={styles.emptyContainer}>
                   <AppText style={styles.emptyText}>You haven't created a department yet.</AppText>
                   <TouchableOpacity style={styles.bigButton} onPress={() => setDeptModalVisible(true)}>
                       <AppText style={styles.bigButtonText}>Create Department</AppText>
                   </TouchableOpacity>
               </View>
          ) : (
              <View>
                  <AppText variant="h2" style={styles.deptTitle}>{department.name}</AppText>

                  {department.semesters?.sort((a,b) => a.sem - b.sem).map((sem) => (
                      <View key={sem.id} style={styles.semCard}>
                          <View style={styles.semHeader}>
                              <AppText variant="h3">Semester {sem.sem}</AppText>
                              <TouchableOpacity onPress={() => openAddClass(sem.id)} style={styles.addClassBtn}>
                                  <Ionicons name="add" size={16} color={COLORS.white} />
                                  <AppText style={styles.addClassText}>Class</AppText>
                              </TouchableOpacity>
                          </View>

                          <View style={styles.classesContainer}>
                              {sem.classes?.length === 0 && <AppText style={styles.noData}>No classes</AppText>}
                              {sem.classes?.map((cls) => (
                                  <View key={cls.id} style={styles.classCard}>
                                      <TouchableOpacity onPress={() => openEditClass(cls, sem.id)}>
                                          <AppText style={styles.className}>{cls.name}</AppText>
                                      </TouchableOpacity>
                                      
                                      <View style={styles.ccContainer}>
                                          {cls.cc ? (
                                              <View style={styles.ccInfo}>
                                                  <Ionicons name="person" size={12} color={COLORS.textSecondary} />
                                                  <AppText variant="caption" style={styles.ccName}>{cls.cc.name}</AppText>
                                              </View>
                                          ) : (
                                              <AppText variant="caption" style={styles.noCC}>No CC assigned</AppText>
                                          )}
                                          
                                          <TouchableOpacity onPress={() => openAssignCC(cls)} style={styles.assignCCBtn}>
                                              <Ionicons name="person-add" size={14} color={COLORS.primary} />
                                          </TouchableOpacity>
                                      </View>
                                  </View>
                              ))}
                          </View>
                      </View>
                  ))}
              </View>
          )}

      </ScrollView>

      {/* Create Department Modal */ }
      <Modal visible={deptModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <AppText variant="h3" style={{marginBottom: 16}}>New Department</AppText>
                  <TextInput 
                      style={styles.input} 
                      placeholder="Department Name (e.g. Computer Engineering)" 
                      value={deptName} 
                      onChangeText={setDeptName}
                  />
                  <View style={styles.modalActions}>
                      <TouchableOpacity onPress={() => setDeptModalVisible(false)}><AppText>Cancel</AppText></TouchableOpacity>
                      <TouchableOpacity onPress={handleCreateDepartment}><AppText style={{color: COLORS.primary, fontWeight: 'bold'}}>Create</AppText></TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      {/* Create Semester Modal */ }
      <Modal visible={semModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <AppText variant="h3" style={{marginBottom: 16}}>New Semester</AppText>
                  <TextInput 
                      style={styles.input} 
                      placeholder="Semester Number (e.g. 1)" 
                      keyboardType="numeric"
                      value={semNumber} 
                      onChangeText={setSemNumber}
                  />
                  <View style={styles.modalActions}>
                      <TouchableOpacity onPress={() => setSemModalVisible(false)}><AppText>Cancel</AppText></TouchableOpacity>
                      <TouchableOpacity onPress={handleCreateSemester}><AppText style={{color: COLORS.primary, fontWeight: 'bold'}}>Create</AppText></TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      {/* Create Class Modal */ }
      <Modal visible={classModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <AppText variant="h3" style={{marginBottom: 16}}>New Class</AppText>
                  <TextInput 
                      style={styles.input} 
                      placeholder="Class Name (e.g. CSA)" 
                      value={className} 
                      onChangeText={setClassName}
                  />
                  <View style={styles.modalActions}>
                      <TouchableOpacity onPress={() => setClassModalVisible(false)}><AppText>Cancel</AppText></TouchableOpacity>
                      <TouchableOpacity onPress={handleCreateClass}><AppText style={{color: COLORS.primary, fontWeight: 'bold'}}>Create</AppText></TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      {/* Edit Class (Promote) Modal */ }
      <Modal visible={editClassModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <AppText variant="h3" style={{marginBottom: 16}}>Edit Class / Promote</AppText>
                  <TextInput 
                      style={styles.input} 
                      placeholder="Class Name" 
                      value={className} 
                      onChangeText={setClassName}
                  />
                  <AppText style={styles.label}>Move to Semester:</AppText>
                  <ScrollView style={{maxHeight: 150, marginBottom: 16}}>
                      {department?.semesters?.sort((a,b)=>a.sem-b.sem).map(sem => (
                          <TouchableOpacity 
                            key={sem.id} 
                            style={[styles.semOption, selectedSemId === sem.id && styles.semOptionSelected]}
                            onPress={() => setSelectedSemId(sem.id)}
                          >
                              <AppText style={{color: selectedSemId === sem.id ? COLORS.white : COLORS.textPrimary}}>
                                  Semester {sem.sem}
                              </AppText>
                          </TouchableOpacity>
                      ))}
                  </ScrollView>

                  <View style={styles.modalActions}>
                      <TouchableOpacity onPress={() => setEditClassModalVisible(false)}><AppText>Cancel</AppText></TouchableOpacity>
                      <TouchableOpacity onPress={handleUpdateClass}><AppText style={{color: COLORS.primary, fontWeight: 'bold'}}>Update</AppText></TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      {/* Assign CC Modal */}
      <Modal visible={ccModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { height: 400 }]}>
                    <AppText variant="h3" style={{marginBottom: 16}}>Assign Class Coordinator</AppText>
                    <AppText style={{marginBottom: 10}}>For Class: {selectedClass?.name}</AppText>
                    
                    <FlatList 
                        data={facultyList}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[styles.facultyOption, item.role === 'CC' && { opacity: 0.6 }]} 
                                onPress={() => {
                                    if (item.role !== 'CC') handleAssignCC(item.id);
                                }}
                                disabled={item.role === 'CC'}
                            >
                                <View>
                                    <AppText style={{fontWeight: '600'}}>{item.name}</AppText>
                                    <AppText variant="caption">{item.email}</AppText>
                                </View>
                                {item.role === 'CC' && <AppText style={{color: COLORS.error, fontSize: 10, fontWeight: 'bold'}}>Already Engaged</AppText>}
                            </TouchableOpacity>
                        )}
                        style={{marginBottom: 16}}
                    />

                    <View style={styles.modalActions}>
                        <TouchableOpacity onPress={() => setCcModalVisible(false)}><AppText>Cancel</AppText></TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
  },
  content: {
      padding: SPACING.m,
      paddingBottom: 50
  },
  addButton: {
      backgroundColor: COLORS.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6
  },
  addButtonText: {
      color: COLORS.white,
      fontWeight: '600'
  },
  deptTitle: {
      textAlign: 'center',
      marginBottom: SPACING.l,
      color: COLORS.primary
  },
  semCard: {
      backgroundColor: COLORS.white,
      padding: SPACING.m,
      borderRadius: LAYOUT.radius.m,
      marginBottom: SPACING.m,
      elevation: 2
  },
  semHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.m,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      paddingBottom: 8
  },
  addClassBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.success,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12
  },
  addClassText: {
      color: COLORS.white,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4
  },
  classesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10
  },
  classCard: {
      backgroundColor: COLORS.surface,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: COLORS.border,
      minWidth: '45%',
      flex: 1
  },
  className: {
      fontWeight: '700',
      color: COLORS.textPrimary,
      marginBottom: 6
  },
  ccContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      paddingTop: 4
  },
  ccInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
  },
  ccName: {
      color: COLORS.textSecondary,
      maxWidth: 80
  },
  noCC: {
      color: COLORS.error,
      fontSize: 10
  },
  assignCCBtn: {
      padding: 4
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 20
  },
  modalContent: {
      backgroundColor: COLORS.white,
      borderRadius: 12,
      padding: 24
  },
  input: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 16,
      backgroundColor: COLORS.surface
  },
  modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 20
  },
  label: {
      marginBottom: 8,
      color: COLORS.textSecondary,
      fontWeight: '600'
  },
  semOption: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border
  },
  semOptionSelected: {
      backgroundColor: COLORS.primary,
      borderRadius: 8,
      borderBottomWidth: 0
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 100
  },
  emptyText: {
      marginBottom: 20,
      color: COLORS.textSecondary
  },
  bigButton: {
      backgroundColor: COLORS.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8
  },
  bigButtonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: 'bold'
  },
  facultyOption: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
  }
});

export default ManageCurriculumScreen;
