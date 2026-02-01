import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';

import { changePassword, clearToken } from '../../services/api';

const ChangePasswordScreen = () => {
  const router = useRouter();
  const { isFirstLogin } = useLocalSearchParams();
  
  // State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6 || newPassword.length > 20) {
      newErrors.newPassword = "Password must be 6-20 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Password Change
  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      await changePassword(newPassword);
      
      // Clear token and redirect to login
      await clearToken();
      
      Alert.alert(
        "Success",
        "Password changed successfully. Please login with your new password.",
        [
          {
            text: "Go to Login",
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Skip (only if not mandatory)
  const handleSkip = async () => {
    await clearToken();
    router.replace('/login');
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white} withPadding={false}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header - Logo Area */}
        <View style={styles.header}>
            
            {/* Lock Icon */}
            <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={60} color={COLORS.primary} />
            </View>

            {/* Title */}
            <AppText variant="h2" style={styles.title}>
              {isFirstLogin === 'true' ? 'Set New Password' : 'Change Password'}
            </AppText>

            {/* Subtitle */}
            <AppText style={styles.subtitle}>
              {isFirstLogin === 'true' 
                ? 'For security, please set a new password for your account.'
                : 'Enter your new password below.'
              }
            </AppText>
        </View>

        {/* Body - Central Card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            
            {/* New Password Field */}
            <View style={styles.inputGroup}>
              <AppText style={styles.inputLabel}>New Password</AppText>
              <View style={[
                styles.inputContainer,
                errors.newPassword && styles.inputError
              ]}>
                <Ionicons name="key-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.textLight}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.newPassword) setErrors({...errors, newPassword: null});
                  }}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showNewPassword ? "eye" : "eye-off"} size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.newPassword && (
                <AppText style={styles.errorText}>{errors.newPassword}</AppText>
              )}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.inputGroup}>
              <AppText style={styles.inputLabel}>Confirm Password</AppText>
              <View style={[
                styles.inputContainer,
                errors.confirmPassword && styles.inputError
              ]}>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={COLORS.textLight}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({...errors, confirmPassword: null});
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <AppText style={styles.errorText}>{errors.confirmPassword}</AppText>
              )}
            </View>

            {/* Password Requirements Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color={COLORS.info} />
              <AppText style={styles.infoText}>
                Password must be between 6-20 characters
              </AppText>
            </View>

            {/* Submit Button */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.submitButton, loading && { opacity: 0.7 }]} 
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    <Ionicons name="shield-checkmark" size={20} color={COLORS.white} style={{marginRight: SPACING.s}} />
                    <AppText style={styles.submitButtonText}>
                        {loading ? "Updating..." : "Update Password"}
                    </AppText>
                </TouchableOpacity>

                {/* Back to Login Link */}
                {isFirstLogin !== 'true' && (
                  <TouchableOpacity style={styles.backLink} onPress={handleSkip}>
                      <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
                      <AppText variant="caption" color={COLORS.textSecondary} style={{marginLeft: SPACING.xs}}>
                        Back to Login
                      </AppText>
                  </TouchableOpacity>
                )}
            </View>

          </View>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-outline" size={16} color={COLORS.success} />
          <AppText variant="caption" style={styles.securityText}>
            Your password is encrypted and stored securely
          </AppText>
        </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.l,
    paddingTop: hp(5),
    paddingBottom: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.l,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  title: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.s,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: SPACING.l,
    lineHeight: 22,
  },
  cardContainer: {
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.radius.xl,
    padding: SPACING.xl,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: SPACING.l,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.s,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.radius.m,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    height: 55,
    paddingHorizontal: SPACING.m,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: SPACING.s,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: SPACING.m,
    borderRadius: LAYOUT.radius.m,
    marginBottom: SPACING.l,
  },
  infoText: {
    color: COLORS.info,
    fontSize: 13,
    marginLeft: SPACING.s,
    flex: 1,
  },
  footer: {
      alignItems: 'center',
  },
  submitButton: {
      width: '100%',
      backgroundColor: COLORS.primary,
      height: 55,
      borderRadius: LAYOUT.radius.round,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.m,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
  },
  submitButtonText: {
      color: COLORS.white,
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: 0.5,
  },
  backLink: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.s,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  securityText: {
    color: COLORS.success,
    marginLeft: SPACING.xs,
  },
});

export default ChangePasswordScreen;
