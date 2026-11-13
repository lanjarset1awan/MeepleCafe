import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";

export default function BookingFormScreen({ route, navigation }) {
  const { tableId, tableNumber, tableType, pricePerHour, capacity } = route.params;

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [reservationDate, setReservationDate] = useState("2026-11-20");
  const [sessionTime, setSessionTime] = useState("Sesi Malam (18.00 - 21.00)");
  const [guestCount, setGuestCount] = useState("4");
  const [loading, setLoading] = useState(false);

  const sessionOptions = [
    "Sesi Siang (13.00 - 16.00)",
    "Sesi Sore (16.00 - 19.00)",
    "Sesi Malam (19.00 - 22.00)"
  ];

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
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        table_id: tableId,
        reservation_date: reservationDate,
        session_time: sessionTime,
        guest_count: count
      };

      const result = await ApiService.createReservation(payload);

      Alert.alert(
        "Reservasi Berhasil! 🎉",
        `Kode Booking Anda: ${result.booking_code}\n\nSilakan simpan tiket Anda untuk ditunjukkan kepada kasir kafe.`,
        [
          {
            text: "Lihat Tiket Saya",
            onPress: () => {
              // Reset stack meja ke daftar meja dan pindah ke Tab Tiket
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
      {/* Table Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryBadgeText}>Meja {tableNumber}</Text>
        </View>
        <Text style={styles.summaryTitle}>{tableType}</Text>
        <Text style={styles.summarySub}>Kapasitas Meja: Maks. {capacity} Orang</Text>
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
            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>Konfirmasi & Simpan Reservasi</Text>
          </>
        )}
      </TouchableOpacity>
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  summaryBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.primaryDark
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text
  },
  summarySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
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
  }
});

