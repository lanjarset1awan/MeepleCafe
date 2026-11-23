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
import { ApiService } from "../../api/apiService";
import { colors } from "../../theme/colors";
import GameImage from "../../components/GameImage";
import CustomDialog from "../../components/CustomDialog";

export default function AdminPaymentListScreen({ navigation }) {
  const [reservations, setReservations] = useState([]);
  const [gamesLookup, setGamesLookup] = useState({});
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

  const loadGamesLookup = async () => {
    try {
      const all = await ApiService.getGames();
      if (all && Array.isArray(all)) {
        const map = {};
        all.forEach((g) => {
          if (g.title) {
            map[g.title.trim().toLowerCase()] = g.image_url;
          }
        });
        setGamesLookup(map);
      }
    } catch (err) {
      console.warn("Gagal memuat lookup gambar game di admin:", err);
    }
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
      loadGamesLookup();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReservations();
    loadGamesLookup();
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
    const actionWord = isApprove ? "Terima" : "Tolak";
    const confirmBtnWord = isApprove ? "Terima Tiket" : "Tolak Tiket";

    showDialog({
      type: isApprove ? "success" : "danger",
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

      // Ambil gambar board game sesuai judul di katalog
      let gameImage =
        (item.board_games && item.board_games.image_url) ||
        (displayGame && gamesLookup[displayGame.trim().toLowerCase()]) ||
        null;

      if (!gameImage && displayGame) {
        const lower = displayGame.trim().toLowerCase();
        const foundKey = Object.keys(gamesLookup).find(
          (k) => lower.includes(k) || k.includes(lower)
        );
        if (foundKey) {
          gameImage = gamesLookup[foundKey];
        }
      }

      return {
        ...item,
        cleanName,
        displayGame,
        gameImage,
        displayTotal: displayTotal || "Rp 30.000",
        displayMethod,
        displayProof,
        normalizedStatus
      };
    });
  }, [reservations, gamesLookup]);

  // Hitung jumlah tiap status
  const pendingCount = parsedReservations.filter((r) => r.normalizedStatus === "Pending").length;
  const confirmedCount = parsedReservations.filter((r) => r.normalizedStatus === "Confirmed").length;
  const rejectedCount = parsedReservations.filter((r) => r.normalizedStatus === "Rejected").length;
  const allCount = parsedReservations.length;

  // Filter & Search
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
      return true;
    });
  }, [parsedReservations, searchQuery, filterStatus]);

  // Render Kartu Tiket (Desain Sama Persis dengan Halaman Tiket Saya)
  const renderItem = ({ item }) => {
    const tableInfo = item.cafe_tables || {};
    const isPending = item.normalizedStatus === "Pending";
    const isConfirmed = item.normalizedStatus === "Confirmed";
    const isRejected = item.normalizedStatus === "Rejected";
    const isProcessing = updatingId === item.id;

    return (
      <View
        style={[
          styles.ticketCard,
          isPending && styles.ticketCardPending,
          isRejected && styles.ticketCardRejected
        ]}
      >
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <View style={styles.ticketHeaderLeft}>
            <Text style={styles.ticketBrand} numberOfLines={1}>
              MEEPLECAFE PASS
            </Text>
            <Text
              style={[styles.bookingCode, isRejected && styles.bookingCodeRejected]}
              numberOfLines={1}
            >
              {item.booking_code}
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            {isPending ? (
              <View style={styles.statusBadgePending}>
                <Ionicons name="time" size={12} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={styles.statusTextPending}>Menunggu Konfirmasi</Text>
              </View>
            ) : isConfirmed ? (
              <View style={styles.statusBadgeActive}>
                <Ionicons name="checkmark-circle" size={12} color="#166534" style={{ marginRight: 4 }} />
                <Text style={styles.statusTextActive}>Aktif</Text>
              </View>
            ) : (
              <View style={styles.statusBadgeRejected}>
                <Ionicons name="close-circle" size={12} color="#DC2626" style={{ marginRight: 4 }} />
                <Text style={styles.statusTextRejected}>Ditolak</Text>
              </View>
            )}
          </View>
        </View>

        {/* Perforated Divider Simulation */}
        <View style={styles.dividerRow}>
          <View style={styles.cutoutLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.cutoutRight} />
        </View>

        {/* Ticket Body */}
        <View style={styles.ticketBody}>
          {/* Status Alert Banner */}
          {isPending && (
            <View style={styles.pendingNoticeBox}>
              <Ionicons name="hourglass" size={18} color="#D97706" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.pendingNoticeTitle}>Menunggu Verifikasi Admin</Text>
                <Text style={styles.pendingNoticeDesc}>
                  Pelanggan telah mengirim bukti pembayaran. Periksa bukti transfer di bawah sebelum menyetujui tiket.
                </Text>
              </View>
            </View>
          )}

          {isRejected && (
            <View style={styles.rejectedNoticeBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.rejectedNoticeTitle}>Reservasi Ditolak</Text>
                <Text style={styles.rejectedNoticeDesc}>
                  Tiket tidak valid/ditolak. Jadwal meja kafe telah dibatalkan dan game dikembalikan ke stok kafe.
                </Text>
              </View>
            </View>
          )}

          {/* Section Game Dipesan */}
          <Text style={styles.gameSectionLabel}>Board Game Dipesan</Text>
          <View style={styles.gameBanner}>
            <GameImage
              uri={item.gameImage}
              style={styles.ticketGameThumb}
            />
            <Text style={styles.gameBannerTitle} numberOfLines={2}>
              {item.displayGame}
            </Text>
          </View>

          {/* Info Rows */}
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Nama Pemesan</Text>
              <Text style={styles.infoValue}>{item.cleanName || "-"}</Text>
            </View>
            <View style={styles.infoColRight}>
              <Text style={styles.infoLabel}>Pemain</Text>
              <Text style={styles.infoValue}>{item.guest_count} Orang</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Meja Bermain</Text>
              <Text style={styles.infoValue}>
                {tableInfo.table_type || "Meja Kafe"} ({tableInfo.table_number || "T-01"})
              </Text>
            </View>
            <View style={styles.infoColRight}>
              <Text style={styles.infoLabel}>Tanggal</Text>
              <Text style={styles.infoValue}>{item.reservation_date}</Text>
            </View>
          </View>

          {/* Nomor WhatsApp Pemesan */}
          {item.customer_phone ? (
            <View style={styles.phoneMetaRow}>
              <Ionicons name="logo-whatsapp" size={14} color="#166534" />
              <Text style={styles.phoneMetaText}>WhatsApp: {item.customer_phone}</Text>
            </View>
          ) : null}

          {/* Session Banner */}
          <View style={styles.sessionBanner}>
            <Ionicons name="time-outline" size={16} color={colors.text} />
            <Text style={styles.sessionBannerText}>{item.session_time}</Text>
          </View>

          {/* Bukti Transfer Terlampir */}
          {item.displayProof ? (
            <View style={styles.proofPreviewRow}>
              <TouchableOpacity
                style={styles.proofThumbWrapper}
                activeOpacity={0.8}
                onPress={() => setPreviewImageUri(item.displayProof)}
              >
                <Image
                  source={{ uri: item.displayProof }}
                  style={styles.proofThumbImage}
                  resizeMode="cover"
                />
                <View style={styles.proofZoomBadge}>
                  <Ionicons name="scan-outline" size={11} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 10, justifyContent: "center" }}>
                <Text style={styles.proofLabelText}>Bukti Pembayaran Terlampir</Text>
                <TouchableOpacity
                  onPress={() => setPreviewImageUri(item.displayProof)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.proofActionLink}>Ketuk untuk periksa bukti transfer fullscreen</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noProofInfoBox}>
              <Ionicons name="information-circle-outline" size={15} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.noProofInfoText}>Tanpa Bukti Transfer</Text>
            </View>
          )}

          {/* Payment & Total Info Row */}
          <View style={styles.paymentInfoRow}>
            <View style={styles.paymentTagTotal}>
              <Ionicons name="wallet-outline" size={14} color={colors.primaryDark} />
              <Text style={styles.paymentTagTotalText}>Total: {item.displayTotal}</Text>
            </View>

            {isPending ? (
              <View style={styles.paymentTagPending}>
                <Ionicons name="hourglass-outline" size={14} color="#D97706" />
                <Text style={styles.paymentTagPendingText}>{item.displayMethod} (Verifikasi)</Text>
              </View>
            ) : isConfirmed ? (
              <View style={styles.paymentTagMethod}>
                <Ionicons name="checkmark-circle" size={14} color="#166534" />
                <Text style={styles.paymentTagMethodText}>{item.displayMethod} (Lunas)</Text>
              </View>
            ) : (
              <View style={styles.paymentTagRejected}>
                <Ionicons name="close-circle" size={14} color="#DC2626" />
                <Text style={styles.paymentTagRejectedText}>{item.displayMethod} (Ditolak)</Text>
              </View>
            )}
          </View>

          {/* Action Buttons: Terima dan Tolak */}
          <View style={styles.actionButtonsRow}>
            {isPending && (
              <>
                <TouchableOpacity
                  style={[styles.btnActionReject, isProcessing && { opacity: 0.6 }]}
                  activeOpacity={0.82}
                  disabled={isProcessing}
                  onPress={() => handleUpdateStatus(item, "Rejected")}
                >
                  <Ionicons name="close-circle-outline" size={17} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.btnActionRejectText}>Tolak</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnActionApprove, isProcessing && { opacity: 0.6 }]}
                  activeOpacity={0.82}
                  disabled={isProcessing}
                  onPress={() => handleUpdateStatus(item, "Confirmed")}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.btnActionApproveText}>Terima & Aktifkan</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {isConfirmed && (
              <TouchableOpacity
                style={[styles.btnActionSecondary, isProcessing && { opacity: 0.6 }]}
                activeOpacity={0.82}
                disabled={isProcessing}
                onPress={() => handleUpdateStatus(item, "Rejected")}
              >
                <Ionicons name="close-circle-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.btnActionSecondaryText}>Ubah Menjadi Ditolak</Text>
              </TouchableOpacity>
            )}

            {isRejected && (
              <TouchableOpacity
                style={[styles.btnActionSecondaryAccept, isProcessing && { opacity: 0.6 }]}
                activeOpacity={0.82}
                disabled={isProcessing}
                onPress={() => handleUpdateStatus(item, "Confirmed")}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#166534" style={{ marginRight: 6 }} />
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
        {/* Eyebrow Pill Admin Panel */}
        <View style={styles.adminPillWrapper}>
          <View style={styles.adminRolePill}>
            <Ionicons name="shield-checkmark" size={12} color="#38BDF8" style={{ marginRight: 4 }} />
            <Text style={styles.adminRolePillText}>ADMIN PANEL</Text>
          </View>
        </View>

        {/* Baris Judul & Tombol Back (Sejajar Sempurna) */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Verifikasi Pembayaran</Text>

          <View style={styles.headerRightPlaceholder} />
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
                name="ticket-outline"
                size={54}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>Tidak Ada Tiket Pembayaran</Text>
              <Text style={styles.emptySubText}>
                {filterStatus === "pending"
                  ? "Semua pembayaran tiket telah diverifikasi. Tidak ada pengajuan yang menunggu konfirmasi saat ini."
                  : "Belum ada tiket reservasi yang cocok dengan filter atau pencarian Anda."}
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
              <Ionicons name="ticket-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
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

      {/* NAVBAR BAWAH ADMIN: ICON TIKET PERSIS SEPERTI TIKET SAYA */}
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
          <Ionicons name="ticket" size={20} color={colors.primary} />
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
    paddingTop: 62,
    paddingBottom: 36,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  adminPillWrapper: {
    alignItems: "center",
    marginBottom: 14
  },
  backBtn: {
    padding: 6,
    width: 36,
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: 6
  },
  headerTitle: {
    fontSize: 20.5,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    flex: 1
  },
  adminRolePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 9.5,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)"
  },
  adminRolePillText: {
    color: "#38BDF8",
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  headerRightPlaceholder: {
    width: 36
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -10,
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

  // CARD DESIGN: SAMA PERSIS DENGAN TIKET SAYA (PERFORATED PASS)
  ticketCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }
  },
  ticketCardPending: {
    borderColor: "#FCD34D",
    borderWidth: 1.5
  },
  ticketCardRejected: {
    borderColor: "#FECACA",
    borderWidth: 1.5,
    opacity: 0.94
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  ticketHeaderLeft: {
    flex: 1,
    marginRight: 10,
    justifyContent: "center"
  },
  ticketBrand: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.2
  },
  bookingCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 2
  },
  bookingCodeRejected: {
    color: colors.textMuted,
    textDecorationLine: "line-through"
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0
  },
  statusBadgeActive: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0
  },
  statusTextActive: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "bold"
  },
  statusBadgePending: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0
  },
  statusTextPending: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "bold"
  },
  statusBadgeRejected: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0
  },
  statusTextRejected: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "bold"
  },

  // Perforated Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
    overflow: "hidden"
  },
  cutoutLeft: {
    width: 14,
    height: 20,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderColor: colors.border
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed"
  },
  cutoutRight: {
    width: 14,
    height: 20,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: colors.background,
    borderLeftWidth: 1,
    borderColor: colors.border
  },

  // Ticket Body
  ticketBody: {
    padding: 16
  },
  pendingNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12
  },
  pendingNoticeTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309"
  },
  pendingNoticeDesc: {
    fontSize: 11,
    color: "#92400E",
    marginTop: 2,
    lineHeight: 15
  },
  rejectedNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12
  },
  rejectedNoticeTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626"
  },
  rejectedNoticeDesc: {
    fontSize: 11,
    color: "#991B1B",
    marginTop: 2,
    lineHeight: 15
  },

  // Game Section Banner
  gameSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6
  },
  gameBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 16
  },
  ticketGameThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    marginRight: 12
  },
  gameBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    flex: 1
  },

  // Info Rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  infoCol: {
    flex: 1
  },
  infoColRight: {
    alignItems: "flex-end"
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600"
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 2
  },
  phoneMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DCFCE7"
  },
  phoneMetaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534",
    marginLeft: 6
  },
  sessionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12
  },
  sessionBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 8
  },

  // Bukti Transfer
  proofPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 8,
    marginBottom: 12
  },
  proofThumbWrapper: {
    width: 44,
    height: 44,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#E2E8F0"
  },
  proofThumbImage: {
    width: "100%",
    height: "100%"
  },
  proofZoomBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 4,
    padding: 2
  },
  proofLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDark
  },
  proofActionLink: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 2
  },
  noProofInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  noProofInfoText: {
    fontSize: 11,
    color: "#64748B",
    fontStyle: "italic"
  },

  // Payment Tags
  paymentInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.border
  },
  paymentTagTotal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  paymentTagTotalText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDark,
    marginLeft: 5
  },
  paymentTagMethod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  paymentTagMethodText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
    marginLeft: 5
  },
  paymentTagPending: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  paymentTagPendingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    marginLeft: 5
  },
  paymentTagRejected: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  paymentTagRejectedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
    marginLeft: 5
  },

  // Action Buttons: Terima dan Tolak
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
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
    borderRadius: 10
  },
  btnActionRejectText: {
    color: "#DC2626",
    fontSize: 13,
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
    borderRadius: 10
  },
  btnActionApproveText: {
    color: "#FFFFFF",
    fontSize: 13,
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
    borderRadius: 10
  },
  btnActionSecondaryText: {
    color: "#DC2626",
    fontSize: 12.5,
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
    borderRadius: 10
  },
  btnActionSecondaryAcceptText: {
    color: "#166534",
    fontSize: 12.5,
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

  // NAVBAR BAWAH ADMIN: Samain persis
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
