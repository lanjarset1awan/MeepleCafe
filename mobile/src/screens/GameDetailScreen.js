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
        <Text style={styles.loadingText}>Memuat detail permainan...</Text>
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

  const stockCount = game.stock || 2;

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Cover Image */}
        <View style={styles.imageWrapper}>
          <GameImage uri={game.image_url} style={styles.bannerImage} />
        </View>

        {/* Floating Detail Card */}
        <View style={styles.detailCard}>
          {/* Header Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {game.game_categories?.name || "Board Game"}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                game.is_available ? styles.statusAvailable : styles.statusUnavailable
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: game.is_available ? colors.success : colors.danger }
                ]}
              />
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

          {/* Game Title */}
          <Text style={styles.title}>{game.title}</Text>

          {/* 4 Quick Stat Cards (Pemain, Durasi, Stok Kafe, Tingkat Kesulitan) */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={[styles.statIconBox, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="people" size={18} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>
                {game.min_players}-{game.max_players}
              </Text>
              <Text style={styles.statLabel}>Pemain</Text>
            </View>

            <View style={styles.statBox}>
              <View style={[styles.statIconBox, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="time" size={18} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>{game.duration_minutes} Mnt</Text>
              <Text style={styles.statLabel}>Durasi</Text>
            </View>

            <View style={styles.statBox}>
              <View style={[styles.statIconBox, { backgroundColor: colors.successLight }]}>
                <Ionicons name="cube" size={18} color={colors.success} />
              </View>
              <Text style={styles.statValue}>{stockCount} Box</Text>
              <Text style={styles.statLabel}>Stok Kafe</Text>
            </View>

            <View style={styles.statBox}>
              <View style={[styles.statIconBox, { backgroundColor: "#FAF5FF" }]}>
                <Ionicons name="bar-chart" size={18} color="#9333EA" />
              </View>
              <Text style={styles.statValue}>{game.difficulty}</Text>
              <Text style={styles.statLabel}>Tingkat</Text>
            </View>
          </View>

          {/* Deskripsi Game */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tentang Permainan</Text>
            <Text style={styles.sectionBody}>
              {game.description || "Permainan board game seru dan interaktif untuk dimainkan bersama teman atau keluarga di MeepleCafe."}
            </Text>
          </View>

          {/* Panduan Tutorial & Aturan */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="book-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Panduan & Aturan Bermain</Text>
            </View>
            <View style={styles.rulesBox}>
              <Ionicons
                name="bulb-outline"
                size={22}
                color={colors.primary}
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <Text style={styles.rulesText}>
                {game.rules_summary ||
                  "Minta bantuan Game Master kami saat kedatangan di kafe untuk memandu jalannya permainan langkah demi langkah!"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.88}
          onPress={handleSelectGameAndChooseTable}
        >
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.ctaText}>Pilih Game & Pesan Meja</Text>
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
    paddingBottom: 100
  },
  imageWrapper: {
    width: "100%",
    height: 250,
    backgroundColor: colors.secondary
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  detailCard: {
    marginTop: -24,
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 }
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20
  },
  statusAvailable: {
    backgroundColor: colors.successLight
  },
  statusUnavailable: {
    backgroundColor: colors.dangerLight
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700"
  },
  statusTextAvailable: {
    color: colors.successText
  },
  statusTextUnavailable: {
    color: colors.dangerText
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
    marginBottom: 22,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  statBox: {
    flex: 1,
    alignItems: "center"
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6
  },
  statValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.text
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
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8
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
    borderRadius: 14,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: colors.primaryBorder
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
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -3 }
  },
  ctaButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 3
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 15,
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
    color: colors.danger,
    fontSize: 15
  }
});
