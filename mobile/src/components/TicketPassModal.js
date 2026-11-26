import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { File, Directory, Paths } from "expo-file-system";
import { colors } from "../theme/colors";

/**
 * Menghasilkan pola batang barcode visual deterministik dari kode booking
 * sehingga E-Tiket tampil profesional tanpa ketergantungan jaringan/SVG.
 */
function buildBarcodePattern(code = "MC-0000") {
  const seed = String(code || "MC-0000");
  const bars = [
    { w: 3, gap: 2 },
    { w: 1.5, gap: 2.5 },
    { w: 3.5, gap: 2 }
  ];

  for (let i = 0; i < 28; i++) {
    const ch = seed.charCodeAt(i % seed.length);
    const val = (ch * (i + 7) + i * 13) % 10;
    const width = val < 3 ? 1.5 : val < 6 ? 2.5 : val < 8 ? 3.5 : 4.5;
    const gap = (val % 3) + 1.5;
    bars.push({ w: width, gap });
  }

  bars.push({ w: 3.5, gap: 2 }, { w: 1.5, gap: 2 }, { w: 3, gap: 0 });
  return bars;
}

/**
 * Menyalin hasil capture ke direktori persisten aplikasi & menyimpannya ke Galeri perangkat.
 */
async function persistAndSaveTicketImage(capturedUri, bookingCode) {
  const normalizedSrc = capturedUri.startsWith("file://") ? capturedUri : `file://${capturedUri}`;
  let persistentUri = normalizedSrc;

  // 1. Simpan salinan permanen di direktori dokumen aplikasi agar tetap ada meski cache dibersihkan
  try {
    const ticketsDir = new Directory(Paths.document, "tickets");
    ticketsDir.create({ intermediates: true, idempotent: true });
    const safeCode = String(bookingCode || "TICKET").replace(/[^A-Za-z0-9_-]/g, "");
    const destFile = new File(ticketsDir, `MeepleCafe-${safeCode}.png`);
    await new File(normalizedSrc).copy(destFile, { overwrite: true });
    persistentUri = destFile.uri;
  } catch (copyErr) {
    console.warn("[TicketPassModal] Salinan persisten fallback ke tmpfile:", copyErr?.message);
  }

  // 2. Simpan ke Galeri Foto perangkat melalui API Expo MediaLibrary SDK 58
  let savedToGallery = false;
  let permissionDenied = false;

  try {
    let perm = await MediaLibrary.getPermissionsAsync(true, ["photo"]);
    if (!perm?.granted) {
      perm = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
    }
    if (!perm?.granted) {
      perm = await MediaLibrary.requestPermissionsAsync(false, ["photo"]);
    }

    if (perm?.granted) {
      await MediaLibrary.Asset.create(persistentUri);
      savedToGallery = true;
    } else {
      permissionDenied = true;
    }
  } catch (galleryErr) {
    console.warn("[TicketPassModal] Simpan galeri fallback:", galleryErr?.message);
  }

  return { localUri: persistentUri, savedToGallery, permissionDenied };
}

