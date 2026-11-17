import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
  Image
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";
import CustomDialog from "../components/CustomDialog";
import SuccessPaymentModal from "../components/SuccessPaymentModal";
import GameImage from "../components/GameImage";

// Logo resmi perbankan & QRIS untuk metode pembayaran
const BANK_LOGOS = {
  bca: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT51BAk8TXeqH2rGF2IDxCx-qnvAIg7ojlj45t7KAZMXw&s=10",
  mandiri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ97zsGfcEryN4wtnmQt9aNVVt3YpEHGjXf13KsHDbA9Q&s=10",
  qris: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQr-ZUsZr698NnD0cJv0tyPbOfuS2Q6vrf4hy9blxCxBw&s=10"
};

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

// Helper tanggal
function getFormattedDate(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BookingFormScreen({ route, navigation }) {
  const [chosenTable, setChosenTable] = useState({
    id: route.params.tableId,
    table_number: route.params.tableNumber,
    table_type: route.params.tableType,
    price_per_hour: route.params.pricePerHour || 30000,
    capacity: route.params.capacity || 4,
    image_url: route.params.tableImage || null
  });
  const [allTables, setAllTables] = useState([]);
  const [tablePickerVisible, setTablePickerVisible] = useState(false);

  const tableId = chosenTable.id;
  const tableNumber = chosenTable.table_number;
  const tableType = chosenTable.table_type;
  const capacity = chosenTable.capacity;
  const pricePerHour = chosenTable.price_per_hour;
  const selectedGame = route.params.selectedGame;

  const todayStr = useMemo(() => getFormattedDate(0), []);
  const currentNow = new Date();
  const currentHourNow = currentNow.getHours();

  // Jika hari ini sudah jam 20.00 ke atas (kafe tutup jam 21.00), default otomatis ke Besok
  const initialDate = currentHourNow >= 20 ? getFormattedDate(1) : todayStr;

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [reservationDate, setReservationDate] = useState(initialDate);

  // Daftar opsi jam mulai (10.00 sampai 20.00 karena kafe tutup jam 21.00)
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

  // Modal Popup Sukses Pasca Pembayaran (Custom Ticket Confirmation)
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [issuedTicket, setIssuedTicket] = useState(null);

  // Data reservasi aktif dari database untuk validasi slot & bentrok
  const [activeReservations, setActiveReservations] = useState([]);

  // Cek apakah tanggal yang dipilih adalah hari kemarin / lampau atau hari ini
  const isPastDate = reservationDate < todayStr;
  const isSelectedDateToday = reservationDate === todayStr;

  // Fungsi pengecekan apakah jam tertentu sudah lewat
  const isHourPassed = (hour) => {
    if (isPastDate) return true; // Semua jam pada tanggal yang telah lewat otomatis tidak berlaku
    if (!isSelectedDateToday) return false;
    const now = new Date();
    return now.getHours() >= hour;
  };

  const isAllTodayPassed = isSelectedDateToday && currentHourNow >= 20;

  // State untuk CustomDialog (menggantikan generic Alert.alert)
  const [dialogConfig, setDialogConfig] = useState({
    visible: false,
    type: "info", // "warning", "error", "success", "info"
    title: "",
    message: "",
    confirmText: "Mengerti",
    cancelText: null,
    onConfirm: null,
    onCancel: null
  });

  const showDialog = (cfg) => {
    setDialogConfig({
      visible: true,
      type: cfg.type || "info",
      title: cfg.title || "",
      message: cfg.message || "",
      confirmText: cfg.confirmText || "Mengerti",
      cancelText: cfg.cancelText || null,
      onConfirm: cfg.onConfirm || null,
      onCancel: cfg.onCancel || null
    });
  };

  const hideDialog = () => {
    setDialogConfig((prev) => ({ ...prev, visible: false }));
  };

  // State untuk Custom Success Payment Modal
  const [successModalData, setSuccessModalData] = useState({
    visible: false,
    bookingCode: "",
    gameTitle: "",
    tableType: "",
    tableNumber: "",
    reservationDate: "",
    sessionTime: "",
    totalPrice: "",
    paymentMethod: ""
  });

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

  // 1. Load daftar game & meja untuk opsi ganti
  useEffect(() => {
    async function loadAllGamesAndTables() {
      try {
        const [games, tables] = await Promise.all([
          ApiService.getGames(),
          ApiService.getTables()
        ]);
        setAllGames(games || []);
        setAllTables(tables || []);
        if (tables && tables.length > 0) {
          setChosenTable((prev) => {
            const match = tables.find((t) => t.id === prev.id);
            return match ? { ...prev, image_url: prev.image_url || match.image_url } : prev;
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAllGamesAndTables();
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

  // Cek ketersediaan untuk setiap slot jam individu (untuk indikator grid)
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
    // Validasi 0: Jika tanggal yang dipilih adalah hari kemarin / lampau
    if (isPastDate) {
      return {
        available: false,
        reason: "Tanggal Sudah Lewat",
        detail: `Tanggal ${reservationDate} sudah berlalu. MeepleCafe hanya melayani reservasi untuk hari ini atau hari yang akan datang.`
      };
    }

    // Validasi 1: Jika jam yang dipilih sudah lewat untuk hari ini
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

    // Validasi 2: Cek bentrok meja pada rentang jam ini
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

    // Validasi 3: Cek stok game pada rentang jam yang sama
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
    isPastDate,
    isSelectedDateToday
  ]);

  // Validasi sebelum membuka modal pembayaran
  const handleProceedToPayment = () => {
    if (isPastDate) {
      showDialog({
        type: "error",
        title: "Tanggal Sudah Lewat",
        message: `Tanggal yang Anda pilih (${reservationDate}) sudah berlalu. Silakan pilih tanggal hari ini atau besok.`
      });
      return;
    }

    if (!chosenGame) {
      showDialog({
        type: "warning",
        title: "Pilih Board Game",
        message: "Silakan pilih board game yang ingin Anda mainkan terlebih dahulu sebelum melanjutkan ke pembayaran.",
        confirmText: "Pilih Game",
        onConfirm: () => setGamePickerVisible(true)
      });
      return;
    }

    if (!customerName.trim()) {
      showDialog({
        type: "warning",
        title: "Nama Belum Diisi",
        message: "Silakan masukkan nama lengkap pemesan sebelum melanjutkan ke pembayaran."
      });
      return;
    }

    if (!customerPhone.trim()) {
      showDialog({
        type: "warning",
        title: "Nomor WhatsApp Diperlukan",
        message: "Silakan masukkan nomor WhatsApp / HP aktif untuk konfirmasi tiket MeepleCafe."
      });
      return;
    }

    const count = parseInt(guestCount, 10);
    if (isNaN(count) || count < 1 || count > capacity) {
      showDialog({
        type: "warning",
        title: "Kapasitas Meja",
        message: `Jumlah pemain harus antara 1 sampai ${capacity} orang sesuai kapasitas ${tableType}.`
      });
      return;
    }

    if (!slotStatus.available) {
      showDialog({
        type: "error",
        title: slotStatus.reason || "Jadwal Tidak Tersedia",
        message: `${slotStatus.detail}\n\nSilakan pilih jam mulai atau durasi lain yang masih kosong.`
      });
      return;
    }

    // Buka Modal Pembayaran
    setPaymentModalVisible(true);
  };

  const handleCopyAccount = (bankName, accountNum) => {
    showDialog({
      type: "success",
      title: "Rekening Disalin",
      message: `Nomor rekening ${bankName} (${accountNum}) a.n. MeepleCafe / Lanjar Setiawan berhasil disalin!`
    });
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

      // Tampilkan popup sukses pembayaran kustom MeepleCafe
      setSuccessModalData({
        visible: true,
        bookingCode: result.booking_code,
        gameTitle: gameTitle,
        gameImage: chosenGame?.image_url,
        tableType: tableType,
        tableNumber: tableNumber,
        reservationDate: reservationDate,
        sessionTime: currentSessionTime,
        totalPrice: formatRupiah(totalPrice),
        paymentMethod: paymentMethodName
      });
    } catch (err) {
      showDialog({
        type: "error",
        title: "Gagal Memproses Reservasi",
        message: err.message || "Terjadi kendala saat menerbitkan tiket. Silakan coba kembali."
      });
      refreshAvailability();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Paket Meja & Game */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionHeaderLabel}>Paket Bermain</Text>

        <View style={styles.packageRow}>
          {chosenGame?.image_url ? (
            <GameImage
              uri={chosenGame.image_url}
              style={styles.packageGameThumb}
            />
          ) : (
            <View style={[styles.packageIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="cube-outline" size={22} color={colors.primary} />
            </View>
          )}
          <View style={styles.packageInfo}>
            <Text style={styles.packageSub}>Board Game Pilihan</Text>
            <Text style={[styles.packageTitle, !chosenGame && { color: colors.textMuted }]}>
              {chosenGame ? chosenGame.title : "Belum Memilih Game"}
            </Text>
            <Text style={styles.packageStock}>
              {chosenGame
                ? `Stok Kafe: ${chosenGame.stock || 2} Box Original`
                : "Silakan pilih game yang ingin dimainkan"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.packageActionBtn}
            onPress={() => setGamePickerVisible(true)}
          >
            <Text style={styles.packageActionBtnText}>
              {chosenGame ? "Ganti" : "Pilih"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.packageRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          {chosenTable?.image_url ? (
            <GameImage
              uri={chosenTable.image_url}
              style={styles.packageGameThumb}
            />
          ) : (
            <View style={[styles.packageIconBox, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="table-chair" size={22} color={colors.primary} />
            </View>
          )}
          <View style={styles.packageInfo}>
            <Text style={styles.packageSub}>Meja Kafe</Text>
            <Text style={styles.packageTitle}>
              {tableType} (Meja {tableNumber})
            </Text>
            <Text style={styles.packageRate}>
              Kapasitas {capacity} Orang • {formatRupiah(numericPricePerHour)} / jam
            </Text>
          </View>
          <TouchableOpacity
            style={styles.packageActionBtn}
            onPress={() => setTablePickerVisible(true)}
          >
            <Text style={styles.packageActionBtnText}>Ganti</Text>
          </TouchableOpacity>
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
            <Ionicons name="time-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.todayClosedNoticeText}>
              Jam operasional hari ini sudah lewat (Kafe tutup pukul 21.00). Silakan pilih tanggal Besok.
            </Text>
          </View>
        )}

        {/* Input Tanggal Manual */}
        <TextInput
          style={[styles.textInput, { marginTop: 8, marginBottom: isPastDate ? 8 : 18 }]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          value={reservationDate}
          onChangeText={setReservationDate}
        />

        {/* Notifikasi jika memilih tanggal yang sudah lewat */}
        {isPastDate && (
          <View style={styles.pastDateNotice}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.pastDateNoticeText}>
              Tanggal {reservationDate} sudah berlalu. MeepleCafe hanya melayani reservasi untuk hari ini atau tanggal mendatang.
            </Text>
          </View>
        )}

        {/* PILIHAN JAM MULAI (GRID 3 KOLOM, FLOW KE BAWAH, DESAIN CENTER) */}
        <View style={styles.labelWithSubRow}>
          <Text style={styles.inputLabel}>Pilih Jam Mulai Bermain</Text>
          <Text style={styles.labelSubText}>Tiap 1 Jam</Text>
        </View>

        <View style={styles.hourGrid}>
          {startHourOptions.map((hour) => {
            const isPassed = isHourPassed(hour);
            const isSelected = startHour === hour;
            const isActive = isSelected && !isPassed;
            const isBusy = !isPassed && isHourBusyForTable(hour);
            const hourLabel = `${String(hour).padStart(2, "0")}.00`;

            return (
              <TouchableOpacity
                key={hour}
                activeOpacity={0.75}
                style={[
                  styles.hourGridItem,
                  isActive && styles.hourGridItemActive,
                  isPassed && styles.hourGridItemPassed,
                  isBusy && !isActive && styles.hourGridItemBusy
                ]}
                onPress={() => {
                  if (isPassed) {
                    showDialog({
                      type: "warning",
                      title: isPastDate ? "Tanggal Sudah Lewat" : "Jam Sudah Terlewati",
                      message: isPastDate
                        ? `Tanggal ${reservationDate} sudah berlalu. Silakan pilih hari ini atau tanggal mendatang.`
                        : `Pukul ${hourLabel} sudah lewat untuk hari ini. Silakan pilih jam lain yang masih buka atau pilih tanggal besok.`
                    });
                    return;
                  }
                  setStartHour(hour);
                }}
              >
                <Text
                  style={[
                    styles.hourGridText,
                    isActive && styles.hourGridTextActive,
                    isPassed && styles.hourGridTextPassed,
                    isBusy && !isActive && styles.hourGridTextMuted
                  ]}
                >
                  {hourLabel}
                </Text>
                <View style={styles.hourStatusRow}>
                  <Text
                    style={[
                      styles.hourGridSub,
                      isActive
                        ? { color: "#FFFFFF" }
                        : isPassed
                          ? { color: "#94A3B8" }
                          : isBusy
                            ? { color: colors.secondary }
                            : { color: colors.textMuted }
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

        {/* RINGKASAN WAKTU BOOKING (DESAIN MINIMALIS & BERSIH) */}
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
                slotStatus.available
                  ? styles.statusBadgeCleanAvailable
                  : isPastDate || isHourPassed(startHour)
                    ? styles.statusBadgeCleanPassed
                    : styles.statusBadgeCleanBusy
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeCleanText,
                  {
                    color: slotStatus.available
                      ? colors.primaryDark
                      : isPastDate || isHourPassed(startHour)
                        ? "#64748B"
                        : colors.secondary
                  }
                ]}
              >
                {slotStatus.available
                  ? "Tersedia"
                  : isPastDate || isHourPassed(startHour)
                    ? "Lewat"
                    : "Penuh"}
              </Text>
            </View>
          </View>

          {!slotStatus.available && (
            <View
              style={[
                styles.conflictNotice,
                (isPastDate || isHourPassed(startHour)) && styles.conflictNoticePassed
              ]}
            >
              <Ionicons
                name={isPastDate || isHourPassed(startHour) ? "time-outline" : "information-circle"}
                size={16}
                color={isPastDate || isHourPassed(startHour) ? "#DC2626" : colors.secondary}
              />
              <Text
                style={[
                  styles.conflictNoticeText,
                  (isPastDate || isHourPassed(startHour)) && styles.conflictNoticeTextPassed
                ]}
              >
                {slotStatus.detail}
              </Text>
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
          <Text style={[styles.priceRowValue, { color: colors.primaryDark }]}>GRATIS</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceRowLabel}>Fasilitas Wi-Fi & Snack Kafe:</Text>
          <Text style={[styles.priceRowValue, { color: colors.primaryDark }]}>GRATIS</Text>
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

      {/* MODAL SISTEM PEMBAYARAN TRANSFER & QRIS */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Pembayaran Reservasi</Text>
                <Text style={styles.modalSub}>Transfer sesuai nominal untuk mengonfirmasi tiket</Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Total Tagihan Box */}
              <View style={styles.modalBillBox}>
                <Text style={styles.modalBillLabel}>TOTAL TAGIHAN</Text>
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
              >
                <View style={styles.paymentMethodLeft}>
                  <View style={[styles.bankLogoBox, styles.bankLogoBoxBca]}>
                    <Image
                      source={{ uri: BANK_LOGOS.bca }}
                      style={styles.bankLogoImageCover}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.bankName}>Bank Central Asia (BCA)</Text>
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
              >
                <View style={styles.paymentMethodLeft}>
                  <View style={[styles.bankLogoBox, styles.bankLogoBoxMandiri]}>
                    <Image
                      source={{ uri: BANK_LOGOS.mandiri }}
                      style={styles.bankLogoImageMandiri}
                      resizeMode="cover"
                    />
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
              >
                <View style={styles.paymentMethodLeft}>
                  <View style={[styles.bankLogoBox, styles.bankLogoBoxQris]}>
                    <Image
                      source={{ uri: BANK_LOGOS.qris }}
                      style={styles.bankLogoImageCover}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.bankName}>QRIS Standar Nasional</Text>
                    <Text style={styles.bankHolder}>Gopay / ShopeePay / OVO / Dana / BCA / Livin</Text>
                  </View>
                </View>
                {selectedPaymentMethod === "qris" && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {selectedPaymentMethod === "qris" && (
                <View style={styles.qrisDisplayCard}>
                  <View style={styles.qrisHeaderBox}>
                    <Image
                      source={{ uri: BANK_LOGOS.qris }}
                      style={styles.qrisHeaderLogo}
                      resizeMode="contain"
                    />
                  </View>
                  <Ionicons name="qr-code" size={120} color={colors.secondary} />
                  <Text style={styles.qrisDesc}>
                    Scan kode QRIS ini dari aplikasi m-banking atau e-wallet Anda.
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
              >
                <View style={styles.paymentMethodLeft}>
                  <View style={[styles.bankLogoBox, styles.bankLogoBoxCash]}>
                    <Ionicons name="cash-outline" size={20} color={colors.primaryDark} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.bankName}>Bayar di Kasir (Cash / Tunai)</Text>
                    <Text style={styles.bankHolder}>Bayar langsung di kasir kafe saat kedatangan</Text>
                  </View>
                </View>
                {selectedPaymentMethod === "cash" && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* Petunjuk Konfirmasi */}
              <View style={styles.transferGuideBox}>
                <Ionicons name="shield-checkmark" size={18} color={colors.secondary} />
                <Text style={styles.transferGuideText}>
                  Setelah transfer sejumlah {formatRupiah(totalPrice)}, tekan tombol konfirmasi
                  di bawah untuk langsung menerbitkan tiket Anda.
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
                      Saya Sudah Transfer (Konfirmasi Tiket)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* POPUP SUKSES PEMBELIAN TIKET (CUSTOM TICKET PASS) */}
      <Modal visible={successModalVisible} animationType="fade" transparent>
        <View style={styles.successModalOverlay}>
          <View style={styles.ticketPassCard}>
            {/* Ticket Pass Header: Biru Slate (#1E293B) */}
            <View style={styles.passHeader}>
              <View style={styles.passTopBadge}>
                <Ionicons name="ticket" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.passTopBadgeText}>TIKET RESMI BERHASIL DITERBITKAN</Text>
              </View>

              <View style={styles.passIconCircle}>
                <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
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

            {/* Ticket Pass Body: Putih (#FFFFFF) */}
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

              <Text style={styles.passMetaLabel}>Board Game Dipesan</Text>
              <View style={styles.passGameBox}>
                <GameImage
                  uri={chosenGame?.image_url}
                  style={styles.passGameThumb}
                />
                <Text style={styles.passGameTitle}>{issuedTicket?.gameTitle || chosenGame?.title}</Text>
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
                <Text style={styles.passTotalLabel}>TOTAL LUNAS</Text>
                <Text style={styles.passTotalValue}>{formatRupiah(issuedTicket?.totalPrice || 0)}</Text>
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

      {/* Modal Picker untuk Ganti Board Game */}
      <Modal visible={gamePickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Board Game</Text>
              <TouchableOpacity onPress={() => setGamePickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={allGames}
              keyExtractor={(item) => item.id}
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
                >
                  <GameImage uri={item.image_url} style={styles.pickerGameThumb} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.gamePickerName}>{item.title}</Text>
                    <Text style={styles.gamePickerDesc}>
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

      {/* Modal Picker untuk Ganti Meja Kafe */}
      <Modal visible={tablePickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Meja Kafe</Text>
              <TouchableOpacity onPress={() => setTablePickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={allTables}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isSelected = chosenTable?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.gamePickerRow,
                      isSelected && styles.gamePickerRowActive
                    ]}
                    onPress={() => {
                      setChosenTable(item);
                      if (parseInt(guestCount, 10) > item.capacity) {
                        setGuestCount(String(item.capacity));
                      }
                      setTablePickerVisible(false);
                    }}
                  >
                    <View
                      style={[
                        styles.pickerGameThumb,
                        {
                          backgroundColor: colors.primaryLight,
                          justifyContent: "center",
                          alignItems: "center",
                          overflow: "hidden"
                        }
                      ]}
                    >
                      {item.image_url ? (
                        <GameImage uri={item.image_url} style={styles.pickerGameThumb} />
                      ) : (
                        <MaterialCommunityIcons name="table-chair" size={20} color={colors.primary} />
                      )}
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.gamePickerName}>
                        {item.table_type} (Meja {item.table_number})
                      </Text>
                      <Text style={styles.gamePickerDesc}>
                        Kapasitas Maksimal {item.capacity} Orang • {formatRupiah(item.price_per_hour || 30000)}/jam
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Dialog Kustom Pengganti Alert.alert */}
      <CustomDialog
        visible={dialogConfig.visible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        onConfirm={dialogConfig.onConfirm}
        onCancel={dialogConfig.onCancel}
        onClose={hideDialog}
      />

      {/* Modal Kustom Bukti Sukses Pembayaran Tiket */}
      <SuccessPaymentModal
        visible={successModalData.visible}
        bookingCode={successModalData.bookingCode}
        gameTitle={successModalData.gameTitle}
        gameImage={successModalData.gameImage}
        tableType={successModalData.tableType}
        tableNumber={successModalData.tableNumber}
        reservationDate={successModalData.reservationDate}
        sessionTime={successModalData.sessionTime}
        totalPrice={successModalData.totalPrice}
        paymentMethod={successModalData.paymentMethod}
        onViewTicket={() => {
          setSuccessModalData((prev) => ({ ...prev, visible: false }));
          navigation.popToTop();
          navigation.navigate("TicketsTab");
        }}
      />
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
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center"
  },
  packageGameThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F1F5F9"
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
    color: colors.primaryDark,
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
    borderColor: colors.primaryLight
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
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4
  },
  todayClosedNoticeText: {
    fontSize: 11,
    color: colors.primaryDark,
    marginLeft: 6,
    flex: 1,
    lineHeight: 16
  },
  pastDateNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    marginBottom: 14
  },
  pastDateNoticeText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
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
    opacity: 0.65
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
  hourGridTextPassed: {
    color: "#94A3B8"
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
    backgroundColor: colors.primary,
    borderColor: colors.primary
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
    backgroundColor: colors.primaryLight
  },
  statusBadgeCleanBusy: {
    backgroundColor: colors.background
  },
  statusBadgeCleanPassed: {
    backgroundColor: "#F1F5F9"
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
    backgroundColor: colors.primaryLight,
    padding: 8,
    borderRadius: 8,
    marginTop: 10
  },
  conflictNoticePassed: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA"
  },
  conflictNoticeText: {
    fontSize: 11,
    color: colors.primaryDark,
    marginLeft: 6,
    flex: 1
  },
  conflictNoticeTextPassed: {
    color: "#DC2626"
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
    backgroundColor: colors.secondary,
    opacity: 0.75
  },
  mainActionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.65)",
    justifyContent: "flex-end"
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
    marginBottom: 16
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
  bankLogoBox: {
    width: 58,
    height: 38,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  bankLogoBoxBca: {
    backgroundColor: "#0060AF",
    borderWidth: 1,
    borderColor: "#005299"
  },
  bankLogoBoxMandiri: {
    backgroundColor: "#0D2B5B",
    borderWidth: 1,
    borderColor: "#0A234A"
  },
  bankLogoBoxQris: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#000000"
  },
  bankLogoBoxCash: {
    backgroundColor: colors.primaryLight
  },
  bankLogoImageCover: {
    width: "100%",
    height: "100%"
  },
  bankLogoImageMandiri: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.35 }]
  },
  bankLogoImageContain: {
    width: "100%",
    height: "100%"
  },
  qrisHeaderBox: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  qrisHeaderLogo: {
    width: 68,
    height: 30
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
  qrisDesc: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8
  },
  transferGuideBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 10,
    marginVertical: 12
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
  pickerModalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
    padding: 20
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
  },

  // STYLES CUSTOM POPUP TIKET PASCA PEMBELIAN
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.75)",
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12
  },
  passTopBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryLight,
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
    color: colors.primaryLight,
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
    backgroundColor: "rgba(30, 41, 59, 0.75)"
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
    backgroundColor: "rgba(30, 41, 59, 0.75)"
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
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginTop: 4,
    marginBottom: 8
  },
  passGameTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#78350F",
    marginLeft: 8,
    flex: 1
  },
  passGameThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#F1F5F9"
  },
  passTotalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 14
  },
  passTotalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.secondary
  },
  passTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary
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
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "600"
  }
});
