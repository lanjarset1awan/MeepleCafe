import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";
import CustomDialog from "../components/CustomDialog";
import GameImage from "../components/GameImage";

/**
 * Memeriksa apakah waktu sesi reservasi sudah lewat dibandingkan waktu saat ini.
 * Format tanggal: YYYY-MM-DD
 * Format sesi: "Sesi Siang (13.00 - 16.00)", "Sesi Sore (16.00 - 19.00)", "Sesi Malam (19.00 - 22.00)", dll.
 */
export function isReservationExpired(reservationDateStr, sessionTimeStr) {
  if (!reservationDateStr) return false;

  const dateParts = reservationDateStr.split("-").map(Number);
  if (dateParts.length !== 3) return false;
  const [year, month, day] = dateParts;

  let endHour = 23;
  let endMinute = 59;

  if (sessionTimeStr) {
    // Ambil jam selesai di belakang tanda minus: "- 16.00" atau "- 19:00"
    const endMatch = sessionTimeStr.match(/-\s*(\d{1,2})[.:](\d{2})/);
    if (endMatch) {
      endHour = parseInt(endMatch[1], 10);
      endMinute = parseInt(endMatch[2], 10);
    } else {
      const anyMatch = sessionTimeStr.match(/(\d{1,2})[.:](\d{2})/);
      if (anyMatch) {
        endHour = Math.min(23, parseInt(anyMatch[1], 10) + 3);
        endMinute = parseInt(anyMatch[2], 10);
      }
    }
  }

  const sessionEndTime = new Date(year, month - 1, day, endHour, endMinute, 0);
  const now = new Date();

  return now.getTime() > sessionEndTime.getTime();
}

