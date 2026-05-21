import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Linking,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { fetchNearestRestaurants } from '../redux/slice/nearestResSlice';
import { setExperience, setRestaurant } from '../redux/slice/experienceSlice';
import LocationErrorModal from './LocationErrorModal';
import {
  getClosedHoursMessage,
  isOrderTypeBlockedNow,
} from '../utils/restaurantHours';

const experiences = [
  { id: 1, title: 'Delivery', icon: require('../assets/images/delivery.png') },
  { id: 2, title: 'Takeaway', icon: require('../assets/images/takeaway.png') },
];

export default function ExperienceScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { experienceId, selectedRestaurant, experienceType } = useSelector(
    state => state.experience,
  );
  const { data, loading } = useSelector(state => state.nearestRestaurants);
  console.log(data,"------------data from nearest restaurant slice");
  

  const [searching, setSearching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [locationUsed, setLocationUsed] = useState(false);

  useEffect(() => {
    if (data?.length) {
      dispatch(setRestaurant(data[0]));
    }
  }, [data]);

  /* ================= LOCATION FLOW ================= */

  const initLocation = async () => {
    setSearching(true);
    setModalVisible(true);

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setSearching(false);
        setModalVisible(false);
        return;
      }
    }

    getLocation();
  };

  const showLocationExplanation = () => {
    Alert.alert(
      'Use My Location',
      'We need your location to show nearby restaurants. Tap Allow to continue.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Allow', onPress: initLocation },
      ],
    );
  };

  const getLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;

        dispatch(
          fetchNearestRestaurants({
            lat: latitude.toString(),
            lng: longitude.toString(),
          }),
        );

        setSearching(false);
        setModalVisible(false);
        setLocationUsed(true);
      },
      error => {
        console.log('LOCATION ERROR:', error);

        setSearching(false);
        setModalVisible(false);

        Alert.alert(
          'Location Required',
          'Please enable GPS and allow location access.',
          [
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
            { text: 'Retry', onPress: initLocation },
          ],
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 0,
        forceRequestLocation: true,
        showLocationDialog: true, // 🔥 ANDROID GPS POPUP
      },
    );
  };

  /* ================= UI ================= */

  const continueNext = () => {
    if (!experienceId || !selectedRestaurant) {
      Alert.alert('Select restaurant and experience');
      return;
    }

    if (isOrderTypeBlockedNow(experienceType, selectedRestaurant?.openingTime, selectedRestaurant?.closingTime)) {
      Alert.alert('Restaurant Closed', getClosedHoursMessage(selectedRestaurant?.openingTime, selectedRestaurant?.closingTime));
      return;
    }

    navigation.navigate('Bottom', { screen: 'HomeScreen' });
  };

  return (
    <>
      <LocationErrorModal
        visible={modalVisible}
        searching={searching}
        onRetry={initLocation}
      />

      <ImageBackground source={require('../assets/images/Cover/cover.jpg')} style={styles.bg}>

          <View style={styles.overlay} />
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Welcome to Hatari</Text>

          <Text style={styles.heading}>Nearest Restaurants</Text>

        
          {loading && <ActivityIndicator size="large" color="#fff" />}

          {data?.map(res => (
         <TouchableOpacity
  key={res.restaurantId}
  style={[
    styles.card,
    selectedRestaurant?.restaurantId === res.restaurantId &&
      styles.selected,
  ]}
  onPress={() => dispatch(setRestaurant(res))}
>
{/* <Image
  source={
    res.image
      ? { uri: res.image }
      : require('../assets/images/restaurant.png')
  }
  style={styles.image}
/> */}

  <Text style={styles.name}>{res.name}</Text>

  <Text style={styles.text}>{res.address}</Text>

  <Text style={styles.text}>
    {res.distance_km?.toFixed(1)} km away
  </Text>
</TouchableOpacity>
          ))}

          <Text style={styles.heading}>Choose Experience</Text>

          <View style={styles.row}>
            {experiences.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.expCard, experienceId === item.id && styles.selected]}
                onPress={() => {
                  if (isOrderTypeBlockedNow(item.title, selectedRestaurant?.openingTime, selectedRestaurant?.closingTime)) {
                    Alert.alert('Restaurant Closed', getClosedHoursMessage(selectedRestaurant?.openingTime, selectedRestaurant?.closingTime));
                    return;
                  }

                  dispatch(setExperience({ id: item.id, type: item.title }));
                }}
              >
                <Image source={item.icon} style={styles.icon} />
                <Text style={styles.text}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>


          

          {experienceId && selectedRestaurant && (
            <TouchableOpacity onPress={continueNext}  style={styles.btn}>
              <LinearGradient colors={['#ff3b30', '#ff6b6b']} style={{borderRadius:10}}>
                <Text style={styles.btnText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}


            {!locationUsed && !searching && (
            <TouchableOpacity onPress={showLocationExplanation} style={styles.locationBtn}>
              <Text style={styles.locationBtnText}>Use Current Location</Text>
            </TouchableOpacity>
          )}

        </SafeAreaView>
      </ImageBackground>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: { 
    flex: 1, 
    alignItems: 'center', 
    paddingTop: Platform.OS === 'android' ? 50 : 30 
  },
  title: { fontSize: 32, color: '#fff', fontWeight: 'bold', marginBottom: 20 },
  heading: { fontSize: 22, color: '#fff', marginVertical: 15 },
  
  card: {
    width: '90%',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  backgroundColor: 'rgba(41, 35, 35, 0.15)', // ✅ Higher opacity
    alignItems: 'center',
  },
  selected: { borderColor: '#ff3b30', borderWidth: 2 },
  image: { width: 120, height: 120, borderRadius: 15 },
  name: { color: 'hsla(0, 20%, 97%, 1.00)', fontSize: 18, marginTop: 8, fontWeight: '600' }, // dark text
  text: { color: 'hsla(0, 20%, 97%, 1.00)', fontSize: 14, textAlign: 'center', marginTop: 4 },

  row: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
expCard: {
  width: 120,
  margin: 10,
  padding: 15,
  alignItems: 'center',
  backgroundColor: 'rgba(138, 128, 128, 0.35)', // stronger background
  borderColor: 'rgba(255, 255, 255, 0.3)',  // subtle but visible border
  borderWidth: 1,
  borderRadius: 15,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4, // for Android shadow
},

  icon: { width: 50, height: 50, marginBottom: 8,tintColor: 'white'},

  btn: {
    marginTop: 20,
    width: '60%',
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
  },
  btnText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 18,
    textAlign: 'center',
    paddingVertical: 15, // vertical padding
  },
  locationBtn: {
    marginBottom: 15,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: '#fff',
    marginVertical:50
  },
  locationBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
});
