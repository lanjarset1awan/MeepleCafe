import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function AboutScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Brand Hero */}
      <View style={styles.heroCard}>
        <Image
          source={require("../../assets/Logo-MeepleCafe.jpeg")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.heroTitle}>MeepleCafe</Text>
        <Text style={styles.heroTagline}>
          Platform Board Game Cafe & Reservasi Meja
        </Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>Versi 1.0.0 • Mobile App</Text>
        </View>
      </View>

      {/* Card 1: Tentang MeepleCafe */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle" size={22} color={colors.primary} />
          <Text style={styles.cardTitle}>Tentang MeepleCafe</Text>
        </View>
        <Text style={styles.aboutText}>
          MeepleCafe adalah aplikasi mobile terintegrasi untuk pecinta board game.
          Aplikasi ini memadukan katalog koleksi permainan fisik terlengkap dengan
          sistem pemesanan meja dan ruangan bermain di kafe secara instan.
        </Text>

        <View style={styles.featuresList}>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="albums-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>Ratusan Koleksi Board Game</Text>
              <Text style={styles.featureDesc}>
                Mulai dari genre strategi, pesta, keluarga, hingga deduksi sosial.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="table-chair" size={18} color={colors.primary} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>Reservasi Meja Instan</Text>
              <Text style={styles.featureDesc}>
                Pilihan meja Reguler, Premium, hingga Ruang VIP privat tanpa antre.
              </Text>
            </View>
          </View>

          <View style={[styles.featureRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.featureIcon}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>Game Master Ramah</Text>
              <Text style={styles.featureDesc}>
                Pemandu berpengalaman siap mengajari aturan bermain game baru.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Card 2: Informasi Operasional Kafe */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="storefront" size={22} color={colors.primary} />
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

      {/* Card 3: Fasilitas Kafe */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Fasilitas & Kenyamanan</Text>
        </View>

        <View style={styles.facilityGrid}>
          <View style={styles.facilityBadge}>
            <Ionicons name="wifi" size={15} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.facilityText}>High-Speed Wi-Fi</Text>
          </View>

          <View style={styles.facilityBadge}>
            <Ionicons name="snow-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.facilityText}>Ruang Ber-AC Sejuk</Text>
          </View>

          <View style={styles.facilityBadge}>
            <Ionicons name="fast-food-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.facilityText}>Snack & Minuman Kafe</Text>
          </View>

          <View style={styles.facilityBadge}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.facilityText}>Komponen Game Terawat</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footerNote}>© 2026 MeepleCafe. All rights reserved.</Text>
    </ScrollView>
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
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
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
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 10,
    backgroundColor: "#FFFFFF"
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text
  },
  heroTagline: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
    textAlign: "center"
  },
  versionBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10
  },
  versionText: {
    fontSize: 11.5,
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginLeft: 8
  },
  aboutText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 14
  },
  featuresList: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC"
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1
  },
  featureInfo: {
    flex: 1
  },
  featureName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text
  },
  featureDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16
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
  facilityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4
  },
  facilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10
  },
  facilityText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryDark
  },
  footerNote: {
    textAlign: "center",
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 10
  }
});
