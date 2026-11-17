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

  const stockCount = game.stock || 2; // Default 2 box fisik di kafe

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
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {game.game_categories?.name || "General"}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                game.is_available ? styles.statusAvailable : styles.statusUnavailable
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  game.is_available ? styles.statusTextAvailable : styles.statusTextUnavailable
                ]}
              >
                {game.is_available ? "Tersedia di Kafe" : "Sedang Dimainkan"}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{game.title}</Text>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={styles.statValue}>
                {game.min_players}-{game.max_players}
              </Text>
              <Text style={styles.statLabel}>Pemain</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="time-outline" size={20} color={colors.secondary} />
              <Text style={styles.statValue}>{game.duration_minutes} Mnt</Text>
              <Text style={styles.statLabel}>Durasi</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="cube-outline" size={20} color={colors.primaryDark} />
              <Text style={styles.statValue}>{stockCount} Box</Text>
              <Text style={styles.statLabel}>Stok Kafe</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons
                name="bar-chart-outline"
                size={20}
                color={
                  (game.difficulty || "").toLowerCase() === "easy"
                    ? colors.success
                    : (game.difficulty || "").toLowerCase() === "medium"
                      ? colors.secondary
                      : colors.accent
                }
              />
              <Text style={styles.statValue}>{game.difficulty}</Text>
              <Text style={styles.statLabel}>Tingkat</Text>
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
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8
  },
  categoryBadgeText: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 12
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  statusAvailable: {
    backgroundColor: "#DCFCE7"
  },
  statusUnavailable: {
    backgroundColor: "#FEE2E2"
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700"
  },
  statusTextAvailable: {
    color: "#166534"
  },
  statusTextUnavailable: {
    color: "#991B1B"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  statBox: {
    flex: 1,
    alignItems: "center"
  },
  statValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 4
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
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
