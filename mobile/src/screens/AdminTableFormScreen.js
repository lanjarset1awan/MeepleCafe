import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";
import GameImage from "../components/GameImage";
import CustomDialog from "../components/CustomDialog";

// Template Foto Meja Populer untuk Pilihan URL Cepat
const TABLE_PRESETS = [
  {
    name: "VIP Lounge",
    type: "VIP Lounge",
    capacity: "6",
    price: "45000",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Wood Cozy",
    type: "Regular Standard",
    capacity: "4",
    price: "25000",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Big Party",
    type: "Party Room",
    capacity: "10",
    price: "60000",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Tatami Room",
    type: "Tatami Room",
    capacity: "6",
    price: "35000",
    url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80"
  }
];

// Opsi Tipe Meja Cepat
const TABLE_TYPE_OPTIONS = [
  "Regular Standard",
  "VIP Lounge",
  "Tatami Room",
  "Party Room",
  "Outdoor Cozy"
];

// Rekomendasi Tag Fasilitas
const FACILITY_TAGS = [
  "AC Dingin",
  "Stopkontak",
  "Meja Kayu Luas",
  "Kursi Busa Empuk",
  "Cup Holder",
  "Pencahayaan Khusus",
  "Papan Tulis Strategi",
  "Dekat Rak Game"
];

