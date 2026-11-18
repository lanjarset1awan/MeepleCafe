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
  Alert,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    setErrorMessage("");
    if (!identifier.trim()) {
      setErrorMessage("Username atau Email wajib diisi.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Kata sandi wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      await login(identifier, password);
      // Sukses login -> AuthContext otomatis mengarahkan ke MainTabs
    } catch (err) {
      setErrorMessage(err.message || "Gagal masuk. Silakan periksa kembali data Anda.");
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
          {/* Header Bar dengan Tombol Kembali */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerBarTitle}>Masuk Akun</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Logo & Judul Sambutan */}
          <View style={styles.brandBox}>
            <Image
              source={require("../../assets/Logo-MeepleCafe.jpeg")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Selamat Datang!</Text>
            <Text style={styles.subtitle}>
              Silakan masuk untuk melanjutkan reservasi meja dan memilih koleksi board game.
            </Text>
          </View>

          {/* Alert Error jika ada */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#991B1B" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Input */}
          <View style={styles.form}>
            {/* Input Identifier */}
            <Text style={styles.inputLabel}>Username, Email, atau NIM</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contoh: lanjar atau lanjar@meeplecafe.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={identifier}
                onChangeText={(val) => {
                  setIdentifier(val);
                  if (errorMessage) setErrorMessage("");
                }}
              />
            </View>

            {/* Input Password */}
            <Text style={styles.inputLabel}>Kata Sandi</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan kata sandi..."
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

            {/* Tombol Masuk */}
            <TouchableOpacity
              style={[styles.btnSubmit, submitting && styles.btnDisabled]}
              activeOpacity={0.88}
              onPress={handleLogin}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.btnSubmitText}>Masuk Sekarang</Text>
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Navigasi ke Halaman Register */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Belum memiliki akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.footerLink}>Daftar Sekarang</Text>
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 14 : 14,
    paddingBottom: 40
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }
  },
  headerBarTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text
  },
  brandBox: {
    alignItems: "center",
    marginBottom: 20
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.darkBg,
    marginBottom: 6
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 10
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 16
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
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
    marginTop: 4
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14
  },
  inputIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text
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
    marginTop: 6,
    marginBottom: 10,
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
    marginTop: 6
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
