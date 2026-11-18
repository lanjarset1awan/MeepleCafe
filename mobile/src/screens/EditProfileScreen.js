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
  ActivityIndicator,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import CustomDialog from "../components/CustomDialog";

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile, uploadAvatar, deleteAvatar } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Dialog State
  const [dialogConfig, setDialogConfig] = useState({
    visible: false,
    type: "info",
    iconName: null,
    title: "",
    message: "",
    confirmText: "Mengerti",
    cancelText: null,
    onConfirm: null,
    onCancel: null
  });

  const showDialog = (cfg) => {
    setDialogConfig({
      visible: true,
      type: cfg.type || "info",
      iconName: cfg.iconName || null,
      title: cfg.title || "",
      message: cfg.message || "",
      confirmText: cfg.confirmText || "Mengerti",
      cancelText: cfg.cancelText || null,
      onConfirm: cfg.onConfirm || null,
      onCancel: cfg.onCancel || null
    });
  };

  const hideDialog = () => {
    setDialogConfig((prev) => ({ ...prev, visible: false }));
  };

  // Inisial 2 huruf dari username pengguna
  const userUsername = user?.username || "pengguna";
  const userInitials = (
    userUsername.length >= 2
      ? userUsername.slice(0, 2)
      : name.slice(0, 2) || "MC"
  ).toUpperCase();

  // Pilih & Unggah Foto Profil dari Galeri
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showDialog({
          type: "warning",
          title: "Izin Diperlukan",
          message: "Aplikasi membutuhkan izin akses galeri untuk memilih foto profil."
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingAvatar(true);
        await uploadAvatar(asset.base64, asset.mimeType || "image/jpeg");
        showDialog({
          type: "success",
          title: "Berhasil",
          message: "Foto profil berhasil diperbarui!"
        });
      }
    } catch (err) {
      console.error("Gagal memilih/mengunggah foto profil:", err);
      showDialog({
        type: "error",
        title: "Gagal Mengunggah",
        message: err.message || "Terjadi kesalahan saat mengunggah foto profil."
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Hapus Foto Profil (Kembali ke inisial nama)
  const handleDeletePhoto = () => {
    if (!user?.avatar) {
      showDialog({
        type: "info",
        title: "Informasi",
        message: "Profil Anda saat ini sudah menggunakan inisial nama bawaan."
      });
      return;
    }

    showDialog({
      type: "danger",
      iconName: "trash-outline",
      title: "Hapus Foto Profil",
      message: "Apakah Anda yakin ingin menghapus foto profil dan kembali menggunakan inisial nama?",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      onConfirm: async () => {
        try {
          setUploadingAvatar(true);
          await deleteAvatar();
          showDialog({
            type: "success",
            title: "Berhasil",
            message: "Foto profil berhasil dihapus."
          });
        } catch (err) {
          showDialog({
            type: "error",
            title: "Gagal Menghapus",
            message: err.message || "Gagal menghapus foto profil."
          });
        } finally {
          setUploadingAvatar(false);
        }
      }
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showDialog({
        type: "warning",
        title: "Perhatian",
        message: "Nama lengkap tidak boleh kosong."
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({
        name: name.trim(),
        phone: phone.trim()
      });

      showDialog({
        type: "success",
        title: "Berhasil",
        message: "Data profil Anda telah berhasil diperbarui!",
        confirmText: "Selesai",
        onConfirm: () => navigation.goBack()
      });
    } catch (err) {
      showDialog({
        type: "error",
        title: "Gagal Menyimpan",
        message: err.message || "Terjadi kesalahan saat menyimpan profil."
      });
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
        {/* Banner Preview Avatar Inisial & Foto Profil */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarWrapper}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarInitials}>{userInitials}</Text>
              </View>
            )}

            {/* Tombol Kamera di Pojok Kanan Bawah Avatar */}
            <TouchableOpacity
              style={styles.cameraBtn}
              activeOpacity={0.85}
              onPress={handlePickImage}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Tombol Tulisan Hapus Foto Profil di Bawah Avatar */}
          <TouchableOpacity
            style={styles.deletePhotoBtn}
            activeOpacity={0.7}
            onPress={handleDeletePhoto}
            disabled={uploadingAvatar}
          >
            <Text style={styles.deletePhotoText}>Hapus Foto Profil</Text>
          </TouchableOpacity>
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

      {/* Dialog Kustom Pengganti Alert.alert (CustomDialog) */}
      <CustomDialog
        visible={dialogConfig.visible}
        type={dialogConfig.type}
        iconName={dialogConfig.iconName}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        onConfirm={dialogConfig.onConfirm}
        onCancel={dialogConfig.onCancel}
        onClose={hideDialog}
      />
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
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  avatarWrapper: {
    position: "relative",
    width: 92,
    height: 92,
    marginBottom: 10
  },
  avatarBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#E8F2FA",
    elevation: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 4,
    borderColor: "#E8F2FA",
    backgroundColor: colors.border
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2
  },
  cameraBtn: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  deletePhotoBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 2
  },
  deletePhotoText: {
    color: "#EF4444",
    fontSize: 13.5,
    fontWeight: "600",
    textAlign: "center"
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
