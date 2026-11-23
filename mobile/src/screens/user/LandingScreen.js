import React, { useState, useEffect } from "react";
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
  ScrollView
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ApiService } from "../../api/apiService";
import { colors } from "../../theme/colors";
import GameImage from "../../components/GameImage";
import CustomDialog from "../../components/CustomDialog";
import OfflineNotice from "../../components/OfflineNotice";
import { CacheService } from "../../services/cacheService";

export default function LandingScreen({ navigation }) {
  const [activePage, setActivePage] = useState("katalog"); // "katalog" | "about"
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [noticeDialogVisible, setNoticeDialogVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const categories = ["All", "Strategy", "Party Game", "Family", "Social Deduction"];

  // Strategi Cache-First (Stale-While-Revalidate)
  const loadGames = async (isManualRefresh = false) => {
    try {
      // 1. Ambil dari Cache Lokal (Instan)
      if (!isManualRefresh) {
        const cached = await CacheService.getGames();
        if (cached && cached.length > 0) {
          setGames(cached);
          setLoading(false);
        }
      }

      // 2. Revalidasi data online
      const data = await ApiService.getGames();
      setGames(data || []);
      setIsOffline(Boolean(data?._isOffline));
    } catch (err) {
      console.warn("LandingScreen loadGames error (offline):", err.message);
      setIsOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadGames(true);
  };

  // Filter game berdasarkan pencarian dan kategori
  const filteredGames = games.filter((item) => {
    const categoryName = item.game_categories?.name || "";
    const matchesCategory =
      selectedFilter === "All" ||
      categoryName.toLowerCase().includes(selectedFilter.toLowerCase());
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Render Card Game (Sama persis dengan katalog internal)
  const renderGameCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => navigation.navigate("GameDetail", { gameId: item.id, title: item.title, isOffline: isOffline })}
    >
      <GameImage uri={item.image_url} style={styles.cardImage} />

      <View style={styles.cardContent}>
        <Text style={styles.gameTitle} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.metaRow}>
          {/* 1. Kategori (Bubble Kotak Biru) */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {item.game_categories?.name || "General"}
            </Text>
          </View>

          {/* 2. Jumlah Pemain (Biru) */}
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.primary, fontWeight: "600" }]}>
              {item.min_players}-{item.max_players} Pemain
            </Text>
          </View>

          {/* 3. Durasi (Biru) */}
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.primary, fontWeight: "600" }]}>
              {item.duration_minutes} mnt
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Footer Card */}
        <View style={styles.actionFooter}>
          <Text style={styles.actionFooterText}>Pelajari Aturan & Pilih Game</Text>
          <Ionicons name="arrow-forward-circle" size={18} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Banner Konsisten */}
      <View style={styles.header}>
        <View style={styles.headerBrandRow}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../../assets/Logo-MeepleCafe.jpeg")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>MeepleCafe</Text>
          </View>

          {/* Tombol Masuk & Daftar di Kanan Header */}
          <View style={styles.authButtonsRow}>
            <TouchableOpacity
              style={styles.headerBtnRegister}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.headerBtnRegisterText}>Daftar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerBtnLogin}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("Login")}
            >
              <Ionicons name="log-in-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.headerBtnLoginText}>Masuk</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informasi Harus Login untuk Bermain / Pesan Meja */}
        <TouchableOpacity
          style={styles.noticeBox}
          activeOpacity={0.85}
          onPress={() => setNoticeDialogVisible(true)}
        >
          <Ionicons name="information-circle-outline" size={17} color="#93C5FD" style={{ marginRight: 6 }} />
          <Text style={styles.noticeText}>
            Jelajahi koleksi game & profil kafe kami. Silakan{" "}
            <Text style={styles.noticeHighlight}>Masuk</Text> atau <Text style={styles.noticeHighlight}>Daftar</Text>{" "}
            untuk memesan meja dan bermain di kafe.
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2 Tab Segmented: Katalog Game & Tentang Kafe (About) */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activePage === "katalog" && styles.tabButtonActive]}
          onPress={() => setActivePage("katalog")}
        >
          <Ionicons
            name="albums-outline"
            size={16}
            color={activePage === "katalog" ? "#FFFFFF" : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabButtonText,
              activePage === "katalog" && styles.tabButtonTextActive
            ]}
          >
            Katalog Game
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activePage === "about" && styles.tabButtonActive]}
          onPress={() => setActivePage("about")}
        >
          <Ionicons
            name="storefront-outline"
            size={16}
            color={activePage === "about" ? "#FFFFFF" : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabButtonText,
              activePage === "about" && styles.tabButtonTextActive
            ]}
          >
            Tentang Kafe
          </Text>
        </TouchableOpacity>
      </View>

      {/* Konten Halaman Berdasarkan Tab Aktif */}
      {activePage === "katalog" ? (
        <View style={{ flex: 1 }}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
            <TextInput
              placeholder="Cari board game (UNO, Monopoly, Catur..."
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

          {/* Category Filter Pills */}
          <View style={styles.filterWrapper}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => {
                const active = selectedFilter === item;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedFilter(item)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Mode Offline Banner */}
          {isOffline && (
            <OfflineNotice message="Mode Offline: Menampilkan katalog tersimpan di perangkat. Pemesanan dinonaktifkan." />
          )}

          {/* Daftar Koleksi Game */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Memuat koleksi board game...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredGames}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderGameCard}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>Tidak ada game yang sesuai pencarian.</Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        /* Halaman About: Tentang Kafe & Informasi Operasional (Sama persis dengan AboutScreen di dalam apps) */
        <ScrollView
          style={styles.aboutContainer}
          contentContainerStyle={styles.aboutScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Hero */}
          <View style={styles.heroCard}>
            <Image
              source={require("../../../assets/Logo-MeepleCafe.jpeg")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>MeepleCafe</Text>
            <Text style={styles.heroTagline}>
              Platform Board Game Cafe & Reservasi Meja
            </Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>Versi 1.0.0 • Mobile App</Text>
            </View>
          </View>

          {/* Card 1: Tentang MeepleCafe */}
          <View style={styles.aboutCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle" size={22} color={colors.primary} />
              <Text style={styles.cardTitle}>Tentang MeepleCafe</Text>
            </View>
            <Text style={styles.aboutText}>
              MeepleCafe adalah aplikasi mobile terintegrasi untuk pecinta board game.
              Aplikasi ini memadukan katalog koleksi permainan fisik terlengkap dengan
              sistem pemesanan meja dan ruangan bermain di kafe secara instan.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name="albums-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureName}>Ratusan Koleksi Board Game</Text>
                  <Text style={styles.featureDesc}>
                    Mulai dari genre strategi, pesta, keluarga, hingga deduksi sosial.
                  </Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <MaterialCommunityIcons name="table-chair" size={18} color={colors.primary} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureName}>Reservasi Meja Instan</Text>
                  <Text style={styles.featureDesc}>
                    Pilihan meja Reguler, Premium, hingga Ruang VIP privat tanpa antre.
                  </Text>
                </View>
              </View>

              <View style={[styles.featureRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <View style={styles.featureIcon}>
                  <Ionicons name="people-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureName}>Game Master Ramah</Text>
                  <Text style={styles.featureDesc}>
                    Pemandu berpengalaman siap mengajari aturan bermain game baru.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Card 2: Informasi Operasional Kafe */}
          <View style={styles.aboutCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="storefront" size={22} color={colors.primary} />
              <Text style={styles.cardTitle}>Informasi Operasional Kafe</Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoHeading}>Alamat Kafe</Text>
                <Text style={styles.infoDesc}>
                  Jl. Graha Prasetya IV No.65, Pedalangan, Kec. Banyumanik, Kota Semarang, Jawa Tengah 50268
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoHeading}>Jam Buka</Text>
                <Text style={styles.infoDesc}>Setiap Hari: 10.00 – 21.00 WIB</Text>
              </View>
            </View>

            <View style={[styles.infoItem, { marginBottom: 0 }]}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoHeading}>Kontak Layanan</Text>
                <Text style={styles.infoDesc}>WhatsApp: +62 812-3456-7890</Text>
              </View>
            </View>
          </View>

          {/* Card 3: Fasilitas Kafe */}
          <View style={styles.aboutCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Fasilitas & Kenyamanan</Text>
            </View>

            <View style={styles.facilityGrid}>
              <View style={styles.facilityBadge}>
                <Ionicons name="wifi" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.facilityText}>High-Speed Wi-Fi</Text>
              </View>

              <View style={styles.facilityBadge}>
                <Ionicons name="snow-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.facilityText}>Ruang Ber-AC Sejuk</Text>
              </View>

              <View style={styles.facilityBadge}>
                <Ionicons name="fast-food-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.facilityText}>Snack & Minuman Kafe</Text>
              </View>

              <View style={styles.facilityBadge}>
                <Ionicons name="shield-checkmark-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.facilityText}>Komponen Game Terawat</Text>
              </View>
            </View>
          </View>

          {/* Card 4: Informasi Pembuat Aplikasi */}
          <View style={styles.aboutCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="code-slash" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Informasi Pembuat Aplikasi</Text>
            </View>

            <View style={styles.creatorBadgeRow}>
              <View style={styles.creatorBadge}>
                <Ionicons name="school" size={13} color={colors.primaryDark} style={{ marginRight: 5 }} />
                <Text style={styles.creatorBadgeText}>Praktikum PPB 2026</Text>
              </View>
            </View>

            <View style={styles.creatorList}>
              <View style={styles.creatorRow}>
                <View style={styles.creatorIconBox}>
                  <Ionicons name="person-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.creatorInfo}>
                  <Text style={styles.creatorLabel}>Nama Pengembang</Text>
                  <Text style={styles.creatorValue}>Lanjar Setiawan</Text>
                </View>
              </View>

              <View style={styles.creatorRow}>
                <View style={styles.creatorIconBox}>
                  <Ionicons name="id-card-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.creatorInfo}>
                  <Text style={styles.creatorLabel}>NIM</Text>
                  <Text style={styles.creatorValue}>21120124120023</Text>
                </View>
              </View>

              <View style={styles.creatorRow}>
                <View style={styles.creatorIconBox}>
                  <Ionicons name="people-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.creatorInfo}>
                  <Text style={styles.creatorLabel}>Kelompok</Text>
                  <Text style={styles.creatorValue}>Kelompok 16</Text>
                </View>
              </View>

              <View style={[styles.creatorRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                <View style={styles.creatorIconBox}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.creatorInfo}>
                  <Text style={styles.creatorLabel}>Shift</Text>
                  <Text style={styles.creatorValue}>Shift 3</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.footerNote}>© 2026 MeepleCafe. All rights reserved.</Text>
        </ScrollView>
      )}

      {/* Dialog Kustom Ajakan Masuk / Daftar di Landing Page */}
      <CustomDialog
        visible={noticeDialogVisible}
        type="info"
        iconName="cafe"
        title="Akses Bermain MeepleCafe"
        message="Anda sedang berada di mode penjelajah tamu. Masuk ke akun Anda atau daftar baru untuk memilih meja favorit dan menikmati sesi bermain di kafe."
        secondaryText="Daftar Akun Baru"
        confirmText="Masuk Sekarang"
        cancelText="Lanjut Menjelajah"
        onConfirm={() => {
          setNoticeDialogVisible(false);
          navigation.navigate("Login");
        }}
        onSecondary={() => {
          setNoticeDialogVisible(false);
          navigation.navigate("Register");
        }}
        onCancel={() => setNoticeDialogVisible(false)}
        onClose={() => setNoticeDialogVisible(false)}
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
    paddingTop: 46,
    paddingBottom: 28,
    paddingHorizontal: 20
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: "#FFFFFF"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  authButtonsRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  headerBtnRegister: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 4
  },
  headerBtnRegisterText: {
    color: "#CBD5E1",
    fontSize: 12.5,
    fontWeight: "600"
  },
  headerBtnLogin: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18
  },
  headerBtnLoginText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "bold"
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    marginTop: 2
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: "#E2E8F0",
    lineHeight: 17
  },
  noticeHighlight: {
    fontWeight: "bold",
    color: "#FFFFFF",
    textDecorationLine: "underline"
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -14,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 10
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10
  },
  tabButtonActive: {
    backgroundColor: colors.primary
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.textMuted
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13.5,
    color: colors.text
  },
  filterWrapper: {
    marginTop: 10,
    marginBottom: 6
  },
  filterList: {
    paddingHorizontal: 16
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.card,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.textMuted
  },
  filterChipTextActive: {
    color: "#FFFFFF"
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
    height: 160,
    resizeMode: "cover"
  },
  cardContent: {
    padding: 14
  },
  gameTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 6
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap"
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 11
  },
  categoryBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.primaryDark
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 11
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18
  },
  actionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.border
  },
  actionFooterText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 14
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60
  },
  emptyText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 15
  },
  aboutContainer: {
    flex: 1
  },
  aboutScrollContent: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 36
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 10,
    backgroundColor: "#FFFFFF"
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text
  },
  heroTagline: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
    textAlign: "center"
  },
  versionBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10
  },
  versionText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.primaryDark
  },
  aboutCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginLeft: 8
  },
  aboutText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 14
  },
  featuresList: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC"
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1
  },
  featureInfo: {
    flex: 1
  },
  featureName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text
  },
  featureDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12
  },
  infoContent: {
    marginLeft: 10,
    flex: 1
  },
  infoHeading: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.text
  },
  infoDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18
  },
  facilityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4
  },
  facilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10
  },
  facilityText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryDark
  },
  creatorBadgeRow: {
    marginBottom: 14
  },
  creatorBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCE3F5"
  },
  creatorBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.primaryDark
  },
  creatorList: {
    marginTop: 2
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  creatorIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  creatorInfo: {
    flex: 1
  },
  creatorLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
    marginBottom: 2
  },
  creatorValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text
  },
  footerNote: {
    textAlign: "center",
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 20
  }
});
