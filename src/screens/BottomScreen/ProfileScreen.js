// src/screens/ProfileScreen.js
import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch, useSelector} from 'react-redux';

import DashboardScreen from '../../components/DashboardScreen';
import CustomHeader from '../../components/CustomHeader';
import Theme from '../../assets/theme';
import {fetchUserProfile} from '../../redux/slice/profileSlice';

const ProfileScreen = ({navigation}) => {
  
  const dispatch = useDispatch();
  const userData = useSelector(state => state.profile);

  const userdata = userData?.userData;

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Do you want to Logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'OK',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              'status',
              'token',
              'user',
              'Experience',
              'Brand',
            ]);

            navigation.reset({
              index: 0,
              routes: [{name: 'LoginScreen'}],
            });
          } catch (e) {
            console.log('Logout Error', e);
          }
        },
      },
    ]);
  };

  return (
    <>
      <CustomHeader title="Profile" />
      <DashboardScreen>
        <View style={styles.container}>
          {/* ⭐ PROFILE SECTION ADDED HERE ⭐ */}
          <View style={styles.profileBox}>
            <Image
              source={{
                uri:
                  userData?.data?.image ||
                  'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              }}
              style={styles.profileImage}
            />

            <View style={{marginLeft: 15}}>
              <Text style={styles.name}>{userdata?.name || 'user'}</Text>
              <Text style={styles.phone}>
                {userdata?.mobileNumber || 7864807035}
              </Text>
            </View>
          </View>

          {/* ===== Menu Options ===== */}
          <View style={styles.menuContainer}>
            {[
              {
                title: 'Address',
                icon: 'location-on',
                renavigation: 'MapScreen',
              },
              {
                title: 'My Orders',
                icon: 'shopping-cart',
                renavigation: 'ItemDetalis',
              },
              {
                title: 'Help and Support',
                icon: 'support-agent',
                renavigation: 'SupportHelpScreen',
              },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.renavigation)}>
                <Icon name={item.icon} size={22} color="#444" />
                <Text style={styles.menuText}>{item.title}</Text>
                <Icon name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>

          {/*  LOGOUT BUTTON (UNCHANGED) */}
          <TouchableOpacity
            style={styles.logoutContainer}
            onPress={handleLogout}>
            <Icon name="logout" size={22} color="#E74C3C" />
            <Text style={styles.logoutText}>Remove / Logout</Text>
          </TouchableOpacity>
        </View>
      </DashboardScreen>
    </>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,

    // paddingTop: 50,
    // backgroundColor: '#fff',
  },
  menuContainer: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  menuText: {
    flex: 1,
    marginLeft: 15,
    fontSize: Theme.fontSizes.smedium,
    color: '#333',
  },
  // ⭐ Added Profile Style ⭐
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
  },
  profileImage: {
    width: 65,
    height: 65,
    borderRadius: 40,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  phone: {
    fontSize: 15,
    color: '#777',
    marginTop: 4,
  },

  logoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDEC',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  logoutText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 18,
    color: '#E74C3C',
    fontWeight: '700',
  },
});