export default function MyTicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [gamesLookup, setGamesLookup] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // 'active' atau 'expired'

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
      console.warn("Gagal memuat lookup gambar game:", err);
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getReservations();
      setTickets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadTickets();
      loadGamesLookup();
    });
    loadTickets();
    loadGamesLookup();
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
    loadGamesLookup();
  };

  // State untuk CustomDialog
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

  // Pisahkan tiket aktif (belum lewat) dan tiket yang sudah kedaluwarsa (lewat jamnya)
  const { activeTickets, expiredTickets } = useMemo(() => {
    const active = [];
    const expired = [];

    (tickets || []).forEach((t) => {
      if (isReservationExpired(t.reservation_date, t.session_time)) {
        expired.push(t);
      } else {
        active.push(t);
      }
    });

    return { activeTickets: active, expiredTickets: expired };
  }, [tickets]);

  const displayedTickets = activeTab === "active" ? activeTickets : expiredTickets;

  const handleDeleteTicket = (ticketId, bookingCode) => {
    showDialog({
      type: "warning",
      title: "Hapus Tiket Reservasi?",
      message: `Apakah Anda yakin ingin membatalkan dan menghapus tiket dengan kode ${bookingCode}?`,
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      onConfirm: async () => {
        try {
          await ApiService.deleteReservation(ticketId);
          setTickets((prev) => prev.filter((item) => item.id !== ticketId));
        } catch (err) {
          showDialog({
            type: "error",
            title: "Gagal Menghapus",
            message: "Tidak dapat menghapus tiket saat ini. Silakan coba kembali."
          });
        }
      }
    });
  };

  const renderTicketCard = ({ item }) => {
    const tableInfo = item.cafe_tables || {};
    const isExpired = isReservationExpired(item.reservation_date, item.session_time);

    // Ambil judul game, total bayar, dan metode pembayaran
    let displayGame = item.game_title;
    let displayName = item.customer_name || "";
    let displayTotal = null;
    let displayMethod = null;

    if (displayName.includes("[Game:")) {
      const match = displayName.match(/\[Game:\s*(.+?)\]/);
      if (match) displayGame = match[1];
    }
    if (displayName.includes("[Total:")) {
      const match = displayName.match(/\[Total:\s*(.+?)\]/);
      if (match) displayTotal = match[1];
    }
    if (displayName.includes("[Metode:")) {
      const match = displayName.match(/\[Metode:\s*(.+?)\]/);
      if (match) displayMethod = match[1];
    }

    displayName = displayName.replace(/\[.+?\]/g, "").trim();

    if (!displayGame) {
      displayGame = "Board Game Bebas Pilih di Rak";
    }
    if (!displayMethod) {
      displayMethod = "Transfer Bank";
    }
    if (!displayTotal) {
      displayTotal = tableInfo.price_per_hour
        ? `Rp ${Number(tableInfo.price_per_hour).toLocaleString("id-ID")}`
        : "Rp 30.000";
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

    return (
      <View style={[styles.ticketCard, isExpired && styles.ticketCardExpired]}>
        {/* Ticket Header */}
        <View style={[styles.ticketHeader, isExpired && styles.ticketHeaderExpired]}>
          <View>
            <Text style={[styles.ticketBrand, isExpired && styles.ticketBrandExpired]}>
              {isExpired ? "MEEPLECAFE (EXPIRED)" : "MEEPLECAFE PASS"}
            </Text>
            <Text style={[styles.bookingCode, isExpired && styles.bookingCodeExpired]}>
              {item.booking_code}
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <View
              style={[
                styles.statusBadge,
                isExpired ? styles.statusBadgeExpired : styles.statusBadgeActive
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isExpired ? styles.statusTextExpired : styles.statusTextActive
                ]}
              >
                {isExpired ? "Kedaluwarsa" : "Aktif"}
              </Text>
            </View>

            {isExpired && (
              <TouchableOpacity
                style={styles.btnDelete}
                onPress={() => handleDeleteTicket(item.id, item.booking_code)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Perforated divider line simulation */}
        <View style={styles.dividerRow}>
          <View style={styles.cutoutLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.cutoutRight} />
        </View>

        {/* Ticket Body */}
        <View style={styles.ticketBody}>
          {/* Label Board Game Dipesan (di atas kotakan judul agar mudah & jelas dibaca) */}
          <Text
            style={[
              styles.gameSectionLabel,
              isExpired && styles.gameSectionLabelExpired
            ]}
          >
            Board Game Dipesan
          </Text>

          {/* Kotakan Khusus Judul Game */}
          <View
            style={[
              styles.gameBanner,
              isExpired && styles.gameBannerExpired
            ]}
          >
            <GameImage
              uri={gameImage}
              style={[styles.ticketGameThumb, isExpired && { opacity: 0.6 }]}
            />
            <Text
              style={[
                styles.gameBannerTitle,
                isExpired && styles.gameBannerTitleExpired
              ]}
              numberOfLines={2}
            >
              {displayGame}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Nama Pemesan</Text>
              <Text style={styles.infoValue}>{displayName}</Text>
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

          {/* Session Banner */}
          <View
            style={[
              styles.sessionBanner,
              isExpired && styles.sessionBannerExpired
            ]}
          >
            <Ionicons
              name={isExpired ? "hourglass-outline" : "time-outline"}
              size={16}
              color={isExpired ? colors.textMuted : colors.secondary}
            />
            <Text
              style={[
                styles.sessionBannerText,
                isExpired && styles.sessionBannerTextExpired
              ]}
            >
              {item.session_time} {isExpired ? "(Waktu Reservasi Telah Selesai)" : ""}
            </Text>
          </View>

          {/* Payment & Total Info Row */}
          <View style={styles.paymentInfoRow}>
            <View style={styles.paymentTagTotal}>
              <Ionicons name="wallet-outline" size={14} color={colors.primaryDark} />
              <Text style={styles.paymentTagTotalText}>Total: {displayTotal}</Text>
            </View>
            <View style={styles.paymentTagMethod}>
              <Ionicons name="checkmark-circle" size={14} color="#166534" />
              <Text style={styles.paymentTagMethodText}>{displayMethod} (Lunas)</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("../../assets/Logo-MeepleCafe.jpeg")}
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                marginRight: 8,
                backgroundColor: "#FFFFFF"
              }}
              resizeMode="contain"
            />
            <Text style={styles.headerSubtitle}>Booking Management</Text>
          </View>
          <View style={styles.totalBadge}>
            <Ionicons name="ticket" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.totalBadgeText}>
              {activeTickets.length} Tiket Aktif
            </Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Tiket Reservasi Saya</Text>
      </View>

      {/* Segmented Filter Tab: Tiket Aktif vs Riwayat Kedaluwarsa */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "active" && styles.tabButtonActive]}
          onPress={() => setActiveTab("active")}
        >
          <Ionicons
            name="ticket"
            size={16}
            color={activeTab === "active" ? "#FFFFFF" : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "active" && styles.tabButtonTextActive
            ]}
          >
            Tiket Aktif ({activeTickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "expired" && styles.tabButtonActive]}
          onPress={() => setActiveTab("expired")}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={activeTab === "expired" ? "#FFFFFF" : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "expired" && styles.tabButtonTextActive
            ]}
          >
            Sudah Lewat ({expiredTickets.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memeriksa status tiket reservasi...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedTickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicketCard}
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
                name={activeTab === "active" ? "ticket-outline" : "archive-outline"}
                size={54}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === "active"
                  ? "Tidak Ada Tiket Aktif"
                  : "Belum Ada Riwayat Kedaluwarsa"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "active"
                  ? "Tiket yang sudah lewat jam reservasinya otomatis dipindahkan ke tab 'Sudah Lewat' agar daftar Anda tetap rapi."
                  : "Semua tiket reservasi Anda saat ini masih aktif dan belum melewati batas jam sesi."}
              </Text>
              {activeTab === "active" && (
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => navigation.navigate("GameTab")}
                >
                  <Text style={styles.browseButtonText}>Reservasi Tiket Baru</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Dialog Kustom Pengganti Alert.alert */}
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
    paddingBottom: 28,
    paddingHorizontal: 20
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2
  },
  totalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  totalBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold"
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 4
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -16,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 8
  },
  tabButtonActive: {
    backgroundColor: colors.primary
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  listContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 30
  },
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
  ticketCardExpired: {
    opacity: 0.72,
    borderColor: "#E2E8F0"
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  ticketHeaderExpired: {
    backgroundColor: "#F1F5F9"
  },
  ticketBrand: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.5
  },
  ticketBrandExpired: {
    color: colors.textMuted
  },
  bookingCode: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 2
  },
  bookingCodeExpired: {
    color: colors.textMuted,
    textDecorationLine: "line-through"
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center"
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  statusBadgeActive: {
    backgroundColor: "#DCFCE7"
  },
  statusBadgeExpired: {
    backgroundColor: "#F1F5F9"
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold"
  },
  statusTextActive: {
    color: "#166534"
  },
  statusTextExpired: {
    color: colors.textMuted
  },
  btnDelete: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#FEE2E2"
  },
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
  ticketBody: {
    padding: 16
  },
  gameSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6
  },
  gameSectionLabelExpired: {
    color: "#94A3B8"
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
  gameBannerExpired: {
    backgroundColor: "#F1F5F9"
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
  gameBannerTitleExpired: {
    color: colors.textMuted
  },
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
    textTransform: "uppercase"
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: 3
  },
  sessionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 10,
    borderRadius: 8,
    marginTop: 6
  },
  sessionBannerExpired: {
    backgroundColor: "#F8FAFC"
  },
  sessionBannerText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 6
  },
  sessionBannerTextExpired: {
    color: colors.textMuted
  },
  paymentInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
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
    marginTop: 50,
    paddingHorizontal: 24
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 14
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold"
  }
});
