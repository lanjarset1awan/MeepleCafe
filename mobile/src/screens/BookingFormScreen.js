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
  const [sessionTime, setSessionTime] = useState("Sesi Malam (18.00 - 21.00)");
  const [guestCount, setGuestCount] = useState("4");
  const [loading, setLoading] = useState(false);

  // State untuk Board Game yang dipilih
  const [chosenGame, setChosenGame] = useState(selectedGame || null);
  const [allGames, setAllGames] = useState([]);
  const [gamePickerVisible, setGamePickerVisible] = useState(false);

  const sessionOptions = [
    "Sesi Siang (13.00 - 16.00)",
    "Sesi Sore (16.00 - 19.00)",
    "Sesi Malam (19.00 - 22.00)"
  ];

  useEffect(() => {
    async function loadAllGames() {
      try {
        const games = await ApiService.getGames();
        setAllGames(games || []);
        // Jika belum ada game terpilih, default ke game pertama
        if (!chosenGame && games && games.length > 0) {
          setChosenGame(games[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAllGames();
  }, []);

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
        `Kode Booking Anda: ${result.booking_code}\n\n🎲 Game: ${gameTitle}\n🪑 Meja: ${tableType} (${tableNumber})\n\nTiket telah diterbitkan, silakan cek di menu Tiket Saya.`,
        [
          {
            text: "Lihat Tiket Saya",
            onPress: () => {
              // Reset stack meja ke daftar meja dan buka Tab Tiket
              navigation.popToTop();
              navigation.navigate("TicketsTab");
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert("Error Reservasi", err.message || "Gagal membuat reservasi.");
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

      {/* Pilihan Sesi Jam */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pilih Sesi Waktu Main *</Text>
        {sessionOptions.map((opt) => {
          const selected = sessionTime === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.sessionOption, selected && styles.sessionOptionActive]}
              onPress={() => setSessionTime(opt)}
            >
              <Ionicons
                name={selected ? "radio-button-on" : "radio-button-off"}
                size={18}
                color={selected ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.sessionOptionText,
                  selected && styles.sessionOptionTextActive
                ]}
              >
                {opt}
              </Text>
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
                      {item.min_players}-{item.max_players} Pemain • {item.difficulty}
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
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6
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
  sessionOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8
  },
  sessionOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  sessionOptionText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 10
  },
  sessionOptionTextActive: {
    fontWeight: "bold",
    color: colors.primaryDark
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
