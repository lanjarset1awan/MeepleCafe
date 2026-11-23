import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  StatusBar,
  Platform,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import CustomDialog from "../components/CustomDialog";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  // Ekstrak informasi pengguna aktif
  const userName = user?.name || "Lanjar Setiawan";
  const userUsername = user?.username || "lanjar";
  const userEmail = user?.email || `${userUsername}@meeplecafe.com`;
  const userPhone = user?.phone || "0812-3456-7890";
  const rawRole = user?.role || "Member";
  const userRole = (rawRole === "Mahasiswa / Member" || rawRole === "Member MeepleCafe") ? "Member" : rawRole;
  const hasCustomAvatar = Boolean(
    user?.avatar &&
    !user.avatar.includes("dicebear.com") &&
    user.avatar.trim() !== ""
  );

  // Ambil 2 huruf awal dari username pengguna sebagai inisial avatar
  const userInitials = (
    userUsername.length >= 2
      ? userUsername.slice(0, 2)
      : userName.slice(0, 2) || "MC"
  ).toUpperCase();

  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header Banner Konsisten */}
      <View style={styles.header}>
        <View style={styles.headerBrandRow}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/Logo-MeepleCafe.jpeg")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Profil Pengguna</Text>
          </View>

          {/* Tombol Admin & Info / About di Kanan Atas */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.headerAdminBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate("AdminGameList")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerInfoBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("About")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Konten Profil (Scrollable & Nyaman di Semua Ukuran Layar) */}
      <ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={styles.contentWrapper}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Kotakan Header Profil (Avatar & Nama) */}
        <View style={styles.profileHeaderCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            activeOpacity={0.85}
            onPress={() => setIsPhotoModalVisible(true)}
          >
            {hasCustomAvatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarBadge}>
                <Ionicons name="person-outline" size={68} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.studentName}>{userName}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={13} color={colors.primary} style={{ marginRight: 5 }} />
            <Text style={styles.roleBadgeText}>{userRole}</Text>
          </View>
        </View>

        {/* Card: Informasi Akun Pengguna */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIconBox}>
              <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Informasi Akun Pengguna</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="at-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoItemLabel}>Username</Text>
              <Text style={styles.infoItemValue}>@{userUsername}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoItemLabel}>Email</Text>
              <Text style={styles.infoItemValue}>{userEmail}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
            <View style={styles.infoIconBox}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoItemLabel}>Nomor Telepon</Text>
              <Text style={styles.infoItemValue}>{userPhone}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons di Bagian Bawah */}
        <View style={styles.actionButtonsWrapper}>
          {/* Tombol Akses Masuk Panel Admin (Khusus Role Admin) */}
          {userRole.toLowerCase() === "admin" && (
            <TouchableOpacity
              style={styles.btnAdminPanel}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("AdminGameList")}
            >
              <View style={styles.adminBtnLeft}>
                <View style={styles.adminIconBox}>
                  <Ionicons name="shield-checkmark" size={19} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.btnAdminPanelTitle}>Masuk Panel Admin</Text>
                  <Text style={styles.btnAdminPanelSubtitle}>Kelola game, meja & verifikasi tiket</Text>
                </View>
              </View>
              <View style={styles.adminPillBadge}>
                <Ionicons name="shield-checkmark" size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.adminPillBadgeText}>ADMIN</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Tombol Besar Edit Profil di Atas Tombol Keluar */}
          <TouchableOpacity
            style={styles.btnEditProfile}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Ionicons name="create-outline" size={19} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.btnEditProfileText}>Edit Profil</Text>
          </TouchableOpacity>

          {/* Tombol Logout di Paling Bawah */}
          <TouchableOpacity
            style={styles.btnLogout}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.btnLogoutText}>Keluar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Foto Profil Layar Penuh (Fullscreen Avatar Viewer) */}
      <Modal
        visible={isPhotoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPhotoModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <StatusBar backgroundColor="#000000" barStyle="light-content" />

          {/* Header Modal */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {userName}
              </Text>
              <Text style={styles.modalSubtitle}>Foto Profil MeepleCafe</Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              activeOpacity={0.8}
              onPress={() => setIsPhotoModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Area Foto Layar Penuh */}
          <TouchableOpacity
            style={styles.modalImageContainer}
            activeOpacity={1}
            onPress={() => setIsPhotoModalVisible(false)}
          >
            {hasCustomAvatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={styles.fullscreenAvatar}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.fullscreenInitialsContainer}>
                <View style={styles.fullscreenAvatarBadge}>
                  <Ionicons name="person-outline" size={72} color="#FFFFFF" />
                </View>
                <Text style={styles.fullscreenName}>{userName}</Text>
                <Text style={styles.fullscreenNote}>Profil menggunakan avatar bawaan</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Footer Modal */}
          <View style={styles.modalFooter}>
            <Text style={styles.modalFooterHint}>Ketuk di mana saja untuk menutup</Text>
          </View>
        </View>
      </Modal>

      {/* Dialog Kustom Konfirmasi Keluar (CustomDialog) */}
      <CustomDialog
        visible={logoutDialogVisible}
        type="danger"
        iconName="log-out-outline"
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari akun MeepleCafe?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        onConfirm={async () => {
          setLogoutDialogVisible(false);
          await logout();
        }}
        onCancel={() => setLogoutDialogVisible(false)}
        onClose={() => setLogoutDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    backgroundColor: colors.darkBg,
    paddingTop: 46,
    paddingBottom: 36,
    paddingHorizontal: 20
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: "#FFFFFF"
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  headerAdminBtn: {
    padding: 4
  },
  headerInfoBtn: {
    padding: 4
  },
  contentScrollView: {
    flex: 1,
    marginTop: -16
  },
  contentWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 28
  },
  profileHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 10
  },
  avatarImage: {
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 4.5,
    borderColor: "#E8F2FA",
    backgroundColor: colors.border
  },
  avatarBadge: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4.5,
    borderColor: "#E8F2FA",
    elevation: 5,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  avatarInitials: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2
  },
  studentName: {
    fontSize: 23,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 6
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 12,
    marginTop: 6
  },
  roleBadgeText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.primaryDark
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14
  },
  cardHeaderIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },
  cardTitle: {
    fontSize: 16.5,
    fontWeight: "bold",
    color: colors.text
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 13,
    marginBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6"
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },
  infoTextBox: {
    flex: 1
  },
  infoItemLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500"
  },
  infoItemValue: {
    fontSize: 15.5,
    color: colors.text,
    fontWeight: "700",
    marginTop: 2.5
  },
  actionButtonsWrapper: {
    width: "100%"
  },
  btnAdminPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  adminBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  adminIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  btnAdminPanelTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.text
  },
  btnAdminPanelSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  adminPillBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  adminPillBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5
  },
  btnEditProfile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14.5,
    borderRadius: 14,
    marginTop: 0,
    marginBottom: 14,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  btnEditProfileText: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "700"
  },
  btnLogout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#DC2626",
    marginTop: 0
  },
  btnLogoutText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "700"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "space-between"
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 14 : 48,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)"
  },
  modalHeaderInfo: {
    flex: 1,
    marginRight: 12
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold"
  },
  modalSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginTop: 2
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center"
  },
  modalImageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  fullscreenAvatar: {
    width: "100%",
    height: "100%",
    maxHeight: 520
  },
  fullscreenInitialsContainer: {
    alignItems: "center",
    justifyContent: "center"
  },
  fullscreenAvatarBadge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#E8F2FA",
    marginBottom: 16
  },
  fullscreenAvatarInitials: {
    fontSize: 54,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2
  },
  fullscreenName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold"
  },
  fullscreenNote: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    marginTop: 6
  },
  modalFooter: {
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    alignItems: "center"
  },
  modalFooterHint: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12
  }
});
