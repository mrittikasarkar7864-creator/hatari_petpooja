import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Screens
import HomeScreen from '../screens/BottomScreen/HomeScreen';
import ProfileScreen from '../screens/BottomScreen/ProfileScreen';

import MenuScreen from '../screens/BottomScreen/MenuScreen';
import OrderSummary from '../screens/BottomScreen/OrderSummary';
import ItemDetalis from '../screens/ItemDetalis';

const Tab = createBottomTabNavigator();

const Bottom = () => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          initialRouteName="HomeScreen"
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: '#FF4D4D',
            tabBarInactiveTintColor: '#999',
            unmountOnBlur: false,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              marginBottom: Platform.OS === 'ios' ? 4 : 6,
            },
            tabBarStyle: [
              styles.tabBar,
              {
                height:
                  Platform.OS === 'ios'
                    ? 70 + insets.bottom * 0.5
                    : 68 + insets.bottom * 0.3,
                paddingBottom: insets.bottom > 0 ? insets.bottom / 2 : 8,
              },
            ],
            tabBarIcon: ({ focused, color }) => {
              let iconName;
              switch (route.name) {
                case 'HomeScreen':
                  iconName = focused ? 'home' : 'home-outline';
                  break;
                case 'MenuScreen':
                  iconName = focused ? 'restaurant' : 'restaurant-outline';
                  break;
                case 'OrderSummary':
                  iconName = focused ? 'receipt' : 'receipt-outline';
                  break;
                case 'CartScreen':
                  iconName = focused ? 'cart' : 'cart-outline';
                  break;
                case 'ProfileScreen':
                  iconName = focused ? 'person' : 'person-outline';
                  break;
              }

              return (
                <Ionicons
                  name={iconName}
                  size={26}
                  color={color}
                  style={{ marginBottom: Platform.OS === 'ios' ? -2 : 0 }}
                />
              );
            },
          })}
        >
          <Tab.Screen
            name="HomeScreen"
            component={HomeScreen}
            options={{ tabBarLabel: 'Home' }}
          />
          <Tab.Screen
            name="MenuScreen"
            component={MenuScreen}
            options={{ tabBarLabel: 'Menu' }}
          />
          <Tab.Screen
            name="OrderSummary"
            component={ItemDetalis}
            options={{ tabBarLabel: 'Orders' }}
          />
          <Tab.Screen
            name="ProfileScreen"
            component={ProfileScreen}
            options={{ tabBarLabel: 'Profile' }}
          />
        </Tab.Navigator>
      </View>
    </SafeAreaView>
  );
};

export default Bottom;

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 10,
    right: 10,
    // bottom: 10,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#fff',
    elevation: 10, // Android shadow
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
});
