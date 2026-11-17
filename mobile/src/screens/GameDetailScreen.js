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
import { colors } from "../theme/colors";
import GameImage from "../components/GameImage";

export default function GameDetailScreen({ route, navigation }) {
  const { gameId } = route.params;
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleSelectGameAndChooseTable = () => {
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

          {/* Kotakan Meta Info: Kategori (Bubble), Total Pemain, dan Waktu Main */}
          <View style={styles.metaBox}>
            {/* 1. Kategori (Bubble Kotak Biru) */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {game.game_categories?.name || "General"}
              </Text>
            </View>

            {/* 2. Jumlah Pemain (Biru) */}
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={15} color={colors.primary} />
              <Text style={styles.metaText}>
                {game.min_players}-{game.max_players} Pemain
              </Text>
            </View>

            {/* 3. Waktu Main (Biru) */}
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={15} color={colors.primary} />
              <Text style={styles.metaText}>
                {game.duration_minutes} mnt
              </Text>
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
          <Ionicons name="calendar-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.ctaText}>Pilih Game Ini & Lanjut Reservasi Meja</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12
  },
  metaBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDark
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center"
  },
  metaText: {
    fontSize: 12.5,
    marginLeft: 5,
    color: colors.primary,
    fontWeight: "600"
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
