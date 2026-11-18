import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("../../assets/Logo-MeepleCafe.jpeg")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>MeepleCafe</Text>
          <Text style={styles.tagline}>Koleksi Board Game & Reservasi Meja Kafe</Text>
          <Text style={styles.description}>
            Eksplorasi ratusan permainan papan fisik, pelajari aturan main, dan amankan meja bermain favoritmu dalam satu genggaman.
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <View style={styles.featureIconCircle}>
              <Ionicons name="albums-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Katalog Koleksi Lengkap</Text>
              <Text style={styles.featureDesc}>
                Lengkap dengan durasi, jumlah pemain, kategori, dan tutorial panduan aturan main.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconCircle}>
              <MaterialCommunityIcons name="table-chair" size={22} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Pesan Meja Tanpa Antre</Text>
              <Text style={styles.featureDesc}>
                Pilihan meja Reguler, Premium, hingga Ruang VIP privat dengan fasilitas high-speed Wi-Fi.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconCircle}>
              <Ionicons name="ticket-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Tiket Reservasi Digital</Text>
              <Text style={styles.featureDesc}>
                Pantau kode booking, sesi bermain, dan bukti reservasi secara langsung dan transparan.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.btnLogin}
            activeOpacity={0.88}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.btnLoginText}>Masuk ke Akun</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnRegister}
            activeOpacity={0.88}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.btnRegisterText}>Daftar Akun Baru</Text>
          </TouchableOpacity>

          <View style={styles.demoHintBox}>
            <Ionicons name="information-circle-outline" size={15} color={colors.primaryDark} style={{ marginRight: 6 }} />
            <Text style={styles.demoHintText}>
              Akun bawaan: <Text style={{ fontWeight: "bold" }}>lanjar</Text> • Sandi: <Text style={{ fontWeight: "bold" }}>123</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 24
  },
  logoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primaryLight
  },
  logoImage: {
    width: 74,
    height: 74,
    borderRadius: 37
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.darkBg,
    letterSpacing: 0.5,
    marginBottom: 4
  },
  tagline: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 10,
    textAlign: "center"
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12
  },
  featuresContainer: {
    marginBottom: 26
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },
  featureContent: {
    flex: 1
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 3
  },
  featureDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16
  },
  actionSection: {
    alignItems: "stretch"
  },
  btnLogin: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 }
  },
  btnLoginText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
  },
  btnRegister: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: 14
  },
  btnRegisterText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "bold"
  },
  demoHintBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  demoHintText: {
    fontSize: 12,
    color: colors.primaryDark
  }
});
