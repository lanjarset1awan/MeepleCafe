import React, { useState, useEffect, useMemo } from "react";
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

// Helper konversi jam format string ke number
function parseHours(sessionStr) {
  if (!sessionStr) return { start: 0, end: 0 };
  const match = sessionStr.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/);
  if (match) {
    return {
      start: parseInt(match[1], 10) + parseInt(match[2], 10) / 60,
      end: parseInt(match[3], 10) + parseInt(match[4], 10) / 60
    };
  }
  return { start: 0, end: 0 };
}

// Cek apakah 2 rentang waktu saling bertabrakan
function doOverlap(s1, s2) {
  const h1 = parseHours(s1);
  const h2 = parseHours(s2);
  if (h1.start === 0 && h1.end === 0) return s1 === s2;
  if (h2.start === 0 && h2.end === 0) return s1 === s2;
  return h1.start < h2.end && h2.start < h1.end;
}

export default function BookingFormScreen({ route, navigation }) {
  const {
    tableId,
    tableNumber,
    tableType,
    pricePerHour = 30000,
    capacity = 4,
    selectedGame
  } = route.params;

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [reservationDate, setReservationDate] = useState("2026-11-20");

  // Pemilihan Jam & Durasi (Tiap 1 Jam, Bisa > 1 Jam)
  const [startHour, setStartHour] = useState(14); // default 14:00
  const [durationHours, setDurationHours] = useState(2); // default 2 Jam

  const [guestCount, setGuestCount] = useState("4");
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // State untuk Board Game yang dipilih
  const [chosenGame, setChosenGame] = useState(selectedGame || null);
  const [allGames, setAllGames] = useState([]);
  const [gamePickerVisible, setGamePickerVisible] = useState(false);

  // Modal Sistem Pembayaran
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("bca");

  // Data reservasi aktif dari database untuk validasi slot & bentrok
  const [activeReservations, setActiveReservations] = useState([]);

  // Daftar opsi jam buka kafe (10.00 sampai 21.00)
  const startHourOptions = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const durationOptions = [1, 2, 3, 4, 5];

  // Hitung jam selesai & label waktu
  const endHour = Math.min(23, startHour + durationHours);
  const startFormatted = `${String(startHour).padStart(2, "0")}.00`;
  const endFormatted = `${String(endHour).padStart(2, "0")}.00`;
  const currentSessionTime = `${startFormatted} - ${endFormatted} (${durationHours} Jam)`;

  // Hitung total bayar
  const numericPricePerHour = Number(pricePerHour) || 30000;
  const totalPrice = durationHours * numericPricePerHour;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

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

  // Cek ketersediaan slot untuk jam yang dipilih
  const slotStatus = useMemo(() => {
    const matchingDateReservations = activeReservations.filter(
      (r) => r.reservation_date === reservationDate && r.status !== "Cancelled"
    );

    // Cek apakah meja ini sudah dibooking orang pada rentang jam ini
    const tableConflict = matchingDateReservations.find(
      (r) => r.table_id === tableId && doOverlap(r.session_time, currentSessionTime)
    );

    if (tableConflict) {
      return {
        available: false,
        reason: "Meja Sudah Dipesan",
        detail: `Meja ini sudah direservasi pada rentang jam ${tableConflict.session_time}.`
      };
    }

    // Cek apakah stok game ini sudah habis dipinjam di meja lain pada jam yang sama
    if (chosenGame) {
      const gameBookedCount = matchingDateReservations.filter((r) => {
        const matchGame =
          (r.game_title && r.game_title.toLowerCase() === chosenGame.title.toLowerCase()) ||
          (r.customer_name && r.customer_name.toLowerCase().includes(chosenGame.title.toLowerCase()));
        return matchGame && doOverlap(r.session_time, currentSessionTime);
      }).length;

      const gameStock = chosenGame.stock || 2;
      if (gameBookedCount >= gameStock) {
        return {
          available: false,
          reason: "Stok Game Habis",
          detail: `Semua ${gameStock} box game "${chosenGame.title}" sedang dipinjam meja lain pada rentang jam ini.`
        };
      }
    }

    return {
      available: true,
      reason: "Slot Tersedia",
      detail: "Jam dan meja ini siap dipesan."
    };
  }, [activeReservations, reservationDate, tableId, chosenGame, currentSessionTime]);

  // Langkah 1: Validasi form sebelum masuk ke modal pembayaran
  const handleProceedToPayment = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert("Perhatian", "Silakan isi nama pemesan dan nomor WhatsApp Anda.");
      return;
    }

    const count = parseInt(guestCount, 10);
    if (isNaN(count) || count < 1 || count > capacity) {
      Alert.alert("Perhatian", `Jumlah pemain harus antara 1 sampai ${capacity} orang.`);
      return;
    }

    if (!slotStatus.available) {
      Alert.alert(
        "Slot Penuh ❌",
        `${slotStatus.detail}\n\nSilakan pilih jam mulai atau durasi lain yang masih kosong.`
      );
      return;
    }

    // Buka Modal Pembayaran
    setPaymentModalVisible(true);
  };

  // Salin nomor rekening ke clipboard simulated
  const handleCopyAccount = (bankName, accountNum) => {
    Alert.alert(
      "Nomor Rekening Disalin ✓",
      `Nomor rekening ${bankName} (${accountNum}) atas nama MeepleCafe / Lanjar Setiawan telah disalin ke clipboard Anda!`
    );
  };

  // Langkah 2: Konfirmasi Pembayaran dan Buat Tiket Reservasi
  const handleConfirmPaymentAndCreateTicket = async () => {
    try {
      setLoading(true);
      const count = parseInt(guestCount, 10) || capacity;
      const gameTitle = chosenGame ? chosenGame.title : "General Play";
      const gameId = chosenGame ? chosenGame.id : null;

      let paymentMethodName = "Transfer BCA";
      if (selectedPaymentMethod === "mandiri") paymentMethodName = "Transfer Mandiri";
      else if (selectedPaymentMethod === "qris") paymentMethodName = "QRIS Instant";
      else if (selectedPaymentMethod === "cash") paymentMethodName = "Bayar di Kasir";

      // Simpan metadata lengkap di customer_name secara aman
      const combinedName = `${customerName.trim()} [Game: ${gameTitle}] [Total: ${formatRupiah(
        totalPrice
      )}] [Metode: ${paymentMethodName}]`;

      const payload = {
        customer_name: combinedName,
        customer_phone: customerPhone.trim(),
        table_id: tableId,
        reservation_date: reservationDate,
        session_time: currentSessionTime,
        guest_count: count,
        game_title: gameTitle,
        game_id: gameId
      };

      const result = await ApiService.createReservation(payload);
      setPaymentModalVisible(false);

      Alert.alert(
        "Pembayaran Dikonfirmasi & Tiket Terbit! 🎉",
        `Kode Booking: ${result.booking_code}\n\n` +
          `🎲 Board Game: ${gameTitle}\n` +
          `🪑 Meja: ${tableType} (Meja ${tableNumber})\n` +
          `⏱️ Waktu: ${currentSessionTime}\n` +
          `💳 Total Bayar: ${formatRupiah(totalPrice)} (${paymentMethodName})\n\n` +
          `Tiket Anda telah aktif! Anda dapat melihatnya langsung di menu Tiket Saya.`,
        [
          {
            text: "Buka Tiket Saya",
            onPress: () => {
              navigation.popToTop();
              navigation.navigate("TicketsTab");
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert(
        "Gagal Memproses Reservasi",
        err.message || "Terjadi kesalahan saat memproses tiket. Silakan coba lagi."
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
        <Text style={styles.summaryHeader}>Ringkasan Paket Meja & Game</Text>

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
            <Text style={styles.priceSubText}>
              Tarif: {formatRupiah(numericPricePerHour)} / Jam
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

      {/* PEMILIHAN JAM MULAI (PER 1 JAM) */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Pilih Jam Mulai Bermain (Tiap 1 Jam) *</Text>
          {checkingAvailability && (
            <Text style={styles.checkingText}>Memeriksa ketersediaan...</Text>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {startHourOptions.map((hour) => {
            const isSelected = startHour === hour;
            const hourLabel = `${String(hour).padStart(2, "0")}.00`;
            return (
              <TouchableOpacity
                key={hour}
                style={[styles.hourChip, isSelected && styles.hourChipActive]}
                onPress={() => setStartHour(hour)}
              >
                <Text style={[styles.hourChipText, isSelected && styles.hourChipTextActive]}>
                  {hourLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* PEMILIHAN DURASI BERMAIN (BISA PILIH > 1 JAM) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pilih Durasi Bermain (Bisa Lebih Dari 1 Jam) *</Text>
        <View style={styles.durationRow}>
          {durationOptions.map((dur) => {
            const isSelected = durationHours === dur;
            return (
              <TouchableOpacity
                key={dur}
                style={[styles.durationChip, isSelected && styles.durationChipActive]}
                onPress={() => setDurationHours(dur)}
              >
                <Text
                  style={[styles.durationChipText, isSelected && styles.durationChipTextActive]}
                >
                  {dur} Jam
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Live Slot Preview & Status Bentrok */}
        <View
          style={[
            styles.slotStatusBox,
            slotStatus.available ? styles.slotBoxAvailable : styles.slotBoxBooked
          ]}
        >
          <View style={styles.slotStatusLeft}>
            <Ionicons
              name={slotStatus.available ? "checkmark-circle" : "alert-circle"}
              size={20}
              color={slotStatus.available ? colors.success : colors.accent}
            />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={styles.slotTimeText}>
                Waktu Booking: {currentSessionTime}
              </Text>
              <Text
                style={[
                  styles.slotStatusSubText,
                  { color: slotStatus.available ? "#166534" : "#991B1B" }
                ]}
              >
                {slotStatus.available
                  ? "✓ Meja & game siap direservasi pada jam ini."
                  : `⚠️ ${slotStatus.detail}`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Jumlah Orang */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Jumlah Pemain (Orang) *</Text>
        <TextInput
          style={styles.input}
          placeholder={`Maksimal ${capacity} Orang`}
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={guestCount}
          onChangeText={setGuestCount}
        />
      </View>

      {/* KARTU RINCIAN TOTAL BAYAR */}
      <View style={styles.billingCard}>
        <View style={styles.billingHeaderRow}>
          <Ionicons name="receipt-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.billingTitle}>Rincian Biaya Reservasi</Text>
        </View>

        <View style={styles.billingRow}>
          <Text style={styles.billingLabel}>
            Sewa {tableType} ({durationHours} Jam x {formatRupiah(numericPricePerHour)}):
          </Text>
          <Text style={styles.billingValue}>{formatRupiah(totalPrice)}</Text>
        </View>

        <View style={styles.billingRow}>
          <Text style={styles.billingLabel}>Peminjaman Board Game ({chosenGame?.title}):</Text>
          <Text style={[styles.billingValue, { color: colors.success }]}>GRATIS</Text>
        </View>

        <View style={styles.billingRow}>
          <Text style={styles.billingLabel}>Free Snack & Wi-Fi Kafe:</Text>
          <Text style={[styles.billingValue, { color: colors.success }]}>GRATIS</Text>
        </View>

        <View style={styles.billingDivider} />

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>TOTAL PEMBAYARAN</Text>
            <Text style={styles.totalSub}>Tarif pasti tanpa biaya tambahan</Text>
          </View>
          <Text style={styles.totalValue}>{formatRupiah(totalPrice)}</Text>
        </View>
      </View>

      {/* Tombol Lanjut ke Pembayaran */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!slotStatus.available || loading) && styles.submitButtonDisabled
        ]}
        onPress={handleProceedToPayment}
        disabled={!slotStatus.available || loading}
        activeOpacity={0.85}
      >
        <Ionicons name="wallet-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.submitButtonText}>
          Bayar {formatRupiah(totalPrice)} & Dapatkan Tiket
        </Text>
      </TouchableOpacity>

      {/* MODAL SISTEM PEMBAYARAN TRANSFER & QRIS */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Pembayaran Reservasi</Text>
                <Text style={styles.modalSub}>Selesaikan pembayaran untuk menerbitkan tiket</Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Box Total Tagihan Modal */}
              <View style={styles.modalTotalBox}>
                <Text style={styles.modalTotalLabel}>Total Yang Harus Ditransfer:</Text>
                <Text style={styles.modalTotalAmount}>{formatRupiah(totalPrice)}</Text>
                <Text style={styles.modalTotalDesc}>
                  Untuk {durationHours} Jam Bermain ({currentSessionTime})
                </Text>
              </View>

              <Text style={styles.paymentSectionTitle}>Pilih Metode Pembayaran:</Text>

              {/* Opsi 1: BCA */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionCard,
                  selectedPaymentMethod === "bca" && styles.paymentOptionActive
                ]}
                onPress={() => setSelectedPaymentMethod("bca")}
              >
                <View style={styles.paymentLeft}>
                  <View style={styles.bankLogoBadge}>
                    <Text style={styles.bankLogoText}>BCA</Text>
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.bankName}>Bank Central Asia (BCA)</Text>
                    <Text style={styles.accountNumber}>8410293812</Text>
                    <Text style={styles.accountHolder}>a.n. MeepleCafe / Lanjar Setiawan</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => handleCopyAccount("BCA", "8410293812")}
                >
                  <Ionicons name="copy-outline" size={14} color={colors.primary} />
                  <Text style={styles.copyBtnText}>Salin</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Opsi 2: Mandiri */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionCard,
                  selectedPaymentMethod === "mandiri" && styles.paymentOptionActive
                ]}
                onPress={() => setSelectedPaymentMethod("mandiri")}
              >
                <View style={styles.paymentLeft}>
                  <View style={[styles.bankLogoBadge, { backgroundColor: "#1E3A8A" }]}>
                    <Text style={styles.bankLogoText}>MDR</Text>
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.bankName}>Bank Mandiri</Text>
                    <Text style={styles.accountNumber}>1370019283741</Text>
                    <Text style={styles.accountHolder}>a.n. MeepleCafe / Lanjar Setiawan</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => handleCopyAccount("Mandiri", "1370019283741")}
                >
                  <Ionicons name="copy-outline" size={14} color={colors.primary} />
                  <Text style={styles.copyBtnText}>Salin</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Opsi 3: QRIS */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionCard,
                  selectedPaymentMethod === "qris" && styles.paymentOptionActive
                ]}
                onPress={() => setSelectedPaymentMethod("qris")}
              >
                <View style={styles.paymentLeft}>
                  <View style={[styles.bankLogoBadge, { backgroundColor: "#DC2626" }]}>
                    <Text style={styles.bankLogoText}>QRIS</Text>
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.bankName}>QRIS Instant</Text>
                    <Text style={styles.accountHolder}>Gopay / ShopeePay / OVO / Dana / BCA QR</Text>
                  </View>
                </View>
                {selectedPaymentMethod === "qris" && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* Box Tampilan Kode QR jika QRIS dipilih */}
              {selectedPaymentMethod === "qris" && (
                <View style={styles.qrisBox}>
                  <Ionicons name="qr-code" size={120} color={colors.text} />
                  <Text style={styles.qrisInstruction}>
                    Scan QRIS ini menggunakan aplikasi E-Wallet atau Mobile Banking Anda.
                  </Text>
                </View>
              )}

              {/* Opsi 4: Bayar di Kasir (Cash) */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionCard,
                  selectedPaymentMethod === "cash" && styles.paymentOptionActive
                ]}
                onPress={() => setSelectedPaymentMethod("cash")}
              >
                <View style={styles.paymentLeft}>
                  <View style={[styles.bankLogoBadge, { backgroundColor: "#059669" }]}>
                    <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.bankName}>Bayar di Kasir (Cash / Tunai)</Text>
                    <Text style={styles.accountHolder}>Bayar langsung saat kedatangan di cafe</Text>
                  </View>
                </View>
                {selectedPaymentMethod === "cash" && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* Instruksi & Petunjuk Transfer */}
              <View style={styles.noticeBox}>
                <Ionicons name="information-circle" size={18} color={colors.secondary} />
                <Text style={styles.noticeText}>
                  Silakan transfer tepat sejumlah {formatRupiah(totalPrice)}. Setelah transfer selesai,
                  tekan tombol konfirmasi di bawah untuk menerbitkan tiket resmi Anda.
                </Text>
              </View>

              {/* Tombol Konfirmasi Pembayaran */}
              <TouchableOpacity
                style={[styles.confirmPayButton, loading && styles.submitButtonDisabled]}
                onPress={handleConfirmPaymentAndCreateTicket}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmPayButtonText}>
                      Saya Sudah Transfer (Konfirmasi Tiket)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  priceSubText: {
    fontSize: 11,
    color: colors.secondary,
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
    marginBottom: 8
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8
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
  chipScroll: {
    flexDirection: "row",
    paddingVertical: 4
  },
  hourChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8
  },
  hourChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  hourChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  hourChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  durationChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 3
  },
  durationChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  durationChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text
  },
  durationChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  slotStatusBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    marginTop: 4
  },
  slotBoxAvailable: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0"
  },
  slotBoxBooked: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA"
  },
  slotStatusLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  slotTimeText: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.text
  },
  slotStatusSubText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500"
  },
  billingCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  billingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  billingTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.primaryDark,
    marginLeft: 6,
    textTransform: "uppercase"
  },
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  billingLabel: {
    fontSize: 12,
    color: colors.textMuted
  },
  billingValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text
  },
  billingDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.text
  },
  totalSub: {
    fontSize: 10,
    color: colors.textMuted
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 3
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
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
    padding: 20
  },
  paymentModalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
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
  modalTotalBox: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E0E7FF"
  },
  modalTotalLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primaryDark,
    textTransform: "uppercase"
  },
  modalTotalAmount: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.primaryDark,
    marginVertical: 4
  },
  modalTotalDesc: {
    fontSize: 11,
    color: colors.primary
  },
  paymentSectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 10
  },
  paymentOptionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  paymentOptionActive: {
    borderColor: colors.primary,
    backgroundColor: "#F8FAFC"
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  bankLogoBadge: {
    width: 44,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#005BAA",
    justifyContent: "center",
    alignItems: "center"
  },
  bankLogoText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold"
  },
  bankName: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.text
  },
  accountNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primaryDark,
    letterSpacing: 0.5,
    marginTop: 2
  },
  accountHolder: {
    fontSize: 10,
    color: colors.textMuted
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.primary,
    marginLeft: 4
  },
  qrisBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12
  },
  qrisInstruction: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0FDFA",
    padding: 12,
    borderRadius: 10,
    marginVertical: 12
  },
  noticeText: {
    fontSize: 11,
    color: "#0F766E",
    marginLeft: 8,
    flex: 1,
    lineHeight: 16
  },
  confirmPayButton: {
    backgroundColor: colors.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 3,
    marginTop: 4
  },
  confirmPayButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
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
