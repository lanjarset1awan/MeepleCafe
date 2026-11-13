import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // 'active' atau 'expired'

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
    });
    loadTickets();
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
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
    Alert.alert(
      "Hapus Tiket",
      `Apakah Anda yakin ingin menghapus tiket ${bookingCode}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await ApiService.deleteReservation(ticketId);
              setTickets((prev) => prev.filter((item) => item.id !== ticketId));
            } catch (err) {
              Alert.alert("Gagal", "Tidak dapat menghapus tiket saat ini.");
            }
          }
        }
      ]
    );
  };

  const renderTicketCard = ({ item }) => {
    const tableInfo = item.cafe_tables || {};
    const isExpired = isReservationExpired(item.reservation_date, item.session_time);

    // Ambil judul game
    let displayGame = item.game_title;
    let displayName = item.customer_name;

    if (!displayGame && displayName && displayName.includes("[Game:")) {
      const match = displayName.match(/\[Game:\s*(.+?)\]/);
      if (match) {
        displayGame = match[1];
        displayName = displayName.replace(/\[Game:\s*.+?\]/, "").trim();
      }
    }

    if (!displayGame) {
      displayGame = "Board Game Bebas Pilih di Rak";
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
                {isExpired ? "● Kedaluwarsa" : "● Aktif"}
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
          {/* Highlight Game Banner */}
          <View
            style={[
              styles.gameBanner,
              isExpired && { backgroundColor: "#F1F5F9" }
            ]}
          >
            <Ionicons
              name="cube"
              size={20}
              color={isExpired ? colors.textMuted : colors.primaryDark}
            />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text
                style={[
                  styles.gameBannerLabel,
                  isExpired && { color: colors.textMuted }
                ]}
              >
                Board Game Dipesan
              </Text>
              <Text
                style={[
                  styles.gameBannerTitle,
                  isExpired && { color: colors.textMuted }
                ]}
              >
                {displayGame}
              </Text>
            </View>
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
              name={isExpired ? "hourglass-outline" : "time"}
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
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Booking Management</Text>
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
    paddingTop: 54,
    paddingBottom: 22,
    paddingHorizontal: 20
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.primaryLight,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1
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
    marginTop: -14,
    padding: 4,
    borderRadius: 12,
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
  gameBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14
  },
  gameBannerLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryDark,
    textTransform: "uppercase"
  },
  gameBannerTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primaryDark,
    marginTop: 1
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
    backgroundColor: "#F0FDFA",
    padding: 10,
    borderRadius: 8,
    marginTop: 6
  },
  sessionBannerExpired: {
    backgroundColor: "#F8FAFC"
  },
  sessionBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.secondary,
    marginLeft: 6
  },
  sessionBannerTextExpired: {
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
