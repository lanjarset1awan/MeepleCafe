import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";

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

  // Parse facilities string into an array
  const facilityList = table.facilities
    ? table.facilities.split(",").map((f) => f.trim())
    : ["Meja luas khusus board game", "Papan skor & dadu", "Free WiFi Kafe"];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={{
            uri:
              table.image_url ||
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500"
          }}
          style={styles.bannerImage}
        />

        <View style={styles.detailCard}>
          <View style={styles.topRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Nomor Meja: {table.table_number}</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>● Siap Digunakan</Text>
            </View>
          </View>

          <Text style={styles.title}>{table.table_type}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Biaya Sewa Meja:</Text>
            <Text style={styles.priceValue}>{formatRupiah(table.price_per_hour)} / Jam</Text>
          </View>

          <View style={styles.specsRow}>
            <View style={styles.specBox}>
              <Ionicons name="people" size={24} color={colors.primary} />
              <Text style={styles.specTitle}>Kapasitas</Text>
              <Text style={styles.specSub}>Maks. {table.capacity} Orang</Text>
            </View>

            <View style={styles.specBox}>
              <Ionicons name="wifi" size={24} color={colors.secondary} />
              <Text style={styles.specTitle}>Fasilitas</Text>
              <Text style={styles.specSub}>High-Speed WiFi</Text>
            </View>

            <View style={styles.specBox}>
              <Ionicons name="fast-food" size={24} color={colors.accent} />
              <Text style={styles.specTitle}>Layanan</Text>
              <Text style={styles.specSub}>Dine-in Menu</Text>
            </View>
          </View>

          {/* List Fasilitas Lengkap */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fasilitas Meja Termasuk:</Text>
            {facilityList.map((item, idx) => (
              <View key={idx} style={styles.facilityItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.facilityText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Info Tambahan */}
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.secondary} />
            <Text style={styles.infoBoxText}>
              Setiap pemesanan meja sudah termasuk akses bebas ke seluruh koleksi board game MeepleCafe dan bantuan panduan dari Game Master kafe.
            </Text>
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
    paddingBottom: 90
  },
  bannerImage: {
    width: "100%",
    height: 240,
    resizeMode: "cover"
  },
  detailCard: {
    marginTop: -20,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8
  },
  badgeText: {
    color: colors.primaryDark,
    fontWeight: "bold",
    fontSize: 12
  },
  activeBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  activeText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "bold"
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12
  },
  priceContainer: {
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 12,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  priceLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500"
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.secondary
  },
  specsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20
  },
  specBox: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border
  },
  specTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 6
  },
  specSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "center"
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  facilityText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 10
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#99F6E4",
    padding: 14,
    borderRadius: 12,
    alignItems: "flex-start"
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: "#0F766E",
    marginLeft: 8,
    lineHeight: 18
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: colors.border
  },
  bookButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
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
    color: colors.accent,
    fontSize: 15
  }
});

