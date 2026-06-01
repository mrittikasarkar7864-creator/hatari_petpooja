// CatItemScreen.js — Fully fixed, shimmer + colors, ready to paste
import React, { useEffect, useRef, useState, useCallback } from "react";
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
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";

import ShimmerPlaceHolder from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";

import DashboardScreen from "../components/DashboardScreen";
import CustomHeader from "../components/CustomHeader";

import {
  fetchCategoryFoods,
  clearCategoryFoods,
} from "../redux/slice/catItemSlice";
import { shouldIncludeByVegFilter } from "../utils/foodType";

import { addToCart } from "../redux/slice/cartSlice";
import {
  addItemToPetpoojaCart,
  fetchPetpoojaCart,
} from "../redux/slice/CartApiSlice";
import Theme from "../assets/theme";

const { width } = Dimensions.get("window");

const CatItemScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();

  const isVeg = useSelector((state) => state.foodFilter?.isVeg);
  const cartItems = useSelector((state) => state.cart?.items || []);
  const selectedRestaurant = useSelector(
    state => state.experience?.selectedRestaurant,
  );

  // route params
  const {
    categoryId,
    categoryName,
    restaurantId,
    categoryIngredients,
    cuisineType: selectedCuisineType,
  } = route.params || {};

  // cat items slice
  const {
    data: categoryFoods = [],
    loading = false,
    error = null,
    page = 1,
    hasMore = false,
  } = useSelector((state) => state.catItems || {});


  // UI state
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedOption, setSelectedOption] = useState("static"); // 'half' | 'full' | 'static'
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [bottomBoxVisible, setBottomBoxVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const boxAnim = useRef(new Animated.Value(150)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // initial fetch
  useEffect(() => {
    dispatch(
      fetchCategoryFoods({
        categoryId,
        categoryIngredients,
        restaurantId,
        cuisineType: selectedCuisineType,
        page: 1,
      })
    );

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, categoryId, restaurantId, selectedCuisineType]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      dispatch(
        fetchCategoryFoods({
          categoryId,
          categoryIngredients,
          restaurantId,
          cuisineType: selectedCuisineType,
          page: page + 1,
        })
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(clearCategoryFoods());
      await dispatch(
        fetchCategoryFoods({
          categoryId,
          categoryIngredients,
          restaurantId,
          cuisineType: selectedCuisineType,
          page: 1,
        })
      );
    } catch (e) {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  // FILTER LOGIC (client-side filter for immediate responsiveness)
  const filteredFoods = (categoryFoods || []).filter((item) => {
    const food = item?.food;
    if (!food) return false;

    // cuisine filter
    if (selectedCuisineType) {
      const f = String(food.cuisineType || "").toLowerCase();
      if (f !== String(selectedCuisineType).toLowerCase()) return false;
    }

    if (!shouldIncludeByVegFilter(food, isVeg)) {
      return false;
    }

    return true;
  });

  // compute unit price helper
  const getUnitPrice = (food, option = "half") => {
    if (!food?.priceInfo) return 0;
    const info = food.priceInfo;
    if (info.hasVariation) {
      return option === "half" ? Number(info.halfPrice || 0) : Number(info.fullPrice || 0);
    }
    return Number(info.staticPrice || 0);
  };

  // open modal and set initial prices/options
  const openModal = (food) => {
    setSelectedFood(food);
    setQuantity(1);

    if (food?.priceInfo && food.priceInfo.hasVariation) {
      setSelectedOption("half");
      setTotalPrice(Number(food.priceInfo.halfPrice || 0));
    } else if (food?.priceInfo) {
      setSelectedOption("static");
      setTotalPrice(Number(food.priceInfo.staticPrice || 0));
    } else {
      setSelectedOption("static");
      setTotalPrice(0);
    }

    setModalVisible(true);
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
    });
  };
const [initialLoading, setInitialLoading] = useState(true);
  useEffect(() => {
  if (!loading) {
    setInitialLoading(false);
  }
}, [loading]);
  // update total when quantity or selectedOption changes
  useEffect(() => {
    if (!selectedFood) return;
    const unit = getUnitPrice(selectedFood, selectedOption);
    setTotalPrice(unit * (quantity || 1));
  }, [quantity, selectedOption, selectedFood]);

  const handleConfirmAdd = () => {
    if (!selectedFood) return;

    const localCartItem = {
      ...selectedFood,
      id:
        selectedFood?.id ||
        selectedFood?.itemid ||
        selectedFood?.item_id ||
        selectedFood?.itemId ||
        selectedFood?._id,
      itemId:
        selectedFood?.itemid ||
        selectedFood?.item_id ||
        selectedFood?.itemId ||
        selectedFood?.id ||
        selectedFood?._id,
      selectedOption,
      hasVariation: !!selectedFood?.priceInfo?.hasVariation,
      quantity,
      totalPrice,
    };

    const resolvedRestaurantId =
      selectedRestaurant?.restaurantId ||
      selectedRestaurant?.petpoojaRestaurantId ||
      restaurantId ||
      selectedRestaurant?.id ||
      selectedRestaurant?._id;

    // dispatch cart action (option + quantity stored)
    dispatch(
      addToCart({
        ...localCartItem,
      })
    );

    const addAndNavigate = async () => {
      try {
        await dispatch(
          addItemToPetpoojaCart({
            restaurantId: resolvedRestaurantId,
            cartItem: localCartItem,
          }),
        ).unwrap();

        const cartResponse = await dispatch(fetchPetpoojaCart()).unwrap();
        closeModal();
        navigation.navigate('OderCartScreen', {
          petpoojaCartData: cartResponse?.cart || null,
          fromPetpoojaSync: true,
        });
      } catch (e) {
        closeModal();
        setBottomBoxVisible(true);
        Animated.timing(boxAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    };

    addAndNavigate();
  };

  const handleGoToCart = () => {
    const navigateToCart = async () => {
      try {
        const cartResponse = await dispatch(fetchPetpoojaCart()).unwrap();
        navigation.navigate('OderCartScreen', {
          petpoojaCartData: cartResponse?.cart || null,
          fromPetpoojaSync: true,
        });
      } catch (e) {
        navigation.navigate('OderCartScreen', {
          petpoojaCartData: null,
          fromPetpoojaSync: true,
        });
      }
    };

    Animated.timing(boxAnim, {
      toValue: 150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setBottomBoxVisible(false);
      navigateToCart();
    });
  };

  // skeleton / shimmer row
  const renderSkeleton = (index) => (
    <View style={styles.card} key={"shimmer-" + index}>
      <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.shimmerImage} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.shimmerLineLarge} />
        <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.shimmerLineSmall} />
        <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.shimmerLineTiny} />
      </View>
    </View>
  );

  const renderItem = ({ item, index }) => {
    const food = item?.food || {};

    
    const typeRaw = Array.isArray(food.type) ? food.type[0] : String(food.type || "");
    const type = String(typeRaw).toLowerCase();

    const priceDisplay = food.priceInfo
      ? food.priceInfo.hasVariation
        ? `Half ₹${food.priceInfo.halfPrice} • Full ₹${food.priceInfo.fullPrice}`
        : `₹${food.priceInfo.staticPrice}`
      : "Price N/A";

    const keyId = food._id || item._id || String(index);

    return (
      <View style={styles.card} key={keyId}>
        <Image source={{ uri: food.image }} style={styles.image} />

        <View style={styles.details}>
          <Text style={styles.cuisine}>{food.cuisineType || ""}</Text>

          <View style={styles.row}>
            <View
              style={[
                styles.typeIndicator,
                {
                  borderColor: type.includes("veg") && !type.includes("non") ? "green" : "red",
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

          <Text style={styles.priceText}>Price: {priceDisplay}</Text>

          <View style={styles.ratingWrapper}>
            <Text style={styles.ratingText}>★ {food.rating || "4"}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => openModal(food)}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const keyExtractor = (item, idx) => {
    return String(item?.food?._id ?? item?._id ?? idx);
  };

  return (
    <> 
 <CustomHeader title={categoryName || "Items"} />
    <DashboardScreen scrollable={false}>
     

    <View style={styles.container}>
  {initialLoading ? (
    <>
      {Array.from({ length: 4 }).map((_, i) => renderSkeleton(i))}
    </>
  ) : error ? (
    <Text style={styles.errorText}>{String(error)}</Text>
  ) : filteredFoods && filteredFoods.length > 0 ? (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <FlatList
        data={filteredFoods}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          loading && hasMore ? (
            <ActivityIndicator size="large" style={{ margin: 10 }} />
          ) : null
        }
      />
    </Animated.View>
  ) : (
    <Text style={styles.noData}>No items found</Text>
  )}
</View>


      {/* Modal */}
      <Modal transparent visible={modalVisible} animationType="none">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            {/* Prevent overlay click from closing when tapping inside content */}
            <TouchableWithoutFeedback onPress={() => {}}>
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
                      <Image source={{ uri: selectedFood.image }} style={styles.modalImg} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.modalFoodName}>{selectedFood.name}</Text>
                        <Text style={styles.modalCuisine}>{selectedFood?.cuisineType}</Text>

                        {selectedFood?.priceInfo?.hasVariation ? (
                          <View style={{ flexDirection: "row", marginTop: 8 }}>
                            <TouchableOpacity
                              style={[styles.optionBtn, selectedOption === "half" && styles.selectedOption]}
                              onPress={() => setSelectedOption("half")}
                            >
                              <Text style={[styles.optionText, selectedOption === "half" && styles.optionTextSelected]}>
                                Half – ₹{selectedFood.priceInfo.halfPrice}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.optionBtn, selectedOption === "full" && styles.selectedOption]}
                              onPress={() => setSelectedOption("full")}
                            >
                              <Text style={[styles.optionText, selectedOption === "full" && styles.optionTextSelected]}>
                                Full – ₹{selectedFood.priceInfo.fullPrice}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text style={styles.modalPriceStatic}>Price: ₹{selectedFood.priceInfo?.staticPrice}</Text>
                        )}
                      </View>
                    </View>

                    {selectedFood?.description ? (
                      <Text style={styles.modalDescription}>{selectedFood.description}</Text>
                    ) : null}

                    <View style={styles.quantityBox}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => {
                          if (quantity > 1) setQuantity((q) => q - 1);
                        }}
                      >
                        <Text style={styles.qtyText}>-</Text>
                      </TouchableOpacity>

                      <Text style={styles.qtyValue}>{quantity}</Text>

                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setQuantity((q) => q + 1)}
                      >
                        <Text style={styles.qtyText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.modalFooter}>
                      <Text style={styles.totalText}>Total: ₹{totalPrice}</Text>

                      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmAdd}>
                        <Text style={styles.confirmBtnText}>Confirm Add</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Bottom success box */}
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
          <LinearGradient colors={["#ff4d4d", "#ff6f61", "#ff8a65"]} style={styles.bottomGradient}>
            <Text style={styles.bottomMsg}>✓ Item added successfully ({cartItems.length} in cart)</Text>

            <TouchableOpacity style={styles.bottomBtn} onPress={handleGoToCart}>
              <Text style={styles.bottomBtnText}>Go to Cart</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}
    </DashboardScreen>
    </>
  );
};

