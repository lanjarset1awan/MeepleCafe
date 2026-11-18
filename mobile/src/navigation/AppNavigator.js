import React from "react";
import { View, Text, ActivityIndicator, Image, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import LandingScreen from "../screens/LandingScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

import GameListScreen from "../screens/GameListScreen";
import GameDetailScreen from "../screens/GameDetailScreen";
import GameInventoryScreen from "../screens/GameInventoryScreen";
import TableListScreen from "../screens/TableListScreen";
import TableDetailScreen from "../screens/TableDetailScreen";
import BookingFormScreen from "../screens/BookingFormScreen";
import MyTicketsScreen from "../screens/MyTicketsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import AboutScreen from "../screens/AboutScreen";

import { colors } from "../theme/colors";

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const GameStack = createNativeStackNavigator();
const InventoryStack = createNativeStackNavigator();
const TableStack = createNativeStackNavigator();
const TicketStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// 1. Stack Katalog Game (Visual Cards & Tutorial)
function GameStackNavigator() {
  return (
    <GameStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.darkBg },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "bold" }
      }}
    >
      <GameStack.Screen
        name="GameList"
        component={GameListScreen}
        options={{ headerShown: false }}
      />
      <GameStack.Screen
        name="GameDetail"
        component={GameDetailScreen}
        options={({ route }) => ({
          title: route.params?.title || "Detail Permainan"
        })}
      />
    </GameStack.Navigator>
  );
}

// 2. Stack Daftar Game (Compact Inventory Rak Kafe & Stok)
function InventoryStackNavigator() {
  return (
    <InventoryStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.darkBg },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "bold" }
      }}
    >
      <InventoryStack.Screen
        name="GameInventory"
        component={GameInventoryScreen}
        options={{ headerShown: false }}
      />
      <InventoryStack.Screen
        name="GameDetail"
        component={GameDetailScreen}
        options={({ route }) => ({
          title: route.params?.title || "Detail Permainan"
        })}
      />
    </InventoryStack.Navigator>
  );
}

// 3. Stack Reservasi Meja
function TableStackNavigator() {
  return (
    <TableStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.darkBg },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "bold" }
      }}
    >
      <TableStack.Screen
        name="TableList"
        component={TableListScreen}
        options={{ headerShown: false }}
      />
      <TableStack.Screen
        name="TableDetail"
        component={TableDetailScreen}
        options={({ route }) => ({
          title: route.params?.title || "Fasilitas Meja"
        })}
      />
      <TableStack.Screen
        name="BookingForm"
        component={BookingFormScreen}
        options={{
          title: "Form Reservasi Meja"
        }}
      />
    </TableStack.Navigator>
  );
}

// 4. Stack Tiket
function TicketStackNavigator() {
  return (
    <TicketStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.darkBg },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "bold" }
      }}
    >
      <TicketStack.Screen
        name="MyTickets"
        component={MyTicketsScreen}
        options={{ headerShown: false }}
      />
    </TicketStack.Navigator>
  );
}

// 5. Stack Profile
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.darkBg },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "bold" }
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: "Edit Profil Pengguna",
          headerShown: true
        }}
      />
    </ProfileStack.Navigator>
  );
}

// Main Bottom Tab Navigator (5 Tab Utama Aplikasi)
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600"
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "GameTab") {
            iconName = focused ? "albums" : "albums-outline";
          } else if (route.name === "InventoryTab") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "TableTab") {
            return (
              <MaterialCommunityIcons
                name="table-chair"
                size={21}
                color={color}
              />
            );
          } else if (route.name === "TicketsTab") {
            iconName = focused ? "ticket" : "ticket-outline";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={20} color={color} />;
        }
      })}
    >
      <Tab.Screen
        name="GameTab"
        component={GameStackNavigator}
        options={{ tabBarLabel: "Katalog" }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryStackNavigator}
        options={{ tabBarLabel: "Daftar Game" }}
      />
      <Tab.Screen
        name="TableTab"
        component={TableStackNavigator}
        options={{ tabBarLabel: "Meja Kafe" }}
      />
      <Tab.Screen
        name="TicketsTab"
        component={TicketStackNavigator}
        options={{ tabBarLabel: "Tiket Saya" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: "Profil" }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator: Memisahkan Auth Flow (Landing, Login, Register) & Main App Flow
export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splashCenter}>
        <Image
          source={require("../../assets/Logo-MeepleCafe.jpeg")}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
        <Text style={styles.splashText}>Menyiapkan sesi MeepleCafe...</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      {user ? (
        // Pengguna sudah login -> Masuk ke 5 Tab Utama & Screen Full (tanpa bottom navbar)
        <RootStack.Group>
          <RootStack.Screen name="MainApp" component={MainTabNavigator} />
          <RootStack.Screen
            name="About"
            component={AboutScreen}
            options={{
              headerShown: true,
              animation: "slide_from_right",
              title: "Tentang MeepleCafe",
              headerStyle: { backgroundColor: colors.darkBg },
              headerTintColor: "#FFFFFF",
              headerTitleStyle: { fontWeight: "bold" }
            }}
          />
        </RootStack.Group>
      ) : (
        // Pengguna belum login -> Katalog Game (Landing) & Autentikasi
        <RootStack.Group>
          <RootStack.Screen name="Landing" component={LandingScreen} />
          <RootStack.Screen
            name="GameDetail"
            component={GameDetailScreen}
            options={({ route }) => ({
              headerShown: true,
              animation: "slide_from_right",
              title: route.params?.title || "Detail Permainan",
              headerStyle: { backgroundColor: colors.darkBg },
              headerTintColor: "#FFFFFF",
              headerTitleStyle: { fontWeight: "bold" }
            })}
          />
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Register" component={RegisterScreen} />
          <RootStack.Screen
            name="About"
            component={AboutScreen}
            options={{
              headerShown: true,
              animation: "slide_from_right",
              title: "Tentang MeepleCafe",
              headerStyle: { backgroundColor: colors.darkBg },
              headerTintColor: "#FFFFFF",
              headerTitleStyle: { fontWeight: "bold" }
            }}
          />
        </RootStack.Group>
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  splashCenter: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  splashLogo: {
    width: 80,
    height: 80,
    borderRadius: 40
  },
  splashText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500"
  }
});
