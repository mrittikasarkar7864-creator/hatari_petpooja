import React, { useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Theme from "../assets/theme";
import { GOOGLE_API_KEY } from "../global_Url/googlemapkey";

const CustomSearchInput = ({ onPlaceSelect }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const fetchPlacesFromOSM = async (text) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=in&q=${encodeURIComponent(
      text
    )}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "HatariApp/1.0",
      },
    });

    const data = await response.json();
    const mapped = Array.isArray(data)
      ? data.map((item) => ({
          place_id: `osm-${item.place_id}`,
          description: item.display_name,
          latitude: Number(item.lat),
          longitude: Number(item.lon),
          source: "osm",
        }))
      : [];

    setSuggestions(mapped);
  };

  const resolvePlaceFromOSM = async (text) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=in&q=${encodeURIComponent(
      text
    )}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "HatariApp/1.0",
      },
    });

    const data = await response.json();
    const first = Array.isArray(data) ? data[0] : null;

    if (first?.lat && first?.lon) {
      onPlaceSelect({
        description: first.display_name || text,
        latitude: Number(first.lat),
        longitude: Number(first.lon),
      });
      return true;
    }

    return false;
  };

  // 🔹 Fetch autocomplete suggestions
  const fetchPlaces = async (text) => {
    setQuery(text);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${GOOGLE_API_KEY}&components=country:in`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.predictions) {
        const mapped = data.predictions.map((item) => ({
          ...item,
          source: "google",
        }));
        setSuggestions(mapped);
      } else {
        if (data.status === "REQUEST_DENIED") {
          await fetchPlacesFromOSM(text);
        } else {
          setSuggestions([]);
        }
      }
    } catch (error) {
      try {
        await fetchPlacesFromOSM(text);
      } catch (fallbackErr) {
        console.log("Error fetching places:", error);
        setSuggestions([]);
      }
    }
  };

  // 🔹 Handle user selecting a place
  const handleSelect = async (item) => {
    const placeId = item?.place_id;
    const description = item?.description || "";

    setQuery(description);
    setSuggestions([]);

    if (item?.source === "osm" && item?.latitude && item?.longitude) {
      onPlaceSelect({
        description,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
      });
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.result?.geometry?.location) {
        const location = data.result.geometry.location;
        onPlaceSelect({
          description,
          latitude: location.lat,
          longitude: location.lng,
        });
      } else if (data.status === "REQUEST_DENIED") {
        const resolved = await resolvePlaceFromOSM(description);
        if (!resolved) {
          Alert.alert("Location Error", "Unable to resolve selected place.");
        }
      } else {
        Alert.alert("Location Error", "Unable to fetch selected place details.");
      }
    } catch (error) {
      try {
        const resolved = await resolvePlaceFromOSM(description);
        if (!resolved) {
          throw new Error("OSM fallback failed");
        }
      } catch (fallbackErr) {
        console.log("Error fetching place details:", error);
        Alert.alert("Location Error", "Failed to fetch place details.");
      }
    }
  };

  // 🔹 Clear search
  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Search location..."
          value={query}
          onChangeText={fetchPlaces}
          placeholderTextColor="#888"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearIcon}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {suggestions.length > 0 && (
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestion}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.suggestionText}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default CustomSearchInput;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 8,
    zIndex: 999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearIcon: {
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  suggestion: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  suggestionText: {
    color: "#333",
    fontSize: 14,
    lineHeight: 18,
  },
});
