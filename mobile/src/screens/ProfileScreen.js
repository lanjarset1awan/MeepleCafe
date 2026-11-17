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
        <View style={styles.headerBrandRow}>
          <Image
            source={require("../../assets/Logo-MeepleCafe.jpeg")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Profil Pengguna</Text>
        </View>
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
        <View style={styles.deptBadge}>
          <Ionicons name="school-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.deptText}>Teknik Komputer</Text>
        </View>
      </View>

      <View style={styles.bodyContent}>
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
            <Ionicons name="time-outline" size={20} color={colors.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoHeading}>Jam Buka</Text>
              <Text style={styles.infoDesc}>Setiap Hari: 10.00 – 21.00 WIB</Text>
            </View>
          </View>

          <View style={[styles.infoItem, { marginBottom: 0 }]}>
            <Ionicons name="call-outline" size={20} color={colors.success} />
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
  profileHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
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
    paddingHorizontal: 16,
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 16
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 10
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3.5,
    borderColor: colors.primary
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
  studentNim: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginTop: 2
  },
  deptBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6
  },
  deptText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.primaryDark
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 10
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
  }
});

