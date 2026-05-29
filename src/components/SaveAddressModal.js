import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  responsiveWidth as rw,
  responsiveHeight as rh,
  responsiveFontSize as rf,
} from "react-native-responsive-dimensions";

import Theme from "../assets/theme";
import { addAddress } from "../redux/slice/addressSlice";
import { log } from "console";

const { width } = Dimensions.get("window");
const PLACEHOLDER_COLOR = "#999";

const showMessage = (msg) => Alert.alert("", msg);

const SaveAddressModal = ({
  visible,
  onRequestClose,
  location,
  addressDetails,
  latitude,
  longitude,
  petpoojaAddress,
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  

  const { data: deliveryData } = useSelector(
    (state) => state.deliverySettings
  );
    const { experienceId, selectedRestaurant } = useSelector(
      state => state.experience
    );
    
  const { loading } = useSelector((state) => state.address);
  const { experienceType } = useSelector((state) => state.experience);

  const rawMinDistance = deliveryData?.minimum_distance;
  const minDistance = Number.isFinite(Number(rawMinDistance))
    ? Number(rawMinDistance)
    : 10;

  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const getRestaurantCoordinates = (restaurant) => {
    return {
      lat:
        toNumber(restaurant?.lat) ??
        toNumber(restaurant?.latitude) ??
        toNumber(restaurant?.location?.lat) ??
        toNumber(restaurant?.location?.latitude) ??
        toNumber(restaurant?.coordinates?.[1]) ??
        null,
      lng:
        toNumber(restaurant?.lng) ??
        toNumber(restaurant?.longitude) ??
        toNumber(restaurant?.location?.lng) ??
        toNumber(restaurant?.location?.longitude) ??
        toNumber(restaurant?.coordinates?.[0]) ??
        null,
    };
  };

  const { lat: restaurantLat, lng: restaurantLng } = getRestaurantCoordinates(
    selectedRestaurant
  );

  const [selectedTag, setSelectedTag] = useState("Home");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [flat, setFlat] = useState("");
  const [landmark, setLandmark] = useState("");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    setAddress(location?.description || "");
    setPin(addressDetails?.pin || "");
    setArea(addressDetails?.area || "");
    setCity(addressDetails?.city || "");
    setState(addressDetails?.state || "");
  }, [location, addressDetails]);

  // Initialize from PetPooja address format if provided
  useEffect(() => {
    if (petpoojaAddress) {
      setName(petpoojaAddress?.name || "");
      setContact(petpoojaAddress?.phone || "");
      setFlat(petpoojaAddress?.addressLine?.split(',')[0] || "");
      setLandmark(petpoojaAddress?.landmark || "");
      setAddress(petpoojaAddress?.addressLine || "");
      setPin(petpoojaAddress?.pincode || "");
      setCity(petpoojaAddress?.city || "");
      setState(petpoojaAddress?.state || "");

      // Map label to selectedTag
      const label = petpoojaAddress?.label || "Home";
      if (["Home", "Work", "Other"].includes(label)) {
        setSelectedTag(label);
      } else {
        setSelectedTag("Home");
      }
    }
  }, [petpoojaAddress]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

 const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardOpen(true));
const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardOpen(false));

