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
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";
import GameImage from "../components/GameImage";

export default function GameListScreen({ navigation }) {
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
      console.error(err);
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
          {/* 1. Kategori (Bubble Kotak Biru) */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {item.game_categories?.name || "General"}
            </Text>
          </View>

          {/* 2. Jumlah Pemain (Biru) */}
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.primary, fontWeight: "600" }]}>
              {item.min_players}-{item.max_players} Pemain
            </Text>
          </View>

          {/* 3. Durasi (Biru) */}
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

        <View style={styles.actionFooter}>
          <Text style={styles.actionFooterText}>Pelajari Aturan & Pilih Game</Text>
          <Ionicons name="arrow-forward-circle" size={18} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerBrandRow}>
          <Image
            source={require("../../assets/Logo-MeepleCafe.jpeg")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Katalog Koleksi Game</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          placeholder="Cari board game (UNO, Monopoly, Catur)..."
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
      <View style={styles.filterWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const active = selectedFilter === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedFilter(item)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat katalog board game...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGames}
          keyExtractor={(item) => item.id}
          renderItem={renderGameCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={54} color={colors.textMuted} />
              <Text style={styles.emptyText}>Tidak ada board game yang cocok.</Text>
            </View>
          }
        />
      )}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: colors.text
  },
  filterWrapper: {
    marginTop: 12,
    marginBottom: 6
  },
  filterList: {
    paddingHorizontal: 16
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: colors.card,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted
  },
  filterChipTextActive: {
    color: "#FFFFFF"
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  cardImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover"
  },
  cardContent: {
    padding: 14
  },
  gameTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 6
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap"
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 11
  },
  categoryBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.primaryDark
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 11
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18
  },
  actionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.border
  },
  actionFooterText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 14
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60
  },
  emptyText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 15
  }
});
