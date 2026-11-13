import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator, Image as RNImage } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { resolveImageUrl, getBackendProxyUrl, FALLBACK_BOARDGAME_IMAGE } from "../utils/imageUrl";

export default function GameImage({ uri, style, contentFit = "cover" }) {
  // Level error fallback: 0 = wsrv.nl proxy, 1 = backend proxy, 2 = static fallback
  const [errorLevel, setErrorLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const getSourceUri = () => {
    if (!uri) return FALLBACK_BOARDGAME_IMAGE;
    if (errorLevel === 0) return resolveImageUrl(uri);
    if (errorLevel === 1) return getBackendProxyUrl(uri);
    return FALLBACK_BOARDGAME_IMAGE;
  };

  const currentUri = getSourceUri();

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: currentUri }}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        transition={250}
        cachePolicy="memory-disk"
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          if (errorLevel < 2) {
            setErrorLevel((prev) => prev + 1);
          } else {
            setIsLoading(false);
          }
        }}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {errorLevel >= 2 && !uri && (
        <View style={styles.errorOverlay}>
          <Ionicons name="image-outline" size={24} color={colors.textMuted} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    position: "relative"
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(241, 245, 249, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center"
  }
});