return () => {
  showSub.remove();
  hideSub.remove();
};
  }, []);
  const handleClose = () => {
  requestAnimationFrame(() => {
    onRequestClose?.();
  });
};

  /* ---------------- Distance ---------------- */
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const a = Number(lat1);
    const b = Number(lon1);
    const c = Number(lat2);
    const d = Number(lon2);

    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c) || !Number.isFinite(d)) {
      return null;
    }

    const R = 6371;
    const dLat = ((c - a) * Math.PI) / 180;
    const dLon = ((d - b) * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a * Math.PI) / 180) *
        Math.cos((c * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
  };

  /* ---------------- Save ---------------- */
const validateAndSave = async () => {
  if (!name || !contact || !flat || !address || !pin || !city || !state) {
    showMessage("Please fill all required fields");
    return;
  }

  const distance = getDistanceKm(
    latitude,
    longitude,
    restaurantLat,
    restaurantLng
  );

  if (distance != null && distance > minDistance + 0.1) {
    showMessage(`Delivery available only within ${minDistance} km`);
    return;
  }

  // ===============================
  // FIXED ADDRESS OBJECT
  // ===============================
  const finalData = {
    name,
    phone: contact,
    mobileNumber: contact,

    apartment: flat,
    landmark,

    // support both formats
    address,
    addressLine: address,

    pin,
    area,
    city,
    state,

    type: experienceType,

    // support both formats
    latitude,
    longitude,

    lat: latitude,
    lng: longitude,

    addressType: selectedTag,
  };

  console.log(finalData, "FINAL ADDRESS DATA");

  try {
    const res = await dispatch(addAddress(finalData)).unwrap();

    console.log(res, "ADDRESS API RESPONSE");

    // ===============================
    // SAFE RESPONSE HANDLING
    // ===============================
    const savedAddressData =
      res?.newAddress ||
      res?.address ||
      res?.data ||
      finalData;

    // ===============================
    // MERGE FALLBACK VALUES
    // ===============================
    const completeAddress = {
      ...finalData,
      ...savedAddressData,

      // ensure coordinates always exist
      latitude:
        savedAddressData?.latitude ||
        savedAddressData?.lat ||
        latitude,

      longitude:
        savedAddressData?.longitude ||
        savedAddressData?.lng ||
        longitude,

      lat:
        savedAddressData?.lat ||
        savedAddressData?.latitude ||
        latitude,

      lng:
        savedAddressData?.lng ||
        savedAddressData?.longitude ||
        longitude,
    };

    console.log(completeAddress, "COMPLETE ADDRESS");

    // ===============================
    // SAVE TO STORAGE
    // ===============================
    await AsyncStorage.setItem(
      "savedAddress",
      JSON.stringify(completeAddress)
    );

    showMessage("Address saved successfully");

    onRequestClose();

    setTimeout(() => {
      navigation.navigate("OrderSummaryScreen");
    }, 400);
  } catch (err) {
    console.log(err, "SAVE ADDRESS ERROR");
    showMessage("Something went wrong");
  }
};

  return (
    
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
    <KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : undefined}
>
        <View
          style={[
            styles.modalContainer,
            isKeyboardOpen && styles.modalContainerKeyboardOpen,
          ]}
        >
          
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.topAddress} numberOfLines={2}>
                {location?.description || "No address selected"}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={rf(3)} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={[
                styles.formScrollContent,
                isKeyboardOpen && styles.formScrollContentKeyboardOpen,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <Text style={styles.header}>Enter complete address</Text>

              <TextInput
                style={styles.input}
                placeholder="Name *"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={styles.input}
                placeholder="Mobile *"
                placeholderTextColor={PLACEHOLDER_COLOR}
                keyboardType="phone-pad"
                value={contact}
                onChangeText={setContact}
                maxLength={10}
              />

              <TextInput
                style={styles.input}
                placeholder="Flat / Building *"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={flat}
                onChangeText={setFlat}
              />

              <TextInput
                style={styles.input}
                placeholder="Landmark"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={landmark}
                onChangeText={setLandmark}
              />

              <TextInput
                style={styles.input}
                placeholder="Address *"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={address}
                onChangeText={setAddress}
              />

              <TextInput
                style={styles.input}
                placeholder="City *"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={city}
                onChangeText={setCity}
              />

              <TextInput
                style={styles.input}
                placeholder="State *"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={state}
                onChangeText={setState}
              />

              <TextInput
                style={styles.input}
                placeholder="Pin *"
                placeholderTextColor={PLACEHOLDER_COLOR}
                keyboardType="numeric"
                value={pin}
                onChangeText={setPin}
                maxLength={6}
              />

           
            </ScrollView>

            {/* Save Button fixed at bottom */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={validateAndSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Address</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SaveAddressModal;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainerKeyboardOpen: {
    justifyContent: "flex-start",
    paddingTop: rh(6),
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: rw(4),
    borderTopLeftRadius: rw(6),
    borderTopRightRadius: rw(6),
    maxHeight: rh(90),
  },
  formScroll: {
    flexGrow: 0,
  },
  formScrollContent: {
    paddingBottom: rh(2),
  },
  formScrollContentKeyboardOpen: {
    paddingBottom: rh(8),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: rh(1),
  },
  topAddress: {
    flex: 1,
    fontSize: rf(2),
    fontWeight: "500",
    paddingRight: rw(2),
    color: "#555",
  },
  header: {
    fontSize: rf(2.3),
    fontWeight: "bold",
    marginBottom: rh(1),
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: rw(3),
    padding: rh(1.4),
    marginVertical: rh(0.6),
    fontSize: rf(2),
    backgroundColor: "#fafafa",
    color: "#000",
  },
  saveAsRow: {
    flexDirection: "row",
    marginTop: rh(2),
  },
  tag: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: rw(5),
    paddingHorizontal: rw(4),
    paddingVertical: rh(1),
    marginRight: rw(2),
  },
  activeTag: {
    backgroundColor: Theme.colors.red,
    borderColor: Theme.colors.red,
  },
  tagText: {
    fontSize: rf(1.9),
    color: "#333",
  },
  activeTagText: {
    color: "#fff",
    fontWeight: "bold",
  },
  saveBtn: {
    backgroundColor: Theme.colors.red,
    paddingVertical: rh(2),
    borderRadius: rw(6),
    alignItems: "center",
    marginTop: rh(2),
    marginBottom: Platform.OS === "android" ? rh(2) : rh(3),
  },
  saveBtnText: {
    color: "#fff",
    fontSize: rf(2.2),
    fontWeight: "bold",
  },
});
