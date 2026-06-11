import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Bottom from './Bottom';
import Splash from '../screens/Splash';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import ExperienceScreen from '../screens/ExperienceScreen';

import FoodDetailScreen from '../screens/FoodDetailScreen';
import CatItemScreen from '../screens/CatItemScreen';
import OrderSummaryScreen from '../screens/OrderSummaryScreen';
import MapScreen from '../screens/MapScreen';
import OrderSuccessScreen from '../screens/ComfromScreen';
import SearchScreen from '../screens/SearchScreen';

import ItemDetalis from '../screens/ItemDetalis';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import OderCartScreen from '../screens/OderCartScreen';
import CouponesScreen from '../screens/CouponesScreen';
import TopPicksScreen from '../screens/TopPicksScreen';
import SaveAddressModal from '../components/SaveAddressModal';
import CuisineTypeSubCat from '../screens/CuisineTypeSubCat';
import PrivacyPolicyScreen from '../privacy&policy/PrivacyPolicyScreen';
import TermsConditionsScreen from '../privacy&policy/TermsConditionsScreen';
import SupportHelpScreen from '../privacy&policy/SupportHelpScreen';


const Stack = createStackNavigator();

const StackNav = () => {


  const [loading, setLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token); // token exists => user already logged in
      } catch (err) {
        console.log('Error reading AsyncStorage:', err);
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <Stack.Navigator
      initialRouteName={userToken ? 'ExperienceScreen' : 'Splash'}
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
        headerTintColor: '#000000',
      }}>


      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OtpScreen"
        component={OtpScreen}
        options={{ headerShown: false }}
      />


      <Stack.Screen
        name="Splash"
        component={Splash}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ExperienceScreen"
        component={ExperienceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FoodDetailScreen"
        component={FoodDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CatItemScreen"
        component={CatItemScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name='OrderSummaryScreen'
        component={OrderSummaryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='MapScreen'
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='OrderSuccessScreen'
        component={OrderSuccessScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name='SearchScreen'
        component={SearchScreen}
        options={{ headerShown: false }}
      />


      <Stack.Screen
        name='ItemDetalis'
        component={ItemDetalis}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='OrderDetailsScreen'
        component={OrderDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='OderCartScreen'
        component={OderCartScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name='CouponesScreen'
        component={CouponesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='TopPicksScreen'
        component={TopPicksScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='SaveAddressModal'
        component={SaveAddressModal}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='CuisineTypeSubCat'
        component={CuisineTypeSubCat}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Bottom"
        component={Bottom}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="PrivacyPolicyScreen"
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="TermsConditionsScreen"
        component={TermsConditionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SupportHelpScreen"
        component={SupportHelpScreen}
        options={{ headerShown: false }}
      />






    </Stack.Navigator>
  );
};

export default StackNav;