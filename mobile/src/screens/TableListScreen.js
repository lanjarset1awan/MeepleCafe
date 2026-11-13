import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";

export default function TableListScreen({ navigation }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getTables();
      setTables(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTables();
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(number);
  };

  const renderTableCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => navigation.navigate("TableDetail", { tableId: item.id, title: item.table_type })}
    >
      <Image
        source={{
          uri:
            item.image_url ||
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500"
        }}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <View style={styles.tableNumberBadge}>
            <Text style={styles.tableNumberText}>Meja {item.table_number}</Text>
          </View>
          <Text style={styles.priceText}>{formatRupiah(item.price_per_hour)}/jam</Text>
        </View>

        <Text style={styles.tableType}>{item.table_type}</Text>

        <View style={styles.capacityRow}>
          <Ionicons name="people" size={16} color={colors.secondary} />
          <Text style={styles.capacityText}>Kapasitas: Hingga {item.capacity} Orang</Text>
        </View>

        <Text style={styles.facilitiesText} numberOfLines={2}>
          Fasilitas: {item.facilities || "Kursi nyaman, papan skor"}
        </Text>

        <View style={styles.actionRow}>
          <Text style={styles.viewDetailText}>Lihat Fasilitas & Booking</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Play Area & Seating</Text>
        <Text style={styles.headerTitle}>Pilihan Meja Bermain</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat pilihan meja...</Text>
        </View>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(item) => item.id}
          renderItem={renderTableCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
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
    paddingBottom: 24
  },
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
    height: 160,
    resizeMode: "cover"
  },
  cardContent: {
    padding: 14
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
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
  priceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.secondary
  },
  tableType: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 6
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  capacityText: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 6
  },
  facilitiesText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 12
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.border
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    marginRight: 4
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 10,
    color: colors.textMuted
  }
});