export default function TicketPassModal({
  visible,
  ticket,
  downloadedInfo,
  autoDownload = false,
  onDownloadComplete,
  onClose
}) {
  const viewShotRef = useRef(null);
  const hasAutoDownloadedRef = useRef(false);

  const [isCardLaidOut, setIsCardLaidOut] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'info' | 'error', text: string }

  const barcodeBars = useMemo(
    () => buildBarcodePattern(ticket?.bookingCode),
    [ticket?.bookingCode]
  );

  // Reset state modal saat ditutup atau berganti tiket
  useEffect(() => {
    if (!visible) {
      setIsCardLaidOut(false);
      setDownloading(false);
      setSharing(false);
      setFeedback(null);
      hasAutoDownloadedRef.current = false;
    }
  }, [visible, ticket?.ticketKey]);

  const captureAndDownload = useCallback(async () => {
    if (!ticket || !viewShotRef.current || downloading) return;

    try {
      setDownloading(true);
      setFeedback(null);

      const capturedUri = await viewShotRef.current.capture();
      if (!capturedUri) {
        throw new Error("Gagal merender gambar E-Tiket.");
      }

      const { localUri, savedToGallery, permissionDenied } = await persistAndSaveTicketImage(
        capturedUri,
        ticket.bookingCode
      );

      const record = {
        ticketKey: ticket.ticketKey,
        bookingCode: ticket.bookingCode,
        localUri,
        savedToGallery,
        downloadedAt: new Date().toISOString(),
        snapshot: ticket.rawItem || null
      };

      if (onDownloadComplete) {
        await onDownloadComplete(ticket.ticketKey, record);
      }

      if (savedToGallery) {
        setFeedback({
          type: "success",
          text: `E-Tiket ${ticket.bookingCode} berhasil diunduh ke Galeri Foto HP & tersimpan offline! Siap ditunjukkan ke kasir.`
        });
      } else if (permissionDenied) {
        setFeedback({
          type: "info",
          text: `E-Tiket tersimpan offline di aplikasi. Izin galeri ditolak — ketuk "Bagikan / Simpan File" untuk menyimpan ke folder HP.`
        });
      } else {
        setFeedback({
          type: "info",
          text: `E-Tiket tersimpan offline di aplikasi! Anda juga dapat mengekspornya lewat tombol "Bagikan / Simpan File".`
        });
      }
    } catch (err) {
      console.warn("[TicketPassModal] Error capture/download:", err?.message);
      setFeedback({
        type: "error",
        text: "Gagal mengunduh gambar E-Tiket. Anda tetap dapat menunjukkan layar E-Tiket ini langsung ke kasir."
      });
    } finally {
      setDownloading(false);
    }
  }, [ticket, downloading, onDownloadComplete]);

  // Trigger download otomatis jika dibuka via tombol "Download Tiket"
  useEffect(() => {
    if (visible && autoDownload && isCardLaidOut && !hasAutoDownloadedRef.current && ticket) {
      hasAutoDownloadedRef.current = true;
      const timer = setTimeout(() => {
        captureAndDownload();
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [visible, autoDownload, isCardLaidOut, ticket, captureAndDownload]);

  const handleShareOrSaveFile = async () => {
    if (!ticket || sharing || downloading) return;

    try {
      setSharing(true);
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        setFeedback({
          type: "error",
          text: "Fitur berbagi/simpan file tidak tersedia pada perangkat ini."
        });
        return;
      }

      let shareUri = downloadedInfo?.localUri || null;
      if (shareUri) {
        try {
          if (!new File(shareUri).exists) {
            shareUri = null;
          }
        } catch (e) {
          shareUri = null;
        }
      }

      if (!shareUri && viewShotRef.current) {
        const capturedUri = await viewShotRef.current.capture();
        const saved = await persistAndSaveTicketImage(capturedUri, ticket.bookingCode);
        shareUri = saved.localUri;

        if (onDownloadComplete) {
          await onDownloadComplete(ticket.ticketKey, {
            ticketKey: ticket.ticketKey,
            bookingCode: ticket.bookingCode,
            localUri: shareUri,
            savedToGallery: saved.savedToGallery,
            downloadedAt: new Date().toISOString(),
            snapshot: ticket.rawItem || null
          });
        }
      }

      if (shareUri) {
        await Sharing.shareAsync(shareUri, {
          mimeType: "image/png",
          dialogTitle: `Simpan atau Bagikan E-Tiket ${ticket.bookingCode}`
        });
      }
    } catch (err) {
      console.warn("[TicketPassModal] Share error:", err?.message);
      setFeedback({
        type: "error",
        text: "Gagal membuka dialog simpan/bagikan file E-Tiket."
      });
    } finally {
      setSharing(false);
    }
  };

  if (!visible || !ticket) return null;

  const isPending = ticket.statusType === "pending";
  const isRejected = ticket.statusType === "rejected";
  const isExpired = ticket.statusType === "expired";
  const isDownloaded = Boolean(downloadedInfo?.localUri);

  const statusBadgeStyle = isRejected
    ? { bg: "#FEE2E2", text: "#DC2626", label: "DITOLAK" }
    : isPending
      ? { bg: "#FEF3C7", text: "#B45309", label: "MENUNGGU VERIFIKASI" }
      : isExpired
        ? { bg: "#F1F5F9", text: "#64748B", label: "KEDALUWARSA" }
        : { bg: "#DCFCE7", text: "#15803D", label: "AKTIF • SIAP KASIR" };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Ionicons name="ticket" size={20} color="#38BDF8" style={{ marginRight: 8 }} />
            <Text style={styles.topBarTitle}>E-Tiket Resmi Kasir</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Kartu E-Tiket yang akan dicapture menjadi Gambar PNG */}
          <ViewShot
            ref={viewShotRef}
            options={{
              format: "png",
              quality: 1,
              result: "tmpfile",
              fileName: `MeepleCafe-${ticket.bookingCode}`
            }}
            style={styles.passCard}
            onLayout={() => setIsCardLaidOut(true)}
          >
            {/* Header Brand Gelap */}
            <View style={styles.passHeader}>
              <View style={styles.passBrandRow}>
                <Image
                  source={require("../../assets/Logo-MeepleCafe.jpeg")}
                  style={styles.passLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={styles.passBrandName}>MEEPLECAFE</Text>
                  <Text style={styles.passBrandSub}>OFFICIAL RESERVATION PASS</Text>
                </View>
              </View>

              <View style={[styles.passStatusPill, { backgroundColor: statusBadgeStyle.bg }]}>
                <Text style={[styles.passStatusText, { color: statusBadgeStyle.text }]}>
                  {statusBadgeStyle.label}
                </Text>
              </View>
            </View>

            {/* Kode Booking & Barcode Kasir */}
            <View style={styles.codeHeroSection}>
              <Text style={styles.codeHeroLabel}>KODE BOOKING KASIR</Text>
              <Text style={styles.codeHeroValue}>{ticket.bookingCode}</Text>

              <View style={styles.barcodeContainer}>
                <View style={styles.barcodeRow}>
                  {barcodeBars.map((bar, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.barcodeBar,
                        { width: bar.w, marginRight: bar.gap }
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.barcodeCaption}>
                  Tunjukkan kode ini saat check-in di kasir MeepleCafe
                </Text>
              </View>
            </View>

            {/* Garis Sobekan Tiket */}
            <View style={styles.perforationRow}>
              <View style={styles.notchLeft} />
              <View style={styles.dashedDivider} />
              <View style={styles.notchRight} />
            </View>

            {/* Isi Detail Reservasi */}
            <View style={styles.passBody}>
              {/* Board Game Terpilih */}
              <View style={styles.gameHighlightBox}>
                <View style={styles.gameIconCircle}>
                  <Ionicons name="dice" size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gameBoxLabel}>BOARD GAME DIPESAN</Text>
                  <Text style={styles.gameBoxTitle} numberOfLines={2}>
                    {ticket.gameTitle}
                  </Text>
                </View>
              </View>

              {/* Grid Detail */}
              <View style={styles.detailGridRow}>
                <View style={styles.detailGridCol}>
                  <Text style={styles.detailLabel}>PEMESAN</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {ticket.customerName}
                  </Text>
                </View>
                <View style={styles.detailGridColRight}>
                  <Text style={styles.detailLabel}>PEMAIN</Text>
                  <Text style={styles.detailValue}>{ticket.guestCount} Orang</Text>
                </View>
              </View>

              <View style={styles.detailGridRow}>
                <View style={styles.detailGridCol}>
                  <Text style={styles.detailLabel}>MEJA BERMAIN</Text>
                  <Text style={styles.detailValue}>{ticket.tableLabel}</Text>
                </View>
                <View style={styles.detailGridColRight}>
                  <Text style={styles.detailLabel}>TANGGAL MAIN</Text>
                  <Text style={styles.detailValue}>{ticket.reservationDate}</Text>
                </View>
              </View>

              {/* Sesi Jam Bermain */}
              <View style={styles.sessionBox}>
                <Ionicons name="time" size={16} color={colors.primaryDark} />
                <Text style={styles.sessionBoxText}>{ticket.sessionTime}</Text>
              </View>

              {/* Ringkasan Pembayaran */}
              <View style={styles.paymentSummaryRow}>
                <View>
                  <Text style={styles.paymentLabel}>Total Pembayaran</Text>
                  <Text style={styles.paymentTotalValue}>{ticket.totalPrice}</Text>
                </View>
                <View style={styles.paymentMethodBadge}>
                  <Ionicons
                    name={isPending ? "hourglass-outline" : "checkmark-circle"}
                    size={14}
                    color={isPending ? "#B45309" : "#15803D"}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      isPending && { color: "#B45309" }
                    ]}
                  >
                    {ticket.paymentMethod} ({isPending ? "Verifikasi" : isRejected ? "Ditolak" : "Lunas"})
                  </Text>
                </View>
              </View>
            </View>

            {/* Footer Verifikasi Kasir */}
            <View style={styles.passFooter}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.passFooterText}>
                E-Tiket Resmi MeepleCafe • Berlaku offline saat check-in kasir
              </Text>
            </View>
          </ViewShot>

          {/* Status Feedback Banner */}
          {feedback ? (
            <View
              style={[
                styles.feedbackBanner,
                feedback.type === "success" && styles.feedbackBannerSuccess,
                feedback.type === "error" && styles.feedbackBannerError
              ]}
            >
              <Ionicons
                name={
                  feedback.type === "success"
                    ? "checkmark-circle"
                    : feedback.type === "error"
                      ? "alert-circle"
                      : "information-circle"
                }
                size={18}
                color={
                  feedback.type === "success"
                    ? "#15803D"
                    : feedback.type === "error"
                      ? "#DC2626"
                      : "#B45309"
                }
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.feedbackText,
                  feedback.type === "success" && { color: "#166534" },
                  feedback.type === "error" && { color: "#991B1B" }
                ]}
              >
                {feedback.text}
              </Text>
            </View>
          ) : isDownloaded ? (
            <View style={[styles.feedbackBanner, styles.feedbackBannerSuccess]}>
              <Ionicons name="cloud-done" size={18} color="#15803D" style={{ marginRight: 8 }} />
              <Text style={[styles.feedbackText, { color: "#166534" }]}>
                E-Tiket sudah tersimpan offline di perangkat ini dan siap ditunjukkan ke kasir.
              </Text>
            </View>
          ) : null}

          {/* Tombol Aksi Unduh & Bagikan */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.primaryActionBtn, downloading && styles.disabledBtn]}
              activeOpacity={0.85}
              onPress={captureAndDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons
                  name={isDownloaded ? "checkmark-done-circle" : "download-outline"}
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={styles.primaryActionText}>
                {downloading
                  ? "Menyimpan E-Tiket..."
                  : isDownloaded
                    ? "Simpan Ulang ke Galeri"
                    : "Download Tiket ke Galeri"}
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryRow}>
              <TouchableOpacity
                style={[styles.secondaryActionBtn, sharing && styles.disabledBtn]}
                activeOpacity={0.85}
                onPress={handleShareOrSaveFile}
                disabled={sharing || downloading}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
                ) : (
                  <Ionicons name="share-social-outline" size={18} color="#E2E8F0" style={{ marginRight: 6 }} />
                )}
                <Text style={styles.secondaryActionText}>
                  {sharing ? "Menyiapkan..." : "Bagikan / Simpan File"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeFooterBtn}
                activeOpacity={0.85}
                onPress={onClose}
              >
                <Text style={styles.closeFooterBtnText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.92)"
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 12
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  topBarTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold"
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center"
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 34,
    alignItems: "center"
  },
  passCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16
  },
  passHeader: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  passBrandRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  passLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    marginRight: 10
  },
  passBrandName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1
  },
  passBrandSub: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 1
  },
  passStatusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12
  },
  passStatusText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.4
  },
  codeHeroSection: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "#F8FAFC"
  },
  codeHeroLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 1.2
  },
  codeHeroValue: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.darkBg,
    letterSpacing: 2,
    marginTop: 2
  },
  barcodeContainer: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    width: "100%"
  },
  barcodeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38
  },
  barcodeBar: {
    height: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 1
  },
  barcodeCaption: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
    fontWeight: "600"
  },
  perforationRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
    backgroundColor: "#FFFFFF"
  },
  notchLeft: {
    width: 12,
    height: 20,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: "#0F172A",
    opacity: 0.85
  },
  dashedDivider: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    marginHorizontal: 4
  },
  notchRight: {
    width: 12,
    height: 20,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: "#0F172A",
    opacity: 0.85
  },
  passBody: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14
  },
  gameHighlightBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14
  },
  gameIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  gameBoxLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryDark,
    letterSpacing: 0.7
  },
  gameBoxTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2
  },
  detailGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 11
  },
  detailGridCol: {
    flex: 1,
    marginRight: 8
  },
  detailGridColRight: {
    alignItems: "flex-end"
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2
  },
  sessionBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 4
  },
  sessionBoxText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primaryDark,
    marginLeft: 6
  },
  paymentSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#E2E8F0"
  },
  paymentLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: "600"
  },
  paymentTotalValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primaryDark,
    marginTop: 1
  },
  paymentMethodBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
    marginLeft: 4
  },
  passFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderColor: "#E2E8F0"
  },
  passFooterText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: colors.textMuted
  },
  feedbackBanner: {
    width: "100%",
    maxWidth: 380,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 12,
    borderRadius: 12,
    marginTop: 14
  },
  feedbackBannerSuccess: {
    backgroundColor: "#DCFCE7",
    borderColor: "#BBF7D0"
  },
  feedbackBannerError: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA"
  },
  feedbackText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
    lineHeight: 17
  },
  actionsContainer: {
    width: "100%",
    maxWidth: 380,
    marginTop: 16
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 4
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "bold"
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 12,
    borderRadius: 12
  },
  secondaryActionText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "700"
  },
  closeFooterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)"
  },
  closeFooterBtnText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "700"
  },
  disabledBtn: {
    opacity: 0.65
  }
});
