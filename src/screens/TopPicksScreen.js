// TopPicksScreen.js — Full Working Code With Your API Structure

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  TouchableWithoutFeedback,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";

import DashboardScreen from "../components/DashboardScreen";
import CustomHeader from "../components/CustomHeader";

import { addToCart } from "../redux/slice/cartSlice";
import {
  getFoodTypeMeta,
  shouldIncludeByVegFilter,
} from "../utils/foodType";
import {
  addItemToPetpoojaCart,
  fetchPetpoojaCart,
} from "../redux/slice/CartApiSlice";
import axiosInstance from "../global_Url/axiosInstance";
import { API } from "../global_Url/GlobalUrl";

const { width } = Dimensions.get("window");

const TopPicksScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const { categoryData, categoryName, title, id } = route.params || {};
  const selectedCategoryName = categoryName || title || "menu";
  const categoryItems = Array.isArray(categoryData?.items)
    ? categoryData.items
    : [];
  const hasInlineItems = categoryItems.length > 0;
  const isVeg = useSelector((state) => state.foodFilter?.isVeg);
  const resolvedIsVeg = isVeg === null ? true : isVeg;
  const apiType = resolvedIsVeg ? "veg" : "non-veg";
  const selectedRestaurant = useSelector(
    state => state.experience?.selectedRestaurant,
  );

  const getRestaurantId = restaurant =>
    restaurant?.restaurantId ||
    restaurant?.petpoojaRestaurantId ||
    restaurant?.id ||
    restaurant?._id ||
    "";

  const cartItems = useSelector((state) => state.cart?.items || []);
  const totalCount = cartItems.length;

  const [selectedFood, setSelectedFood] = useState(null);
  
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [baseTotal, setBaseTotal] = useState(0);
  const [addonsTotal, setAddonsTotal] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [bottomBoxVisible, setBottomBoxVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchedItems, setFetchedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const restaurantId = getRestaurantId(selectedRestaurant);
  const selectedCategoryId =
    categoryData?.categoryId ||
    categoryData?.rawPayload?.categoryid ||
    categoryData?.id ||
    id ||
    categoryData?._id ||
    "";

  const selectedParentCategoryId =
    categoryData?.parentId ||
    categoryData?.rawPayload?.parent_category_id ||
    categoryData?.parentCategoryId ||
    "";

  const normalizeTopPicksItem = useCallback((item) => {
    if (!item) {
      return item;
    }

    const source = item?.food || item;
    const attr = String(
      source?.attribute ||
      source?.rawPayload?.item_attributeid ||
      source?.raw?.attribute ||
      source?.raw?.rawPayload?.item_attributeid ||
      "",
    ).trim();

    const nameText = String(source?.name || source?.rawPayload?.itemname || "").toLowerCase();

    const fallbackType =
      attr === "1"
        ? "veg"
        : attr === "2"
        ? "non-veg"
        : attr === "24" || attr === "3"
        ? "egg"
        : nameText.includes("chicken") ||
          nameText.includes("mutton") ||
          nameText.includes("fish") ||
          nameText.includes("prawn")
        ? "non-veg"
        : "";

    if (item?.food) {
      return {
        ...item,
        food: {
          ...item.food,
          type: item?.food?.type || fallbackType,
        },
      };
    }

    return {
      ...item,
      type: item?.type || fallbackType,
    };
  }, []);

  const getItemPrice = useCallback((item) => {
    const source = item?.food || item;
    const priceCandidate =
      source?.price ||
      source?.priceInfo?.staticPrice ||
      source?.priceInfo?.fullPrice ||
      source?.priceInfo?.halfPrice ||
      source?.rawPayload?.price ||
      source?.raw?.price ||
      0;

    return Number(priceCandidate || 0);
  }, []);

  const loadCategoryItems = useCallback(async () => {
    if (!restaurantId || !selectedCategoryId) {
      setFetchedItems([]);
      return;
    }

    try {
      setLoadingItems(true);

      const response = await axiosInstance.get(API.getfoodpagination, {
        params: {
          restaurantId,
          parentCategoryId: selectedParentCategoryId,
          categoryId: selectedCategoryId,
          type: apiType,
          page: 1,
          limit: 100,
          search: "",
        },
      });

      const items = Array.isArray(response?.data?.items)
        ? response.data.items
        : [];
      setFetchedItems(items.map(normalizeTopPicksItem));
    } catch (e) {
      setFetchedItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [restaurantId, selectedCategoryId, selectedParentCategoryId, normalizeTopPicksItem, apiType]);

  useEffect(() => {
    if (hasInlineItems) {
      return;
    }

    loadCategoryItems();
  }, [hasInlineItems, loadCategoryItems]);

  const sourceItems = (hasInlineItems ? categoryItems : fetchedItems).map(normalizeTopPicksItem);
  const filteredCategoryItems = sourceItems.filter(item =>
    shouldIncludeByVegFilter(item?.food || item, resolvedIsVeg)
  );

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const boxAnim = useRef(new Animated.Value(150)).current;

  // Total calculation
  useEffect(() => {
    if (!selectedFood) return;

    const base = getItemPrice(selectedFood) * quantity;

    const addons =
      selectedAddOns.reduce(
        (sum, a) => sum + Number(a.price || 0),
        0
      ) * quantity;

    setBaseTotal(base);
    setAddonsTotal(addons);
    setTotalPrice(base + addons);
  }, [selectedFood, quantity, selectedAddOns, getItemPrice]);

  // Open modal
  const openModal = (food) => {
    setSelectedFood(food);
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

  // Close modal
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
    });
  };

  // Add to cart
  const handleConfirmAdd = () => {
    if (!selectedFood) return;

    const localCartItem = {
      ...selectedFood,
      price: getItemPrice(selectedFood),
      priceInfo: {
        ...selectedFood.priceInfo,
        staticPrice: getItemPrice(selectedFood),
      },
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
      quantity,
      totalPrice,
      selectedAddOns,
    };

    dispatch(
      addToCart({
        ...localCartItem,
      })
    );

    const addAndNavigate = async () => {
      try {
        const restaurantId = getRestaurantId(selectedRestaurant);
        await dispatch(
          addItemToPetpoojaCart({
            restaurantId,
            cartItem: localCartItem,
          })
        ).unwrap();

        closeModal();
        setBottomBoxVisible(true);
        boxAnim.setValue(150);
        Animated.timing(boxAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      } catch (e) {
        closeModal();

        // Keep current UX if API fails
        setBottomBoxVisible(true);
        boxAnim.setValue(150);
        Animated.timing(boxAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    };

    addAndNavigate();
  };

  // Go to cart
  const handleGoToCart = () => {
    const navigateToCart = async () => {
      try {
        const cartResponse = await dispatch(fetchPetpoojaCart()).unwrap();
        navigation.navigate("OderCartScreen", {
          petpoojaCartData: cartResponse?.cart || null,
          fromPetpoojaSync: true,
        });
      } catch (e) {
        navigation.navigate("OderCartScreen", {
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

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);

    try {
      if (!hasInlineItems) {
        await loadCategoryItems();
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Render item
  const renderItem = ({ item, index }) => {
    console.log(item,"------------------item in render"); // Debug log
    const typeMeta = getFoodTypeMeta(item);

    const imageUri =
      item.item_image_url ||
      "https://cdn-icons-png.flaticon.com/512/3075/3075977.png";

    return (
      <View
        style={styles.card}
        key={
          item._id ||
          item.itemid ||
          item.id ||
          item.item_id ||
          index
        }
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
        />

        <View style={styles.details}>
          <Text style={styles.cuisine}>
            {typeMeta.label}
          </Text>

          <View style={styles.row}>
            <View
              style={[
                styles.typeIndicator,
                {
                  borderColor: typeMeta.color,
                },
              ]}
            >
              <View
                style={[
                  styles.typeDot,
                  {
                    backgroundColor: typeMeta.color,
                  },
                ]}
              />
            </View>

            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <Text style={styles.priceText}>
            ₹{getItemPrice(item)}
          </Text>

          {/* <Text
            style={styles.description}
            numberOfLines={2}
          >
            {item.rawPayload?.itemdescription ||
              "Delicious food item"}
          </Text> */}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => openModal(item)}
        >
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <CustomHeader title={selectedCategoryName} />

      <DashboardScreen scrollable={false}>
        <View style={styles.container}>
          {loadingItems && !hasInlineItems ? (
            <ActivityIndicator size="large" color="#FF4D4D" style={{ marginTop: 20 }} />
          ) : null}
          {filteredCategoryItems.length === 0 ? (
            <Text style={styles.noData}>
              No items available
            </Text>
          ) : (
            <FlatList
              data={filteredCategoryItems}
              keyExtractor={(item, index) =>
                (
                  item._id ||
                  item.itemid ||
                  item.id ||
                  item.item_id ||
                  index
                ).toString()
              }
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 120,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              }
            />
          )}
        </View>

        {/* Modal */}
        <Modal
          transparent
          visible={modalVisible}
          animationType="none"
        >
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
                          source={{
                            uri:
                              selectedFood.item_image_url ||
                              "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
                          }}
                          style={styles.modalImg}
                        />

                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.modalCuisine}>
                            {getFoodTypeMeta(selectedFood).label}
                          </Text>

                          <Text style={styles.modalFoodName}>
                            {selectedFood.name}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.staticPrice}>
                        Price: ₹{getItemPrice(selectedFood)}
                      </Text>

                      <Text style={styles.modalDescription}>
                        {
                          selectedFood.rawPayload
                            ?.itemdescription
                        }
                      </Text>

                      {/* Quantity */}
                      <View style={styles.quantityBox}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() =>
                            quantity > 1 &&
                            setQuantity(quantity - 1)
                          }
                        >
                          <Text style={styles.qtyText}>-</Text>
                        </TouchableOpacity>

                        <Text style={styles.qtyValue}>
                          {quantity}
                        </Text>

                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() =>
                            setQuantity(quantity + 1)
                          }
                        >
                          <Text style={styles.qtyText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Footer */}
                      <View style={styles.modalFooter}>
                        <View>
                          <Text style={styles.totalPrice}>
                            Total: ₹{totalPrice}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.confirmBtn}
                          onPress={handleConfirmAdd}
                        >
                          <Text style={styles.confirmBtnText}>
                            Confirm Add
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Bottom Success Box */}
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
              colors={[
                "#ff4d4d",
                "#ff6f61",
                "#ff8a65",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bottomGradient}
            >
              <Text style={styles.bottomMsg}>
                ✓ Item added successfully (
                {totalCount} in cart)
              </Text>

              <TouchableOpacity
                style={styles.bottomBtn}
                onPress={handleGoToCart}
              >
                <Text style={styles.bottomBtnText}>
                  Go to Cart
                </Text>
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
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  noData: {
    textAlign: "center",
    marginTop: 30,
    color: "gray",
    fontSize: 16,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    marginBottom: 15,
    alignItems: "center",
    elevation: 3,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowRadius: 4,
  },

  image: {
    width: 85,
    height: 85,
    borderRadius: 14,
    backgroundColor: "#f2f2f2",
  },

  details: {
    flex: 1,
    marginLeft: 12,
  },

  cuisine: {
    color: "#FF4D4D",
    fontSize: 12,
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  typeIndicator: {
    width: 15,
    height: 15,
    borderWidth: 1,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },

  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginLeft: 8,
    width: "88%",
  },

  priceText: {
    color: "#000",
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700",
  },

  description: {
    color: "#666",
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },

  addBtn: {
    backgroundColor: "#FF4D4D",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },

  addText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  modalHandle: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginBottom: 15,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  modalImg: {
    width: 85,
    height: 85,
    borderRadius: 14,
    backgroundColor: "#f2f2f2",
  },

  modalFoodName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },

  modalCuisine: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },

  staticPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF4D4D",
    marginTop: 18,
    color: "#222",
  },

  modalDescription: {
    marginTop: 12,
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },

  quantityBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F0",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 20,
  },

  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },

  qtyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF4D4D",
  },

  qtyValue: {
    marginHorizontal: 22,
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },

  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  confirmBtn: {
    backgroundColor: "#FF4D4D",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
  },

  confirmBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  // Bottom Box
  bottomBox: {
    position: "absolute",
    bottom: Platform.OS === "android" ? 25 : 50,
    width: "100%",
    paddingHorizontal: 16,
  },

  bottomGradient: {
    padding: 16,
    borderRadius: 20,
  },

  bottomMsg: {
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "600",
  },

  bottomBtn: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignSelf: "center",
  },

  bottomBtnText: {
    fontWeight: "700",
    color: "#FF4D4D",
  },
});