import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import GameListScreen from "../screens/GameListScreen";
import GameDetailScreen from "../screens/GameDetailScreen";
import TableListScreen from "../screens/TableListScreen";
import TableDetailScreen from "../screens/TableDetailScreen";
import BookingFormScreen from "../screens/BookingFormScreen";
import MyTicketsScreen from "../screens/MyTicketsScreen";
import ProfileScreen from "../screens/ProfileScreen";

import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();
const GameStack = createNativeStackNavigator();
const TableStack = createNativeStackNavigator();
const TicketStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// 1. Stack Katalog Game
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

// 2. Stack Reservasi Meja
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

// 3. Stack Tiket
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

// 4. Stack Profile
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
    </ProfileStack.Navigator>
  );
}

// Main Bottom Tab Navigator (Modul 6)
export default function AppNavigator() {
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
          height: 60,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600"
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "GameTab") {
            iconName = focused ? "cube" : "cube-outline";
          } else if (route.name === "TableTab") {
            iconName = focused ? "restaurant" : "restaurant-outline";
          } else if (route.name === "TicketsTab") {
            iconName = focused ? "ticket" : "ticket-outline";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        }
      })}
    >
      <Tab.Screen
        name="GameTab"
        component={GameStackNavigator}
        options={{ tabBarLabel: "Katalog Game" }}
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

