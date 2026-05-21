// TopPicksScreen.js — Production-ready, full screen with pagination
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  ActivityIndicator,
  RefreshControl,
  TouchableWithoutFeedback,
  Platform,
  LogBox,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";

import DashboardScreen from "../components/DashboardScreen";
import CustomHeader from "../components/CustomHeader";

import { fetchAllFoods, clearFoods } from "../redux/slice/AllFoodsSlice";
import { addToCart } from "../redux/slice/cartSlice";

const { width } = Dimensions.get("window");

const TopPicksScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const [baseTotal, setBaseTotal] = useState(0);
  const [addonsTotal, setAddonsTotal] = useState(0);
  const isVeg = useSelector((state) => state.foodFilter?.isVeg ?? null);
  const cartItems = useSelector((state) => state.cart?.items ?? []);
  const totalCount = cartItems.length;

  const { AllFoodsData, page = 1, hasMore = true, loading = false } = useSelector(
    (state) => state.allFoods ?? {}
  );

  const { categoryId, categoryName, subCategory2 } = route.params ?? {};
  console.log(subCategory2, "----------subCategory2");


  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState("half");
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [bottomBoxVisible, setBottomBoxVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const boxAnim = useRef(new Animated.Value(150)).current;

  // Normalize food
  const normalizeFood = (item) => {
    if (!item) return null;
    if (item.food && typeof item.food === "object") return item.food;
    return item;
  };

  // Compute unit price
  const computeUnitPrice = (food, option = "half") => {
    const info = food?.priceInfo ?? {};
    if (info.hasVariation)
      return option === "half"
        ? Number(info.halfPrice || 0)
        : Number(info.fullPrice || 0);
    return Number(info.staticPrice || 0);
  };

  // Update total
  useEffect(() => {
    if (!selectedFood) return;
    const base = computeUnitPrice(selectedFood, selectedOption) * quantity;
    const addons =
      selectedAddOns.reduce((sum, a) => sum + Number(a.price || 0), 0) * quantity;
    setTotalPrice(base + addons);
  }, [selectedFood, selectedOption, quantity, selectedAddOns]);

  // Fetch foods
  const loadFoods = (pageNo = 1) => {
    if (!categoryId && !subCategory2) return;

    const parentId = categoryId || null;
    const childId = subCategory2 || null;

    dispatch(
      fetchAllFoods({
        subCategory: parentId,
        subCategory2: childId,
        type: isVeg ? "veg" : "non-veg",
        page: pageNo,
        limit: 10,
      })
    );
  };


  useEffect(() => {
    dispatch(clearFoods());
    loadFoods(1);
  }, [categoryId, dispatch, isVeg]);

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(clearFoods());
    loadFoods(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (loading || !hasMore) return;
    loadFoods(page + 1);
  };

  // Filter foods by veg/non-veg
  const filteredFoods = (AllFoodsData || []).filter((item) => {
    const food = normalizeFood(item);
    if (!food) return false;

    const rawType = Array.isArray(food.type) ? food.type[0] : String(food.type || "");
    const type = rawType.toLowerCase();

    if (isVeg === true) return type.includes("veg") && !type.includes("non");
    if (isVeg === false) return type.includes("non");
    return true;
  });

  const toggleAddOn = (addon) => {
    const exists = selectedAddOns.some((a) => a.name === addon.name);
    setSelectedAddOns(
      exists
        ? selectedAddOns.filter((a) => a.name !== addon.name)
        : [...selectedAddOns, addon]
    );
  };

  const openModal = (food) => {
    setSelectedFood(food);
    setSelectedOption(food?.priceInfo?.hasVariation ? "half" : "full");
    setQuantity(1);
    setSelectedAddOns([]);
    setModalVisible(true);
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedFood(null);
      setQuantity(1);
      setSelectedAddOns([]);
      setSelectedOption("half");
    });
  };

  const handleConfirmAdd = () => {
    if (!selectedFood) return;
    dispatch(
      addToCart({
        ...selectedFood,
        quantity,
        selectedOption,
        hasVariation: !!selectedFood?.priceInfo?.hasVariation,
        selectedAddOns,
        totalPrice,
      })
    );
    closeModal();
    setBottomBoxVisible(true);
    Animated.timing(boxAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const handleGoToCart = () => {
    Animated.timing(boxAnim, {
      toValue: 150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setBottomBoxVisible(false));
    navigation.navigate("OderCartScreen");
  };

  // Update totals
  useEffect(() => {
    if (!selectedFood) return;
    const unit = computeUnitPrice(selectedFood, selectedOption);
    const base = unit * quantity;
    const addons =
      selectedAddOns.reduce((sum, a) => sum + Number(a.price || 0), 0) *
      quantity;
    setBaseTotal(base);
    setAddonsTotal(addons);
    setTotalPrice(base + addons);
  }, [selectedFood, selectedOption, quantity, selectedAddOns]);



  const renderItem = ({ item, index }) => {
    const food = normalizeFood(item);
    if (!food) return null;

    const type = String(food.type ?? "").toLowerCase();
    const priceInfo = food.priceInfo || {};
    const imageUri = food.image || "";

    return (
      <View style={styles.card} key={food._id || index}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <View style={styles.details}>
          <Text style={styles.cuisine}>{food.cuisineType || ""}</Text>
          <View style={styles.row}>
            <View
              style={[
                styles.typeIndicator,
                {
                  borderColor:
                    type.includes("veg") && !type.includes("non") ? "green" : "red",
                },
              ]}
            >
              <View
                style={[
                  styles.typeDot,
                  {
                    backgroundColor:
                      type.includes("veg") && !type.includes("non") ? "green" : "red",
                  },
                ]}
              />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {food.name}
            </Text>
          </View>
          {priceInfo.hasVariation ? (
            <>
              <Text style={styles.priceText}>Half: ₹{priceInfo.halfPrice}</Text>
              <Text style={styles.priceText}>Full: ₹{priceInfo.fullPrice}</Text>
            </>
          ) : (
            <Text style={styles.priceText}>
              Price: ₹{priceInfo.staticPrice ?? "N/A"}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal(food)}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const keyExtractor = (item, idx) =>
    String(item?.food?._id ?? item?._id ?? item?.id ?? idx);

  return (
    <>
      <CustomHeader title={categoryName } />
      <DashboardScreen scrollable={false}>
        <View style={styles.container}>
          {filteredFoods.length === 0 && !loading ? (
            <Text style={styles.noData}>No items available</Text>
          ) : (
            <FlatList
              showsVerticalScrollIndicator={false}
              data={filteredFoods}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 120 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loading ? <ActivityIndicator size="small" color="#FF4D4D" /> : null
              }
            />
          )}
        </View>

        {/* Modal */}
        <Modal transparent visible={modalVisible} animationType="none">
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.modalContent,
                    {
                      transform: [
                        {
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [300, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.modalHandle} />
                  {selectedFood && (
                    <>
                      <View style={styles.modalHeader}>
                        <Image
                          source={{ uri: selectedFood.image }}
                          style={styles.modalImg}
                        />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.modalCuisine}>
                            {selectedFood.cuisineType}
                          </Text>
                          <Text style={styles.modalFoodName}>
                            {selectedFood.name}
                          </Text>
                        </View>
                      </View>

                      {selectedFood?.priceInfo?.hasVariation ? (
                        <View style={styles.optionRow}>
                          {["half", "full"].map((opt) => (
                            <TouchableOpacity
                              key={opt}
                              style={[
                                styles.optionBtn,
                                selectedOption === opt && styles.selectedOption,
                              ]}
                              onPress={() => setSelectedOption(opt)}
                            >
                              <Text
                                style={[
                                  styles.optionText,
                                  selectedOption === opt &&
                                  styles.optionTextSelected,
                                ]}
                              >
                                {opt.charAt(0).toUpperCase() + opt.slice(1)} – ₹
                                {opt === "half"
                                  ? selectedFood.priceInfo.halfPrice
                                  : selectedFood.priceInfo.fullPrice}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.staticPrice}>
                          Price: ₹{selectedFood.priceInfo.staticPrice}
                        </Text>
                      )}

                      {selectedFood?.description && (
                        <Text style={styles.modalDescription}>
                          {selectedFood.description}
                        </Text>
                      )}

                      {selectedFood?.addOns?.length > 0 && (
                        <View style={{ marginTop: 15 }}>
                          <Text style={styles.addonTitle}>Add-ons</Text>
                          {selectedFood.addOns.map((addon, index) => {
                            const isSelected = selectedAddOns.some(
                              (a) => a.name === addon.name
                            );
                            return (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.addonItem,
                                  isSelected && {
                                    borderColor: "#FF4D4D",
                                    borderWidth: 1.5,
                                  },
                                ]}
                                onPress={() => toggleAddOn(addon)}
                              >
                                <Image
                                  source={{ uri: addon.image }}
                                  style={styles.addonImage}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.addonName}>{addon.name}</Text>
                                  <Text style={styles.addonPrice}>₹{addon.price}</Text>
                                </View>
                                <View
                                  style={
                                    isSelected
                                      ? styles.checkmarkSelected
                                      : styles.checkmarkBox
                                  }
                                >
                                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {/* Quantity Selector */}
                      <View style={styles.quantityBox}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() =>
                            quantity > 1 && setQuantity(quantity - 1)
                          }>
                          <Text style={styles.qtyText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => setQuantity(quantity + 1)}>
                          <Text style={styles.qtyText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Footer: Total + Confirm */}
                      <View style={styles.modalFooter}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.totalPrice}>
                            Base: ₹{baseTotal}{' '}
                            {selectedOption === 'half' ? '(Half)' : '(Full)'}{' '}
                            {selectedAddOns.length > 0 &&
                              ` + Add-ons: ${selectedAddOns
                                .map(a => `${a.name} ₹${a.price}`)
                                .join(', ')}`}
                          </Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={handleConfirmAdd}>
                            <Text style={styles.confirmBtnText}>
                              Confirm Add
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  )}
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Added to cart bottom box */}
        {bottomBoxVisible && (
          <Animated.View
            style={[
              styles.bottomBox,
              {
                transform: [
                  {
                    translateY: boxAnim.interpolate({
                      inputRange: [0, 150],
                      outputRange: [0, 150],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["#ff4d4d", "#ff6f61", "#ff8a65"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bottomGradient}
            >
              <Text style={styles.bottomMsg}>
                ✓ Item added successfully ({totalCount} in cart)
              </Text>
              <TouchableOpacity
                style={styles.bottomBtn}
                onPress={handleGoToCart}
                activeOpacity={0.8}
              >
                <Text style={styles.bottomBtnText}>Go to Cart</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}
      </DashboardScreen>
    </>
  );
};

export default TopPicksScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 10 },
  noData: { textAlign: "center", marginTop: 20, color: "gray" },

  card: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    alignItems: "center",
    elevation: 3,
  },
  image: { width: 80, height: 80, borderRadius: 10, backgroundColor: "#f2f2f2" },
  details: { flex: 1, marginLeft: 10 },
  cuisine: { color: "#000", fontSize: 12, fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  name: { fontSize: 15, fontWeight: "600", color: "black", width: "90%", left: 7 },
  typeIndicator: { width: 14, height: 14, borderWidth: 1, borderRadius: 3, justifyContent: "center", alignItems: "center" },
  typeDot: { width: 7, height: 7, borderRadius: 50 },
  priceText: { color: "#000", marginTop: 4, fontSize: 13 },
  addBtn: { backgroundColor: "#FF4D4D", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", paddingVertical: 20, paddingHorizontal: 18, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  modalHandle: { width: 60, height: 6, borderRadius: 3, backgroundColor: "#ddd", alignSelf: "center", marginBottom: 15 },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  modalImg: { width: 80, height: 80, borderRadius: 12, backgroundColor: "#f2f2f2", borderWidth: 1, borderColor: "#eee" },
  modalFoodName: { fontSize: 18, fontWeight: "700", color: "#222" },
  modalCuisine: { fontSize: 14, color: "#888", marginTop: 2 },
  modalDescription: { marginTop: 12, fontSize: 14, color: "#555", lineHeight: 20 },
  optionRow: { flexDirection: "row", marginTop: 12 },
  optionBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: "#FF4D4D", marginRight: 10, backgroundColor: "#fff" },
  selectedOption: { backgroundColor: "#FF4D4D", borderColor: "#FF4D4D" },
  optionText: { color: "#FF4D4D", fontWeight: "600" },
  optionTextSelected: { color: "#fff", fontWeight: "700" },
  staticPrice: { fontSize: 16, fontWeight: "700", color: "#FF4D4D", marginTop: 10 },
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 15,
    shadowColor: '#f9eeeeff',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  confirmBtn: {
    backgroundColor: '#FF4D4D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#FF4D4D',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  staticPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF4D4D',
    marginTop: 10,
  },
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 15,
    shadowColor: '#f9eeeeff',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(240, 227, 227, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF4D4D',
  },
  qtyValue: {
    marginHorizontal: 18,
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  addonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  addonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#FF4D4D',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  addonImage: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#eee',
    marginRight: 10,
  },
  addonName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addonPrice: {
    fontSize: 13,
    color: '#FF4D4D',
    marginTop: 2,
  },
  checkmarkBox: {
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkSelected: {
    width: 22,
    height: 22,
    borderRadius: 12,
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  confirmBtn: {
    backgroundColor: '#FF4D4D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#FF4D4D',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  closedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  closedImage: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  closedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e53935',
    marginBottom: 6,
  },
  bottomBox: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 30 : 60,
    width: '100%',
    paddingHorizontal: 16,
  },
  bottomGradient: {
    padding: 15, borderRadius: 20, height:
      Platform.OS === 'android'
        ? Math.max(99, width - 600) // Android: slightly taller, never below 120
        : Math.max(100, width - 270)
  },
  bottomMsg: { color: '#fff', textAlign: 'center', marginBottom: 10 },
  bottomBtn: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignSelf: 'center',
  },
  bottomBtnText: { fontWeight: '700', color: 'red' },

});
