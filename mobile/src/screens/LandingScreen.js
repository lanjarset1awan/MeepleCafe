import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";
import GameImage from "../components/GameImage";

export default function LandingScreen({ navigation }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const categories = ["All", "Strategy", "Party Game", "Family", "Social Deduction"];

  const loadGames = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getGames();
      setGames(data || []);
    } catch (err) {
      console.error("LandingScreen loadGames error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadGames();
  };

  // Filter game berdasarkan pencarian dan kategori
  const filteredGames = games.filter((item) => {
    const categoryName = item.game_categories?.name || "";
    const matchesCategory =
      selectedFilter === "All" ||
      categoryName.toLowerCase().includes(selectedFilter.toLowerCase());
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Aksi ketika tombol "Main" ditekan -> Suruh login/daftar
  const handlePlayGame = (item) => {
    Alert.alert(
      "Masuk untuk Bermain",
      `Ingin memainkan "${item.title}"? Silakan masuk ke akun MeepleCafe Anda terlebih dahulu untuk reservasi meja.`,
      [
        { text: "Nanti Saja", style: "cancel" },
        {
          text: "Daftar Akun",
          onPress: () => navigation.navigate("Register")
        },
        {
          text: "Masuk",
          style: "default",
          onPress: () => navigation.navigate("Login")
        }
      ]
    );
  };

  const renderGameCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => navigation.navigate("GameDetail", { gameId: item.id, title: item.title })}
    >
      <GameImage uri={item.image_url} style={styles.cardImage} />

      <View style={styles.cardContent}>
        <Text style={styles.gameTitle} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.metaRow}>
          {/* Kategori Game */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {item.game_categories?.name || "General"}
            </Text>
          </View>

          {/* Jumlah Pemain */}
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.primary, fontWeight: "600" }]}>
              {item.min_players}-{item.max_players} Pemain
            </Text>
          </View>

          {/* Durasi */}
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.primary, fontWeight: "600" }]}>
              {item.duration_minutes} mnt
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Footer Card: Lihat Detail & Tombol Main */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.btnDetail}
            onPress={() => navigation.navigate("GameDetail", { gameId: item.id, title: item.title })}
          >
            <Text style={styles.btnDetailText}>Detail Game</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnPlay}
            activeOpacity={0.85}
            onPress={() => handlePlayGame(item)}
          >
            <Ionicons name="play" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.btnPlayText}>Main</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Banner Konsisten */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerBrandRow}>
            <Image
              source={require("../../assets/Logo-MeepleCafe.jpeg")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>MeepleCafe</Text>
          </View>

          {/* Tombol Masuk & Daftar di Header */}
          <View style={styles.authButtonsRow}>
            <TouchableOpacity
              style={styles.headerBtnRegister}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.headerBtnRegisterText}>Daftar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerBtnLogin}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Login")}
            >
              <Ionicons name="log-in-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.headerBtnLoginText}>Masuk</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Welcoming Tagline */}
        <View style={styles.heroBox}>
          <Text style={styles.heroTitle}>Katalog Koleksi Board Game</Text>
          <Text style={styles.heroSubtitle}>
            Jelajahi ratusan permainan papan fisik. Tekan tombol <Text style={{ fontWeight: "bold", color: "#FFFFFF" }}>Main</Text> untuk memesan meja kafe!
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          placeholder="Cari board game (Catan, UNO, Catur, Dixit)..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Pills */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === item && styles.filterTextActive
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Game Cards List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat katalog board game...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGames}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderGameCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Tidak ada board game yang cocok.</Text>
            </View>
          }
        />
      )}

      {/* Floating Bottom Bar: Ajakan Masuk / Demo */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomBarTitle}>Ingin bermain langsung di kafe?</Text>
          <Text style={styles.bottomBarSubtitle}>Masuk atau daftar untuk reservasi meja.</Text>
        </View>
        <TouchableOpacity
          style={styles.bottomBtnLogin}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.bottomBtnLoginText}>Masuk Akun</Text>
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
  header: {
    backgroundColor: colors.darkBg,
    paddingTop: 46,
    paddingBottom: 16,
    paddingHorizontal: 16
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  headerLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: "#FFFFFF"
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  authButtonsRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  headerBtnRegister: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 6
  },
  headerBtnRegisterText: {
    color: "#E2E8F0",
    fontSize: 12.5,
    fontWeight: "600"
  },
  headerBtnLogin: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  headerBtnLoginText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "bold"
  },
  heroBox: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 10,
    marginTop: 2
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  },
  heroSubtitle: {
    color: "#CBD5E1",
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13.5,
    color: colors.text
  },
  filterContainer: {
    marginBottom: 8
  },
  filterList: {
    paddingHorizontal: 16
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterText: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: "500"
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 85
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  cardImage: {
    width: 90,
    height: 105,
    borderRadius: 10
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between"
  },
  gameTitle: {
    fontSize: 15.5,
    fontWeight: "bold",
    color: colors.text
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 3,
    marginBottom: 4,
    gap: 5
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  categoryBadgeText: {
    color: colors.primaryDark,
    fontSize: 10.5,
    fontWeight: "700"
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted
  },
  description: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 6
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 6
  },
  btnDetail: {
    flexDirection: "row",
    alignItems: "center"
  },
  btnDetailText: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: "500",
    marginRight: 2
  },
  btnPlay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14
  },
  btnPlayText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold"
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40
  },
  loadingText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 13
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50
  },
  emptyText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 13
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: -2 }
  },
  bottomBarInfo: {
    flex: 1,
    marginRight: 12
  },
  bottomBarTitle: {
    fontSize: 12.5,
    fontWeight: "bold",
    color: colors.text
  },
  bottomBarSubtitle: {
    fontSize: 11,
    color: colors.textMuted
  },
  bottomBtnLogin: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10
  },
  bottomBtnLoginText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold"
  }
});
