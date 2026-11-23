import React, { useState, useCallback, useMemo } from "react";
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
  Modal
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";
import CustomDialog from "../components/CustomDialog";

export default function AdminPaymentListScreen({ navigation }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending"); // 'pending', 'confirmed', 'rejected', 'all'
  const [updatingId, setUpdatingId] = useState(null);

  // Modal Fullscreen Preview Bukti Transfer
  const [previewImageUri, setPreviewImageUri] = useState(null);

  // Dialog State
  const [dialogConfig, setDialogConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "Mengerti",
    cancelText: null,
    onConfirm: null,
    onCancel: null
  });

  const showDialog = (cfg) => {
    setDialogConfig({
      visible: true,
      type: cfg.type || "info",
      title: cfg.title || "",
      message: cfg.message || "",
      confirmText: cfg.confirmText || "Mengerti",
      cancelText: cfg.cancelText || null,
      onConfirm: cfg.onConfirm || null,
      onCancel: cfg.onCancel || null
    });
  };

  const hideDialog = () => {
    setDialogConfig((prev) => ({ ...prev, visible: false }));
  };

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getReservations();
      setReservations(data || []);
    } catch (err) {
      console.error("Gagal memuat reservasi admin:", err);
      showDialog({
        type: "error",
        title: "Gagal Memuat Data",
        message: "Tidak dapat memuat daftar tiket pembayaran reservasi."
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReservations();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReservations();
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace("MainApp");
    }
  };

  // Handler Update Status Reservasi (Terima / Tolak)
  const handleUpdateStatus = (reservation, newStatus) => {
    const isApprove = newStatus === "Confirmed";
    const actionWord = isApprove ? "Menerima" : "Menolak";
    const confirmBtnWord = isApprove ? "Ya, Terima & Aktifkan" : "Ya, Tolak Reservasi";

    showDialog({
      type: isApprove ? "info" : "warning",
      title: `${actionWord} Pembayaran Tiket?`,
      message: isApprove
        ? `Apakah Anda yakin ingin memvalidasi pembayaran dan mengaktifkan tiket ${reservation.booking_code} milik "${reservation.cleanName}"?`
        : `Apakah Anda yakin ingin menolak tiket ${reservation.booking_code}? Jadwal meja akan dibatalkan dan box board game akan dikembalikan ke stok kafe.`,
      confirmText: confirmBtnWord,
      cancelText: "Batal",
      onConfirm: async () => {
        try {
          setUpdatingId(reservation.id);
          await ApiService.updateReservationStatus(reservation.id, newStatus);
          
          showDialog({
            type: "success",
            title: isApprove ? "Tiket Diterima!" : "Tiket Ditolak",
            message: isApprove
              ? `Pembayaran tiket ${reservation.booking_code} berhasil disetujui. Tiket kini berstatus Aktif untuk pelanggan.`
              : `Tiket ${reservation.booking_code} telah ditolak. Jadwal meja telah dibebaskan.`
          });
          loadReservations();
        } catch (err) {
          showDialog({
            type: "error",
            title: "Gagal Mengubah Status",
            message: err.message || "Terjadi kesalahan saat memproses status tiket."
          });
        } finally {
          setUpdatingId(null);
        }
      }
    });
  };

  // Parsing & Normalisasi Metadata Reservasi
  const parsedReservations = useMemo(() => {
    return reservations.map((item) => {
      const rawName = item.customer_name || "";
      let displayGame = item.game_title || "Board Game Bebas Pilih di Rak";
      let displayTotal = null;
      let displayMethod = "Transfer Bank";
      let displayProof = null;

      if (rawName.includes("[Game:")) {
        const m = rawName.match(/\[Game:\s*(.+?)\]/);
        if (m) displayGame = m[1];
      }
      if (rawName.includes("[Total:")) {
        const m = rawName.match(/\[Total:\s*(.+?)\]/);
        if (m) displayTotal = m[1];
      }
      if (rawName.includes("[Metode:")) {
        const m = rawName.match(/\[Metode:\s*(.+?)\]/);
        if (m) displayMethod = m[1];
      }
      if (rawName.includes("[Bukti:")) {
        const m = rawName.match(/\[Bukti:\s*(.+?)\]/);
        if (m) displayProof = m[1];
      }

      const cleanName = rawName.replace(/\[.+?\]/g, "").trim();
      const rawStatus = (item.status || "Confirmed").trim();
      const statusLower = rawStatus.toLowerCase();

      let normalizedStatus = "Confirmed";
      if (statusLower === "pending" || statusLower === "menunggu konfirmasi") {
        normalizedStatus = "Pending";
      } else if (
        statusLower === "rejected" ||
        statusLower === "ditolak" ||
        statusLower === "cancelled"
      ) {
        normalizedStatus = "Rejected";
      }

      return {
        ...item,
        cleanName,
        displayGame,
        displayTotal: displayTotal || "Rp 30.000",
        displayMethod,
        displayProof,
        normalizedStatus
      };
    });
  }, [reservations]);

  // Hitung jumlah tiap kategori
  const pendingCount = parsedReservations.filter((r) => r.normalizedStatus === "Pending").length;
  const confirmedCount = parsedReservations.filter((r) => r.normalizedStatus === "Confirmed").length;
  const rejectedCount = parsedReservations.filter((r) => r.normalizedStatus === "Rejected").length;
  const allCount = parsedReservations.length;

  // Filter & Search Logic
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return parsedReservations.filter((item) => {
      const matchesSearch =
        !q ||
        (item.cleanName && item.cleanName.toLowerCase().includes(q)) ||
        (item.booking_code && item.booking_code.toLowerCase().includes(q)) ||
        (item.customer_phone && item.customer_phone.toLowerCase().includes(q)) ||
        (item.displayGame && item.displayGame.toLowerCase().includes(q)) ||
        (item.cafe_tables?.table_number && item.cafe_tables.table_number.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterStatus === "pending") return item.normalizedStatus === "Pending";
      if (filterStatus === "confirmed") return item.normalizedStatus === "Confirmed";
      if (filterStatus === "rejected") return item.normalizedStatus === "Rejected";
      return true; // 'all'
    });
  }, [parsedReservations, searchQuery, filterStatus]);

  // Render Kartu Tiket Pembayaran
  const renderItem = ({ item }) => {
    const tableInfo = item.cafe_tables || {};
    const isPending = item.normalizedStatus === "Pending";
    const isConfirmed = item.normalizedStatus === "Confirmed";
    const isRejected = item.normalizedStatus === "Rejected";
    const isProcessing = updatingId === item.id;

    return (
      <View
        style={[
          styles.card,
          isPending && styles.cardPending,
          isRejected && styles.cardRejected
        ]}
      >
        {/* Card Header: Kode Reservasi & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.codeIconBox}>
              <Ionicons name="receipt" size={15} color={colors.primary} />
            </View>
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.bookingCodeText}>{item.booking_code}</Text>
              <Text style={styles.dateSubText}>
                {item.reservation_date} • {item.session_time}
              </Text>
            </View>
          </View>

          {isPending ? (
            <View style={styles.statusBadgePending}>
              <Ionicons name="time" size={12} color="#D97706" style={{ marginRight: 4 }} />
              <Text style={styles.statusBadgeTextPending}>Menunggu</Text>
            </View>
          ) : isConfirmed ? (
            <View style={styles.statusBadgeConfirmed}>
              <Ionicons name="checkmark-circle" size={12} color="#166534" style={{ marginRight: 4 }} />
              <Text style={styles.statusBadgeTextConfirmed}>Diterima</Text>
            </View>
          ) : (
            <View style={styles.statusBadgeRejected}>
              <Ionicons name="close-circle" size={12} color="#DC2626" style={{ marginRight: 4 }} />
              <Text style={styles.statusBadgeTextRejected}>Ditolak</Text>
            </View>
          )}
        </View>

        {/* Card Body: Info Pemesan & Meja */}
        <View style={styles.cardBody}>
          <View style={styles.infoGridRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Nama Pemesan</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.cleanName || "-"}
              </Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Nomor WhatsApp</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.customer_phone || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.infoGridRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Meja Kafe</Text>
              <Text style={styles.infoValue}>
                {tableInfo.table_type || "Meja Kafe"} ({tableInfo.table_number || "T-01"})
              </Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Kapasitas Pemain</Text>
              <Text style={styles.infoValue}>{item.guest_count} Orang</Text>
            </View>
          </View>

          <View style={styles.infoGridRow}>
            <View style={styles.infoColFull}>
              <Text style={styles.infoLabel}>Board Game Dipesan</Text>
              <Text style={styles.infoValueGame} numberOfLines={1}>
                {item.displayGame}
              </Text>
            </View>
          </View>

          {/* Box Bukti Transfer & Tag Pembayaran */}
          <View style={styles.paymentSectionBox}>
            <View style={styles.paymentMetaRow}>
              <View style={styles.totalBadge}>
                <Ionicons name="wallet-outline" size={13} color={colors.primaryDark} style={{ marginRight: 4 }} />
                <Text style={styles.totalBadgeText}>Total: {item.displayTotal}</Text>
              </View>
              <View style={styles.methodBadge}>
                <Ionicons name="card-outline" size={13} color="#475569" style={{ marginRight: 4 }} />
                <Text style={styles.methodBadgeText}>{item.displayMethod}</Text>
              </View>
            </View>

            {/* Bukti Foto Transfer */}
            {item.displayProof ? (
              <TouchableOpacity
                style={styles.proofBox}
                activeOpacity={0.82}
                onPress={() => setPreviewImageUri(item.displayProof)}
              >
                <Image
                  source={{ uri: item.displayProof }}
                  style={styles.proofThumbnail}
                  resizeMode="cover"
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.proofPillAttached}>
                    <Ionicons name="image" size={12} color="#047857" style={{ marginRight: 4 }} />
                    <Text style={styles.proofPillAttachedText}>Bukti Transfer Terlampir</Text>
                  </View>
                  <Text style={styles.proofActionHint}>
                    Ketuk untuk periksa foto fullscreen
                  </Text>
                </View>
                <Ionicons name="search" size={18} color={colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.noProofBox}>
                <Ionicons name="information-circle-outline" size={15} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.noProofText}>
                  Tidak ada file bukti (Pembayaran di Kasir / Tunai)
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {isPending && (
              <>
                <TouchableOpacity
                  style={[styles.btnActionReject, isProcessing && { opacity: 0.6 }]}
                  activeOpacity={0.8}
                  disabled={isProcessing}
                  onPress={() => handleUpdateStatus(item, "Rejected")}
                >
                  <Ionicons name="close-circle-outline" size={16} color="#DC2626" style={{ marginRight: 4 }} />
                  <Text style={styles.btnActionRejectText}>Tolak</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnActionApprove, isProcessing && { opacity: 0.6 }]}
                  activeOpacity={0.8}
                  disabled={isProcessing}
                  onPress={() => handleUpdateStatus(item, "Confirmed")}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.btnActionApproveText}>Terima & Aktifkan</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {isConfirmed && (
              <TouchableOpacity
                style={[styles.btnActionSecondary, isProcessing && { opacity: 0.6 }]}
                activeOpacity={0.8}
                disabled={isProcessing}
                onPress={() => handleUpdateStatus(item, "Rejected")}
              >
                <Ionicons name="close-circle-outline" size={15} color="#DC2626" style={{ marginRight: 4 }} />
                <Text style={styles.btnActionSecondaryText}>Ubah Menjadi Ditolak</Text>
              </TouchableOpacity>
            )}

            {isRejected && (
              <TouchableOpacity
                style={[styles.btnActionSecondaryAccept, isProcessing && { opacity: 0.6 }]}
                activeOpacity={0.8}
                disabled={isProcessing}
                onPress={() => handleUpdateStatus(item, "Confirmed")}
              >
                <Ionicons name="checkmark-circle-outline" size={15} color="#166534" style={{ marginRight: 4 }} />
                <Text style={styles.btnActionSecondaryAcceptText}>Terima Ulang Tiket</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Admin */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Verifikasi Pembayaran</Text>
            <View style={styles.adminRolePill}>
              <Text style={styles.adminRolePillText}>ADMIN PANEL</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama, kode reservasi, meja, game..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips Horizontal (Centered) */}
      <View style={styles.filterWrapper}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterStatus === "pending" && styles.filterChipActive
          ]}
          onPress={() => setFilterStatus("pending")}
        >
          <Text
            style={[
              styles.filterChipText,
              filterStatus === "pending" && styles.filterChipTextActive
            ]}
          >
            Menunggu ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterStatus === "confirmed" && styles.filterChipActive
          ]}
          onPress={() => setFilterStatus("confirmed")}
        >
          <Text
            style={[
              styles.filterChipText,
              filterStatus === "confirmed" && styles.filterChipTextActive
            ]}
          >
            Diterima ({confirmedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterStatus === "rejected" && styles.filterChipActive
          ]}
          onPress={() => setFilterStatus("rejected")}
        >
          <Text
            style={[
              styles.filterChipText,
              filterStatus === "rejected" && styles.filterChipTextActive
            ]}
          >
            Ditolak ({rejectedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterStatus === "all" && styles.filterChipActive
          ]}
          onPress={() => setFilterStatus("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              filterStatus === "all" && styles.filterChipTextActive
            ]}
          >
            Semua ({allCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat tiket pembayaran...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
              <Ionicons
                name="receipt-outline"
                size={54}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>Tidak Ada Tiket Pembayaran</Text>
              <Text style={styles.emptySubText}>
                {filterStatus === "pending"
                  ? "Semua pembayaran tiket telah diproses. Tidak ada pengajuan yang menunggu konfirmasi."
                  : "Belum ada data tiket reservasi yang cocok dengan filter atau pencarian Anda."}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal Fullscreen Preview Bukti Transfer */}
      <Modal visible={!!previewImageUri} transparent animationType="fade">
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="receipt-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.imageModalTitle}>Bukti Transfer Pelanggan</Text>
            </View>
            <TouchableOpacity
              style={styles.imageModalCloseBtn}
              onPress={() => setPreviewImageUri(null)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.imageModalContent}>
            {previewImageUri && (
              <Image
                source={{ uri: previewImageUri }}
                style={styles.imageModalPreview}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Dialog untuk Alert & Konfirmasi */}
      <CustomDialog
        visible={dialogConfig.visible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        onConfirm={dialogConfig.onConfirm}
        onCancel={dialogConfig.onCancel}
        onClose={hideDialog}
      />

      {/* NAVBAR BAWAH ADMIN: 3 TAB LENGKAP */}
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
          onPress={() => navigation.replace("AdminTableList")}
        >
          <MaterialCommunityIcons name="table-chair" size={21} color={colors.textMuted} />
          <Text style={styles.adminBottomNavLabel}>Meja Kafe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.adminBottomNavItem}
          activeOpacity={0.8}
        >
          <Ionicons name="receipt" size={20} color={colors.primary} />
          <Text style={[styles.adminBottomNavLabel, styles.adminBottomNavLabelActive]}>
            Verifikasi Tiket
          </Text>
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
  refreshBtn: {
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
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 3
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterChipText: {
    fontSize: 11,
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
    paddingBottom: 100
  },

  // CARD DESIGN
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    overflow: "hidden"
  },
  cardPending: {
    borderColor: "#FCD34D",
    borderWidth: 1.5
  },
  cardRejected: {
    borderColor: "#FECACA",
    opacity: 0.9
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9"
  },
  codeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center"
  },
  bookingCodeText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 0.5
  },
  dateSubText: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1
  },
  statusBadgePending: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12
  },
  statusBadgeTextPending: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309"
  },
  statusBadgeConfirmed: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12
  },
  statusBadgeTextConfirmed: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534"
  },
  statusBadgeRejected: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12
  },
  statusBadgeTextRejected: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626"
  },

  cardBody: {
    padding: 14
  },
  infoGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  infoCol: {
    flex: 1,
    marginRight: 8
  },
  infoColFull: {
    flex: 1
  },
  infoLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3
  },
  infoValue: {
    fontSize: 12.5,
    color: colors.text,
    fontWeight: "600",
    marginTop: 2
  },
  infoValueGame: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: "700",
    marginTop: 2
  },

  // Payment Section Inside Card
  paymentSectionBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  paymentMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  totalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  totalBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.primaryDark
  },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  methodBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569"
  },

  proofBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1"
  },
  proofThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: "#F1F5F9"
  },
  proofPillAttached: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 2
  },
  proofPillAttachedText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#047857"
  },
  proofActionHint: {
    fontSize: 10.5,
    color: colors.primary,
    fontWeight: "600"
  },
  noProofBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4
  },
  noProofText: {
    fontSize: 11,
    color: "#64748B",
    fontStyle: "italic"
  },

  // Action Buttons
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#F1F5F9"
  },
  btnActionReject: {
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
  btnActionRejectText: {
    color: "#DC2626",
    fontSize: 12.5,
    fontWeight: "700"
  },
  btnActionApprove: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  btnActionApproveText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700"
  },
  btnActionSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 9,
    borderRadius: 8
  },
  btnActionSecondaryText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700"
  },
  btnActionSecondaryAccept: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingVertical: 9,
    borderRadius: 8
  },
  btnActionSecondaryAcceptText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "700"
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

  // Modal Fullscreen Preview
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "space-between"
  },
  imageModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16
  },
  imageModalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  imageModalCloseBtn: {
    padding: 6
  },
  imageModalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  imageModalPreview: {
    width: "100%",
    height: "85%"
  },

  // NAVBAR BAWAH ADMIN
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
