import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import GameImage from "../components/GameImage";

export default function TableListScreen({ route, navigation }) {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Menerima & mengelola game yang dipilih
  const [selectedGame, setSelectedGame] = useState(route.params?.selectedGame || null);
  const [allGames, setAllGames] = useState([]);
  const [gamePickerVisible, setGamePickerVisible] = useState(false);

  // Sync jika route.params.selectedGame berubah dari navigasi luar
  useEffect(() => {
    if (route.params?.selectedGame) {
      setSelectedGame(route.params.selectedGame);
    }
  }, [route.params?.selectedGame]);

  // Load daftar board game untuk modal ganti game
  useEffect(() => {
    async function loadAllGames() {
      try {
        const games = await ApiService.getGames();
        setAllGames(games || []);
      } catch (err) {
        console.error("Gagal memuat list games di TableListScreen:", err);
      }
    }
    loadAllGames();
  }, []);

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

  const handleSelectTable = (table) => {
    navigation.navigate("BookingForm", {
      tableId: table.id,
      tableNumber: table.table_number,
      tableType: table.table_type,
      pricePerHour: table.price_per_hour,
      capacity: table.capacity,
      tableImage: table.image_url,
      selectedGame: selectedGame // Membawa game yang dipilih ke form booking!
    });
  };

  const renderTableCard = ({ item }) => (
    <View style={styles.card}>
      <GameImage uri={item.image_url} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.tableType}>{item.table_type}</Text>

        <View style={styles.cardTopRow}>
          <View style={styles.tableNumberBadge}>
            <Text style={styles.tableNumberText}>Meja {item.table_number}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>Tersedia</Text>
          </View>
        </View>

        <View style={styles.infoMetaRow}>
          <View style={styles.capacityRow}>
            <Ionicons name="people-outline" size={16} color={colors.primary} />
            <Text style={styles.capacityText}>Kapasitas: Maks. {item.capacity} Orang</Text>
          </View>
          <Text style={styles.priceText}>{formatRupiah(item.price_per_hour)}/jam</Text>
        </View>

        <Text style={styles.facilitiesText} numberOfLines={2}>
          Fasilitas: {item.facilities || "Kursi nyaman, pencahayaan khusus board game"}
        </Text>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.btnDetail}
            onPress={() =>
              navigation.navigate("TableDetail", {
                tableId: item.id,
                title: item.table_type,
                selectedGame: selectedGame
              })
            }
          >
            <Text style={styles.btnDetailText}>Info Meja</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSelect}
            activeOpacity={0.85}
            onPress={() => handleSelectTable(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnSelectText}>Pilih Meja Ini</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerBrandRow}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/Logo-MeepleCafe.jpeg")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Daftar Meja Bermain</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.headerAdminBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate("AdminTableList")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerInfoBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("About")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Selected Game Sticky Notification Banner */}
      {selectedGame ? (
        <View style={styles.selectedGameBanner}>
          <View style={styles.gameBannerLeft}>
            <GameImage uri={selectedGame.image_url} style={styles.gameBannerThumb} />
            <View style={styles.gameBannerTexts}>
              <Text style={styles.gameBannerLabel}>Game yang Dipilih:</Text>
              <Text style={styles.gameBannerTitle} numberOfLines={1}>{selectedGame.title}</Text>
              <Text style={styles.gameBannerMeta}>
                {selectedGame.min_players}-{selectedGame.max_players} Pemain ({selectedGame.difficulty})
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.changeGameBtn}
            onPress={() => setGamePickerVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.changeGameBtnText}>Ganti</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.noGameBanner}
          onPress={() => setGamePickerVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="cube-outline" size={20} color={colors.primaryDark} style={{ marginRight: 8 }} />
          <Text style={styles.noGameBannerText}>
            Belum memilih game? <Text style={styles.noGameHighlight}>Pilih Game Di Sini</Text> atau langsung pilih meja.
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat pilihan meja kafe...</Text>
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

      {/* Modal Picker untuk Ganti Board Game */}
      <Modal visible={gamePickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Pilih Board Game</Text>
                <Text style={styles.modalSub}>Pilih board game yang ingin Anda mainkan di meja</Text>
              </View>
              <TouchableOpacity onPress={() => setGamePickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={allGames}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.gamePickerRow,
                    selectedGame?.id === item.id && styles.gamePickerRowActive
                  ]}
                  onPress={() => {
                    setSelectedGame(item);
                    setGamePickerVisible(false);
                  }}
                >
                  <GameImage uri={item.image_url} style={styles.pickerGameThumb} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.gamePickerName}>{item.title}</Text>
                    <Text style={styles.gamePickerDesc}>
                      {item.min_players}-{item.max_players} Pemain • Stok: {item.stock || 2} Box
                    </Text>
                  </View>
                  {selectedGame?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    paddingTop: 46,
    paddingBottom: 36,
    paddingHorizontal: 20
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: "#FFFFFF"
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  headerAdminBtn: {
    padding: 4
  },
  headerInfoBtn: {
    padding: 4
  },
  selectedGameBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  gameBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  gameBannerThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F1F5F9"
  },
  gameBannerTexts: {
    marginLeft: 10,
    flex: 1
  },
  gameBannerLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase"
  },
  gameBannerTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text
  },
  gameBannerMeta: {
    fontSize: 11,
    color: colors.primaryDark,
    marginTop: 2
  },
  changeGameBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8
  },
  changeGameBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primaryDark
  },
  noGameBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    marginHorizontal: 16,
    marginTop: -16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14
  },
  noGameBannerText: {
    fontSize: 12,
    color: colors.primaryDark,
    marginLeft: 8,
    flex: 1,
    fontWeight: "500"
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
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
    height: 150,
    resizeMode: "cover"
  },
  cardContent: {
    padding: 14
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
  tableType: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8
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
    color: colors.primary
  },
  facilitiesText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 14
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.border
  },
  btnDetail: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  btnDetailText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted
  },
  btnSelect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  btnSelectText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF"
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
  noGameHighlight: {
    fontWeight: "bold",
    color: colors.primaryDark,
    textDecorationLine: "underline"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.65)",
    justifyContent: "flex-end"
  },
  pickerModalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    padding: 20
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text
  },
  modalSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  gamePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  gamePickerRowActive: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8
  },
  gamePickerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text
  },
  gamePickerDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  },
  pickerGameThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F1F5F9"
  }
});
