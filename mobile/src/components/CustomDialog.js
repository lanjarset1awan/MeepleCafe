import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function CustomDialog({
  visible,
  type = "info", // "warning", "error", "success", "info", "danger"
  iconName: customIconName,
  title,
  message,
  confirmText = "Mengerti",
  cancelText,
  secondaryText,
  onConfirm,
  onCancel,
  onSecondary,
  onClose
}) {
  if (!visible) return null;

  const getTypeStyle = () => {
    switch (type) {
      case "danger":
        return {
          iconName: customIconName || "log-out-outline",
          iconColor: "#DC2626",
          badgeBg: "#FEE2E2",
          borderColor: "#FECACA",
          buttonBg: "#DC2626"
        };
      case "warning":
        return {
          iconName: customIconName || "alert-circle",
          iconColor: colors.secondary,
          badgeBg: colors.secondaryLight,
          borderColor: "#FED7AA",
          buttonBg: colors.secondary
        };
      case "error":
        return {
          iconName: customIconName || "close-circle",
          iconColor: "#DC2626",
          badgeBg: "#FEE2E2",
          borderColor: "#FECACA",
          buttonBg: "#DC2626"
        };
      case "success":
        return {
          iconName: customIconName || "checkmark-circle",
          iconColor: "#16A34A",
          badgeBg: "#DCFCE7",
          borderColor: "#BBF7D0",
          buttonBg: "#16A34A"
        };
      default:
        return {
          iconName: customIconName || "information-circle",
          iconColor: colors.primary,
          badgeBg: colors.primaryLight,
          borderColor: "#E0E7FF",
          buttonBg: colors.primary
        };
    }
  };

  const currentType = getTypeStyle();

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (onClose) onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  const handleSecondary = () => {
    if (onSecondary) onSecondary();
    if (onClose) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogCard}>
              {/* Icon Badge */}
              <View style={[styles.iconBadge, { backgroundColor: currentType.badgeBg }]}>
                <Ionicons name={currentType.iconName} size={32} color={currentType.iconColor} />
              </View>

              {/* Title & Message */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {secondaryText && (
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={handleSecondary}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.secondaryBtnText}>{secondaryText}</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.buttonRow}>
                  {cancelText && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={handleCancel}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelBtnText} numberOfLines={1} adjustsFontSizeToFit>
                        {cancelText}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.confirmBtn,
                      { backgroundColor: currentType.buttonBg },
                      !cancelText && { flex: 1 }
                    ]}
                    onPress={handleConfirm}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.confirmBtnText} numberOfLines={1} adjustsFontSizeToFit>
                      {confirmText}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  dialogCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8
  },
  message: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20
  },
  buttonContainer: {
    width: "100%"
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    gap: 10
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center"
  },
  confirmBtn: {
    flex: 1.2,
    minHeight: 46,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center"
  }
});
