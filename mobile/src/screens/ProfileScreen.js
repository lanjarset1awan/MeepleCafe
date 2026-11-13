import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { DEFAULT_BACKEND_URL } from "../api/config";

export default function ProfileScreen() {
  const openGitHub = () => {
    Linking.openURL("https://github.com");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
            }}
            style={styles.avatarImage}
          />
          <View style={styles.onlineBadge} />
        </View>

        <Text style={styles.studentName}>Lanjar Setiawan</Text>
        <Text style={styles.studentNim}>NIM: 211201221XXXXX</Text>
        <Text style={styles.studentDept}>Teknik Komputer / Elektro</Text>

        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Praktikum PPB 2026</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: "#DCFCE7" }]}>
            <Text style={[styles.tagText, { color: "#166534" }]}>React Native + Supabase</Text>
          </View>
        </View>
      </View>

      {/* About Application */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
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
          <Ionicons name="storefront" size={20} color={colors.secondary} />
          <Text style={styles.cardTitle}>Informasi Operasional Kafe</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={18} color={colors.textMuted} />
          <View style={styles.infoContent}>
            <Text style={styles.infoHeading}>Alamat Kafe</Text>
            <Text style={styles.infoDesc}>
              Jl. Prof. Sudarto, Tembalang, Semarang (Dekat Kampus UNDIP)
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={18} color={colors.textMuted} />
          <View style={styles.infoContent}>
            <Text style={styles.infoHeading}>Jam Buka</Text>
            <Text style={styles.infoDesc}>Selasa – Minggu: 12.00 – 23.00 WIB (Senin Tutup)</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="call-outline" size={18} color={colors.textMuted} />
          <View style={styles.infoContent}>
            <Text style={styles.infoHeading}>Kontak Layanan</Text>
            <Text style={styles.infoDesc}>WhatsApp: +62 812-3456-7890</Text>
          </View>
        </View>
      </View>

      {/* Technical Spec & Status */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="code-slash" size={20} color={colors.darkBg} />
          <Text style={styles.cardTitle}>Spesifikasi Teknis Tugas Akhir</Text>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specKey}>Arsitektur Backend</Text>
          <Text style={styles.specVal}>Node.js + Express (MVC)</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specKey}>Database</Text>
          <Text style={styles.specVal}>Supabase PostgreSQL</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specKey}>Frontend Framework</Text>
          <Text style={styles.specVal}>React Native Expo</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specKey}>Navigasi</Text>
          <Text style={styles.specVal}>Bottom Tabs & Native Stack</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specKey}>Total Halaman</Text>
          <Text style={styles.specVal}>7 Halaman Aktif</Text>
        </View>

        <TouchableOpacity style={styles.githubButton} onPress={openGitHub} activeOpacity={0.85}>
          <Ionicons name="logo-github" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.githubText}>Lihat Source Code di GitHub</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 16,
    paddingTop: 54,
    paddingBottom: 40
  },
  profileHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12
  },
  avatarImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: colors.primary
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  studentName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text
  },
  studentNim: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2
  },
  studentDept: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1
  },
  tagRow: {
    flexDirection: "row",
    marginTop: 14
  },
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginHorizontal: 4
  },
  tagText: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.primaryDark
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 15,
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
    marginBottom: 12
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
    marginTop: 2,
    lineHeight: 18
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  specKey: {
    fontSize: 12,
    color: colors.textMuted
  },
  specVal: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text
  },
  githubButton: {
    flexDirection: "row",
    backgroundColor: colors.darkBg,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16
  },
  githubText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold"
  }
});
