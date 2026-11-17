import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      {/* Header Banner Konsisten */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("../../assets/Logo-MeepleCafe.jpeg")}
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                marginRight: 8,
                backgroundColor: "#FFFFFF"
              }}
              resizeMode="contain"
            />
            <Text style={styles.headerSubtitle}>User Profile & Info</Text>
          </View>
          <View style={styles.totalBadge}>
            <Ionicons name="school" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.totalBadgeText}>Teknik Komputer</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Profil Saya</Text>
      </View>

      {/* Kotakan Profil (Avatar & Nama) - Melayang Menumpuk di Atas Kotak Biru */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: "https://mmdrzvvnmoplbdfaiixx.supabase.co/storage/v1/object/public/avatar/2/avatar.png?t=1779476174261"
            }}
            style={styles.avatarImage}
          />
          <View style={styles.onlineBadge} />
        </View>

        <Text style={styles.studentName}>Lanjar Setiawan</Text>
        <Text style={styles.studentNim}>NIM: 21120124120023</Text>
        <Text style={styles.studentDept}>Teknik Komputer</Text>
      </View>

      <View style={styles.bodyContent}>
        {/* About Application */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Image
              source={require("../../assets/Logo-MeepleCafe.jpeg")}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                marginRight: 8,
                borderWidth: 1,
                borderColor: colors.border
              }}
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
            <Ionicons name="storefront" size={18} color={colors.secondary} />
            <Text style={styles.cardTitle}>Informasi Operasional Kafe</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={styles.infoHeading}>Alamat Kafe</Text>
              <Text style={styles.infoDesc}>
                Jl. Graha Prasetya IV No.65, Pedalangan, Kec. Banyumanik, Kota Semarang, Jawa Tengah 50268
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={styles.infoHeading}>Jam Buka</Text>
              <Text style={styles.infoDesc}>Setiap Hari: 10.00 – 21.00 WIB</Text>
            </View>
          </View>

          <View style={[styles.infoItem, { marginBottom: 0 }]}>
            <Ionicons name="call-outline" size={16} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={styles.infoHeading}>Kontak Layanan</Text>
              <Text style={styles.infoDesc}>WhatsApp: +62 812-3456-7890</Text>
            </View>
          </View>
        </View>
      </View>
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
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 20
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2
  },
  totalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  totalBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold"
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 4
  },
  profileHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: -16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 10
  },
  bodyContent: {
    paddingHorizontal: 16
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.primary
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  studentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text
  },
  studentNim: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  },
  studentDept: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    marginLeft: 8
  },
  aboutText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8
  },
  infoContent: {
    marginLeft: 10,
    flex: 1
  },
  infoHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text
  },
  infoDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
    lineHeight: 17
  }
});

