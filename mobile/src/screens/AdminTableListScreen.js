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
  Image
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";
import GameImage from "../components/GameImage";
import CustomDialog from "../components/CustomDialog";

export default function AdminTableListScreen({ navigation }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'inactive'

  // Dialog State
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedTableForDelete, setSelectedTableForDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState({
    visible: false,
    type: "info",
    title: "",
    message: ""
  });

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getTables();
      setTables(data || []);
    } catch (err) {
      console.error("Gagal memuat meja kafe:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTables();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTables();
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(number || 0);
  };

  // Filter & Search Logic
  const filteredTables = tables.filter((item) => {
    const tableNum = (item.table_number || "").toLowerCase();
    const tableType = (item.table_type || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = tableNum.includes(query) || tableType.includes(query);

    const isActive = item.is_active !== false;
    if (filterStatus === "active") return matchesSearch && isActive;
    if (filterStatus === "inactive") return matchesSearch && !isActive;
    return matchesSearch;
  });

  const activeCount = tables.filter((t) => t.is_active !== false).length;
  const inactiveCount = tables.filter((t) => t.is_active === false).length;

  const handlePromptDelete = (table) => {
    setSelectedTableForDelete(table);
    setDialogVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTableForDelete) return;
    try {
      setIsDeleting(true);
      await ApiService.deleteTable(selectedTableForDelete.id);
      setDialogVisible(false);
      setFeedbackDialog({
        visible: true,
        type: "success",
        title: "Meja Dinonaktifkan",
        message: `Meja "${selectedTableForDelete.table_number} (${selectedTableForDelete.table_type})" berhasil dinonaktifkan.`
      });
      loadTables();
    } catch (err) {
      setDialogVisible(false);
      setFeedbackDialog({
        visible: true,
        type: "danger",
        title: "Gagal Menghapus Meja",
        message: err.message || "Terjadi kesalahan saat menghapus data meja kafe."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTableCard = ({ item }) => {
    const isActive = item.is_active !== false;

    return (
      <View style={styles.card}>
        <GameImage uri={item.image_url} style={styles.cardImage} />

        <View style={styles.cardContent}>
          {/* Header Row: Table Number & Status Badge */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.tableNumBadge}>
              <MaterialCommunityIcons name="table-chair" size={16} color={colors.primary} style={{ marginRight: 5 }} />
              <Text style={styles.tableNumText}>Meja {item.table_number}</Text>
            </View>

            <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
              <View style={[styles.statusDot, { backgroundColor: isActive ? "#10B981" : "#EF4444" }]} />
              <Text style={[styles.statusBadgeText, { color: isActive ? "#047857" : "#B91C1C" }]}>
                {isActive ? "Aktif" : "Non-Aktif"}
              </Text>
            </View>
          </View>

          {/* Tipe Meja */}
          <Text style={styles.tableType}>{item.table_type}</Text>

          {/* Meta Info Row: Kapasitas & Tarif Sewa */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={colors.primary} />
              <Text style={styles.metaText}>Maks. {item.capacity} Orang</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color="#059669" />
              <Text style={[styles.metaText, { color: "#059669", fontWeight: "700" }]}>
                {formatRupiah(item.price_per_hour)} / Jam
              </Text>
            </View>
          </View>

          {/* Fasilitas Meja */}
          <Text style={styles.facilitiesText} numberOfLines={2}>
            <Ionicons name="sparkles-outline" size={12} color={colors.textMuted} /> Fasilitas: {item.facilities || "Kursi nyaman, pencahayaan khusus board game"}
          </Text>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Action Buttons: Edit & Delete */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.btnEdit}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("AdminTableForm", { table: item })}
            >
              <Ionicons name="create-outline" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.btnEditText}>Edit Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnDelete}
              activeOpacity={0.8}
              onPress={() => handlePromptDelete(item)}
            >
              <Ionicons name="trash-outline" size={15} color="#DC2626" style={{ marginRight: 5 }} />
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
            <Text style={styles.headerTitle}>Kelola Meja Kafe</Text>
            <View style={styles.adminRolePill}>
              <Ionicons name="shield-checkmark" size={11} color="#38BDF8" style={{ marginRight: 4 }} />
              <Text style={styles.adminRolePillText}>ADMIN PANEL</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerAddBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AdminTableForm")}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Switcher Tab Admin: Katalog Game vs Meja Kafe */}
        <View style={styles.adminNavSwitcher}>
          <TouchableOpacity
            style={styles.adminNavTab}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AdminGameList")}
          >
            <Ionicons name="game-controller-outline" size={15} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
            <Text style={styles.adminNavTabText}>Katalog Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adminNavTab, styles.adminNavTabActive]}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="table-chair" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={[styles.adminNavTabText, styles.adminNavTabTextActive]}>Meja Kafe</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          placeholder="Cari meja (T-01, VIP, Regular...)"
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

      {/* Filter Status Pills */}
      <View style={styles.filterWrapper}>
        <TouchableOpacity
          onPress={() => setFilterStatus("all")}
          style={[styles.filterChip, filterStatus === "all" && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, filterStatus === "all" && styles.filterChipTextActive]}>
            Semua ({tables.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilterStatus("active")}
          style={[styles.filterChip, filterStatus === "active" && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, filterStatus === "active" && styles.filterChipTextActive]}>
            Aktif ({activeCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilterStatus("inactive")}
          style={[styles.filterChip, filterStatus === "inactive" && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, filterStatus === "inactive" && styles.filterChipTextActive]}>
            Non-Aktif ({inactiveCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Subheader info: Jumlah meja terdaftar */}
      <View style={styles.infoSummaryRow}>
        <Text style={styles.infoSummaryText}>
          Total <Text style={{ fontWeight: "700", color: colors.primary }}>{filteredTables.length}</Text> meja kafe terdaftar
        </Text>
      </View>

      {/* List Meja Kafe */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat data meja kafe...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTables}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTableCard}
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
              <MaterialCommunityIcons name="table-chair" size={54} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Tidak ada meja ditemukan</Text>
              <Text style={styles.emptySubText}>
                {searchQuery
                  ? "Coba gunakan kata kunci pencarian nomor atau tipe meja lain."
                  : "Belum ada meja kafe yang terdaftar dalam sistem."}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button (+ Tambah Meja) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("AdminTableForm")}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.fabText}>Tambah Meja</Text>
      </TouchableOpacity>

      {/* Dialog Konfirmasi Hapus Meja */}
      <CustomDialog
        visible={dialogVisible}
        type="danger"
        title="Konfirmasi Nonaktifkan Meja"
        message={`Apakah Anda yakin ingin menonaktifkan Meja "${selectedTableForDelete?.table_number} (${selectedTableForDelete?.table_type})"?\n\nData meja tetap tersimpan di riwayat reservasi pelanggan.`}
        confirmText={isDeleting ? "Menghapus..." : "Ya, Hapus / Nonaktifkan"}
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDialogVisible(false)}
      />

      {/* Dialog Feedback Hasil */}
      <CustomDialog
        visible={feedbackDialog.visible}
        type={feedbackDialog.type}
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        confirmText="Tutup"
        onConfirm={() => setFeedbackDialog({ ...feedbackDialog, visible: false })}
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
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  backBtn: {
    padding: 6
  },
  headerTitleBox: {
    alignItems: "center"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  adminRolePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)"
  },
  adminRolePillText: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  headerAddBtn: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  adminNavSwitcher: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    padding: 4,
    marginTop: 14
  },
  adminNavTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8
  },
  adminNavTabActive: {
    backgroundColor: colors.primary
  },
  adminNavTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)"
  },
  adminNavTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.text
  },
  filterWrapper: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.textMuted
  },
  filterChipTextActive: {
    color: colors.primaryDark,
    fontWeight: "700"
  },
  infoSummaryRow: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 4
  },
  infoSummaryText: {
    fontSize: 12,
    color: colors.textMuted
  },
  listContainer: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 90
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2
  },
  cardImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#F1F5F9"
  },
  cardContent: {
    padding: 14
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6
  },
  tableNumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8
  },
  tableNumText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primaryDark
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  statusBadgeActive: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0"
  },
  statusBadgeInactive: {
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
  tableType: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 6
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 8
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center"
  },
  metaText: {
    fontSize: 12.5,
    color: colors.text,
    fontWeight: "600",
    marginLeft: 5
  },
  facilitiesText: {
    fontSize: 12,
    color: colors.textMuted,
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
    gap: 8
  },
  btnEdit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 8
  },
  btnEditText: {
    color: "#FFFFFF",
    fontSize: 12.5,
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
    paddingHorizontal: 14,
    borderRadius: 8
  },
  btnDeleteText: {
    color: "#DC2626",
    fontSize: 12.5,
    fontWeight: "600"
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60
  },
  loadingText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 13
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 32
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 12
  },
  emptySubText: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18
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
    fontWeight: "700",
    fontSize: 14
  }
});
