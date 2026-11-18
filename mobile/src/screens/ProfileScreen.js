import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  // Ekstrak informasi pengguna aktif
  const userName = user?.name || "Lanjar Setiawan";
  const userUsername = user?.username || "lanjar";
  const userEmail = user?.email || `${userUsername}@meeplecafe.com`;
  const userPhone = user?.phone || "0812-3456-7890";
  const userNim = user?.nim ? user.nim : "";
  const userMajor = user?.major || "Teknik Komputer";
  const userRole = user?.role || "Member MeepleCafe";

  // Ambil 2 huruf awal dari username pengguna sebagai inisial avatar
  const userInitials = (
    userUsername.length >= 2
      ? userUsername.slice(0, 2)
      : userName.slice(0, 2) || "MC"
  ).toUpperCase();

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar dari akun MeepleCafe?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Keluar",
          style: "destructive",
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Banner Konsisten */}
      <View style={styles.header}>
        <View style={styles.headerBrandRow}>
          <Image
            source={require("../../assets/Logo-MeepleCafe.jpeg")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Profil Pengguna</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Kotakan Header Profil (Avatar 2 Huruf, Nama, Username, dan Tombol Edit Profil) */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarInitials}>{userInitials}</Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>

          <Text style={styles.studentName}>{userName}</Text>
          <Text style={styles.studentUsername}>@{userUsername}</Text>

          <TouchableOpacity
            style={styles.btnEditProfileHeader}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Ionicons name="create-outline" size={15} color={colors.primaryDark} style={{ marginRight: 6 }} />
            <Text style={styles.btnEditProfileHeaderText}>Edit Profil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bodyContent}>
          {/* Card: Informasi Akun Pengguna (Tanpa Tombol Edit) */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
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

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="call-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoTextBox}>
                <Text style={styles.infoItemLabel}>Nomor Telepon</Text>
                <Text style={styles.infoItemValue}>{userPhone}</Text>
              </View>
            </View>

            {userNim ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="id-card-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoTextBox}>
                  <Text style={styles.infoItemLabel}>NIM Mahasiswa</Text>
                  <Text style={styles.infoItemValue}>{userNim}</Text>
                </View>
              </View>
            ) : null}

            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
              <View style={styles.infoIconBox}>
                <Ionicons name="school-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoTextBox}>
                <Text style={styles.infoItemLabel}>Program Studi / Kategori</Text>
                <Text style={styles.infoItemValue}>{userMajor}</Text>
              </View>
            </View>
          </View>

          {/* About Application */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Image
                source={require("../../assets/Logo-MeepleCafe.jpeg")}
                style={styles.cardLogo}
                resizeMode="contain"
              />
              <Text style={styles.cardTitle}>Tentang MeepleCafe</Text>
            </View>
            <Text style={styles.aboutText}>
              MeepleCafe adalah aplikasi mobile terintegrasi untuk pecinta board game.
              Aplikasi ini memadukan katalog koleksi permainan fisik terlengkap dengan
              sistem pemesanan meja dan ruangan bermain di kafe secara instan.
            </Text>
          </View>

          {/* Cafe Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="storefront" size={22} color={colors.secondary} />
              <Text style={styles.cardTitle}>Informasi Operasional Kafe</Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoHeading}>Alamat Kafe</Text>
                <Text style={styles.infoDesc}>
                  Jl. Graha Prasetya IV No.65, Pedalangan, Kec. Banyumanik, Kota Semarang, Jawa Tengah 50268
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoHeading}>Jam Buka</Text>
                <Text style={styles.infoDesc}>Setiap Hari: 10.00 – 21.00 WIB</Text>
              </View>
            </View>

            <View style={[styles.infoItem, { marginBottom: 0 }]}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoHeading}>Kontak Layanan</Text>
                <Text style={styles.infoDesc}>WhatsApp: +62 812-3456-7890</Text>
              </View>
            </View>
          </View>

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
  scrollView: {
    flex: 1,
    marginTop: -16
  },
  scrollContent: {
    paddingBottom: 36
  },
  profileHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  bodyContent: {
    paddingHorizontal: 16
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12
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
    elevation: 5,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  avatarInitials: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    borderWidth: 2.5,
    borderColor: "#FFFFFF"
  },
  studentName: {
    fontSize: 21,
    fontWeight: "bold",
    color: colors.text
  },
  studentUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 2
  },
  btnEditProfileHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 12
  },
  btnEditProfileHeaderText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.primaryDark
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
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
  cardLogo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: "bold",
    color: colors.text,
    marginLeft: 8
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 11,
    marginBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6"
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  infoTextBox: {
    flex: 1
  },
  infoItemLabel: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: "500"
  },
  infoItemValue: {
    fontSize: 13.5,
    color: colors.text,
    fontWeight: "700",
    marginTop: 1
  },
  aboutText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10
  },
  infoContent: {
    marginLeft: 10,
    flex: 1
  },
  infoHeading: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.text
  },
  infoDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18
  },
  btnLogout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#DC2626",
    marginTop: 6,
    marginBottom: 24
  },
  btnLogoutText: {
    color: "#DC2626",
    fontSize: 14.5,
    fontWeight: "700"
  }
});