export default function AdminTableFormScreen({ navigation, route }) {
  const existingTable = route.params?.table || null;
  const isEditMode = Boolean(existingTable);

  // Form Fields State
  const [tableNumber, setTableNumber] = useState(existingTable?.table_number || "");
  const [tableType, setTableType] = useState(existingTable?.table_type || "Regular Standard");
  const [capacity, setCapacity] = useState(
    existingTable?.capacity !== undefined ? String(existingTable.capacity) : "4"
  );
  const [pricePerHour, setPricePerHour] = useState(
    existingTable?.price_per_hour !== undefined ? String(existingTable.price_per_hour) : "25000"
  );
  const [facilities, setFacilities] = useState(
    existingTable?.facilities || "AC Dingin, Stopkontak, Meja Kayu Luas"
  );
  const [imageUrl, setImageUrl] = useState(existingTable?.image_url || "");
  const [isActive, setIsActive] = useState(existingTable?.is_active !== false);

  // Mode Upload Foto: 'upload' (Kamera/Galeri) atau 'url' (Input Link)
  const [imageInputMode, setImageInputMode] = useState("upload");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog State
  const [dialogState, setDialogState] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null
  });

  // 1. Pilih Gambar dari Galeri HP
  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setDialogState({
          visible: true,
          type: "warning",
          title: "Izin Diperlukan",
          message: "Aplikasi membutuhkan izin galeri untuk memilih foto meja kafe."
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingImage(true);
        const uploadRes = await ApiService.uploadGameImage(
          asset.base64,
          asset.mimeType || "image/jpeg"
        );
        setImageUrl(uploadRes.imageUrl);
        setDialogState({
          visible: true,
          type: "success",
          title: "Foto Berhasil Diunggah",
          message: "Foto meja kafe berhasil diunggah ke cloud storage!"
        });
      }
    } catch (err) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Gagal Mengunggah",
        message: err.message || "Terjadi kesalahan saat mengunggah foto meja."
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // 2. Ambil Foto Meja Langsung dari Kamera HP
  const handleTakeFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setDialogState({
          visible: true,
          type: "warning",
          title: "Izin Kamera Diperlukan",
          message: "Aplikasi membutuhkan izin kamera untuk memotret fisik meja kafe."
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingImage(true);
        const uploadRes = await ApiService.uploadGameImage(
          asset.base64,
          asset.mimeType || "image/jpeg"
        );
        setImageUrl(uploadRes.imageUrl);
        setDialogState({
          visible: true,
          type: "success",
          title: "Foto Berhasil Diunggah",
          message: "Foto meja kafe dari kamera berhasil disimpan ke cloud storage!"
        });
      }
    } catch (err) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Gagal Mengunggah",
        message: err.message || "Terjadi kesalahan saat memotret meja."
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Toggle Tag Fasilitas ke TextInput
  const handleToggleFacilityTag = (tag) => {
    const currentList = facilities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (currentList.includes(tag)) {
      const updated = currentList.filter((item) => item !== tag);
      setFacilities(updated.join(", "));
    } else {
      const updated = [...currentList, tag];
      setFacilities(updated.join(", "));
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(Number(number) || 0);
  };

  // Validasi Form
  const validateForm = () => {
    if (!tableNumber.trim()) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Nomor Meja Wajib Diisi",
        message: "Silakan masukkan nomor atau kode meja (contoh: T-01, VIP-01)."
      });
      return false;
    }

    if (!tableType.trim()) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Tipe Meja Wajib Diisi",
        message: "Silakan pilih atau ketikkan tipe meja kafe."
      });
      return false;
    }

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap <= 0) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Kapasitas Meja Tidak Valid",
        message: "Kapasitas maksimal orang harus berupa angka positif minimal 1 orang."
      });
      return false;
    }

    const price = parseInt(pricePerHour, 10);
    if (isNaN(price) || price < 0) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Tarif Sewa Tidak Valid",
        message: "Tarif sewa per jam harus berupa nominal angka 0 atau lebih."
      });
      return false;
    }

    return true;
  };

  // Simpan / Perbarui Data Meja Kafe
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        table_number: tableNumber.trim().toUpperCase(),
        table_type: tableType.trim(),
        capacity: parseInt(capacity, 10),
        price_per_hour: parseInt(pricePerHour, 10),
        facilities: facilities.trim() || null,
        image_url: imageUrl.trim() || null,
        is_active: isActive
      };

      if (isEditMode) {
        await ApiService.updateTable(existingTable.id, payload);
        setDialogState({
          visible: true,
          type: "success",
          title: "Berhasil Diperbarui",
          message: `Data Meja "${payload.table_number}" telah berhasil disimpan.`,
          onConfirm: () => {
            setDialogState({ visible: false });
            navigation.goBack();
          }
        });
      } else {
        await ApiService.createTable(payload);
        setDialogState({
          visible: true,
          type: "success",
          title: "Berhasil Ditambahkan",
          message: `Meja "${payload.table_number}" telah sukses ditambahkan ke daftar meja MeepleCafe.`,
          onConfirm: () => {
            setDialogState({ visible: false });
            navigation.goBack();
          }
        });
      }
    } catch (err) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Gagal Menyimpan",
        message: err.message || "Terjadi kesalahan saat menyimpan data meja kafe."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      {/* Header Form */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {isEditMode ? "Edit Meja Kafe" : "Tambah Meja Kafe"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditMode ? "Perbarui informasi meja bermain" : "Masukkan informasi meja bermain baru"}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: FOTO MEJA KAFE */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="image-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Foto Sampul Meja</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Tampilkan foto meja untuk memudahkan pelanggan memilih area bermain
          </Text>

          {/* Pratinjau Foto Meja */}
          <View style={styles.imagePreviewContainer}>
            {imageUrl ? (
              <GameImage uri={imageUrl} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="table-chair" size={48} color={colors.textMuted} />
                <Text style={styles.imagePlaceholderText}>Belum ada foto meja dipilih</Text>
              </View>
            )}

            {uploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.uploadingText}>Mengunggah foto...</Text>
              </View>
            )}
          </View>

          {/* Tab Pemilih Mode Upload vs URL */}
          <View style={styles.modeTabContainer}>
            <TouchableOpacity
              style={[styles.modeTab, imageInputMode === "upload" && styles.modeTabActive]}
              onPress={() => setImageInputMode("upload")}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={14}
                color={imageInputMode === "upload" ? "#FFFFFF" : colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.modeTabText,
                  imageInputMode === "upload" && styles.modeTabTextActive
                ]}
              >
                Dari HP / Kamera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, imageInputMode === "url" && styles.modeTabActive]}
              onPress={() => setImageInputMode("url")}
            >
              <Ionicons
                name="link-outline"
                size={14}
                color={imageInputMode === "url" ? "#FFFFFF" : colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.modeTabText,
                  imageInputMode === "url" && styles.modeTabTextActive
                ]}
              >
                Input Link URL
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tombol Aksi Upload */}
          {imageInputMode === "upload" ? (
            <View style={styles.imageActionRow}>
              <TouchableOpacity
                style={styles.imageActionBtn}
                onPress={handlePickFromGallery}
                disabled={uploadingImage}
              >
                <Ionicons name="images-outline" size={18} color={colors.primary} />
                <Text style={styles.imageActionBtnText}>Buka Galeri</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imageActionBtn}
                onPress={handleTakeFromCamera}
                disabled={uploadingImage}
              >
                <Ionicons name="camera-outline" size={18} color={colors.primary} />
                <Text style={styles.imageActionBtnText}>Buka Kamera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.urlInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="https://images.unsplash.com/photo-..."
                placeholderTextColor={colors.textMuted}
                value={imageUrl}
                onChangeText={setImageUrl}
                autoCapitalize="none"
              />

              <Text style={styles.presetLabel}>Atau pilih template meja siap pakai:</Text>
              <View style={styles.presetGrid}>
                {TABLE_PRESETS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.presetChip,
                      imageUrl === item.url && styles.presetChipSelected
                    ]}
                    onPress={() => {
                      setImageUrl(item.url);
                      if (!isEditMode && (!tableType || tableType === "Regular Standard")) {
                        setTableType(item.type);
                        setCapacity(item.capacity);
                        setPricePerHour(item.price);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        imageUrl === item.url && styles.presetChipTextSelected
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* SECTION 2: IDENTITAS MEJA */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="table-chair" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Identitas Meja</Text>
          </View>

          {/* Nomor Meja */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Nomor / Kode Meja <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, { fontWeight: "700" }]}
              placeholder="Contoh: T-01, VIP-01, TT-01"
              placeholderTextColor={colors.textMuted}
              value={tableNumber}
              onChangeText={(txt) => setTableNumber(txt.toUpperCase())}
              autoCapitalize="characters"
            />
            <Text style={styles.inputHint}>Kode pengenal meja yang ditampilkan pada kartu reservasi</Text>
          </View>

          {/* Tipe Meja */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Tipe / Kategori Meja <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Regular Standard, VIP Lounge"
              placeholderTextColor={colors.textMuted}
              value={tableType}
              onChangeText={setTableType}
            />

            {/* Quick Chips Tipe Meja */}
            <View style={styles.chipWrapper}>
              {TABLE_TYPE_OPTIONS.map((type, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.typeChip,
                    tableType === type && styles.typeChipActive
                  ]}
                  onPress={() => setTableType(type)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      tableType === type && styles.typeChipTextActive
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* SECTION 3: KAPASITAS & TARIF SEWA */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calculator-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Kapasitas & Tarif Sewa</Text>
          </View>

          <View style={styles.rowTwoCols}>
            {/* Kapasitas Maksimal */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>
                Kapasitas (Orang) <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="people-outline" size={18} color={colors.primary} style={styles.inputInnerIcon} />
                <TextInput
                  style={[styles.textInput, styles.textInputWithIcon]}
                  placeholder="4"
                  placeholderTextColor={colors.textMuted}
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Tarif Sewa per Jam */}
            <View style={[styles.inputGroup, { flex: 1.3 }]}>
              <Text style={styles.inputLabel}>
                Tarif / Jam (Rp) <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="cash-outline" size={18} color="#059669" style={styles.inputInnerIcon} />
                <TextInput
                  style={[styles.textInput, styles.textInputWithIcon]}
                  placeholder="25000"
                  placeholderTextColor={colors.textMuted}
                  value={pricePerHour}
                  onChangeText={setPricePerHour}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Pratinjau Tarif */}
          <View style={styles.pricePreviewBox}>
            <Text style={styles.pricePreviewLabel}>Perkiraan Harga Sewa Pelanggan:</Text>
            <Text style={styles.pricePreviewValue}>
              {formatRupiah(pricePerHour)} / Jam{" "}
              <Text style={styles.pricePreviewSub}>(Maks. {capacity || "0"} orang)</Text>
            </Text>
          </View>
        </View>

        {/* SECTION 4: FASILITAS MEJA */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Fasilitas Meja</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Ketuk tag di bawah untuk menambah atau mengurangi fasilitas secara instan:
          </Text>

          {/* Quick Facility Tags */}
          <View style={styles.chipWrapper}>
            {FACILITY_TAGS.map((tag, idx) => {
              const isSelected = facilities
                .split(",")
                .map((t) => t.trim().toLowerCase())
                .includes(tag.toLowerCase());

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.facilityChip,
                    isSelected && styles.facilityChipActive
                  ]}
                  onPress={() => handleToggleFacilityTag(tag)}
                >
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                    size={14}
                    color={isSelected ? colors.primaryDark : colors.textMuted}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.facilityChipText,
                      isSelected && styles.facilityChipTextActive
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Facilities Text Area */}
          <View style={[styles.inputGroup, { marginTop: 10 }]}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="AC Dingin, Stopkontak, Meja Kayu Luas, Kursi Busa..."
              placeholderTextColor={colors.textMuted}
              value={facilities}
              onChangeText={setFacilities}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* SECTION 5: STATUS AKTIF / KETERSEDIAAN */}
        <View style={styles.cardSection}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isActive ? "#10B981" : "#EF4444" }
                  ]}
                />
                <Text style={styles.switchTitle}>
                  {isActive ? "Meja Aktif (Siap Dipesan)" : "Non-Aktif (Maintenance)"}
                </Text>
              </View>
              <Text style={styles.switchDesc}>
                {isActive
                  ? "Meja ditampilkan di daftar reservasi dan dapat dipilih oleh pelanggan"
                  : "Meja disembunyikan sementara dari jadwal reservasi baru"}
              </Text>
            </View>

            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: "#FECACA", true: colors.primaryLight }}
              thumbColor={isActive ? colors.primary : "#DC2626"}
            />
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={isEditMode ? "save-outline" : "checkmark-circle-outline"}
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.submitBtnText}>
                {isEditMode ? "Simpan Perubahan Meja" : "Tambahkan Meja Kafe"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* DIALOG FEEDBACK */}
      <CustomDialog
        visible={dialogState.visible}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        confirmText="OK"
        onConfirm={() => {
          if (dialogState.onConfirm) {
            dialogState.onConfirm();
          } else {
            setDialogState({ ...dialogState, visible: false });
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    backgroundColor: colors.darkBg,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  backBtn: {
    padding: 6
  },
  headerTitleBox: {
    flex: 1,
    alignItems: "center"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 2
  },
  scrollContent: {
    padding: 16
  },
  cardSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 6
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 16
  },
  imagePreviewContainer: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    position: "relative"
  },
  imagePreview: {
    width: "100%",
    height: "100%"
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center"
  },
  uploadingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8
  },
  modeTabContainer: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 8
  },
  modeTabActive: {
    backgroundColor: colors.primary
  },
  modeTabText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.textMuted
  },
  modeTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  imageActionRow: {
    flexDirection: "row",
    gap: 10
  },
  imageActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6
  },
  imageActionBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.primaryDark
  },
  urlInputContainer: {
    gap: 8
  },
  presetLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 4
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  presetChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  presetChipText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: "500"
  },
  presetChipTextSelected: {
    color: colors.primaryDark,
    fontWeight: "700"
  },
  inputGroup: {
    marginBottom: 12
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6
  },
  requiredAsterisk: {
    color: "#EF4444"
  },
  inputHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.text
  },
  inputWithIcon: {
    position: "relative",
    justifyContent: "center"
  },
  inputInnerIcon: {
    position: "absolute",
    left: 10,
    zIndex: 1
  },
  textInputWithIcon: {
    paddingLeft: 34
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: 12
  },
  chipWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  typeChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  typeChipText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500"
  },
  typeChipTextActive: {
    color: colors.primaryDark,
    fontWeight: "700"
  },
  facilityChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  facilityChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  facilityChipText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500"
  },
  facilityChipTextActive: {
    color: colors.primaryDark,
    fontWeight: "700"
  },
  textArea: {
    height: 70,
    textAlignVertical: "top"
  },
  pricePreviewBox: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 10,
    padding: 10,
    marginTop: 2
  },
  pricePreviewLabel: {
    fontSize: 11,
    color: "#065F46"
  },
  pricePreviewValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#047857",
    marginTop: 2
  },
  pricePreviewSub: {
    fontSize: 11.5,
    fontWeight: "normal",
    color: "#065F46"
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  switchTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.text
  },
  switchDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 16
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  submitBtnDisabled: {
    opacity: 0.7
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "700"
  }
});