export default CatItemScreen;

const styles = StyleSheet.create({
  container: { flex: 1,paddingHorizontal:10 },
  noData: { textAlign: "center", color: "#666", marginTop: 40, fontSize: 16 },
  errorText: { textAlign: "center", color: "#cc3333", marginTop: 20 },

  // CARD
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
  details: { flex: 1, marginLeft: 12 },
  cuisine: { fontSize: 12, color: "black" },

  typeIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  typeDot: { width: 7, height: 7, borderRadius: 50 },

  row: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  name: { fontSize: 15, fontWeight: "600", color: "black", marginLeft: 6 },

  ratingWrapper: {
    backgroundColor: "green",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  ratingText: { color: "#fff", fontSize: 10, fontWeight: "600" },

  priceText: { color: "#000", marginTop: 4, fontSize: 13 },

  addBtn: {
    backgroundColor: "#FF4D4D",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: "center",
    marginLeft: 8,
  },
  addText: { color: "#fff", fontWeight: "600" },

  // SHIMMER
  shimmerImage: { width: 80, height: 80, borderRadius: 10 },
  shimmerLineLarge: { width: width * 0.5, height: 14, borderRadius: 6, marginBottom: 8 },
  shimmerLineSmall: { width: width * 0.3, height: 12, borderRadius: 6, marginBottom: 6 },
  shimmerLineTiny: { width: width * 0.15, height: 12, borderRadius: 6 },

  // MODAL
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHandle: { width: 50, height: 5, borderRadius: 3, backgroundColor: "#ccc", alignSelf: "center", marginBottom: 10 },
  modalHeader: { flexDirection: "row" },
  modalImg: { width: 70, height: 70, borderRadius: 10 },
  modalFoodName: { fontSize: 18, fontWeight: "700", marginBottom: 6, color: "#111111" },
  modalCuisine: { fontSize: 14, color: "#555" },
  modalDescription: { marginTop: 10, color: "#444" },
  modalPriceStatic: { fontSize: 16, color: "#222222", fontWeight: "700", marginBottom: 10 },

  optionBtn: { paddingVertical: 8, paddingHorizontal: 15, borderColor: "#aaa", borderWidth: 1, borderRadius: 8, marginRight: 10 },
  selectedOption: { backgroundColor: "#FF4D4D", borderColor: "#FF4D4D" },
  optionText: { color: "#000" },
  optionTextSelected: { color: "#fff", fontWeight: "700" },

  quantityBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F1F1",
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 10,
  },
  qtyBtn: { width: 35, height: 35, borderRadius: 20, backgroundColor: "#eee", justifyContent: "center", alignItems: "center" },
  qtyText: { fontSize: 20, fontWeight: "bold", color: "#FF4D4D" },
  qtyValue: { fontSize: 17, fontWeight: "700", marginHorizontal: 20, color: "#111" },

  modalFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalText: { fontSize: 17, fontWeight: "700", color: "#111" },
  confirmBtn: { backgroundColor: "#FF4D4D", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25 },
  confirmBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // BOTTOM BOX
  bottomBox: { position: "absolute", bottom: 60, width: "100%", paddingHorizontal: 16 },
  bottomGradient: { padding: 15, borderRadius: 20 },
  bottomMsg: { color: "#fff", textAlign: "center", marginBottom: 10 },
  bottomBtn: { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 30, borderRadius: 20, alignSelf: "center" },
  bottomBtnText: { fontWeight: "700", color: "red" },
});
