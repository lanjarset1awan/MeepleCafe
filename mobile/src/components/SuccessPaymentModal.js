import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import GameImage from "./GameImage";

export default function SuccessPaymentModal({
  visible,
  bookingCode,
  gameTitle,
  gameImage,
  tableType,
  tableNumber,
  reservationDate,
  sessionTime,
  totalPrice,
  paymentMethod,
  status = "Menunggu Konfirmasi",
  onViewTicket
}) {
  if (!visible) return null;

  const isPending = status === "Pending" || status === "Menunggu Konfirmasi";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon Celebration */}
          <View style={[styles.celebrationBadge, isPending && { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
            <View style={[styles.innerBadge, isPending && { backgroundColor: "#F59E0B" }]}>
              <Ionicons name={isPending ? "hourglass-outline" : "checkmark"} size={34} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.title}>
            {isPending ? "Pengajuan Terkirim!" : "Pembayaran Berhasil!"}
          </Text>
          <Text style={styles.subtitle}>
            {isPending
              ? "Bukti pembayaran terkirim. Tiket menunggu konfirmasi verifikasi dari Admin."
              : "Tiket resmi reservasi MeepleCafe Anda telah diterbitkan."}
          </Text>

          {/* Ticket Pass Preview Card */}
          <View style={styles.ticketPreview}>
            <View style={styles.ticketTop}>
              <View>
                <Text style={styles.brandText}>MEEPLECAFE TICKET PASS</Text>
                <Text style={styles.codeText}>{bookingCode || "MC-XXXX"}</Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  isPending && { backgroundColor: "#FEF3C7", borderColor: "#FDE68A", borderWidth: 1 }
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    isPending && { color: "#B45309" }
                  ]}
                >
                  {isPending ? "MENUNGGU KONFIRMASI" : "LUNAS"}
                </Text>
              </View>
            </View>

            {/* Perforated separator */}
            <View style={styles.separatorRow}>
              <View style={styles.cutoutLeft} />
              <View style={styles.dashedDivider} />
              <View style={styles.cutoutRight} />
            </View>

            <View style={styles.ticketDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Board Game:</Text>
                <View style={styles.gameValueRow}>
                  {gameImage ? (
                    <GameImage uri={gameImage} style={styles.modalGameThumb} />
                  ) : (
                    <Ionicons name="cube-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                  )}
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {gameTitle || "General Play"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Meja Kafe:</Text>
                <Text style={styles.detailValue}>
                  {tableType} ({tableNumber})
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Jadwal Main:</Text>
                <Text style={styles.detailValueHighlight}>{sessionTime}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tanggal:</Text>
                <Text style={styles.detailValue}>{reservationDate}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Metode Bayar:</Text>
                <Text style={styles.detailValue}>{paymentMethod}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Dibayar:</Text>
                <Text style={styles.totalAmount}>{totalPrice}</Text>
              </View>
            </View>
          </View>

          {/* Notice Box */}
          <View style={styles.noticeBox}>
            <Ionicons name="information-circle" size={16} color={colors.secondary} />
            <Text style={styles.noticeText}>
              Tunjukkan kode booking ini kepada Game Master kafe saat tiba di lokasi.
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onViewTicket}
            activeOpacity={0.88}
          >
            <Text style={styles.actionBtnText}>Buka Tiket Saya</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }
  },
  celebrationBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14
  },
  innerBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16
  },
  ticketPreview: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 14
  },
  ticketTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FFFFFF"
  },
  brandText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1
  },
  codeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 2
  },
  statusPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  statusPillText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "bold"
  },
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 16,
    overflow: "hidden"
  },
  cutoutLeft: {
    width: 12,
    height: 16,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: colors.card,
    borderRightWidth: 1,
    borderColor: colors.border
  },
  dashedDivider: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed"
  },
  cutoutRight: {
    width: 12,
    height: 16,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    backgroundColor: colors.card,
    borderLeftWidth: 1,
    borderColor: colors.border
  },
  ticketDetails: {
    padding: 14
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textMuted
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    maxWidth: "60%",
    textAlign: "right"
  },
  gameValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1
  },
  modalGameThumb: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: "#F1F5F9"
  },
  detailValueHighlight: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primaryDark
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: colors.border
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.text
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    width: "100%"
  },
  noticeText: {
    fontSize: 11,
    color: "#0F766E",
    marginLeft: 6,
    flex: 1,
    lineHeight: 16
  },
  actionBtn: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF"
  }
});
