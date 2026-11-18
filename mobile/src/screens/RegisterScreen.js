import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nim, setNim] = useState("");
  const [major, setMajor] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async () => {
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Nama lengkap wajib diisi.");
      return;
    }
    if (!username.trim()) {
      setErrorMessage("Username wajib diisi.");
      return;
    }
    if (username.trim().includes(" ")) {
      setErrorMessage("Username tidak boleh mengandung spasi.");
      return;
    }
    if (!password.trim() || password.trim().length < 3) {
      setErrorMessage("Kata sandi minimal 3 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    try {
      setSubmitting(true);
      await register({
        name,
        username,
        email,
        phone,
        nim,
        major,
        password
      });

      Alert.alert(
        "Pendaftaran Berhasil!",
        `Selamat datang di MeepleCafe, ${name}! Akun Anda telah siap digunakan.`,
        [{ text: "Mulai Bermain" }]
      );
      // Sukses registrasi -> AuthContext otomatis login & mengarahkan ke MainTabs
    } catch (err) {
      setErrorMessage(err.message || "Gagal mendaftarkan akun. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerBarTitle}>Pendaftaran Akun</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Judul Registrasi */}
          <View style={styles.brandBox}>
            <Image
              source={require("../../assets/Logo-MeepleCafe.jpeg")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Buat Akun Meeple</Text>
            <Text style={styles.subtitle}>
              Daftarkan diri Anda untuk memesan meja bermain dan menikmati katalog board game terlengkap.
            </Text>
          </View>

          {/* Alert Error jika ada */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#991B1B" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Registrasi */}
          <View style={styles.form}>
            {/* Nama Lengkap */}
            <Text style={styles.inputLabel}>
              Nama Lengkap <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contoh: Budi Santoso"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errorMessage) setErrorMessage("");
                }}
              />
            </View>

            {/* Username */}
            <Text style={styles.inputLabel}>
              Username <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="at-outline" size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contoh: budi123 (tanpa spasi)"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={(val) => {
                  setUsername(val);
                  if (errorMessage) setErrorMessage("");
                }}
              />
            </View>

            {/* Email (Opsional) */}
            <Text style={styles.inputLabel}>Email (Opsional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contoh: budi@gmail.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Nomor Telepon / WA */}
            <Text style={styles.inputLabel}>Nomor WhatsApp / HP</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contoh: 081234567890"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* NIM & Program Studi (Opsional) */}
            <View style={styles.twoColRow}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.inputLabel}>NIM (Opsional)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="211201..."
                    placeholderTextColor={colors.textMuted}
                    value={nim}
                    onChangeText={setNim}
                  />
                </View>
              </View>
              <View style={{ flex: 1.2, marginLeft: 6 }}>
                <Text style={styles.inputLabel}>Program Studi</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Teknik Komputer"
                    placeholderTextColor={colors.textMuted}
                    value={major}
                    onChangeText={setMajor}
                  />
                </View>
              </View>
            </View>

            {/* Kata Sandi */}
            <Text style={styles.inputLabel}>
              Kata Sandi <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Minimal 3 karakter..."
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage("");
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={19}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Konfirmasi Kata Sandi */}
            <Text style={styles.inputLabel}>
              Konfirmasi Kata Sandi <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ulangi kata sandi Anda..."
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (errorMessage) setErrorMessage("");
                }}
              />
            </View>

            {/* Tombol Daftar */}
            <TouchableOpacity
              style={[styles.btnSubmit, submitting && styles.btnDisabled]}
              activeOpacity={0.88}
              onPress={handleRegister}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.btnSubmitText}>Daftar Sekarang</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Navigasi ke Halaman Login */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Sudah memiliki akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerLink}>Masuk di sini</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  headerBarTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text
  },
  brandBox: {
    alignItems: "center",
    marginBottom: 16
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 10
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.darkBg,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 14
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    color: "#991B1B",
    fontWeight: "500"
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 18
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 5,
    marginTop: 2
  },
  required: {
    color: colors.accent
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12
  },
  inputIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: colors.text
  },
  twoColRow: {
    flexDirection: "row"
  },
  eyeButton: {
    padding: 6
  },
  btnSubmit: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    marginTop: 8,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 }
  },
  btnDisabled: {
    opacity: 0.6
  },
  btnSubmitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted
  },
  footerLink: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.primary
  }
});
