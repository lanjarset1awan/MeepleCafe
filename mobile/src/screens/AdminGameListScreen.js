import React, { useState, useEffect, useCallback } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";
import GameImage from "../components/GameImage";
import CustomDialog from "../components/CustomDialog";

export default function AdminGameListScreen({ navigation }) {
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  // State untuk dialog konfirmasi hapus & notifikasi
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedGameForDelete, setSelectedGameForDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState({
    visible: false,
    type: "info",
    title: "",
    message: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [gamesData, catData] = await Promise.all([
        ApiService.getGames(),
        ApiService.getCategories().catch(() => [])
      ]);

      setGames(gamesData || []);

      if (catData && catData.length > 0) {
        const catNames = ["All", ...catData.map((c) => c.name)];
        setCategories(catNames);
      } else {
        setCategories(["All", "Strategy", "Party Game", "Family", "Social Deduction"]);
      }
    } catch (err) {
      console.error("Gagal memuat katalog admin:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Muat ulang setiap kali layar kembali aktif (focus)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter game berdasarkan search & category
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

  // Konfirmasi sebelum hapus
  const handlePromptDelete = (game) => {
    setSelectedGameForDelete(game);
    setDialogVisible(true);
  };

  // Eksekusi hapus game
  const handleConfirmDelete = async () => {
    if (!selectedGameForDelete) return;
    setIsDeleting(true);
    try {
      await ApiService.deleteGame(selectedGameForDelete.id);
      setDialogVisible(false);
      // Hapus dari state lokal seketika
      setGames((prev) => prev.filter((g) => g.id !== selectedGameForDelete.id));
      setSelectedGameForDelete(null);

      setFeedbackDialog({
        visible: true,
        type: "success",
        title: "Berhasil Dihapus",
        message: "Board game telah berhasil dihapus dari katalog MeepleCafe."
      });
    } catch (err) {
      setDialogVisible(false);
      setFeedbackDialog({
        visible: true,
        type: "danger",
        title: "Gagal Menghapus",
        message: err.message || "Terjadi kesalahan saat menghapus data board game."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderGameCard = ({ item }) => {
    const isAvail = item.is_available !== false;
    const categoryName = item.game_categories?.name || "General";

    return (
      <View style={styles.card}>
        {/* Thumbnail Image */}
        <GameImage uri={item.image_url} style={styles.cardImage} />

        <View style={styles.cardContent}>
          {/* Header Row: Title & Status Badge */}
          <View style={styles.cardHeaderRow}>
            <Text style={styles.gameTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.statusBadge, isAvail ? styles.statusBadgeAvail : styles.statusBadgeUnavail]}>
              <View style={[styles.statusDot, { backgroundColor: isAvail ? "#10B981" : "#EF4444" }]} />
              <Text style={[styles.statusBadgeText, { color: isAvail ? "#047857" : "#B91C1C" }]}>
                {isAvail ? "Tersedia" : "Dipinjam"}
              </Text>
            </View>
          </View>

          {/* Meta Info Row */}
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryName}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={13} color={colors.primary} />
              <Text style={styles.metaText}>
                {item.min_players}-{item.max_players} Pemain
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.primary} />
              <Text style={styles.metaText}>{item.duration_minutes} mnt</Text>
            </View>
          </View>

          {/* Deskripsi Singkat */}
          <Text style={styles.description} numberOfLines={2}>
            {item.description || "Tidak ada deskripsi tersedia."}
          </Text>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Action Buttons: Edit & Delete */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.btnEdit}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("AdminGameForm", { game: item })}
            >
              <Ionicons name="create-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnEditText}>Edit Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnDelete}
              activeOpacity={0.8}
              onPress={() => handlePromptDelete(item)}
            >
              <Ionicons name="trash-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.btnDeleteText}>Hapus</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Banner Admin */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Kelola Katalog Game</Text>
            <View style={styles.adminRolePill}>
              <Ionicons name="shield-checkmark" size={11} color="#38BDF8" style={{ marginRight: 4 }} />
              <Text style={styles.adminRolePillText}>ADMIN PANEL</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerAddBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AdminGameForm")}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          placeholder="Cari board game (Catan, Splendor, UNO...)"
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
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Subheader info: Jumlah game terdaftar */}
      <View style={styles.infoSummaryRow}>
        <Text style={styles.infoSummaryText}>
          Total <Text style={{ fontWeight: "700", color: colors.primary }}>{filteredGames.length}</Text> board game ditemukan
        </Text>
        <Text style={styles.infoHintText}>Ketuk kartu untuk mengedit / menghapus</Text>
      </View>

      {/* List Board Game */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat katalog admin...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGames}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderGameCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Katalog Belum Tersedia</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `Tidak ada game yang cocok dengan "${searchQuery}".`
                  : "Belum ada board game yang terdaftar. Tambahkan sekarang!"}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("AdminGameForm")}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyAddBtnText}>Tambah Game Pertama</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) Tambah Game Baru */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.88}
        onPress={() => navigation.navigate("AdminGameForm")}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Tambah Game</Text>
      </TouchableOpacity>

      {/* Dialog Konfirmasi Hapus */}
      <CustomDialog
        visible={dialogVisible}
        type="danger"
        iconName="trash-outline"
        title="Hapus Board Game?"
        message={
          selectedGameForDelete
            ? `Apakah Anda yakin ingin menghapus "${selectedGameForDelete.title}" dari katalog kafe? Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        confirmText={isDeleting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDialogVisible(false)}
        onClose={() => setDialogVisible(false)}
      />

      {/* Dialog Notifikasi Feedback (Sukses/Error) */}
      <CustomDialog
        visible={feedbackDialog.visible}
        type={feedbackDialog.type}
        iconName={feedbackDialog.type === "success" ? "checkmark-circle-outline" : "alert-circle-outline"}
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        confirmText="Tutup"
        onConfirm={() => setFeedbackDialog({ ...feedbackDialog, visible: false })}
        onClose={() => setFeedbackDialog({ ...feedbackDialog, visible: false })}
      />
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
    paddingTop: 48,
    paddingBottom: 18,
    paddingHorizontal: 16
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitleBox: {
    alignItems: "center"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  adminRolePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)"
  },
  adminRolePillText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.6
  },
  headerAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: colors.text
  },
  filterWrapper: {
    marginTop: 10,
    marginBottom: 4
  },
  filterList: {
    paddingHorizontal: 16
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterChipText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: "500"
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  infoSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 6
  },
  infoSummaryText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  infoHintText: {
    fontSize: 11,
    color: colors.textMuted
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 90
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5
  },
  cardImage: {
    width: "100%",
    height: 155
  },
  cardContent: {
    padding: 14
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  gameTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginRight: 8
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  statusBadgeAvail: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0"
  },
  statusBadgeUnavail: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA"
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700"
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8
  },
  categoryBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DBEAFE"
  },
  categoryBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.primary
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center"
  },
  metaText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 4
  },
  description: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10
  },
  btnEdit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 10
  },
  btnEditText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600"
  },
  btnDelete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10
  },
  btnDeleteText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600"
  },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 28,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16
  },
  emptyAddBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700"
  }
});
