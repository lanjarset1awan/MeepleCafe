import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import GameImage from "../components/GameImage";
import CustomDialog from "../components/CustomDialog";

export default function GameDetailScreen({ route, navigation }) {
  const { gameId } = route.params;
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        const data = await ApiService.getGameById(gameId);
        setGame(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [gameId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat detail permainan & stok...</Text>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Data game tidak ditemukan.</Text>
      </View>
    );
  }

  const stockCount =
    route.params?.stock !== undefined ? route.params.stock : (game.stock || 2);

  const getRackCode = (id) => {
    const num = typeof id === "number" ? id : (parseInt(String(id).replace(/\D/g, ""), 10) || 1);
    const letters = ["A", "B", "C", "D"];
    const section = letters[(num - 1) % letters.length];
    const shelfNum = Math.floor(((num - 1) % 12) / letters.length) + 1;
    return `Rak ${section}-0${shelfNum}`;
  };

  const rackCode =
    route.params?.rackCode || game.rack_code || getRackCode(game.id);

  const handleSelectGameAndChooseTable = () => {
    if (!user) {
      setLoginPromptVisible(true);
      return;
    }

    navigation.navigate("TableTab", {
      screen: "TableList",
      params: {
        selectedGame: {
          id: game.id,
          title: game.title,
          image_url: game.image_url,
          min_players: game.min_players,
          max_players: game.max_players,
          difficulty: game.difficulty,
          stock: stockCount,
          category: game.game_categories?.name || "General"
        }
      }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Image */}
        <GameImage uri={game.image_url} style={styles.bannerImage} />

        {/* Floating Header Card */}
        <View style={styles.detailCard}>
          <Text style={styles.title}>{game.title}</Text>

          {/* Kotakan Ringkasan Spesifikasi Game (Grid 3x2 Seimbang & Elegan) */}
          <View style={styles.specsCard}>
            {/* Baris 1: Kategori, Jumlah Pemain, Durasi Main */}
            <View style={styles.specsRow}>
              {/* 1. Kategori */}
              <View style={styles.specCell}>
                <View style={styles.iconCircle}>
                  <Ionicons name="shapes-outline" size={17} color={colors.primary} />
                </View>
                <Text style={styles.specValue} numberOfLines={1}>
                  {game.game_categories?.name || "General"}
                </Text>
                <Text style={styles.specLabel}>Kategori</Text>
              </View>

              {/* 2. Jumlah Pemain */}
              <View style={styles.specCell}>
                <View style={styles.iconCircle}>
                  <Ionicons name="people-outline" size={17} color={colors.primary} />
                </View>
                <Text style={styles.specValue} numberOfLines={1}>
                  {game.min_players}-{game.max_players} Org
                </Text>
                <Text style={styles.specLabel}>Pemain</Text>
              </View>

              {/* 3. Durasi Main */}
              <View style={styles.specCell}>
                <View style={styles.iconCircle}>
                  <Ionicons name="time-outline" size={17} color={colors.primary} />
                </View>
                <Text style={styles.specValue} numberOfLines={1}>
                  {game.duration_minutes} Mnt
                </Text>
                <Text style={styles.specLabel}>Durasi</Text>
              </View>
            </View>

            {/* Garis Pemisah Halus Antar Baris */}
            <View style={styles.specsDivider} />

            {/* Baris 2: Stok Box, Posisi Rak, Tingkat Kesulitan */}
            <View style={styles.specsRow}>
              {/* 4. Stok Box */}
              <View style={styles.specCell}>
                <View style={styles.iconCircle}>
                  <Ionicons name="cube-outline" size={17} color={colors.primary} />
                </View>
                <Text style={styles.specValue} numberOfLines={1}>
                  {stockCount} Box
                </Text>
                <Text style={styles.specLabel}>Stok Kafe</Text>
              </View>

              {/* 5. Posisi Rak */}
              <View style={styles.specCell}>
                <View style={styles.iconCircle}>
                  <Ionicons name="location-outline" size={17} color={colors.primary} />
                </View>
                <Text style={styles.specValue} numberOfLines={1}>
                  {rackCode}
                </Text>
                <Text style={styles.specLabel}>Posisi Rak</Text>
              </View>

              {/* 6. Kesulitan */}
              <View style={styles.specCell}>
                <View style={styles.iconCircle}>
                  <Ionicons name="bar-chart-outline" size={17} color={colors.primary} />
                </View>
                <Text style={styles.specValue} numberOfLines={1}>
                  {game.difficulty || "Medium"}
                </Text>
                <Text style={styles.specLabel}>Tingkat</Text>
              </View>
            </View>
          </View>

          {/* Sinopsis & Deskripsi Permainan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deskripsi Permainan</Text>
            <Text style={styles.sectionBody}>
              {game.description || "Tidak ada deskripsi khusus untuk game ini."}
            </Text>
          </View>

          {/* Tutorial / Rangkuman Aturan Main */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="book-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Panduan Tutorial & Aturan Bermain</Text>
            </View>
            <View style={styles.rulesBox}>
              <Text style={styles.rulesText}>
                {game.rules_summary ||
                  "Minta bantuan Game Master kafe kami untuk memandu jalannya permainan langkah demi langkah!"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Floating CTA Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.88}
          onPress={handleSelectGameAndChooseTable}
        >
          <Ionicons
            name={user ? "calendar-outline" : "play-circle-outline"}
            size={20}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.ctaText}>
            {user ? "Pilih Game Ini & Lanjut Reservasi Meja" : "Main Game Ini (Perlu Masuk Akun)"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dialog Kustom Wajib Masuk Akun (CustomDialog) */}
      <CustomDialog
        visible={loginPromptVisible}
        type="info"
        iconName="game-controller"
        title="Masuk untuk Bermain"
        message={`Ingin memainkan "${game?.title || "game ini"}"? Silakan masuk ke akun MeepleCafe Anda atau daftar akun baru untuk memilih meja dan bermain di kafe.`}
        secondaryText="Daftar Akun Baru"
        confirmText="Masuk Sekarang"
        cancelText="Nanti Dulu"
        onConfirm={() => {
          setLoginPromptVisible(false);
          navigation.navigate("Login");
        }}
        onSecondary={() => {
          setLoginPromptVisible(false);
          navigation.navigate("Register");
        }}
        onCancel={() => setLoginPromptVisible(false)}
        onClose={() => setLoginPromptVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    paddingBottom: 90
  },
  bannerImage: {
    width: "100%",
    height: 240,
    resizeMode: "cover"
  },
  detailCard: {
    marginTop: -20,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12
  },
  specsCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 20
  },
  specsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  specCell: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 2
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  specValue: {
    fontSize: 12.5,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center"
  },
  specLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "center"
  },
  specsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
    marginHorizontal: 10
  },
  section: {
    marginBottom: 20
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text
  },
  sectionBody: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22
  },
  rulesBox: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    padding: 14,
    borderRadius: 12,
    alignItems: "flex-start",
    marginTop: 4
  },
  rulesText: {
    flex: 1,
    fontSize: 13,
    color: colors.primaryDark,
    lineHeight: 20,
    fontWeight: "500"
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: colors.border
  },
  ctaButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 10,
    color: colors.textMuted
  },
  errorText: {
    color: colors.accent,
    fontSize: 15
  }
});
