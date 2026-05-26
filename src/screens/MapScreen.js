import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Linking,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Geolocation from "react-native-geolocation-service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomSearchInput from "../components/CustomSearchInput";
import SaveAddressModal from "../components/SaveAddressModal";
import DashboardScreen from "../components/DashboardScreen";
import Theme from "../assets/theme";
import { GOOGLE_API_KEY } from "../global_Url/googlemapkey";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const DEFAULT_REGION = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const isValidCoordinate = (lat, lng) => {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

const getAddressCoordinates = (address) => {
  const lat =
    toNumber(address?.lat) ??
    toNumber(address?.latitude) ??
    toNumber(address?.customerLatitude) ??
    null;

  const lng =
    toNumber(address?.lng) ??
    toNumber(address?.longitude) ??
    toNumber(address?.customerLongitude) ??
    null;

  return { lat, lng };
};

const MapScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  const geocodeDeniedShownRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState("Home");
  const [addressDetails, setAddressDetails] = useState({
    pin: "",
    area: "",
    city: "",
    state: "",
  });

  useFocusEffect(
    React.useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () =>
        navigation.getParent()?.setOptions({ tabBarStyle: undefined });
    }, [navigation])
  );

  useEffect(() => {
    checkSavedAddress();
  }, []);

  /** ================= LOCATION FLOW ================= **/

  const checkSavedAddress = async () => {
    try {
      const saved = await AsyncStorage.getItem("savedAddress");
      if (saved) {
        const addr = JSON.parse(saved);
        const { lat, lng } = getAddressCoordinates(addr);

        if (!isValidCoordinate(lat, lng)) {
          requestLocationPermission();
          return;
        }

        setLocation({
          latitude: lat,
          longitude: lng,
          description: addr.addressLine || addr.address || addr.area || "Saved Address",
        });

        setAddressDetails({
          pin: addr.pin || "",
          area: addr.area || "",
          city: addr.city || "",
          state: addr.state || "",
        });

        const region = { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
        setMapRegion(region);
        mapRef.current?.animateToRegion(region, 1000);
        setLoading(false);
      } else {
        requestLocationPermission();
      }
    } catch (e) {
      console.log("❌ Error loading saved address:", e);
      requestLocationPermission();
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          fetchCurrentLocation();
        } else {
          setLoading(false);
          Alert.alert("Permission Denied", "Location permission is required.");
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      try {
        const auth = await Geolocation.requestAuthorization("whenInUse");

        if (auth === "granted") {
          fetchCurrentLocation();
          return;
        }

        setLoading(false);
        Alert.alert(
          "Permission Required",
          "Please allow location access to fetch your current location.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      } catch (err) {
        setLoading(false);
        Alert.alert("Error", "Unable to request location permission.");
      }
    }
  };

  const fetchCurrentLocation = () => {
    setLoading(true);
    
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const region = { 
          latitude, 
          longitude, 
          latitudeDelta: 0.01, 
          longitudeDelta: 0.01 
        };

        setLocation({ latitude, longitude });
        setMapRegion(region);
        mapRef.current?.animateToRegion(region, 1000);

        await reverseGeocode(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        const code = Number(error?.code || 0);
        
        // Fallback: Use default location (Delhi) if GPS fails
        if (code === 3 || code === 2) {
          const fallbackLocation = { latitude: 28.7041, longitude: 77.1025, description: "Delhi" };
          setLocation(fallbackLocation);
          setMapRegion({ ...fallbackLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 });
          mapRef.current?.animateToRegion({ ...fallbackLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 1000);
          Alert.alert("Using Default Location", "Using Delhi as default. Please search for your location or enable location services.");
        } else if (code === 1) {
          Alert.alert(
            "Permission Denied",
            "Location permission is denied. Enable it from Settings.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        } else {
          Alert.alert(
            "Error",
            "Unable to fetch current location. Make sure GPS is ON and permission granted. Or search for your location manually."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        const components = result.address_components;

        let pin = "", area = "", city = "", state = "";
        components.forEach((comp) => {
          if (comp.types.includes("postal_code")) pin = comp.long_name;
          if (comp.types.includes("sublocality") || comp.types.includes("sublocality_level_1")) area = comp.long_name;
          if (comp.types.includes("locality")) city = comp.long_name;
          if (comp.types.includes("administrative_area_level_1")) state = comp.long_name;
        });

        setLocation((prev) => ({ ...prev, description: result.formatted_address }));
        setAddressDetails({ pin, area, city, state });
      } else if (data.status === "REQUEST_DENIED") {
        setLocation((prev) => ({
          ...prev,
          description: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
        }));

        try {
          const osmResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            {
              headers: {
                Accept: "application/json",
                "User-Agent": "HatariApp/1.0",
              },
            }
          );
          const osmData = await osmResponse.json();

          if (osmData?.display_name) {
            const address = osmData.address || {};
            setLocation((prev) => ({
              ...prev,
              description: osmData.display_name,
            }));
            setAddressDetails({
              pin: address.postcode || "",
              area:
                address.suburb ||
                address.neighbourhood ||
                address.city_district ||
                "",
              city: address.city || address.town || address.village || "",
              state: address.state || "",
            });
          }
        } catch (osmErr) {
          if (!geocodeDeniedShownRef.current) {
            geocodeDeniedShownRef.current = true;
            Alert.alert(
              "Maps API Billing Required",
              "Google Geocoding is denied because billing is not enabled for this API key."
            );
          }
        }
      } else {
        setLocation((prev) => ({
          ...prev,
          description: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
        }));
      }
    } catch (err) {
      console.log("Reverse geocode error:", err);
      setLocation((prev) => ({
        ...prev,
        description: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
      }));
    }
  };

  const goToCurrentLocation = () => requestLocationPermission();

  /** ================= UI ================= **/

  return (
    <DashboardScreen>
      <StatusBar hidden />
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Theme.colors.red} />
            <Text style={styles.loadingText}>Fetching your location...</Text>
          </View>
        ) : (
          <View style={styles.fullScreenContainer}>
            {/* Map */}
            <MapView
              ref={mapRef}
              style={styles.map}
              region={mapRegion}
              showsUserLocation
              showsMyLocationButton
              scrollEnabled={true}
              zoomEnabled={true}
            >
              {location && isValidCoordinate(location.latitude, location.longitude) && (
                <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />
              )}
            </MapView>

            {/* Custom Search Input - Priority Layer */}
            <View style={styles.searchContainer}>
              <CustomSearchInput
                onPlaceSelect={async (place) => {
                  const loc = { latitude: place.latitude, longitude: place.longitude, description: place.description };
                  setLocation(loc);
                  const region = { ...loc, latitudeDelta: 0.01, longitudeDelta: 0.01 };
                  setMapRegion(region);
                  mapRef.current?.animateToRegion(region, 1000);
                  await reverseGeocode(place.latitude, place.longitude);
                }}
              />
            </View>

            {/* Address Info */}
            <View style={styles.addressSection}>
              <Text style={styles.sectionTitle}>🏠 {selectedType}</Text>
              <Text style={styles.subAddress}>{location?.description || "No address selected"}</Text>
              <TouchableOpacity onPress={goToCurrentLocation} style={styles.useCurrentBtn}>
                <Text style={styles.useCurrentText}>📍 Use Current Location</Text>
              </TouchableOpacity>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={styles.floatingNextBtn}
              onPress={() => setSaveModalVisible(true)}
            >
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Save Address Modal */}
        <SaveAddressModal
          visible={saveModalVisible}
          onRequestClose={() => setSaveModalVisible(false)}
          location={location}
          addressDetails={addressDetails}
          latitude={location?.latitude}
          longitude={location?.longitude}
        />
      </SafeAreaView>
    </DashboardScreen>
  );
};

export default MapScreen;

/** ================= STYLES ================= **/

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  fullScreenContainer: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 14, color: "#555" },
  map: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  searchContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    pointerEvents: "box-none",
  },
  addressSection: {
    position: "absolute",
    top: Platform.OS === "android" ? 60 : 90,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    elevation: 5,
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  subAddress: { fontSize: 13, color: "#c71616ff" },
  useCurrentBtn: { 
    marginTop: 12, 
    paddingVertical: 10, 
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
  },
  useCurrentText: { color: Theme.colors.red, fontWeight: "700", fontSize: 13 },
  floatingNextBtn: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 30,
    right: 20,
    backgroundColor: Theme.colors.red,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    elevation: 5,
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  nextBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});