import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput
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

  // Navigasi Kembali Bersih (Langsung 1 kali klik keluar dari admin)
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("MainApp");
    }
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
        message: `Meja "${selectedTableForDelete.table_number} (${selectedTableForDelete.table_type})" berhasil dinonaktifkan / masuk status maintenance.`
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

  // Desain Kartu: Dibuat SAMA PERSIS dengan Halaman Meja Kafe Pelanggan
  const renderTableCard = ({ item }) => {
    const isActive = item.is_active !== false;

    return (
      <View style={styles.card}>
        <GameImage uri={item.image_url} style={styles.cardImage} />

        <View style={styles.cardContent}>
          {/* 1. Tipe Meja (Judul 18px Bold) */}
          <Text style={styles.tableType}>{item.table_type}</Text>

          {/* 2. Top Row: Nomor Meja & Status Badge */}
          <View style={styles.cardTopRow}>
            <View style={styles.tableNumberBadge}>
              <Text style={styles.tableNumberText}>Meja {item.table_number}</Text>
            </View>

            {isActive ? (
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>Tersedia</Text>
              </View>
            ) : (
              <View style={styles.statusPillMaintenance}>
                <Ionicons name="construct" size={11} color="#B45309" style={{ marginRight: 4 }} />
                <Text style={styles.statusPillTextMaintenance}>Maintenance</Text>
              </View>
            )}
          </View>

          {/* 3. Info Meta Row: Kapasitas & Tarif Sewa */}
          <View style={styles.infoMetaRow}>
            <View style={styles.capacityRow}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={styles.capacityText}>Kapasitas: Maks. {item.capacity} Orang</Text>
            </View>
            <Text style={styles.priceText}>{formatRupiah(item.price_per_hour)}/jam</Text>
          </View>

          {/* 4. Fasilitas Meja */}
          <Text style={styles.facilitiesText} numberOfLines={2}>
            Fasilitas: {item.facilities || "Kursi nyaman, pencahayaan khusus board game"}
          </Text>

          {/* 5. Action Buttons Row: Edit Data & Hapus */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.btnEdit}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("AdminTableForm", { table: item })}
            >
              <Ionicons name="create-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnEditText}>Edit Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnDelete}
              activeOpacity={0.85}
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
      {/* Header Banner Admin yang Bersih & Rapi */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.8}
            onPress={handleBack}
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
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
            Tersedia ({activeCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilterStatus("inactive")}
          style={[styles.filterChip, filterStatus === "inactive" && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, filterStatus === "inactive" && styles.filterChipTextActive]}>
            Maintenance ({inactiveCount})
          </Text>
        </TouchableOpacity>
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
        message={`Apakah Anda yakin ingin memasukkan Meja "${selectedTableForDelete?.table_number} (${selectedTableForDelete?.table_type})" ke status Maintenance?\n\nMeja tidak akan dapat dipesan pelanggan, dan riwayat reservasi lama tetap aman.`}
        confirmText={isDeleting ? "Menghapus..." : "Ya, Nonaktifkan"}
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

      {/* NAVBAR BAWAH ADMIN: Samain Persis dengan Bottom Navbar Halaman Meja Kafe */}
      <View style={styles.adminBottomNav}>
        <TouchableOpacity
          style={styles.adminBottomNavItem}
          activeOpacity={0.8}
          onPress={() => navigation.replace("AdminGameList")}
        >
          <Ionicons name="albums-outline" size={20} color={colors.textMuted} />
          <Text style={styles.adminBottomNavLabel}>Katalog Game</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.adminBottomNavItem}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="table-chair" size={21} color={colors.primary} />
          <Text style={[styles.adminBottomNavLabel, styles.adminBottomNavLabelActive]}>Meja Kafe</Text>
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
    paddingTop: 48,
    paddingBottom: 22,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -14,
    paddingHorizontal: 14,
    height: 44,
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6.5,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.textMuted
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 150
  },

  // CARD DESIGN: SAMA PERSIS DENGAN HALAMAN MEJA KAFE
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
    height: 150,
    resizeMode: "cover"
  },
  cardContent: {
    padding: 14
  },
  tableType: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  tableNumberBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  tableNumberText: {
    color: colors.primaryDark,
    fontWeight: "bold",
    fontSize: 12
  },
  statusPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusPillText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "bold"
  },
  statusPillMaintenance: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12
  },
  statusPillTextMaintenance: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "bold"
  },
  infoMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  capacityText: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 6
  },
  priceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primaryDark
  },
  facilitiesText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: 12
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 2
  },
  btnEdit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 8
  },
  btnEditText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold"
  },
  btnDelete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  btnDeleteText: {
    color: "#DC2626",
    fontSize: 13,
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
    bottom: 76, // Di atas bottom navbar
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 28,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6
  },
  fabText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14
  },

  // NAVBAR BAWAH ADMIN: Samain persis dengan Tab Bar Utama Meja Kafe
  adminBottomNav: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderColor: colors.border,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4
  },
  adminBottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  adminBottomNavLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 2
  },
  adminBottomNavLabelActive: {
    color: colors.primary,
    fontWeight: "700"
  }
});
