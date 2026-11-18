import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [nim, setNim] = useState(user?.nim || "");
  const [major, setMajor] = useState(user?.major || "");
  const [isSaving, setIsSaving] = useState(false);

  // Inisial 2 huruf dari username pengguna
  const userUsername = user?.username || "pengguna";
  const userInitials = (
    userUsername.length >= 2
      ? userUsername.slice(0, 2)
      : name.slice(0, 2) || "MC"
  ).toUpperCase();

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Perhatian", "Nama lengkap tidak boleh kosong.");
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        nim: nim.trim(),
        major: major.trim()
      });

      Alert.alert(
        "Berhasil",
        "Data profil Anda telah berhasil diperbarui!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (err) {
      Alert.alert("Gagal", err.message || "Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Preview Avatar Inisial */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarInitials}>{userInitials}</Text>
          </View>
          <Text style={styles.avatarTitle}>@{userUsername}</Text>
          <Text style={styles.avatarSubtitle}>
            Inisial profil dibuat otomatis dari 2 huruf username Anda
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Data Akun Pengguna</Text>

          {/* Username (Read Only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username Akun</Text>
            <View style={[styles.inputBox, styles.inputBoxDisabled]}>
              <Ionicons name="at-outline" size={19} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={`@${userUsername}`}
                editable={false}
                style={[styles.inputField, styles.inputFieldDisabled]}
              />
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.helperText}>Username bersifat permanen</Text>
          </View>

          {/* Email (Read Only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Terdaftar</Text>
            <View style={[styles.inputBox, styles.inputBoxDisabled]}>
              <Ionicons name="mail-outline" size={19} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={user?.email || `${userUsername}@meeplecafe.com`}
                editable={false}
                style={[styles.inputField, styles.inputFieldDisabled]}
              />
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.helperText}>Email digunakan untuk verifikasi sistem</Text>
          </View>

          {/* Nama Lengkap (Editable) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Nama Lengkap <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={19} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama lengkap Anda"
                placeholderTextColor={colors.textMuted}
                style={styles.inputField}
              />
            </View>
          </View>

          {/* Nomor Telepon / WA (Editable) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nomor Telepon / WhatsApp</Text>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={19} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Contoh: 081234567890"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={styles.inputField}
              />
            </View>
          </View>

          {/* NIM Mahasiswa (Editable) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NIM Mahasiswa (Opsional)</Text>
            <View style={styles.inputBox}>
              <Ionicons name="id-card-outline" size={19} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                value={nim}
                onChangeText={setNim}
                placeholder="Contoh: 21120124120023"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={styles.inputField}
              />
            </View>
          </View>

          {/* Program Studi / Kategori (Editable) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Program Studi / Kategori Member</Text>
            <View style={styles.inputBox}>
              <Ionicons name="school-outline" size={19} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                value={major}
                onChangeText={setMajor}
                placeholder="Contoh: Teknik Komputer / Member Umum"
                placeholderTextColor={colors.textMuted}
                style={styles.inputField}
              />
            </View>
          </View>

          {/* Tombol Aksi */}
          <TouchableOpacity
            style={[styles.btnSave, isSaving && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.btnSaveText}>Simpan Perubahan</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnCancel}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            disabled={isSaving}
          >
            <Text style={styles.btnCancelText}>Batal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36
  },
  avatarCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  avatarBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#E8F2FA",
    elevation: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 10
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2
  },
  avatarTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary
  },
  avatarSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 15
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6
  },
  requiredStar: {
    color: "#DC2626"
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48
  },
  inputBoxDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB"
  },
  inputIcon: {
    marginRight: 10
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: colors.text
  },
  inputFieldDisabled: {
    color: colors.textMuted
  },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    marginLeft: 2
  },
  btnSave: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  btnSaveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
  },
  btnCancel: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10
  },
  btnCancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600"
  }
});
