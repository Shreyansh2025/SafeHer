import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
} from 'react-native';

import {
  COLORS,
  SPACING,
  RADIUS,
  SHADOW,
} from '../utils/constants';

import { contactAPI } from '../services/api';


export default function ContactsScreen() {

  const [contacts, setContacts] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [editingContact, setEditingContact] =
    useState(null);


  // Form state
  const [name, setName] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [relation, setRelation] =
    useState('');


  // =========================================================
  // LOAD CONTACTS
  // =========================================================

  useEffect(() => {
    fetchContacts();
  }, []);


  const fetchContacts = async () => {

    try {

      setLoading(true);

      const response =
        await contactAPI.getAll();

      setContacts(
        response?.data?.data || []
      );

    } catch (error) {

      console.error(
        'Fetch contacts error:',
        error.response?.data || error.message
      );

      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Failed to load contacts'
      );

    } finally {
      setLoading(false);
    }
  };


  // =========================================================
  // OPEN ADD
  // =========================================================

  const openAddModal = () => {

    setEditingContact(null);

    setName('');
    setPhone('');
    setRelation('');

    setModalVisible(true);
  };


  // =========================================================
  // OPEN EDIT
  // =========================================================

  const openEditModal = (contact) => {

    setEditingContact(contact);

    setName(contact?.name || '');
    setPhone(contact?.phone || '');
    setRelation(contact?.relation || '');

    setModalVisible(true);
  };


  // =========================================================
  // PHONE VALIDATION
  // =========================================================

  const isValidPhone = (value) => {
    const cleaned = value
        .trim()
        .replace(/\D/g, '');

    // Indian number with country code
    if (
        cleaned.startsWith('91') &&
        cleaned.length === 12
    ) {
        return /^[6-9]\d{9}$/.test(
            cleaned.slice(2)
        );
    }

    // Indian number with leading zero
    if (
        cleaned.startsWith('0') &&
        cleaned.length === 11
    ) {
        return /^[6-9]\d{9}$/.test(
            cleaned.slice(1)
        );
    }

    // Normal Indian 10-digit number
    if (
        cleaned.length === 10
    ) {
        return /^[6-9]\d{9}$/.test(
            cleaned
        );
    }

    return false;
};


  // =========================================================
  // SAVE CONTACT
  // =========================================================

  const handleSaveContact = async () => {

    const trimmedName =
      name.trim();

    const trimmedPhone =
      phone.trim();

    const trimmedRelation =
      relation.trim();


    // -------------------------------------------------------
    // REQUIRED FIELDS
    // -------------------------------------------------------

    if (!trimmedName) {
      Alert.alert(
        'Invalid Name',
        'Please enter the contact name.'
      );
      return;
    }


    if (!trimmedPhone) {
      Alert.alert(
        'Invalid Phone',
        'Please enter the contact phone number.'
      );
      return;
    }


    if (!trimmedRelation) {
      Alert.alert(
        'Invalid Relationship',
        'Please enter the relationship.'
      );
      return;
    }


    // -------------------------------------------------------
    // PHONE
    // -------------------------------------------------------

    if (!isValidPhone(trimmedPhone)) {

      Alert.alert(
        'Invalid Phone',
        'Please enter a valid phone number.\n\nExample: +91 9876543210'
      );

      return;
    }


    try {

      setSaving(true);


      const contactData = {
        name: trimmedName,
        phone: trimmedPhone,
        relation: trimmedRelation,
      };


      // -----------------------------------------------------
      // UPDATE
      // -----------------------------------------------------

      if (editingContact) {

        const response =
          await contactAPI.update(
            editingContact.id,
            contactData
          );


        const updatedContact =
          response?.data?.data;


        if (updatedContact) {

          setContacts((current) =>
            current.map((contact) =>
              contact.id === editingContact.id
                ? updatedContact
                : contact
            )
          );
        }


        Alert.alert(
          'Success',
          'Contact updated successfully'
        );

      }


      // -----------------------------------------------------
      // CREATE
      // -----------------------------------------------------

      else {

        const response =
          await contactAPI.create(
            contactData
          );


        const newContact =
          response?.data?.data;


        if (newContact) {

          setContacts((current) => [
            newContact,
            ...current
          ]);
        }


        Alert.alert(
          'Success',
          'Contact added successfully'
        );
      }


      setModalVisible(false);


      // Clear fields
      setEditingContact(null);
      setName('');
      setPhone('');
      setRelation('');


    } catch (error) {

      console.error(
        'Save contact error:',
        error.response?.data || error.message
      );


      Alert.alert(
        'Unable to Save',
        error.response?.data?.message ||
          'Failed to save emergency contact'
      );

    } finally {

      setSaving(false);

    }
  };


  // =========================================================
  // DELETE
  // =========================================================

  const handleDeleteContact = (contact) => {

    Alert.alert(
      'Delete Contact',
      `Are you sure you want to remove ${contact.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Delete',
          style: 'destructive',

          onPress: async () => {

            try {

              setDeletingId(contact.id);


              await contactAPI.delete(
                contact.id
              );


              setContacts((current) =>
                current.filter(
                  (item) =>
                    item.id !== contact.id
                )
              );


              Alert.alert(
                'Success',
                'Contact deleted successfully'
              );

            } catch (error) {

              console.error(
                'Delete contact error:',
                error.response?.data ||
                  error.message
              );


              Alert.alert(
                'Error',
                error.response?.data?.message ||
                  'Failed to delete contact'
              );

            } finally {

              setDeletingId(null);

            }
          },
        },
      ]
    );
  };


  // =========================================================
  // AVATAR
  // =========================================================

  const getAvatarColor = (index) => {

    const colors = [
      COLORS.primary,
      COLORS.secondary,
      '#10B981',
      '#F59E0B',
      '#8B5CF6',
    ];

    return colors[
      index % colors.length
    ];
  };


  const getInitials = (contactName) => {

    if (!contactName) {
      return '??';
    }

    return contactName
      .trim()
      .split(/\s+/)
      .map(
        (word) => word[0]
      )
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  // =========================================================
  // RENDER
  // =========================================================

  const renderContact = ({
    item,
    index
  }) => (

    <TouchableOpacity
      style={styles.contactCard}
      onPress={() =>
        openEditModal(item)
      }
      activeOpacity={0.7}
      disabled={
        deletingId === item.id
      }
    >

      <View
        style={[
          styles.avatar,
          {
            backgroundColor:
              getAvatarColor(index),
          },
        ]}
      >

        <Text style={styles.avatarText}>
          {getInitials(item.name)}
        </Text>

      </View>


      <View style={styles.contactInfo}>

        <Text style={styles.contactName}>
          {item.name}
        </Text>

        <Text style={styles.contactPhone}>
          {item.phone}
        </Text>

        <View
          style={styles.relationshipBadge}
        >

          <Text
            style={
              styles.relationshipText
            }
          >
            {item.relation}
          </Text>

        </View>

      </View>


      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() =>
          handleDeleteContact(item)
        }
        disabled={
          deletingId === item.id
        }
      >

        {deletingId === item.id ? (
          <ActivityIndicator
            size="small"
            color={COLORS.danger}
          />
        ) : (
          <Text
            style={
              styles.deleteButtonText
            }
          >
            🗑️
          </Text>
        )}

      </TouchableOpacity>

    </TouchableOpacity>
  );


  return (

    <View style={styles.container}>

      {/* Header */}

      <View style={styles.header}>

        <Text style={styles.title}>
          Emergency Contacts
        </Text>

        <Text style={styles.subtitle}>
          {contacts.length} contact
          {contacts.length !== 1
            ? 's'
            : ''}
        </Text>

      </View>


      {/* Contact List */}

      {loading && contacts.length === 0 ? (

        <View style={styles.centerContent}>

          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

        </View>

      ) : contacts.length === 0 ? (

        <View style={styles.centerContent}>

          <Text style={styles.emptyText}>
            No emergency contacts yet
          </Text>

          <Text
            style={
              styles.emptySubtext
            }
          >
            Add trusted people who will be
            notified in emergencies
          </Text>

        </View>

      ) : (

        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) =>
            item.id.toString()
          }
          contentContainerStyle={
            styles.listContent
          }
          refreshing={loading}
          onRefresh={fetchContacts}
        />

      )}


      {/* Add Contact Button */}

      <TouchableOpacity
        style={styles.addButton}
        onPress={openAddModal}
        disabled={saving}
      >

        <Text
          style={styles.addButtonText}
        >
          + Add Contact
        </Text>

      </TouchableOpacity>


      {/* Add / Edit Modal */}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {

          if (!saving) {
            setModalVisible(false);
          }

        }}
      >

        <View
          style={
            styles.modalOverlay
          }
        >

          <View
            style={
              styles.modalContent
            }
          >

            <Text
              style={styles.modalTitle}
            >
              {editingContact
                ? 'Edit Contact'
                : 'Add New Contact'}
            </Text>


            {/* Name */}

            <View
              style={
                styles.inputContainer
              }
            >

              <Text style={styles.label}>
                Full Name
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g., Sarah Johnson"
                placeholderTextColor={
                  COLORS.textSecondary
                }
                value={name}
                onChangeText={setName}
                editable={!saving}
                autoCapitalize="words"
              />

            </View>


            {/* Phone */}

            <View
              style={
                styles.inputContainer
              }
            >

              <Text style={styles.label}>
                Phone Number
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g., +91 9876543210"
                placeholderTextColor={
                  COLORS.textSecondary
                }
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!saving}
              />

            </View>


            {/* Relationship */}

            <View
              style={
                styles.inputContainer
              }
            >

              <Text style={styles.label}>
                Relationship
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g., Sister, Friend, Colleague"
                placeholderTextColor={
                  COLORS.textSecondary
                }
                value={relation}
                onChangeText={setRelation}
                editable={!saving}
                autoCapitalize="words"
              />

            </View>


            {/* Buttons */}

            <View
              style={styles.modalButtons}
            >

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                ]}
                onPress={() =>
                  setModalVisible(false)
                }
                disabled={saving}
              >

                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  saving &&
                    styles.disabledButton,
                ]}
                onPress={
                  handleSaveContact
                }
                disabled={saving}
              >

                {saving ? (

                  <ActivityIndicator
                    color="#fff"
                  />

                ) : (

                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    {editingContact
                      ? 'Update'
                      : 'Save'}
                  </Text>

                )}

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

    </View>

  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    backgroundColor:
      COLORS.cardBg,
    borderBottomLeftRadius:
      RADIUS.xl,
    borderBottomRightRadius:
      RADIUS.xl,
    ...SHADOW,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },

  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  listContent: {
    padding: SPACING.lg,
    paddingBottom:
      SPACING.xxl,
  },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },

  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  contactInfo: {
    flex: 1,
  },

  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom:
      SPACING.xs / 2,
  },

  contactPhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },

  relationshipBadge: {
    backgroundColor:
      COLORS.primary + '20',
    paddingHorizontal:
      SPACING.sm,
    paddingVertical:
      SPACING.xs / 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },

  relationshipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  deleteButton: {
    padding: SPACING.sm,
  },

  deleteButtonText: {
    fontSize: 20,
  },

  addButton: {
    backgroundColor:
      COLORS.primary,
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOW,
  },

  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor:
      COLORS.cardBg,
    borderTopLeftRadius:
      RADIUS.xl,
    borderTopRightRadius:
      RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },

  inputContainer: {
    marginBottom: SPACING.md,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },

  input: {
    backgroundColor:
      COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius:
      RADIUS.md,
    padding:
      SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  modalButtons: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },

  modalButton: {
    flex: 1,
    padding:
      SPACING.md,
    borderRadius:
      RADIUS.md,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },

  cancelButton: {
    backgroundColor:
      COLORS.background,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  cancelButtonText: {
    color:
      COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  saveButton: {
    backgroundColor:
      COLORS.primary,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  disabledButton: {
    opacity: 0.7,
  },

});