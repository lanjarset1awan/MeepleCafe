import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import AppNavigator from "./src/navigation/AppNavigator";
import { colors } from "./src/theme/colors";

// Tahan splash screen agar tidak langsung hilang otomatis sebelum komponen siap
SplashScreen.preventAutoHideAsync().catch(() => {});

// Konfigurasi animasi transisi fade yang halus saat splash ditutup
if (typeof SplashScreen.setOptions === "function") {
  SplashScreen.setOptions({
    duration: 350,
    fade: true
  });
}

const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background
  }
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Beri waktu 250ms agar native view, navigasi, dan theme selesai ter-mount
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root} onLayout={onLayoutRootView}>
        <NavigationContainer theme={customTheme}>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  }
});
