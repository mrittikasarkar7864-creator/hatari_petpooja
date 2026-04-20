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
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { data: deliveryData } = useSelector(
    (state) => state.deliverySettings
  );
    const { experienceId, selectedRestaurant } = useSelector(
      state => state.experience
    );
    console.log(selectedRestaurant, "selectedRestaurant in save address modal");
    
  const { loading } = useSelector((state) => state.address);
  const { experienceType } = useSelector((state) => state.experience);

  const minDistance = deliveryData?.minimum_distance || 10;

  const restaurantLat = selectedRestaurant?.lat;
  const restaurantLng = selectedRestaurant?.lng;

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

  /* ---------------- Distance ---------------- */
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
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

    if (distance > minDistance) {
      showMessage(`Delivery available only within ${minDistance} km`);
      return;
    }

    const finalData = {
      name,
      mobileNumber: contact,
      apartment: flat,
      landmark,
      address,
      pin,
      area,
      city,
      state,
      type: experienceType,
      lat: latitude,
      lng: longitude,
      addressType: selectedTag,
    };

    try {
      const res = await dispatch(addAddress(finalData)).unwrap();

      if (res?.success && res?.newAddress) {
        await AsyncStorage.setItem(
          "savedAddress",
          JSON.stringify(res.newAddress)
        );

        showMessage("Address saved successfully");
        onRequestClose();

        setTimeout(() => {
          navigation.navigate("OrderSummaryScreen");
        }, 400);
      } else {
        showMessage("Failed to save address");
      }
    } catch (err) {
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
        style={styles.keyboardRoot}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? rh(2) : 0}
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
              <TouchableOpacity onPress={onRequestClose}>
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

              {/* Address Tags */}
              <View style={styles.saveAsRow}>
                {["Home", "Work", "Other"].map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tag,
                      selectedTag === tag && styles.activeTag,
                    ]}
                    onPress={() => setSelectedTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedTag === tag && styles.activeTagText,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
