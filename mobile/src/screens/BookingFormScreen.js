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

// Jam operasional kafe: Buka jam 10.00, Tutup jam 21.00 (9 malam)
const OPENING_HOUR = 10;
const CLOSING_HOUR = 21;

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

// Helper tanggal YYYY-MM-DD
function getFormattedDate(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

  const todayStr = useMemo(() => getFormattedDate(0), []);
  const currentNow = new Date();
  const currentHourNow = currentNow.getHours();

  // Jika hari ini sudah jam 20.00 ke atas (kafe tutup jam 21.00), default otomatis ke Besok
  const initialDate = currentHourNow >= 20 ? getFormattedDate(1) : todayStr;

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [reservationDate, setReservationDate] = useState(initialDate);

  // Daftar opsi jam mulai (10.00 sampai 20.00)
  const startHourOptions = useMemo(() => {
    const hours = [];
    for (let h = OPENING_HOUR; h < CLOSING_HOUR; h++) {
      hours.push(h);
    }
    return hours;
  }, []);

  // Hitung jam mulai default yang valid (belum lewat)
  const initialStartHour = useMemo(() => {
    if (reservationDate === todayStr) {
      const nextHour = startHourOptions.find((h) => h > currentHourNow);
      return nextHour || 14;
    }
    return 14;
  }, [reservationDate, todayStr, currentHourNow, startHourOptions]);

  const [startHour, setStartHour] = useState(initialStartHour);
  const [durationHours, setDurationHours] = useState(2); // default 2 Jam

  const [guestCount, setGuestCount] = useState(String(Math.min(4, capacity)));
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // State Board Game
  const [chosenGame, setChosenGame] = useState(selectedGame || null);
  const [allGames, setAllGames] = useState([]);
  const [gamePickerVisible, setGamePickerVisible] = useState(false);
  const [gameSearchQuery, setGameSearchQuery] = useState("");

  // Modal Sistem Pembayaran
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("bca");

  // Modal Popup Sukses Pasca Pembayaran (Custom Ticket Confirmation)
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [issuedTicket, setIssuedTicket] = useState(null);

  // Data reservasi aktif dari database
  const [activeReservations, setActiveReservations] = useState([]);

  // Cek apakah tanggal yang dipilih adalah hari ini
  const isSelectedDateToday = reservationDate === todayStr;

  // Pengecekan apakah jam tertentu sudah lewat untuk hari ini
  const isHourPassed = (hour) => {
    if (!isSelectedDateToday) return false;
    const now = new Date();
    return now.getHours() >= hour;
  };

  const isAllTodayPassed = isSelectedDateToday && currentHourNow >= 20;

  // Sesuaikan startHour saat tanggal berganti
  useEffect(() => {
    if (isSelectedDateToday) {
      const nextH = startHourOptions.find((h) => !isHourPassed(h));
      if (nextH) {
        setStartHour(nextH);
      }
    }
  }, [reservationDate, isSelectedDateToday]);

  // Durasi maksimal yang diizinkan agar tidak melebihi jam 21.00 (tutup kafe)
  const maxAllowedDuration = Math.max(1, CLOSING_HOUR - startHour);
  const availableDurations = useMemo(() => {
    const list = [];
    const limit = Math.min(5, maxAllowedDuration);
    for (let d = 1; d <= limit; d++) {
      list.push(d);
    }
    return list;
  }, [maxAllowedDuration]);

  // Sesuaikan durasi secara otomatis jika jam mulai berubah mendekati jam tutup
  useEffect(() => {
    if (durationHours > maxAllowedDuration) {
      setDurationHours(maxAllowedDuration);
    }
  }, [startHour, maxAllowedDuration]);

  // Hitung jam selesai & label waktu
  const endHour = Math.min(CLOSING_HOUR, startHour + durationHours);
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

  // 1. Load daftar game
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

  // 2. Ambil seluruh data reservasi dari database untuk cek bentrok
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

  // Cek ketersediaan untuk setiap slot jam individu (indikator grid)
  const isHourBusyForTable = (hour) => {
    const slotString = `${String(hour).padStart(2, "0")}.00 - ${String(hour + 1).padStart(2, "0")}.00 (1 Jam)`;
    return activeReservations.some(
      (r) =>
        r.reservation_date === reservationDate &&
        r.status !== "Cancelled" &&
        r.table_id === tableId &&
        doOverlap(r.session_time, slotString)
    );
  };

  // Cek ketersediaan slot untuk rentang jam yang dipilih
  const slotStatus = useMemo(() => {
    if (isHourPassed(startHour)) {
      return {
        available: false,
        reason: "Jam Sudah Terlewati",
        detail: `Pukul ${startFormatted} sudah lewat untuk hari ini. Silakan pilih jam berikutnya atau pilih tanggal besok.`
      };
    }

    const matchingDateReservations = activeReservations.filter(
      (r) => r.reservation_date === reservationDate && r.status !== "Cancelled"
    );

    // Bentrok meja
    const tableConflict = matchingDateReservations.find(
      (r) => r.table_id === tableId && doOverlap(r.session_time, currentSessionTime)
    );

    if (tableConflict) {
      return {
        available: false,
        reason: "Meja Sedang Dipesan",
        detail: `Meja ${tableNumber} telah direservasi pelanggan lain pada rentang jam ${tableConflict.session_time}.`
      };
    }

    // Stok game
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
  }, [
    activeReservations,
    reservationDate,
    tableId,
    chosenGame,
    currentSessionTime,
    tableNumber,
    startHour,
    startFormatted,
    isSelectedDateToday
  ]);

  // Validasi sebelum membuka modal pembayaran
  const handleProceedToPayment = () => {
    if (!customerName.trim()) {
      Alert.alert("Data Belum Lengkap", "Silakan masukkan nama pemesan Anda.");
      return;
    }

    if (!customerPhone.trim()) {
      Alert.alert("Data Belum Lengkap", "Silakan masukkan nomor WhatsApp / HP Anda.");
      return;
    }

    const count = parseInt(guestCount, 10);
    if (isNaN(count) || count < 1 || count > capacity) {
      Alert.alert("Perhatian", `Jumlah pemain harus antara 1 sampai ${capacity} orang.`);
      return;
    }

    if (!slotStatus.available) {
      Alert.alert(
        "Jadwal Tidak Tersedia",
        `${slotStatus.detail}\n\nSilakan pilih jam mulai atau durasi lain yang masih kosong.`
      );
      return;
    }

    // Buka Modal Pembayaran
    setPaymentModalVisible(true);
  };

  const handleCopyAccount = (bankName, accountNum) => {
    Alert.alert(
      "Nomor Rekening Disalin",
      `Nomor rekening ${bankName} (${accountNum}) a.n. MeepleCafe / Lanjar Setiawan berhasil disalin.`
    );
  };

  // Konfirmasi Pembayaran dan Buat Tiket Reservasi
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

      // Format metadata
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

      // Simpan data tiket untuk ditampilkan di Popup Custom Tiket
      setIssuedTicket({
        bookingCode: result.booking_code,
        customerName: customerName.trim(),
        guestCount: count,
        gameTitle: gameTitle,
        tableType: tableType,
        tableNumber: tableNumber,
        reservationDate: reservationDate,
        sessionTime: currentSessionTime,
        totalPrice: totalPrice,
        paymentMethod: paymentMethodName
      });
      setSuccessModalVisible(true);
    } catch (err) {
      Alert.alert(
        "Gagal Memproses Reservasi",
        err.message || "Terjadi kendala saat menerbitkan tiket. Silakan coba kembali."
      );
      refreshAvailability();
    } finally {
      setLoading(false);
    }
  };

  // Filter daftar game di modal picker
  const filteredPickerGames = allGames.filter((g) =>
    g.title.toLowerCase().includes(gameSearchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 1. Paket Bermain (Meja + Board Game) */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionHeaderLabel}>Paket Bermain</Text>

        {/* Board Game Row */}
        <View style={styles.packageRow}>
          <View style={[styles.packageIconBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="cube" size={22} color={colors.primary} />
          </View>
          <View style={styles.packageInfo}>
            <Text style={styles.packageSub}>Board Game Pilihan</Text>
            <Text style={styles.packageTitle}>{chosenGame ? chosenGame.title : "Pilih Game"}</Text>
            <Text style={styles.packageStock}>
              Stok Kafe: {chosenGame?.stock || 2} Box Original
            </Text>
          </View>
          <TouchableOpacity
            style={styles.packageActionBtn}
            onPress={() => setGamePickerVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.packageActionBtnText}>Ganti</Text>
          </TouchableOpacity>
        </View>

        {/* Meja Row */}
        <View style={[styles.packageRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          <View style={[styles.packageIconBox, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="restaurant" size={22} color="#2563EB" />
          </View>
          <View style={styles.packageInfo}>
            <Text style={styles.packageSub}>Meja Kafe</Text>
            <Text style={styles.packageTitle}>
              {tableType} (Meja {tableNumber})
            </Text>
            <Text style={styles.packageRate}>
              Kapasitas {capacity} Orang • {formatRupiah(numericPricePerHour)} / jam
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Informasi Pemesan */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionHeaderLabel}>Data Pemesan</Text>

        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>Nama Lengkap *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: Lanjar Setiawan"
            placeholderTextColor={colors.textMuted}
            value={customerName}
            onChangeText={setCustomerName}
          />
        </View>

        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>Nomor WhatsApp / HP *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: 081234567890"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={customerPhone}
            onChangeText={setCustomerPhone}
          />
        </View>

        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>Jumlah Pemain *</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`Maksimal ${capacity} Orang`}
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={guestCount}
            onChangeText={setGuestCount}
          />
        </View>
      </View>

      {/* 3. Jadwal & Waktu Main */}
      <View style={styles.cardSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderLabel}>Jadwal Reservasi</Text>
          <Text style={styles.operatingHoursText}>Kafe Buka 10.00 - 21.00</Text>
        </View>

        {/* Pemilihan Tanggal Cepat */}
        <Text style={styles.inputLabel}>Pilih Tanggal Bermain</Text>
        <View style={styles.datePillsRow}>
          {[
            { label: "Hari Ini", date: getFormattedDate(0) },
            { label: "Besok", date: getFormattedDate(1) },
            { label: "Lusa", date: getFormattedDate(2) }
          ].map((dp) => {
            const isSelected = reservationDate === dp.date;
            return (
              <TouchableOpacity
                key={dp.date}
                style={[styles.datePill, isSelected && styles.datePillActive]}
                onPress={() => setReservationDate(dp.date)}
              >
                <Text style={[styles.datePillText, isSelected && styles.datePillTextActive]}>
                  {dp.label}
                </Text>
                <Text style={[styles.datePillSub, isSelected && styles.datePillSubActive]}>
                  {dp.date.slice(5)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notifikasi jika jam operasional hari ini sudah tutup */}
        {isAllTodayPassed && (
          <View style={styles.todayClosedNotice}>
            <Ionicons name="time-outline" size={16} color={colors.warningText} />
            <Text style={styles.todayClosedNoticeText}>
              Jam operasional hari ini sudah lewat (Kafe tutup pukul 21.00). Silakan pilih tanggal Besok.
            </Text>
          </View>
        )}

        {/* Input Tanggal Manual */}
        <TextInput
          style={[styles.textInput, { marginTop: 8, marginBottom: 18 }]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          value={reservationDate}
          onChangeText={setReservationDate}
        />

        {/* PILIHAN JAM MULAI (GRID 3 KOLOM, CENTER ALIGNED) */}
        <View style={styles.labelWithSubRow}>
          <Text style={styles.inputLabel}>Pilih Jam Mulai Bermain</Text>
          <Text style={styles.labelSubText}>Tiap 1 Jam</Text>
        </View>

        <View style={styles.hourGrid}>
          {startHourOptions.map((hour) => {
            const isSelected = startHour === hour;
            const isPassed = isHourPassed(hour);
            const isBusy = !isPassed && isHourBusyForTable(hour);
            const hourLabel = `${String(hour).padStart(2, "0")}.00`;

            return (
              <TouchableOpacity
                key={hour}
                activeOpacity={0.75}
                disabled={isPassed}
                style={[
                  styles.hourGridItem,
                  isSelected && styles.hourGridItemActive,
                  isPassed && styles.hourGridItemPassed,
                  isBusy && !isSelected && styles.hourGridItemBusy
                ]}
                onPress={() => {
                  if (isPassed) {
                    Alert.alert(
                      "Jam Sudah Terlewati",
                      "Jam ini sudah lewat untuk hari ini. Silakan pilih jam berikutnya atau pilih tanggal besok."
                    );
                    return;
                  }
                  setStartHour(hour);
                }}
              >
                <Text
                  style={[
                    styles.hourGridText,
                    isSelected && styles.hourGridTextActive,
                    (isPassed || isBusy) && !isSelected && styles.hourGridTextMuted
                  ]}
                >
                  {hourLabel}
                </Text>
                <View style={styles.hourStatusRow}>
                  <View
                    style={[
                      styles.dotIndicator,
                      isSelected
                        ? { backgroundColor: "#FFFFFF" }
                        : isPassed
                        ? { backgroundColor: "#CBD5E1" }
                        : isBusy
                        ? { backgroundColor: colors.danger }
                        : { backgroundColor: colors.success }
                    ]}
                  />
                  <Text
                    style={[
                      styles.hourGridSub,
                      isSelected
                        ? { color: "#FFFFFF" }
                        : isPassed
                        ? { color: "#94A3B8" }
                        : isBusy
                        ? { color: colors.dangerText }
                        : { color: colors.successText }
                    ]}
                  >
                    {isPassed ? "Lewat" : isBusy ? "Dipesan" : "Tersedia"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* PILIHAN DURASI BERMAIN */}
        <View style={[styles.labelWithSubRow, { marginTop: 18 }]}>
          <Text style={styles.inputLabel}>Durasi Main</Text>
          <Text style={styles.labelSubText}>Maksimal s/d 21.00 (Tutup)</Text>
        </View>

        <View style={styles.durationSegmentRow}>
          {availableDurations.map((dur) => {
            const isSelected = durationHours === dur;
            return (
              <TouchableOpacity
                key={dur}
                style={[styles.durationSegment, isSelected && styles.durationSegmentActive]}
                onPress={() => setDurationHours(dur)}
              >
                <Text
                  style={[
                    styles.durationSegmentText,
                    isSelected && styles.durationSegmentTextActive
                  ]}
                >
                  {dur} Jam
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* RINGKASAN WAKTU BOOKING */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleCardHeader}>
            <View style={styles.scheduleTimeCol}>
              <Text style={styles.scheduleTimeTitle}>
                {startFormatted} — {endFormatted} WIB
              </Text>
              <Text style={styles.scheduleMeta}>
                Durasi {durationHours} Jam • Kafe tutup pukul 21.00
              </Text>
            </View>

            <View
              style={[
                styles.statusBadgeClean,
                slotStatus.available ? styles.statusBadgeCleanAvailable : styles.statusBadgeCleanBusy
              ]}
            >
              <View
                style={[
                  styles.statusDotClean,
                  { backgroundColor: slotStatus.available ? colors.success : colors.danger }
                ]}
              />
              <Text
                style={[
                  styles.statusBadgeCleanText,
                  { color: slotStatus.available ? colors.successText : colors.dangerText }
                ]}
              >
                {slotStatus.available ? "Tersedia" : "Penuh"}
              </Text>
            </View>
          </View>

          {!slotStatus.available && (
            <View style={styles.conflictNotice}>
              <Ionicons name="information-circle" size={16} color={colors.danger} />
              <Text style={styles.conflictNoticeText}>{slotStatus.detail}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 4. Rincian Total Bayar */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionHeaderLabel}>Rincian Pembayaran</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceRowLabel}>
            Sewa {tableType} ({durationHours} Jam x {formatRupiah(numericPricePerHour)}):
          </Text>
          <Text style={styles.priceRowValue}>{formatRupiah(totalPrice)}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceRowLabel}>Peminjaman {chosenGame?.title || "Board Game"}:</Text>
          <Text style={[styles.priceRowValue, { color: colors.successText, fontWeight: "bold" }]}>
            GRATIS
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceRowLabel}>Fasilitas Wi-Fi & Bantuan Game Master:</Text>
          <Text style={[styles.priceRowValue, { color: colors.successText, fontWeight: "bold" }]}>
            GRATIS
          </Text>
        </View>

        <View style={styles.priceDivider} />

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>TOTAL BAYAR</Text>
            <Text style={styles.totalSub}>Tarif sewa meja bersih</Text>
          </View>
          <Text style={styles.totalValue}>{formatRupiah(totalPrice)}</Text>
        </View>
      </View>

      {/* Tombol Lanjut ke Pembayaran */}
      <TouchableOpacity
        style={[
          styles.mainActionBtn,
          !slotStatus.available && styles.mainActionBtnDisabled
        ]}
        onPress={handleProceedToPayment}
        activeOpacity={0.88}
      >
        <Ionicons name="wallet-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.mainActionBtnText}>
          {slotStatus.available
            ? `Bayar ${formatRupiah(totalPrice)} & Dapatkan Tiket`
            : "Slot Tidak Tersedia — Pilih Jam Lain"}
        </Text>
      </TouchableOpacity>

      {/* MODAL 1: SISTEM PEMBAYARAN TRANSFER & QRIS */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalCard}>
            {/* Sheet Handle */}
            <View style={styles.dragHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Metode Pembayaran</Text>
                <Text style={styles.modalSub}>Transfer ke rekening resmi kafe atau bayar di kasir</Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Total Tagihan Box */}
              <View style={styles.modalBillBox}>
                <Text style={styles.modalBillLabel}>TOTAL TAGIHAN RESERVASI</Text>
                <Text style={styles.modalBillAmount}>{formatRupiah(totalPrice)}</Text>
                <Text style={styles.modalBillSub}>
                  {tableType} ({tableNumber}) • {durationHours} Jam ({currentSessionTime})
                </Text>
              </View>

              <Text style={styles.paymentGroupTitle}>Pilih Rekening Tujuan Transfer:</Text>

              {/* Opsi 1: BCA */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === "bca" && styles.paymentMethodCardActive
                ]}
                onPress={() => setSelectedPaymentMethod("bca")}
                activeOpacity={0.85}
              >
                <View style={styles.paymentMethodLeft}>
                  <View style={[styles.bankBadge, { backgroundColor: "#005BAA" }]}>
                    <Text style={styles.bankBadgeText}>BCA</Text>
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.bankName}>Bank Central Asia</Text>
                    <Text style={styles.bankAccount}>8410293812</Text>
                    <Text style={styles.bankHolder}>a.n. MeepleCafe / Lanjar Setiawan</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => handleCopyAccount("BCA", "8410293812")}
                >
                  <Ionicons name="copy-outline" size={13} color={colors.primary} />
                  <Text style={styles.copyBtnText}>Salin</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Opsi 2: Mandiri */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === "mandiri" && styles.paymentMethodCardActive
                ]}
                onPress={() => setSelectedPaymentMethod("mandiri")}
                activeOpacity={0.85}
              >
                <View style={styles.paymentMethodLeft}>
                  <View style={[styles.bankBadge, { backgroundColor: "#002776" }]}>
                    <Text style={styles.bankBadgeText}>MDR</Text>
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.bankName}>Bank Mandiri</Text>
                    <Text style={styles.bankAccount}>1370019283741</Text>
                    <Text style={styles.bankHolder}>a.n. MeepleCafe / Lanjar Setiawan</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => handleCopyAccount("Mandiri", "1370019283741")}
                >
                  <Ionicons name="copy-outline" size={13} color={colors.primary} />
                  <Text style={styles.copyBtnText}>Salin</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Opsi 3: QRIS */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === "qris" && styles.paymentMethodCardActive
                ]}
                onPress={() => setSelectedPaymentMethod("qris")}
                activeOpacity={0.85}
              >
                <View style={styles.paymentMethodLeft}>
                  <View style={[styles.bankBadge, { backgroundColor: "#ED1C24" }]}>
                    <Text style={styles.bankBadgeText}>QRIS</Text>
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.bankName}>QRIS Instant</Text>
                    <Text style={styles.bankHolder}>Gopay / ShopeePay / OVO / Dana / BCA</Text>
                  </View>
                </View>
                {selectedPaymentMethod === "qris" ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                ) : (
                  <View style={styles.radioOutline} />
                )}
              </TouchableOpacity>

              {selectedPaymentMethod === "qris" && (
                <View style={styles.qrisDisplayCard}>
                  <View style={styles.qrisHeader}>
                    <Text style={styles.qrisHeaderTitle}>QRIS PEMBAYARAN MEEPLECAFE</Text>
                  </View>
                  <Ionicons name="qr-code" size={130} color={colors.secondary} style={{ marginVertical: 8 }} />
                  <Text style={styles.qrisDesc}>
                    Scan kode QRIS ini dari aplikasi m-banking atau e-wallet Anda untuk transfer instan.
                  </Text>
                </View>
              )}

              {/* Opsi 4: Bayar di Kasir (Cash) */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === "cash" && styles.paymentMethodCardActive
                ]}
                onPress={() => setSelectedPaymentMethod("cash")}
                activeOpacity={0.85}
              >
                <View style={styles.paymentMethodLeft}>
                  <View style={[styles.bankBadge, { backgroundColor: "#059669" }]}>
                    <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.bankName}>Bayar di Kasir (Cash / Tunai)</Text>
                    <Text style={styles.bankHolder}>Bayar langsung di kasir kafe saat kedatangan</Text>
                  </View>
                </View>
                {selectedPaymentMethod === "cash" ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                ) : (
                  <View style={styles.radioOutline} />
                )}
              </TouchableOpacity>

              {/* Petunjuk Konfirmasi */}
              <View style={styles.transferGuideBox}>
                <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                <Text style={styles.transferGuideText}>
                  Setelah melakukan pembayaran sejumlah {formatRupiah(totalPrice)}, tekan tombol di bawah untuk langsung menerbitkan tiket Anda.
                </Text>
              </View>

              {/* Tombol Konfirmasi Pembayaran */}
              <TouchableOpacity
                style={[styles.confirmPaymentBtn, loading && { opacity: 0.6 }]}
                onPress={handleConfirmPaymentAndCreateTicket}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmPaymentBtnText}>
                      Konfirmasi & Terbitkan Tiket
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: POPUP SUKSES PEMBELIAN TIKET (CUSTOM VIP TICKET PASS) */}
      <Modal visible={successModalVisible} animationType="fade" transparent>
        <View style={styles.successModalOverlay}>
          <View style={styles.ticketPassCard}>
            {/* Ticket Pass Header: Dark Navy Slate */}
            <View style={styles.passHeader}>
              <View style={styles.passTopBadge}>
                <Ionicons name="ticket" size={13} color={colors.warning} style={{ marginRight: 5 }} />
                <Text style={styles.passTopBadgeText}>TIKET RESMI BERHASIL TERBIT</Text>
              </View>

              <View style={styles.passIconCircle}>
                <Ionicons name="checkmark-circle" size={34} color={colors.primary} />
              </View>

              <Text style={styles.passHeading}>Pembayaran Terkonfirmasi</Text>
              <Text style={styles.passBookingLabel}>KODE BOOKING</Text>
              <Text style={styles.passBookingCode}>{issuedTicket?.bookingCode}</Text>
            </View>

            {/* Perforated Divider */}
            <View style={styles.passDividerRow}>
              <View style={styles.passCutoutLeft} />
              <View style={styles.passDashedLine} />
              <View style={styles.passCutoutRight} />
            </View>

            {/* Ticket Pass Body: Crisp White */}
            <View style={styles.passBody}>
              <View style={styles.passDetailRow}>
                <View style={styles.passCol}>
                  <Text style={styles.passMetaLabel}>Nama Pemesan</Text>
                  <Text style={styles.passMetaValue}>{issuedTicket?.customerName}</Text>
                </View>
                <View style={styles.passColRight}>
                  <Text style={styles.passMetaLabel}>Pemain</Text>
                  <Text style={styles.passMetaValue}>{issuedTicket?.guestCount} Orang</Text>
                </View>
              </View>

              <View style={styles.passDetailRow}>
                <View style={styles.passCol}>
                  <Text style={styles.passMetaLabel}>Meja Kafe</Text>
                  <Text style={styles.passMetaValue}>
                    {issuedTicket?.tableType} ({issuedTicket?.tableNumber})
                  </Text>
                </View>
                <View style={styles.passColRight}>
                  <Text style={styles.passMetaLabel}>Tanggal</Text>
                  <Text style={styles.passMetaValue}>{issuedTicket?.reservationDate}</Text>
                </View>
              </View>

              <View style={styles.passGameBox}>
                <Ionicons name="cube" size={18} color={colors.primary} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.passGameLabel}>Board Game Pilihan</Text>
                  <Text style={styles.passGameTitle}>{issuedTicket?.gameTitle}</Text>
                </View>
              </View>

              <View style={styles.passDetailRow}>
                <View style={styles.passCol}>
                  <Text style={styles.passMetaLabel}>Jadwal Sesi</Text>
                  <Text style={styles.passMetaValue}>{issuedTicket?.sessionTime}</Text>
                </View>
                <View style={styles.passColRight}>
                  <Text style={styles.passMetaLabel}>Metode Bayar</Text>
                  <Text style={styles.passMetaValue}>{issuedTicket?.paymentMethod}</Text>
                </View>
              </View>

              <View style={styles.passTotalBox}>
                <Text style={styles.passTotalLabel}>STATUS PEMBAYARAN</Text>
                <Text style={styles.passTotalValue}>LUNAS • {formatRupiah(issuedTicket?.totalPrice || 0)}</Text>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.passPrimaryBtn}
                activeOpacity={0.88}
                onPress={() => {
                  setSuccessModalVisible(false);
                  navigation.popToTop();
                  navigation.navigate("TicketsTab");
                }}
              >
                <Ionicons name="ticket-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.passPrimaryBtnText}>Buka Tiket Saya</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.passSecondaryBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setSuccessModalVisible(false);
                  navigation.popToTop();
                  navigation.navigate("GameTab");
                }}
              >
                <Text style={styles.passSecondaryBtnText}>Kembali ke Beranda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: PICKER GANTI BOARD GAME (DENGAN SEARCH BAR) */}
      <Modal visible={gamePickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.dragHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Board Game</Text>
              <TouchableOpacity onPress={() => setGamePickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Input di Picker */}
            <View style={styles.pickerSearchRow}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                placeholder="Cari board game..."
                placeholderTextColor={colors.textMuted}
                style={styles.pickerSearchInput}
                value={gameSearchQuery}
                onChangeText={setGameSearchQuery}
              />
              {gameSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setGameSearchQuery("")}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredPickerGames}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.gamePickerRow,
                    chosenGame?.id === item.id && styles.gamePickerRowActive
                  ]}
                  onPress={() => {
                    setChosenGame(item);
                    setGamePickerVisible(false);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.pickerIconBox, chosenGame?.id === item.id && { backgroundColor: colors.primaryLight }]}>
                    <Ionicons
                      name="cube-outline"
                      size={22}
                      color={chosenGame?.id === item.id ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.gamePickerName}>{item.title}</Text>
                    <Text style={styles.gamePickerDesc}>
                      {item.min_players}-{item.max_players} Pemain • Stok: {item.stock || 2} Box
                    </Text>
                  </View>
                  {chosenGame?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
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
  cardSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12
  },
  operatingHoursText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500"
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  packageIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  packageInfo: {
    marginLeft: 12,
    flex: 1
  },
  packageSub: {
    fontSize: 11,
    color: colors.textMuted
  },
  packageTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 2
  },
  packageStock: {
    fontSize: 11,
    color: colors.primaryDark,
    marginTop: 2,
    fontWeight: "600"
  },
  packageRate: {
    fontSize: 11,
    color: "#2563EB",
    marginTop: 2,
    fontWeight: "600"
  },
  packageActionBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  packageActionBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primaryDark
  },
  inputField: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6
  },
  labelWithSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  labelSubText: {
    fontSize: 11,
    color: colors.textMuted
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text
  },
  datePillsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4
  },
  datePill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 3
  },
  datePillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  datePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text
  },
  datePillTextActive: {
    color: colors.primaryDark,
    fontWeight: "bold"
  },
  datePillSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
  },
  datePillSubActive: {
    color: colors.primaryDark
  },
  todayClosedNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningLight,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4
  },
  todayClosedNoticeText: {
    fontSize: 11,
    color: colors.warningText,
    marginLeft: 6,
    flex: 1,
    lineHeight: 16
  },
  hourGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    columnGap: 8,
    rowGap: 10
  },
  hourGridItem: {
    width: "31.5%",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center"
  },
  hourGridItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  hourGridItemBusy: {
    backgroundColor: colors.background,
    borderColor: colors.border
  },
  hourGridItemPassed: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    opacity: 0.5
  },
  hourGridText: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center"
  },
  hourGridTextActive: {
    color: "#FFFFFF"
  },
  hourGridTextMuted: {
    color: colors.textMuted
  },
  hourStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4
  },
  hourGridSub: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center"
  },
  durationSegmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14
  },
  durationSegment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 3
  },
  durationSegmentActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  durationSegmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text
  },
  durationSegmentTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  scheduleCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14
  },
  scheduleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  scheduleTimeCol: {
    flex: 1
  },
  scheduleTimeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text
  },
  scheduleMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3
  },
  statusBadgeClean: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20
  },
  statusBadgeCleanAvailable: {
    backgroundColor: colors.successLight
  },
  statusBadgeCleanBusy: {
    backgroundColor: colors.dangerLight
  },
  statusDotClean: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5
  },
  statusBadgeCleanText: {
    fontSize: 11,
    fontWeight: "bold"
  },
  conflictNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerLight,
    padding: 8,
    borderRadius: 8,
    marginTop: 10
  },
  conflictNoticeText: {
    fontSize: 11,
    color: colors.dangerText,
    marginLeft: 6,
    flex: 1
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  priceRowLabel: {
    fontSize: 12,
    color: colors.textMuted
  },
  priceRowValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text
  },
  priceDivider: {
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
  mainActionBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
    elevation: 3
  },
  mainActionBtnDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.75
  },
  mainActionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end"
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 12
  },
  paymentModalCard: {
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
  modalBillBox: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  modalBillLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDark,
    letterSpacing: 0.8
  },
  modalBillAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primaryDark,
    marginVertical: 4
  },
  modalBillSub: {
    fontSize: 11,
    color: colors.primary
  },
  paymentGroupTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 10
  },
  paymentMethodCard: {
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
  paymentMethodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  bankBadge: {
    width: 44,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center"
  },
  bankBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold"
  },
  bankName: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.text
  },
  bankAccount: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primaryDark,
    letterSpacing: 0.5,
    marginTop: 2
  },
  bankHolder: {
    fontSize: 10,
    color: colors.textMuted
  },
  radioOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
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
  qrisDisplayCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10
  },
  qrisHeader: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6
  },
  qrisHeaderTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.dangerText
  },
  qrisDesc: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 4
  },
  transferGuideBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 10,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  transferGuideText: {
    fontSize: 11,
    color: colors.primaryDark,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16
  },
  confirmPaymentBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 4
  },
  confirmPaymentBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  },

  // STYLES CUSTOM POPUP TIKET PASCA PEMBELIAN (VIP PASS)
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  ticketPassCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }
  },
  passHeader: {
    backgroundColor: colors.darkBg,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center"
  },
  passTopBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10
  },
  passTopBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.warning,
    letterSpacing: 0.8
  },
  passIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8
  },
  passHeading: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 6
  },
  passBookingLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  passBookingCode: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    letterSpacing: 1.5,
    marginTop: 2
  },
  passDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
    backgroundColor: colors.card,
    overflow: "hidden"
  },
  passCutoutLeft: {
    width: 14,
    height: 20,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: "rgba(15, 23, 42, 0.75)"
  },
  passDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed"
  },
  passCutoutRight: {
    width: 14,
    height: 20,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: "rgba(15, 23, 42, 0.75)"
  },
  passBody: {
    padding: 16
  },
  passDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  passCol: {
    flex: 1
  },
  passColRight: {
    alignItems: "flex-end"
  },
  passMetaLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
    fontWeight: "600"
  },
  passMetaValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 2
  },
  passGameBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  passGameLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.primaryDark,
    textTransform: "uppercase"
  },
  passGameTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.primaryDark
  },
  passTotalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 14
  },
  passTotalLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.successText
  },
  passTotalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.successText
  },
  passPrimaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8
  },
  passPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  },
  passSecondaryBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10
  },
  passSecondaryBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600"
  },

  // STYLES MODAL PICKER GAME
  pickerModalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
    padding: 20
  },
  pickerSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12
  },
  pickerSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.text
  },
  gamePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: colors.borderLight
  },
  gamePickerRowActive: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8
  },
  pickerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center"
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
  }
});
