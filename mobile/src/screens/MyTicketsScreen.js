import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";

export default function MyTicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderTicketCard = ({ item }) => {
    const tableInfo = item.cafe_tables || {};

    // Ambil judul game dari field game_title atau parsing dari customer_name jika sebelumnya disimpan di sana
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
      <View style={styles.ticketCard}>
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <View>
            <Text style={styles.ticketBrand}>MEEPLECAFE PASS</Text>
            <Text style={styles.bookingCode}>{item.booking_code}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status || "Confirmed"}</Text>
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
          <View style={styles.gameBanner}>
            <Ionicons name="cube" size={20} color={colors.primaryDark} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={styles.gameBannerLabel}>Board Game Dipesan</Text>
              <Text style={styles.gameBannerTitle}>{displayGame}</Text>
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
                {tableInfo.table_type || "Reguler Table"} ({tableInfo.table_number || "T-01"})
              </Text>
            </View>
            <View style={styles.infoColRight}>
              <Text style={styles.infoLabel}>Tanggal</Text>
              <Text style={styles.infoValue}>{item.reservation_date}</Text>
            </View>
          </View>

          <View style={styles.sessionBanner}>
            <Ionicons name="time" size={16} color={colors.secondary} />
            <Text style={styles.sessionBannerText}>{item.session_time}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Booking History</Text>
        <Text style={styles.headerTitle}>Tiket Reservasi Saya</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat tiket reservasi...</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
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
              <Ionicons name="ticket-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Belum Ada Tiket Reservasi</Text>
              <Text style={styles.emptySubtitle}>
                Pilih game dari Katalog Game, lalu pilih meja bermain untuk mendapatkan tiket reservasi Anda!
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate("GameTab")}
              >
                <Text style={styles.browseButtonText}>Mulai dari Katalog Game</Text>
              </TouchableOpacity>
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
  listContainer: {
    padding: 16,
    paddingBottom: 30
  },
  ticketCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }
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
  ticketBrand: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.5
  },
  bookingCode: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 2
  },
  statusBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#166534"
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
  sessionBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.secondary,
    marginLeft: 6
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
    marginTop: 60,
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
