import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, SPACING, LAYOUT } from '../../constants/theme';
import { wp, hp } from '../../utils/responsive';

import { loginUser, saveToken, getMyProfile } from '../../services/api';



const LoginScreen = () => {
  const router = useRouter();
  
  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // Handlers
  const handleLogin = async () => {
    if (!username || !password) {
        alert("Please enter Username and Password");
        return;
    }

    setLoading(true);

    try {
        // 1. Login
        const loginData = await loginUser(username, password);
        await saveToken(loginData.token);

        // 2. Check if password change is required
        if (loginData.mustChangePassword) {
            router.replace({ 
                pathname: '/change-password', 
                params: { isFirstLogin: 'true' } 
            });
            return;
        }

        // 3. Fetch Profile to get Role
        const profileData = await getMyProfile();
        const userRole = profileData.user.role; // Assuming structure { user: { role: 'STUDENT' } }

        console.log("Logged in as:", userRole);

        // 4. Redirect based on BACKEND role (ignoring UI dropdown for security)
        const userName = profileData.user.name;
        
        switch (userRole) {
            case 'STUDENT': // Backend likely returns uppercase
            case 'Student':
                router.push({ pathname: '/student-dashboard', params: { name: userName } });
                break;
            case 'FACULTY':
            case 'Faculty':
                router.push({ pathname: '/faculty-dashboard', params: { name: userName } });
                break;
            case 'CC':
            case 'HOD':
                router.push({ pathname: '/coordinator-dashboard', params: { name: userName } });
                break;
            default:
                alert("Unknown Role: " + userRole);
                break;
        }

    } catch (error) {
        console.error(error);
        alert(error.message || "Login Failed");
    } finally {
        setLoading(false);
    }
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
            
            {/* AcadOne Logo */}
            <Image
                 source={require('../../../assets/images/splash-icon.png')}
                 style={styles.acadOneLogo}
                 contentFit="contain"
            />

            {/* Divider */}
            <View style={styles.divider} />

            {/* Marwadi University Logo */}
            <Image 
                source={require('../../../assets/images/MU_LOGO_BLACK.png')}
                style={styles.muLogo}
                contentFit="contain"
            />
        </View>

        {/* Body - Central Card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            
            <AppText variant="h3" style={styles.cardTitle}>Welcome Back</AppText>
            
            {/* Username Field */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Username/ID"
                  placeholderTextColor={COLORS.textLight}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>



            {/* Footer - Login Button */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.loginButton, loading && { opacity: 0.7 }]} 
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <AppText style={styles.loginButtonText}>
                        {loading ? "Logging in..." : "Secure Login"}
                    </AppText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/change-password')}>
                    <AppText variant="caption" color={COLORS.primary}>Forgot Password?</AppText>
                </TouchableOpacity>
            </View>

          </View>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    // marginBottom: hp(3),
    // marginTop: hp(5),
  },
  acadOneLogo: {
      width: 200,
      height: 200,
  },
  divider: {
      height: 2,
      width: 200,
      backgroundColor: COLORS.border,
      marginBottom: SPACING.xl,
  },
  muLogo: {
      width: 200,
      height: 60,
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
    elevation: 8, // Android shadow
  },
  cardTitle: {
      marginBottom: SPACING.l,
      textAlign: 'center',
      color: COLORS.textPrimary,
  },
  inputGroup: {
    marginBottom: SPACING.m,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface, // Light grey background
    borderRadius: LAYOUT.radius.m,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    height: 55,
    paddingHorizontal: SPACING.m,
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.radius.m,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    height: 55,
    paddingHorizontal: SPACING.m,
  },
  placeholderText: {
      color: COLORS.textLight,
      fontSize: 16,
  },
  selectedRoleText: {
      color: COLORS.textPrimary,
      fontSize: 16,
  },
  dropdownList: {
      marginTop: -SPACING.s,
      marginBottom: SPACING.m,
      backgroundColor: COLORS.white,
      borderRadius: LAYOUT.radius.m,
      borderWidth: 1,
      borderColor: COLORS.border,
      overflow: 'hidden',
  },
  dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: SPACING.m,
      paddingHorizontal: SPACING.m,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.surface,
  },
  dropdownItemText: {
      fontSize: 16,
      color: COLORS.textSecondary,
  },
  footer: {
      marginTop: SPACING.m,
      alignItems: 'center',
  },
  loginButton: {
      width: '100%',
      backgroundColor: COLORS.primary,
      height: 55,
      borderRadius: LAYOUT.radius.round,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.m,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
  },
  loginButtonText: {
      color: COLORS.white,
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: 0.5,
  },
  forgotPassword: {
      padding: SPACING.s,
  }
});

export default LoginScreen;
