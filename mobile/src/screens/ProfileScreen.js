import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { COLORS, SPACING, RADIUS, SHADOW } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();

  const [editModalVisible, setEditModalVisible] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // --------------------------------------------------
  // LOAD PROFILE
  // --------------------------------------------------
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);

      const response = await profileAPI.get();

      const profile = response?.data?.data;

      if (profile) {
        await updateUser(profile);
      }
    } catch (error) {
      console.error(
        'Load profile error:',
        error.response?.data || error.message
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  // --------------------------------------------------
  // OPEN EDIT PROFILE
  // --------------------------------------------------
  const openEditProfile = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setPassword('');

    setEditModalVisible(true);
  };

  // --------------------------------------------------
  // UPDATE PROFILE
  // --------------------------------------------------
  const handleUpdateProfile = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      Alert.alert('Invalid Name', 'Please enter your name.');
      return;
    }

    if (!trimmedEmail) {
      Alert.alert('Invalid Email', 'Please enter your email.');
      return;
    }

    if (!trimmedPhone) {
      Alert.alert('Invalid Phone', 'Please enter your phone number.');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // Password validation only when user wants to change it
    if (password.trim() && password.trim().length < 6) {
      Alert.alert(
        'Invalid Password',
        'New password must be at least 6 characters.'
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
      };

      // Only send password if user entered a new one
      if (password.trim()) {
        payload.password = password.trim();
      }

      const response = await profileAPI.update(payload);

      const updatedUser = response?.data?.data;

      if (!updatedUser) {
        throw new Error('Profile update response is invalid.');
      }

      // Update AuthContext + AsyncStorage
      await updateUser(updatedUser);

      // Clear password field
      setPassword('');

      // Close modal
      setEditModalVisible(false);

      Alert.alert(
        'Profile Updated',
        'Your profile has been updated successfully.'
      );
    } catch (error) {
      console.error(
        'Update profile error:',
        error.response?.data || error.message
      );

      Alert.alert(
        'Update Failed',
        error.response?.data?.message ||
          'Unable to update your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  // --------------------------------------------------
  // MENU
  // --------------------------------------------------
  const menuItems = [
    {
      id: 1,
      icon: '👤',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: openEditProfile,
    },
    {
      id: 2,
      icon: '🔔',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      onPress: () =>
        Alert.alert(
          'Coming Soon',
          'Notification settings coming soon!'
        ),
    },
    {
      id: 3,
      icon: '🔒',
      title: 'Privacy & Security',
      subtitle: 'Control your privacy settings',
      onPress: () =>
        Alert.alert(
          'Coming Soon',
          'Privacy settings coming soon!'
        ),
    },
    {
      id: 4,
      icon: '📍',
      title: 'Location Settings',
      subtitle: 'Manage location sharing',
      onPress: () =>
        Alert.alert(
          'Coming Soon',
          'Location settings coming soon!'
        ),
    },
    {
      id: 5,
      icon: '❓',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () =>
        Alert.alert(
          'Coming Soon',
          'Help center coming soon!'
        ),
    },
    {
      id: 6,
      icon: 'ℹ️',
      title: 'About SafeHer',
      subtitle: 'Version 1.0.0',
      onPress: () =>
        Alert.alert(
          'SafeHer',
          "Women's Safety App\nVersion 1.0.0\n\nYour Safety, Our Priority"
        ),
    },
  ];

  // --------------------------------------------------
  // INITIALS
  // --------------------------------------------------
  const getInitials = (profileName) => {
    if (!profileName) return '??';

    return profileName
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* -------------------------------------------
            PROFILE HEADER
        -------------------------------------------- */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(user?.name)}
              </Text>
            </View>
          </View>

          <Text style={styles.userName}>
            {user?.name || 'User'}
          </Text>

          <Text style={styles.userEmail}>
            {user?.email || 'user@example.com'}
          </Text>

          {user?.phone ? (
            <Text style={styles.userPhone}>
              {user.phone}
            </Text>
          ) : null}

          {loadingProfile && (
            <View style={styles.profileLoading}>
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
              />

              <Text style={styles.profileLoadingText}>
                Loading profile...
              </Text>
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Contacts</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Alerts</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>Safe</Text>
            </View>
          </View>
        </View>

        {/* -------------------------------------------
            MENU ITEMS
        -------------------------------------------- */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>
                  {item.icon}
                </Text>
              </View>

              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>
                  {item.title}
                </Text>

                <Text style={styles.menuSubtitle}>
                  {item.subtitle}
                </Text>
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* -------------------------------------------
            LOGOUT
        -------------------------------------------- */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>

        {/* -------------------------------------------
            FOOTER
        -------------------------------------------- */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for women's safety
          </Text>
        </View>
      </ScrollView>

      {/* =================================================
          EDIT PROFILE MODAL
      ================================================= */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!saving) {
            setEditModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    Edit Profile
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    Update your account information
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setEditModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.closeButtonText}>
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Full Name
                </Text>

                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!saving}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Email
                </Text>

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!saving}
                />
              </View>

              {/* Phone */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Phone Number
                </Text>

                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="phone-pad"
                  editable={!saving}
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  New Password
                </Text>

                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Leave empty to keep current password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!saving}
                />

                <Text style={styles.inputHint}>
                  Minimum 6 characters. Leave empty if you don't
                  want to change your password.
                </Text>
              </View>

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                  ]}
                  onPress={() => setEditModalVisible(false)}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.saveButton,
                    saving && styles.disabledButton,
                  ]}
                  onPress={handleUpdateProfile}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  contentContainer: {
    paddingBottom: SPACING.lg,
  },

  /* -------------------------------------------
     PROFILE HEADER
  -------------------------------------------- */

  profileHeader: {
    backgroundColor: COLORS.cardBg,
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    ...SHADOW,
  },

  avatarContainer: {
    marginBottom: SPACING.md,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    ...SHADOW,
  },

  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },

  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },

  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },

  userPhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },

  profileLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  profileLoadingText: {
    marginLeft: SPACING.xs,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  statsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },

  /* -------------------------------------------
     MENU
  -------------------------------------------- */

  menuContainer: {
    padding: SPACING.lg,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW,
  },

  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },

  menuIcon: {
    fontSize: 24,
  },

  menuTextContainer: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },

  menuSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  chevron: {
    fontSize: 28,
    color: COLORS.textSecondary,
  },

  /* -------------------------------------------
     LOGOUT
  -------------------------------------------- */

  logoutButton: {
    backgroundColor: COLORS.danger,
    margin: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOW,
  },

  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* -------------------------------------------
     FOOTER
  -------------------------------------------- */

  footer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },

  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },

  /* -------------------------------------------
     MODAL
  -------------------------------------------- */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '92%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },

  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeButtonText: {
    fontSize: 28,
    lineHeight: 30,
    color: COLORS.textSecondary,
  },

  inputContainer: {
    marginBottom: SPACING.md,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },

  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  inputHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },

  modalButtons: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },

  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },

  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },

  saveButton: {
    backgroundColor: COLORS.primary,
  },

  disabledButton: {
    opacity: 0.7,
  },

  cancelButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },

  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
