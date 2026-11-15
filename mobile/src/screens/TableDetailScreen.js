import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";
import GameImage from "../components/GameImage";

export default function TableDetailScreen({ route, navigation }) {
  const { tableId, selectedGame } = route.params;
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        const data = await ApiService.getTableById(tableId);
        setTable(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [tableId]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(number);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat detail area meja...</Text>
      </View>
    );
  }

  if (!table) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Data meja tidak ditemukan.</Text>
      </View>
    );
  }

  const facilityList = table.facilities
    ? table.facilities.split(",").map((f) => f.trim())
    : [
        "Meja luas dengan permukaan khusus alas board game",
        "Pencahayaan warm focus nyaman untuk membaca kartu & dadu",
        "Akses bebas colokan listrik & Free High-Speed WiFi Kafe",
        "Bantuan tutorial langsung dari Game Master kafe"
      ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Cover Image */}
        <View style={styles.imageWrapper}>
          <GameImage uri={table.image_url} style={styles.bannerImage} />
        </View>

        {/* Floating Detail Card */}
        <View style={styles.detailCard}>
          {/* Top Badges */}
          <View style={styles.topRow}>
            <View style={styles.tableBadge}>
              <Text style={styles.tableBadgeText}>Meja {table.table_number}</Text>
            </View>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Siap Dipesan</Text>
            </View>
          </View>

          {/* Table Type Title */}
          <Text style={styles.title}>{table.table_type}</Text>

          {/* Price Card */}
          <View style={styles.priceContainer}>
            <View>
              <Text style={styles.priceLabel}>Tarif Sewa Meja</Text>
              <Text style={styles.priceValue}>{formatRupiah(table.price_per_hour)}</Text>
            </View>
            <View style={styles.perHourBadge}>
              <Text style={styles.perHourBadgeText}>per jam</Text>
            </View>
          </View>

          {/* 3 Quick Highlight Chips */}
          <View style={styles.specsRow}>
            <View style={styles.specBox}>
              <View style={[styles.specIconBox, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="people" size={18} color={colors.primary} />
              </View>
              <Text style={styles.specTitle}>Kapasitas</Text>
              <Text style={styles.specSub}>Maks {table.capacity} Orang</Text>
            </View>

            <View style={styles.specBox}>
              <View style={[styles.specIconBox, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="wifi" size={18} color="#2563EB" />
              </View>
              <Text style={styles.specTitle}>Konektivitas</Text>
              <Text style={styles.specSub}>Free Wi-Fi 5G</Text>
            </View>

            <View style={styles.specBox}>
              <View style={[styles.specIconBox, { backgroundColor: colors.successLight }]}>
                <Ionicons name="game-controller" size={18} color={colors.success} />
              </View>
              <Text style={styles.specTitle}>Game Master</Text>
              <Text style={styles.specSub}>Free Panduan</Text>
            </View>
          </View>

          {/* List Fasilitas Lengkap */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fasilitas & Keunggulan Meja</Text>
            {facilityList.map((item, idx) => (
              <View key={idx} style={styles.facilityItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.facilityText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Button CTA to Booking Form */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bookButton}
          activeOpacity={0.88}
          onPress={() =>
            navigation.navigate("BookingForm", {
              tableId: table.id,
              tableNumber: table.table_number,
              tableType: table.table_type,
              pricePerHour: table.price_per_hour,
              capacity: table.capacity,
              selectedGame: selectedGame
            })
          }
        >
          <Ionicons name="ticket-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.bookButtonText}>Lanjutkan Reservasi Meja</Text>
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
  scrollContent: {
    paddingBottom: 100
  },
  imageWrapper: {
    width: "100%",
    height: 250,
    backgroundColor: colors.secondary
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  detailCard: {
    marginTop: -24,
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 }
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  tableBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8
  },
  tableBadgeText: {
    color: colors.primaryDark,
    fontWeight: "bold",
    fontSize: 12
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6
  },
  activeText: {
    color: colors.successText,
    fontSize: 11,
    fontWeight: "bold"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 14
  },
  priceContainer: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  priceLabel: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: "600"
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primaryDark,
    marginTop: 2
  },
  perHourBadge: {
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  perHourBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.primaryDark
  },
  specsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
    gap: 8
  },
  specBox: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  specIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6
  },
  specTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.text
  },
  specSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "center"
  },
  section: {
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  facilityText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 10,
    flex: 1
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -3 }
  },
  bookButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 3
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
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
  errorText: {
    color: colors.danger,
    fontSize: 15
  }
});
