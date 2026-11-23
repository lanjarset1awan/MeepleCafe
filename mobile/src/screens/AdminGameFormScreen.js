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
import { ApiService } from "../api/apiService";
import { colors } from "../theme/colors";
import GameImage from "../components/GameImage";
import CustomDialog from "../components/CustomDialog";

// Template gambar siap pakai untuk kemudahan input admin
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
    name: "Catan",
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
  const [imageUrl, setImageUrl] = useState(existingGame?.image_url || "");
  const [description, setDescription] = useState(existingGame?.description || "");
  const [rulesSummary, setRulesSummary] = useState(existingGame?.rules_summary || "");
  const [isAvailable, setIsAvailable] = useState(
    existingGame?.is_available !== undefined ? existingGame.is_available : true
  );

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

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category_id: categoryId || null,
        min_players: parseInt(minPlayers, 10),
        max_players: parseInt(maxPlayers, 10),
        duration_minutes: parseInt(durationMinutes, 10),
        difficulty,
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

          {/* Status Ketersediaan */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Ketersediaan Permainan</Text>
              <Text style={styles.switchSublabel}>
                {isAvailable ? "Tersedia untuk dipinjam pengunjung" : "Sedang tidak tersedia / dipinjam"}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: "#CBD5E1", true: colors.primary }}
              thumbColor={isAvailable ? "#FFFFFF" : "#F1F5F9"}
            />
          </View>
        </View>

        {/* Card 2: Aturan & Spesifikasi Main */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="game-controller-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Spesifikasi & Gameplay</Text>
          </View>

          {/* Row Pemain & Durasi */}
          <View style={styles.twoColumnRow}>
            <View style={styles.columnHalf}>
              <Text style={styles.fieldLabel}>
                Min Pemain <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="people-outline" size={17} color={colors.textMuted} />
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
                <Ionicons name="people-outline" size={17} color={colors.textMuted} />
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

          <View style={[styles.twoColumnRow, { marginTop: 12 }]}>
            <View style={styles.columnHalf}>
              <Text style={styles.fieldLabel}>
                Durasi (Menit) <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="time-outline" size={17} color={colors.textMuted} />
                <TextInput
                  style={styles.colInput}
                  keyboardType="numeric"
                  placeholder="45"
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                />
              </View>
            </View>

            <View style={styles.columnHalf}>
              <Text style={styles.fieldLabel}>Tingkat Kesulitan</Text>
              <View style={styles.difficultyPicker}>
                {["Mudah", "Menengah", "Sulit"].map((lvl) => {
                  const active = difficulty === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[styles.diffChip, active && styles.diffChipActive]}
                      onPress={() => setDifficulty(lvl)}
                    >
                      <Text style={[styles.diffChipText, active && styles.diffChipTextActive]}>
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Card 3: Media & Gambar */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="image-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Cover & Media Visual</Text>
          </View>

          <Text style={styles.fieldLabel}>URL Gambar Sampul (Image URL)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="https://images.unsplash.com/..."
            placeholderTextColor={colors.textMuted}
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
          />

          {/* Quick Preset Buttons */}
          <Text style={[styles.fieldHint, { marginTop: 8 }]}>Gunakan template foto jika belum memiliki URL:</Text>
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

          {/* Live Preview Image */}
          {imageUrl.length > 5 && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Pratinjau Cover:</Text>
              <GameImage uri={imageUrl} style={styles.previewImage} />
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
    paddingHorizontal: 10,
    height: 42
  },
  colInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13.5,
    color: colors.text
  },
  difficultyPicker: {
    flexDirection: "row",
    height: 42,
    alignItems: "center",
    gap: 4
  },
  diffChip: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  diffChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  diffChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600"
  },
  diffChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
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
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border
  },
  previewLabel: {
    fontSize: 11,
    color: colors.textMuted,
    padding: 6,
    backgroundColor: "#F8FAFC"
  },
  previewImage: {
    width: "100%",
    height: 140
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
