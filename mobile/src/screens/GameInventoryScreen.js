import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";
import GameImage from "../components/GameImage";

export default function GameInventoryScreen({ navigation }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("all"); // 'all', 'available', 'in_use'

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

  // Generate deterministic stock info for inventory display
  const getGameStock = (index, isAvailable) => {
    if (!isAvailable) return 0;
    // Stock varies between 1 to 3 boxes
    return (index % 3) + 1;
  };

  const getRackCode = (index) => {
    const letters = ["A", "B", "C", "D"];
    const section = letters[index % letters.length];
    const shelfNum = Math.floor(index / letters.length) + 1;
    return `Rak ${section}-0${shelfNum}`;
  };

  const filteredGames = games.filter((item, index) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Simulate one or two games in-use for realistic cafe inventory demo
    const isInUse = index === 3 || index === 7;
    const isAvailable = !isInUse && item.is_available;

    if (filterAvailability === "available") {
      return matchesSearch && isAvailable;
    }
    if (filterAvailability === "in_use") {
      return matchesSearch && isInUse;
    }
    return matchesSearch;
  });

  const totalTitles = games.length;
  const availableTitles = games.filter((_, idx) => idx !== 3 && idx !== 7).length;

  const renderCompactItem = ({ item, index }) => {
    const isInUse = index === 3 || index === 7;
    const isAvailable = !isInUse && item.is_available;
    const stockCount = getGameStock(index, isAvailable);
    const rackCode = getRackCode(index);

    return (
      <TouchableOpacity
        style={styles.compactRow}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("GameDetail", { gameId: item.id, title: item.title })
        }
      >
        {/* Thumbnail Small */}
        <GameImage uri={item.image_url} style={styles.thumbImage} />

        {/* Info Tengah */}
        <View style={styles.centerInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={styles.metaBadgeRow}>
            <View style={styles.genrePill}>
              <Text style={styles.genrePillText}>
                {item.game_categories?.name || "Game"}
              </Text>
            </View>
            <View style={styles.rackBadge}>
              <Ionicons name="location-sharp" size={11} color={colors.textMuted} style={{ marginRight: 2 }} />
              <Text style={styles.rackText}>{rackCode}</Text>
            </View>
          </View>

          <View style={styles.metaIconRow}>
            <View style={styles.metaIconItem}>
              <Ionicons name="people-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.playerText}>
                {item.min_players}-{item.max_players} Pemain
              </Text>
            </View>
            <Text style={styles.metaDivider}>•</Text>
            <View style={styles.metaIconItem}>
              <Ionicons name="time-outline" size={13} color={colors.secondary} style={{ marginRight: 4 }} />
              <Text style={styles.playerText}>
                {item.duration_minutes} mnt
              </Text>
            </View>
          </View>
        </View>

        {/* Status & Ketersediaan di Kanan */}
        <View style={styles.rightInfo}>
          <View
            style={[
              styles.stockBadge,
              isAvailable ? styles.stockAvailable : styles.stockInUse
            ]}
          >
            <Text
              style={[
                styles.stockText,
                isAvailable ? styles.stockTextAvailable : styles.stockTextInUse
              ]}
            >
              {isAvailable ? `Tersedia ${stockCount} Box` : "Sedang Main"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginTop: 6 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBrandRow}>
          <Image
            source={require("../../assets/Logo-MeepleCafe.jpeg")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Daftar Stok Game</Text>
        </View>
      </View>

      {/* Summary Stat Box */}
      <View style={styles.summaryBar}>
        <View style={styles.statCol}>
          <Text style={styles.statNum}>{totalTitles}</Text>
          <Text style={styles.statLbl}>Total Judul</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={[styles.statNum, { color: colors.primary }]}>
            {availableTitles}
          </Text>
          <Text style={styles.statLbl}>Siap di Rak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={[styles.statNum, { color: colors.secondary }]}>2</Text>
          <Text style={styles.statLbl}>Sedang Main</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          placeholder="Cari daftar game di rak..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs (Semua, Tersedia, Dipinjam) */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, filterAvailability === "all" && styles.tabBtnActive]}
          onPress={() => setFilterAvailability("all")}
        >
          <Text style={[styles.tabBtnText, filterAvailability === "all" && styles.tabBtnTextActive]}>
            Semua ({totalTitles})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, filterAvailability === "available" && styles.tabBtnActive]}
          onPress={() => setFilterAvailability("available")}
        >
          <Text style={[styles.tabBtnText, filterAvailability === "available" && styles.tabBtnTextActive]}>
            Tersedia di Rak ({availableTitles})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, filterAvailability === "in_use" && styles.tabBtnActive]}
          onPress={() => setFilterAvailability("in_use")}
        >
          <Text style={[styles.tabBtnText, filterAvailability === "in_use" && styles.tabBtnTextActive]}>
            Sedang Main (2)
          </Text>
        </TouchableOpacity>
      </View>

      {/* List Compact */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat inventaris rak game...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGames}
          keyExtractor={(item) => item.id}
          renderItem={renderCompactItem}
          contentContainerStyle={styles.listContent}
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
              <Text style={styles.emptyText}>Tidak ada data game yang sesuai.</Text>
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
    paddingTop: 52,
    paddingBottom: 26,
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
  summaryBar: {
    flexDirection: "row",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  statCol: {
    flex: 1,
    alignItems: "center"
  },
  statNum: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text
  },
  statLbl: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: "70%",
    backgroundColor: colors.border,
    alignSelf: "center"
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.text
  },
  filterTabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted
  },
  tabBtnTextActive: {
    color: "#FFFFFF"
  },
  listContent: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 24
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }
  },
  thumbImage: {
    width: 54,
    height: 54,
    borderRadius: 10,
    resizeMode: "cover"
  },
  centerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4
  },
  metaBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  genrePill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8
  },
  genrePillText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryDark
  },
  rackBadge: {
    flexDirection: "row",
    alignItems: "center"
  },
  rackText: {
    fontSize: 11,
    color: colors.textMuted
  },
  metaIconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2
  },
  metaIconItem: {
    flexDirection: "row",
    alignItems: "center"
  },
  metaDivider: {
    marginHorizontal: 6,
    color: colors.textMuted,
    fontSize: 10
  },
  playerText: {
    fontSize: 11,
    color: colors.textMuted
  },
  rightInfo: {
    alignItems: "flex-end",
    justifyContent: "center"
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  stockAvailable: {
    backgroundColor: colors.primaryLight
  },
  stockInUse: {
    backgroundColor: "#F1F5F9"
  },
  stockText: {
    fontSize: 10,
    fontWeight: "700"
  },
  stockTextAvailable: {
    color: colors.primaryDark
  },
  stockTextInUse: {
    color: colors.textMuted
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
  emptyContainer: {
    alignItems: "center",
    marginTop: 50
  },
  emptyText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 14
  }
});

