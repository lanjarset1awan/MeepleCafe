import React, { useState, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ApiService } from "../../api/apiService";
import { colors } from "../../theme/colors";
import GameImage from "../../components/GameImage";
import CustomDialog from "../../components/CustomDialog";

// Template gambar siap pakai untuk opsi URL cepat
const IMAGE_TEMPLATES = [
  {
    name: "Strategy",
    url: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Cards / Party",
    url: "https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Dice / Family",
    url: "https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Catan Classic",
    url: "https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__imagepage/img/M_9m571w-N4b1tI2o0bJgq_6v24=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2419375.jpg"
  }
];

export default function AdminGameFormScreen({ navigation, route }) {
  const existingGame = route.params?.game || null;
  const isEditMode = Boolean(existingGame);

  // Form Fields
  const [title, setTitle] = useState(existingGame?.title || "");
  const [categoryId, setCategoryId] = useState(existingGame?.category_id || "");
  const [minPlayers, setMinPlayers] = useState(
    existingGame?.min_players ? String(existingGame.min_players) : "2"
  );
  const [maxPlayers, setMaxPlayers] = useState(
    existingGame?.max_players ? String(existingGame.max_players) : "4"
  );
  const [durationMinutes, setDurationMinutes] = useState(
    existingGame?.duration_minutes ? String(existingGame.duration_minutes) : "45"
  );
  const [difficulty, setDifficulty] = useState(existingGame?.difficulty || "Menengah");
  const [stock, setStock] = useState(
    existingGame?.stock !== undefined ? String(existingGame.stock) : "2"
  );
  const [shelfLocation, setShelfLocation] = useState(
    existingGame?.shelf_location || existingGame?.rack_code || "Rak A-01"
  );
  const [imageUrl, setImageUrl] = useState(existingGame?.image_url || "");
  const [description, setDescription] = useState(existingGame?.description || "");
  const [rulesSummary, setRulesSummary] = useState(existingGame?.rules_summary || "");
  const [isAvailable, setIsAvailable] = useState(
    existingGame?.is_available !== false && (existingGame?.stock === undefined || Number(existingGame.stock) > 0)
  );

  // Mode Pilihan Gambar: 'upload' (dari HP/kamera) atau 'url' (input link)
  const [imageInputMode, setImageInputMode] = useState("upload");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Categories dari API / Supabase
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog State
  const [dialogState, setDialogState] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const catList = await ApiService.getCategories();
        if (catList && catList.length > 0) {
          setCategories(catList);
          // Jika belum ada kategori terpilih, gunakan kategori pertama
          if (!categoryId && !isEditMode) {
            setCategoryId(catList[0].id);
          }
        }
      } catch (err) {
        console.warn("Gagal memuat kategori:", err);
      }
    }
    fetchCategories();
  }, []);

  // 1. Pilih Gambar dari Galeri HP
  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setDialogState({
          visible: true,
          type: "warning",
          title: "Izin Diperlukan",
          message: "Aplikasi membutuhkan izin akses galeri untuk memilih foto sampul game."
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
          message: "Gambar sampul berhasil diunggah ke cloud storage Supabase!"
        });
      }
    } catch (err) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Gagal Mengunggah",
        message: err.message || "Terjadi kesalahan saat mengunggah gambar."
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // 2. Ambil Foto Langsung dari Kamera HP
  const handleTakeFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setDialogState({
          visible: true,
          type: "warning",
          title: "Izin Kamera Diperlukan",
          message: "Aplikasi membutuhkan izin kamera untuk memotret fisik board game."
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
          message: "Foto board game dari kamera berhasil diunggah ke cloud storage!"
        });
      }
    } catch (err) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Gagal Mengunggah",
        message: err.message || "Terjadi kesalahan saat mengambil foto."
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Judul Wajib Diisi",
        message: "Silakan masukkan nama atau judul board game terlebih dahulu."
      });
      return false;
    }

    const minP = parseInt(minPlayers, 10);
    const maxP = parseInt(maxPlayers, 10);
    if (isNaN(minP) || minP <= 0 || isNaN(maxP) || maxP <= 0) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Jumlah Pemain Tidak Valid",
        message: "Jumlah pemain minimal dan maksimal harus berupa angka positif."
      });
      return false;
    }

    if (minP > maxP) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Rentang Pemain Keliru",
        message: "Pemain minimal tidak boleh lebih besar dari pemain maksimal."
      });
      return false;
    }

    const dur = parseInt(durationMinutes, 10);
    if (isNaN(dur) || dur <= 0) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Durasi Tidak Valid",
        message: "Estimasi durasi bermain harus berupa angka menit lebih dari 0."
      });
      return false;
    }

    const stk = parseInt(stock, 10);
    if (isNaN(stk) || stk < 0) {
      setDialogState({
        visible: true,
        type: "danger",
        title: "Stok Tidak Valid",
        message: "Stok box kafe harus berupa angka 0 atau lebih."
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const parsedStock = Math.max(0, parseInt(stock, 10) || 0);
      const payload = {
        title: title.trim(),
        category_id: categoryId || null,
        min_players: parseInt(minPlayers, 10),
        max_players: parseInt(maxPlayers, 10),
        duration_minutes: parseInt(durationMinutes, 10),
        difficulty,
        stock: parsedStock,
        shelf_location: shelfLocation.trim() || "Rak A-01",
        image_url: imageUrl.trim() || null,
        description: description.trim() || null,
        rules_summary: rulesSummary.trim() || null,
        is_available: isAvailable
      };

      if (isEditMode) {
        await ApiService.updateGame(existingGame.id, payload);
        setDialogState({
          visible: true,
          type: "success",
          title: "Berhasil Diperbarui",
          message: `Data board game "${title}" telah berhasil disimpan.`,
          onConfirm: () => {
            setDialogState({ visible: false });
            navigation.goBack();
          }
        });
      } else {
        await ApiService.createGame(payload);
        setDialogState({
          visible: true,
          type: "success",
          title: "Berhasil Ditambahkan",
          message: `Board game "${title}" telah sukses ditambahkan ke katalog MeepleCafe.`,
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
        message: err.message || "Terjadi kendala saat menyimpan data board game."
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
              {isEditMode ? "Edit Board Game" : "Tambah Board Game"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditMode ? "Perbarui informasi katalog game" : "Masukkan informasi board game baru"}
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
        {/* Card 1: Informasi Utama */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="cube-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Informasi Utama Game</Text>
          </View>

          {/* Input Judul */}
          <Text style={styles.fieldLabel}>
            Judul Board Game <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: Catan, Splendor, The Resistance..."
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          {/* Pilihan Kategori */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Kategori Permainan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
            {categories.map((cat) => {
              const selected = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryPill, selected && styles.categoryPillActive]}
                  onPress={() => setCategoryId(cat.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryPillText, selected && styles.categoryPillTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Card 2: Spesifikasi & Gameplay (Layout Rapi, Tingkat Kesulitan Luas) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="game-controller-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Spesifikasi & Gameplay</Text>
          </View>

          {/* Row Pemain: Min & Max berdampingan */}
          <View style={styles.twoColumnRow}>
            <View style={styles.columnHalf}>
              <Text style={styles.fieldLabel}>
                Min Pemain <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="people-outline" size={17} color={colors.primary} />
                <TextInput
                  style={styles.colInput}
                  keyboardType="numeric"
                  placeholder="2"
                  value={minPlayers}
                  onChangeText={setMinPlayers}
                />
              </View>
            </View>

            <View style={styles.columnHalf}>
              <Text style={styles.fieldLabel}>
                Max Pemain <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="people-outline" size={17} color={colors.primary} />
                <TextInput
                  style={styles.colInput}
                  keyboardType="numeric"
                  placeholder="6"
                  value={maxPlayers}
                  onChangeText={setMaxPlayers}
                />
              </View>
            </View>
          </View>

          {/* Row Durasi: Full Width */}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.fieldLabel}>
              Estimasi Durasi (Menit) <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="time-outline" size={17} color={colors.primary} />
              <TextInput
                style={styles.colInput}
                keyboardType="numeric"
                placeholder="45 (menit)"
                value={durationMinutes}
                onChangeText={setDurationMinutes}
              />
            </View>
          </View>

          {/* Row Tingkat Kesulitan: Menggunakan icon bar-chart-outline serasi dengan GameDetail */}
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Ionicons name="bar-chart-outline" size={17} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>Tingkat Kesulitan Permainan</Text>
            </View>
            <View style={styles.difficultyContainer}>
              {["Mudah", "Menengah", "Sulit"].map((lvl) => {
                const active = difficulty === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.diffPill,
                      active && styles.diffPillActive
                    ]}
                    onPress={() => setDifficulty(lvl)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.diffPillText,
                        active && styles.diffPillTextActive
                      ]}
                    >
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Row Stok Kafe & Posisi Rak (Inventaris Fisik) */}
          <View style={[styles.twoColumnRow, { marginTop: 14 }]}>
            <View style={styles.columnHalf}>
              <Text style={styles.fieldLabel}>
                Stok Kafe (Box) <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="cube-outline" size={17} color={colors.primary} />
                <TextInput
                  style={styles.colInput}
                  keyboardType="numeric"
                  placeholder="2"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
            </View>

            <View style={styles.columnHalf}>
              <Text style={styles.fieldLabel}>
                Posisi Rak Kafe <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="grid-outline" size={17} color={colors.primary} />
                <TextInput
                  style={styles.colInput}
                  placeholder="Rak A-01"
                  value={shelfLocation}
                  onChangeText={setShelfLocation}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Card 3: Media & Gambar Cover (2 Pilihan: Upload dari HP / Gunakan Link URL) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="image-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Cover & Media Visual</Text>
          </View>

          {/* Tab Selector: Upload dari HP vs Gunakan Link URL */}
          <Text style={styles.fieldLabel}>Pilih Metode Input Foto:</Text>
          <View style={styles.imageSourceToggle}>
            <TouchableOpacity
              style={[styles.sourceToggleBtn, imageInputMode === "upload" && styles.sourceToggleBtnActive]}
              activeOpacity={0.85}
              onPress={() => setImageInputMode("upload")}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={16}
                color={imageInputMode === "upload" ? "#FFFFFF" : colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[styles.sourceToggleText, imageInputMode === "upload" && styles.sourceToggleTextActive]}
              >
                Upload dari HP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sourceToggleBtn, imageInputMode === "url" && styles.sourceToggleBtnActive]}
              activeOpacity={0.85}
              onPress={() => setImageInputMode("url")}
            >
              <Ionicons
                name="link-outline"
                size={16}
                color={imageInputMode === "url" ? "#FFFFFF" : colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[styles.sourceToggleText, imageInputMode === "url" && styles.sourceToggleTextActive]}
              >
                Gunakan Link URL
              </Text>
            </TouchableOpacity>
          </View>

          {/* Opsi 1: Upload dari HP (Galeri / Kamera) */}
          {imageInputMode === "upload" ? (
            <View style={styles.uploadAreaWrapper}>
              <View style={styles.uploadButtonsRow}>
                <TouchableOpacity
                  style={styles.btnUploadAction}
                  activeOpacity={0.85}
                  onPress={handlePickFromGallery}
                  disabled={uploadingImage}
                >
                  <Ionicons name="images-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.btnUploadActionText}>Pilih dari Galeri</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnUploadAction}
                  activeOpacity={0.85}
                  onPress={handleTakeFromCamera}
                  disabled={uploadingImage}
                >
                  <Ionicons name="camera-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.btnUploadActionText}>Ambil Foto Kamera</Text>
                </TouchableOpacity>
              </View>

              {uploadingImage && (
                <View style={styles.uploadProgressBox}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.uploadProgressText}>Mengunggah gambar ke cloud storage Supabase...</Text>
                </View>
              )}
            </View>
          ) : (
            /* Opsi 2: Input Link URL Manual & Preset Template */
            <View style={{ marginTop: 6 }}>
              <TextInput
                style={styles.textInput}
                placeholder="Masukkan link gambar (https://...)"
                placeholderTextColor={colors.textMuted}
                value={imageUrl}
                onChangeText={setImageUrl}
                autoCapitalize="none"
              />

              <Text style={[styles.fieldHint, { marginTop: 10 }]}>Pilih template foto siap pakai:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateRow}>
                {IMAGE_TEMPLATES.map((tpl, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.templatePill}
                    onPress={() => setImageUrl(tpl.url)}
                  >
                    <Ionicons name="image" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.templatePillText}>{tpl.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Pratinjau Gambar Cover (Live Preview) */}
          {imageUrl.length > 5 ? (
            <View style={styles.previewContainer}>
              <View style={styles.previewHeaderRow}>
                <View style={styles.previewTag}>
                  <Ionicons name="checkmark-circle" size={13} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.previewTagText}>Pratinjau Cover Aktif</Text>
                </View>

                <TouchableOpacity
                  style={styles.btnClearImage}
                  onPress={() => setImageUrl("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.btnClearImageText}>Hapus Foto</Text>
                </TouchableOpacity>
              </View>
              <GameImage uri={imageUrl} style={styles.previewImage} />
            </View>
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Ionicons name="image-outline" size={32} color={colors.textMuted} />
              <Text style={styles.noImageText}>Belum ada foto sampul dipilih</Text>
            </View>
          )}
        </View>

        {/* Card 4: Deskripsi & Aturan */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Deskripsi & Ringkasan Aturan</Text>
          </View>

          <Text style={styles.fieldLabel}>Deskripsi Singkat</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Tuliskan latar belakang tema, objektif game, dan keseruan memainkannya..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Ringkasan Aturan Main (Rules)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Contoh: Giliran berjalan searah jarum jam. Pemain mengumpulkan resource dan membangun pemukiman..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            value={rulesSummary}
            onChangeText={setRulesSummary}
          />
        </View>

        {/* Card 5: Status Ketersediaan Game (Modelan Meja Kafe) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="toggle-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Status Ketersediaan</Text>
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isAvailable ? "#10B981" : "#EF4444" }
                  ]}
                />
                <Text style={styles.switchLabel}>
                  {isAvailable ? "Game Aktif (Tersedia)" : "Game Tidak Tersedia"}
                </Text>
              </View>
              <Text style={styles.switchSublabel}>
                {isAvailable
                  ? "Game siap dimainkan dan dapat dipesan oleh pelanggan saat reservasi."
                  : "Game bertanda 'Tidak Tersedia' di katalog dan tombol pemesanan akan dinonaktifkan."}
              </Text>
            </View>

            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: "#FECACA", true: colors.primaryLight }}
              thumbColor={isAvailable ? colors.primary : "#DC2626"}
            />
          </View>
        </View>

        {/* Action Button Simpan */}
        <TouchableOpacity
          style={[styles.btnSubmit, isSubmitting && styles.btnSubmitDisabled]}
          activeOpacity={0.88}
          onPress={handleSave}
          disabled={isSubmitting}
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
              <Text style={styles.btnSubmitText}>
                {isEditMode ? "Simpan Perubahan Game" : "Tambahkan ke Katalog"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnCancel}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnCancelText}>Batalkan</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Dialog Feedback (Sukses / Validasi Error) */}
      <CustomDialog
        visible={dialogState.visible}
        type={dialogState.type}
        iconName={
          dialogState.type === "success"
            ? "checkmark-circle-outline"
            : dialogState.type === "danger"
            ? "alert-circle-outline"
            : "information-circle-outline"
        }
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
        onClose={() => setDialogState({ ...dialogState, visible: false })}
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
    paddingBottom: 18,
    paddingHorizontal: 16
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitleBox: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: "#94A3B8",
    marginTop: 2
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.text
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6
  },
  requiredAsterisk: {
    color: "#EF4444",
    fontWeight: "700"
  },
  fieldHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: colors.text
  },
  textArea: {
    minHeight: 75,
    textAlignVertical: "top",
    paddingTop: 10
  },
  categoryPicker: {
    flexDirection: "row",
    marginBottom: 6
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  categoryPillText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500"
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  switchSublabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 12
  },
  columnHalf: {
    flex: 1
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44
  },
  colInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13.5,
    color: colors.text
  },
  // Tingkat Kesulitan Luas & Serasi
  difficultyContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4
  },
  diffPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  diffPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  diffPillText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600"
  },
  diffPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  // Tab Selector: Upload vs Link URL
  imageSourceToggle: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  sourceToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10
  },
  sourceToggleBtnActive: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2
  },
  sourceToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary
  },
  sourceToggleTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  uploadAreaWrapper: {
    marginTop: 4
  },
  uploadButtonsRow: {
    flexDirection: "row",
    gap: 10
  },
  btnUploadAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 11,
    borderRadius: 12
  },
  btnUploadActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary
  },
  uploadProgressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  uploadProgressText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginLeft: 8
  },
  templateRow: {
    flexDirection: "row",
    marginBottom: 10
  },
  templatePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6
  },
  templatePillText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600"
  },
  previewContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC"
  },
  previewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  previewTag: {
    flexDirection: "row",
    alignItems: "center"
  },
  previewTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669"
  },
  btnClearImage: {
    flexDirection: "row",
    alignItems: "center"
  },
  btnClearImageText: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "600"
  },
  previewImage: {
    width: "100%",
    height: 150
  },
  noImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    marginTop: 10
  },
  noImageText: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 4
  },
  btnSubmit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  btnSubmitDisabled: {
    opacity: 0.7
  },
  btnSubmitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700"
  },
  btnCancel: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8
  },
  btnCancelText: {
    color: colors.textMuted,
    fontSize: 13.5,
    fontWeight: "600"
  }
});
