import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function OfflineNotice({
  message = "Mode Offline: Menampilkan katalog tersimpan di perangkat. Pemesanan dinonaktifkan."
}) {
  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color="#B45309" style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center"
  },
  icon: {
    marginRight: 8
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
    lineHeight: 16
  }
});
