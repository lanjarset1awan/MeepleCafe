import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";

export default function BookingFormScreen({ route, navigation }) {
  const { tableId, tableNumber, tableType, pricePerHour, capacity, selectedGame } = route.params;

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [reservationDate, setReservationDate] = useState("2026-11-20");
  const [sessionTime, setSessionTime] = useState("Sesi Siang (13.00 - 16.00)");
  const [guestCount, setGuestCount] = useState("4");
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // State untuk Board Game yang dipilih
  const [chosenGame, setChosenGame] = useState(selectedGame || null);
  const [allGames, setAllGames] = useState([]);
  const [gamePickerVisible, setGamePickerVisible] = useState(false);

  // Data reservasi aktif dari database untuk validasi slot & bentrok
  const [activeReservations, setActiveReservations] = useState([]);

  const sessionOptions = [
    { id: "siang", label: "Sesi Siang (13.00 - 16.00)", keyword: "Siang" },
    { id: "sore", label: "Sesi Sore (16.00 - 19.00)", keyword: "Sore" },
    { id: "malam", label: "Sesi Malam (19.00 - 22.00)", keyword: "Malam" }
  ];

  // 1. Load daftar game untuk opsi ganti game
  useEffect(() => {
    async function loadAllGames() {
      try {
        const games = await ApiService.getGames();
        setAllGames(games || []);
        if (!chosenGame && games && games.length > 0) {
          setChosenGame(games[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAllGames();
  }, []);

  // 2. Ambil seluruh data reservasi dari database untuk cek bentrok jam & stok
  const refreshAvailability = async () => {
    try {
      setCheckingAvailability(true);
      const resData = await ApiService.getReservations();
      setActiveReservations(resData || []);
    } catch (err) {
      console.warn("Gagal mengecek reservasi aktif:", err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    refreshAvailability();
  }, [reservationDate, tableId, chosenGame]);

  // Fungsi pengecekan ketersediaan per sesi
  const getSessionStatus = (sessionObj) => {
    const matchingDateReservations = activeReservations.filter(
      (r) => r.reservation_date === reservationDate && r.status !== "Cancelled"
    );

    // Cek apakah meja ini sudah dibooking orang pada sesi tersebut
    const isTableOccupied = matchingDateReservations.some((r) => {
      const matchSession =
        r.session_time?.toLowerCase().includes(sessionObj.keyword.toLowerCase()) ||
        r.session_time === sessionObj.label;
      return r.table_id === tableId && matchSession;
    });

    if (isTableOccupied) {
      return {
        available: false,
        reason: "Meja Sudah Dipesan",
        detail: "Meja ini telah direservasi oleh pelanggan lain pada jam ini."
      };
    }

    // Cek apakah stok game ini sudah habis / dipinjam di meja lain pada sesi tersebut
    if (chosenGame) {
      const gameBookedCount = matchingDateReservations.filter((r) => {
        const matchSession =
          r.session_time?.toLowerCase().includes(sessionObj.keyword.toLowerCase()) ||
          r.session_time === sessionObj.label;

        const matchGame =
          (r.game_title && r.game_title.toLowerCase() === chosenGame.title.toLowerCase()) ||
          (r.customer_name && r.customer_name.toLowerCase().includes(chosenGame.title.toLowerCase()));

        return matchGame && matchSession;
      }).length;

      const gameStock = chosenGame.stock || 2; // Default stok fisik kafe
      if (gameBookedCount >= gameStock) {
        return {
          available: false,
          reason: "Stok Game Habis",
          detail: `Semua ${gameStock} box game "${chosenGame.title}" sedang dipinjam meja lain pada sesi ini.`
        };
      }
    }

    return {
      available: true,
      reason: "Tersedia",
      detail: "Slot jam ini siap dipesan."
    };
  };

  // Otomatis arahkan sesi terpilih ke sesi yang masih tersedia jika sesi saat ini penuh
  useEffect(() => {
    if (activeReservations.length > 0) {
      const currentStatus = getSessionStatus(
        sessionOptions.find((s) => s.label === sessionTime) || sessionOptions[0]
      );
      if (!currentStatus.available) {
        const firstAvailable = sessionOptions.find((s) => getSessionStatus(s).available);
        if (firstAvailable) {
          setSessionTime(firstAvailable.label);
        }
      }
    }
  }, [activeReservations, reservationDate, tableId, chosenGame]);

  const handleSelectSession = (sessionObj, status) => {
    if (!status.available) {
      Alert.alert(
        "Slot Tidak Tersedia ❌",
        `${status.detail}\n\nSilakan pilih sesi jam berikutnya atau pilih tanggal/meja lain!`,
        [{ text: "Mengerti" }]
      );
      return;
    }
    setSessionTime(sessionObj.label);
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert("Perhatian", "Silakan isi nama dan nomor telepon Anda.");
      return;
    }

    const count = parseInt(guestCount, 10);
    if (isNaN(count) || count < 1 || count > capacity) {
      Alert.alert("Perhatian", `Jumlah pemain harus antara 1 sampai ${capacity} orang.`);
      return;
    }

    // Validasi akhir ketersediaan slot sebelum kirim
    const currentSessionObj =
      sessionOptions.find((s) => s.label === sessionTime) || sessionOptions[0];
    const status = getSessionStatus(currentSessionObj);
    if (!status.available) {
      Alert.alert(
        "Slot Penuh ❌",
        `${status.detail}\n\nMohon pilih sesi jam berikutnya sebelum konfirmasi.`
      );
      return;
    }

    try {
      setLoading(true);
      const gameTitle = chosenGame ? chosenGame.title : "General Play";
      const gameId = chosenGame ? chosenGame.id : null;

      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        table_id: tableId,
        reservation_date: reservationDate,
        session_time: sessionTime,
        guest_count: count,
        game_title: gameTitle,
        game_id: gameId
      };

      const result = await ApiService.createReservation(payload);

      Alert.alert(
        "Reservasi Berhasil! 🎉",
        `Kode Booking Anda: ${result.booking_code}\n\n🎲 Game: ${gameTitle}\n🪑 Meja: ${tableType} (${tableNumber})\n⏱️ Waktu: ${sessionTime}\n\nTiket telah diterbitkan, silakan cek di menu Tiket Saya.`,
        [
          {
            text: "Lihat Tiket Saya",
            onPress: () => {
              navigation.popToTop();
              navigation.navigate("TicketsTab");
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert(
        "Reservasi Gagal",
        err.message || "Slot pada sesi ini baru saja dipesan orang lain. Silakan pilih sesi berikutnya."
      );
      refreshAvailability();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Paket Reservasi Card (Meja + Game) */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeader}>Ringkasan Paket Reservasi</Text>

        {/* Game Terpilih */}
        <View style={styles.summaryItem}>
          <Ionicons name="cube" size={20} color={colors.primary} />
          <View style={styles.summaryItemText}>
            <Text style={styles.summaryItemLabel}>Board Game yang Dipesan:</Text>
            <Text style={styles.summaryItemValue}>
              {chosenGame ? chosenGame.title : "Belum memilih game"}
            </Text>
            <Text style={styles.stockSubText}>
              📦 Stok Fisik Kafe: {chosenGame?.stock || 2} Box Original
            </Text>
          </View>
          <TouchableOpacity
            style={styles.changeGameBtn}
            onPress={() => setGamePickerVisible(true)}
          >
            <Text style={styles.changeGameBtnText}>Ganti</Text>
          </TouchableOpacity>
        </View>

        {/* Meja Terpilih */}
        <View style={[styles.summaryItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          <Ionicons name="restaurant" size={20} color={colors.secondary} />
          <View style={styles.summaryItemText}>
            <Text style={styles.summaryItemLabel}>Meja / Ruangan Bermain:</Text>
            <Text style={styles.summaryItemValue}>
              {tableType} (Meja {tableNumber}) - Maks. {capacity} Orang
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.formHeader}>Lengkapi Informasi Pemesan</Text>

      {/* Input Nama */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nama Pemesan *</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Lanjar Setiawan"
          placeholderTextColor={colors.textMuted}
          value={customerName}
          onChangeText={setCustomerName}
        />
      </View>

      {/* Input No HP / WA */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nomor WhatsApp / HP *</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: 081234567890"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={customerPhone}
          onChangeText={setCustomerPhone}
        />
      </View>

      {/* Input Tanggal */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tanggal Main (YYYY-MM-DD) *</Text>
        <TextInput
          style={styles.input}
          placeholder="2026-11-20"
          placeholderTextColor={colors.textMuted}
          value={reservationDate}
          onChangeText={setReservationDate}
        />
      </View>

      {/* Pilihan Sesi Jam dengan Pengecekan Slot Terintegrasi Database */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Pilih Sesi Waktu Main *</Text>
          {checkingAvailability && (
            <Text style={styles.checkingText}>Memeriksa ketersediaan...</Text>
          )}
        </View>

        {sessionOptions.map((s) => {
          const status = getSessionStatus(s);
          const isSelected = sessionTime === s.label && status.available;

          return (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.8}
              style={[
                styles.sessionCard,
                isSelected && styles.sessionCardSelected,
                !status.available && styles.sessionCardDisabled
              ]}
              onPress={() => handleSelectSession(s, status)}
            >
              <View style={styles.sessionCardLeft}>
                <Ionicons
                  name={
                    !status.available
                      ? "close-circle"
                      : isSelected
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={
                    !status.available
                      ? colors.accent
                      : isSelected
                      ? colors.primary
                      : colors.textMuted
                  }
                />
                <View style={{ marginLeft: 10 }}>
                  <Text
                    style={[
                      styles.sessionLabelText,
                      isSelected && styles.sessionLabelTextActive,
                      !status.available && styles.sessionLabelTextDisabled
                    ]}
                  >
                    {s.label}
                  </Text>
                  {!status.available && (
                    <Text style={styles.sessionReasonText}>
                      ⚠️ {status.reason} (Harus pilih sesi lain)
                    </Text>
                  )}
                </View>
              </View>

              <View
                style={[
                  styles.statusBadgeSmall,
                  status.available ? styles.badgeAvailable : styles.badgeBooked
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeSmallText,
                    status.available ? styles.textAvailable : styles.textBooked
                  ]}
                >
                  {status.available ? "Tersedia ✓" : "Penuh ❌"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Jumlah Orang */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Jumlah Pemain (Orang) *</Text>
        <TextInput
          style={styles.input}
          placeholder={`Maksimal ${capacity}`}
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={guestCount}
          onChangeText={setGuestCount}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>Konfirmasi & Pesan Meja Sekarang</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Modal Picker untuk Ganti Board Game */}
      <Modal visible={gamePickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Board Game</Text>
              <TouchableOpacity onPress={() => setGamePickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={allGames}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.gamePickerItem,
                    chosenGame?.id === item.id && styles.gamePickerItemActive
                  ]}
                  onPress={() => {
                    setChosenGame(item);
                    setGamePickerVisible(false);
                  }}
                >
                  <Ionicons
                    name="cube-outline"
                    size={20}
                    color={chosenGame?.id === item.id ? colors.primary : colors.textMuted}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.gamePickerTitle}>{item.title}</Text>
                    <Text style={styles.gamePickerSub}>
                      {item.min_players}-{item.max_players} Pemain • Stok: {item.stock || 2} Box
                    </Text>
                  </View>
                  {chosenGame?.id === item.id && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  summaryHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  summaryItemText: {
    marginLeft: 12,
    flex: 1
  },
  summaryItemLabel: {
    fontSize: 11,
    color: colors.textMuted
  },
  summaryItemValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 2
  },
  stockSubText: {
    fontSize: 11,
    color: colors.primaryDark,
    marginTop: 2,
    fontWeight: "600"
  },
  changeGameBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8
  },
  changeGameBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primaryDark
  },
  formHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 14
  },
  inputGroup: {
    marginBottom: 16
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  checkingText: {
    fontSize: 11,
    color: colors.primaryDark,
    fontStyle: "italic"
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text
  },
  sessionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  sessionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  sessionCardDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    opacity: 0.8
  },
  sessionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  sessionLabelText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  sessionLabelTextActive: {
    fontWeight: "bold",
    color: colors.primaryDark
  },
  sessionLabelTextDisabled: {
    color: colors.textMuted
  },
  sessionReasonText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: "600",
    marginTop: 2
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8
  },
  badgeAvailable: {
    backgroundColor: "#DCFCE7"
  },
  badgeBooked: {
    backgroundColor: "#FEE2E2"
  },
  statusBadgeSmallText: {
    fontSize: 10,
    fontWeight: "bold"
  },
  textAvailable: {
    color: "#166534"
  },
  textBooked: {
    color: "#991B1B"
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  gamePickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  gamePickerItemActive: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8
  },
  gamePickerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text
  },
  gamePickerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  }
});
