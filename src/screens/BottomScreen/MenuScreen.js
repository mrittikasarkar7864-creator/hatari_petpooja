// CatItemScreen.js — Optimized & Production Ready (No Reload Issue)

import React, {useEffect, useRef, useState, useCallback} from 'react';
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
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import {useDispatch, useSelector} from 'react-redux';

import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

import DashboardScreen from '../../components/DashboardScreen';
import CustomHeader from '../../components/CustomHeader';

import {
  fetchFoodPagination,
  clearFoods,
} from '../../redux/slice/SearchFoodPaginationSlice';
import { shouldIncludeByVegFilter } from '../../utils/foodType';
import {
  addItemToPetpoojaCart,
  fetchPetpoojaCart,
} from '../../redux/slice/CartApiSlice';
import axiosInstance from '../../global_Url/axiosInstance';
import {API} from '../../global_Url/GlobalUrl';

import {addToCart} from '../../redux/slice/cartSlice';

const {width} = Dimensions.get('window');

const CatItemScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // ================= REDUX =================

  const isVeg = useSelector(state => state.foodFilter.isVeg);

  const {
    AllFoodsData = [],
    loading,
    page = 1,
    hasMore,
  } = useSelector(state => state.FoodPagination);



  const cartItems = useSelector(state => state.cart.items || []);

  const selectedRestaurant = useSelector(
    state => state.experience.selectedRestaurant,
  );

  // ================= STATES =================

  const [selectedFood, setSelectedFood] = useState(null);

  const [selectedOption, setSelectedOption] = useState('half');

  const [selectedAddOns, setSelectedAddOns] = useState([]);

  const [quantity, setQuantity] = useState(1);

  const [modalVisible, setModalVisible] = useState(false);

  const [bottomBoxVisible, setBottomBoxVisible] = useState(false);

  const [searchText, setSearchText] = useState('');

  const [refreshing, setRefreshing] = useState(false);
  const [fetchedItems, setFetchedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [baseTotal, setBaseTotal] = useState(0);

  const [addonsTotal, setAddonsTotal] = useState(0);

  const [totalPrice, setTotalPrice] = useState(0);

  // ================= REFS =================

  const initialLoaded = useRef(false);
  const lastResIdRef = useRef('');
  const lastFoodTypeRef = useRef('');
  const onEndReachedDuringMomentum = useRef(true);
  const isPaginatingRef = useRef(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(0)).current;

  const boxAnim = useRef(new Animated.Value(150)).current;

  // ================= HELPERS =================

  const totalCount = cartItems.length;

  const getRestaurantId = restaurant =>
    restaurant?.restaurantId ??
    restaurant?._id ??
    restaurant?.id ??
    '';

  const resId = getRestaurantId(selectedRestaurant);
  const foodType = isVeg === null ? '' : isVeg ? 'veg' : 'non-veg';
  const hasInlineItems = AllFoodsData.length > 0;

  const isRestaurantActive =
    selectedRestaurant?.available !== false;

  // ================= INITIAL LOAD =================

  useEffect(() => {
    if (!resId) {
      return;
    }

    const restaurantChanged = lastResIdRef.current !== resId;
    const foodTypeChanged = lastFoodTypeRef.current !== foodType;
    lastResIdRef.current = resId;
    lastFoodTypeRef.current = foodType;

    if (!initialLoaded.current || restaurantChanged || foodTypeChanged) {
      initialLoaded.current = true;

      dispatch(clearFoods());
      dispatch(
        fetchFoodPagination({
          page: 1,
          limit: 10,
          type: foodType,
          search: '',
          restaurantId: resId,
        }),
      );
    }
  }, [resId, foodType, dispatch]);

  // ================= ANIMATION =================

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setBottomBoxVisible(false);

        boxAnim.setValue(150);
      };
    }, []),
  );

  const normalizeFallbackItem = useCallback(raw => {
    const attr = String(raw?.attribute || raw?.rawPayload?.item_attributeid || '').trim();
    const fallbackType = attr === '1' ? 'veg' : attr === '2' ? 'non-veg' : attr === '24' || attr === '3' ? 'egg' : '';

    const hasVariation = Array.isArray(raw?.variations) && raw.variations.length > 0;
    const half = raw?.variations?.[0] || {};
    const full = raw?.variations?.[1] || raw?.variations?.[0] || {};

    return {
      food: {
        _id: raw?.itemId || raw?._id || raw?.item_id || '',
        name: raw?.name || raw?.rawPayload?.itemname || '',
        image: raw?.item_image_url || raw?.rawPayload?.item_image_url || null,
        cuisineType: raw?.cuisines?.[0] || raw?.rawPayload?.cuisine || '',
        type: fallbackType,
        priceInfo: {
          hasVariation,
          halfPrice: Number(half?.price || 0),
          fullPrice: Number(full?.price || 0),
          staticPrice: Number(raw?.price || raw?.rawPayload?.price || 0),
        },
        addOns: Array.isArray(raw?.addons)
          ? raw.addons
          : Array.isArray(raw?.rawPayload?.addon)
          ? raw.rawPayload.addon
          : [],
        description: raw?.description || raw?.rawPayload?.itemdescription || '',
        available: raw?.active !== false && (raw?.in_stock === undefined || Number(raw?.in_stock || 0) > 0),
        raw,
      },
      _id: raw?.itemId || raw?._id || raw?.item_id || '',
      name: raw?.name || raw?.rawPayload?.itemname || '',
      type: fallbackType,
    };
  }, []);

  const loadCategoryItems = useCallback(async () => {
    if (!resId) {
      setFetchedItems([]);
      return;
    }

    try {
      setLoadingItems(true);

      const response = await axiosInstance.get(API.getfoodpagination, {
        params: {
          restaurantId: resId,
          page: 1,
          limit: 200,
          search: '',
        },
      });

      const items = Array.isArray(response?.data?.items) ? response.data.items : [];
      setFetchedItems(items.map(normalizeFallbackItem));
    } catch (e) {
      setFetchedItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [resId, normalizeFallbackItem]);

  useEffect(() => {
    loadCategoryItems();
  }, [loadCategoryItems]);

  // ================= REFRESH =================

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      dispatch(clearFoods());

      await dispatch(
        fetchFoodPagination({
          page: 1,
          limit: 10,
          type: foodType,
          search: '',
          restaurantId: resId,
        }),
      ).unwrap();

      await loadCategoryItems();
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  };

  // ================= PAGINATION =================

  const handleLoadMore = () => {
    if (
      loading ||
      !hasMore ||
      onEndReachedDuringMomentum.current ||
      isPaginatingRef.current
    ) {
      return;
    }

    isPaginatingRef.current = true;
    onEndReachedDuringMomentum.current = true;

    dispatch(
      fetchFoodPagination({
        page: page + 1,
        limit: 10,
        type: foodType,
        search: '',
        restaurantId: resId,
      }),
    ).finally(() => {
      isPaginatingRef.current = false;
    });
  };

  // ================= FILTER =================

  const mergeById = (primary = [], secondary = []) => {
    const map = new Map();

    primary.forEach(item => {
      const food = item?.food || item;
      const id =
        food?._id ||
        food?.id ||
        food?.itemId ||
        food?.itemid ||
        item?._id;
      map.set(String(id || Math.random()), item);
    });

    secondary.forEach(item => {
      const food = item?.food || item;
      const id =
        food?._id ||
        food?.id ||
        food?.itemId ||
        food?.itemid ||
        item?._id;
      const key = String(id || Math.random());
      if (!map.has(key)) {
        map.set(key, item);
      }
    });

    return Array.from(map.values());
  };

  const sourceItems = mergeById(AllFoodsData, fetchedItems);

  const filteredFoods = sourceItems.filter(item => {
    const food = item.food || item;

    if (!food) {
      return false;
    }

    if (!shouldIncludeByVegFilter(food, isVeg)) {
      return false;
    }

    const normalizedSearch = searchText.trim().toLowerCase();

    if (normalizedSearch) {
      return food.name
        ?.toLowerCase()
        ?.includes(normalizedSearch);
    }

    return true;
  });

  // ================= PRICE =================

  const computePrice = (
    food = selectedFood,
    option = selectedOption,
    qty = quantity,
    addOns = selectedAddOns,
  ) => {
    if (!food) {
      return;
    }

    const basePrice = food.priceInfo?.hasVariation
      ? option === 'half'
        ? Number(food.priceInfo.halfPrice)
        : Number(food.priceInfo.fullPrice)
      : Number(food.priceInfo.staticPrice);

    const addOnPrice = addOns.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0,
    );

    const base = basePrice * qty;

    const finalTotal = base + addOnPrice;

    setBaseTotal(base);

    setAddonsTotal(addOnPrice);

    setTotalPrice(finalTotal);
  };

  useEffect(() => {
    computePrice();
  }, [
    quantity,
    selectedOption,
    selectedAddOns,
    selectedFood,
  ]);

  // ================= ADDON =================

  const toggleAddOn = addon => {
    const exists = selectedAddOns.some(
      item => item.name === addon.name,
    );

    if (exists) {
      setSelectedAddOns(prev =>
        prev.filter(item => item.name !== addon.name),
      );
    } else {
      setSelectedAddOns(prev => [...prev, addon]);
    }
  };

  // ================= MODAL =================

  const openModal = food => {
    setSelectedFood(food);

    setSelectedOption(
      food?.priceInfo?.hasVariation ? 'half' : 'full',
    );

    setQuantity(1);

    setSelectedAddOns([]);

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
    });
  };

  // ================= CART =================

  const handleConfirmAdd = () => {
    if (!selectedFood) {
      return;
    }

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
      quantity,
      selectedOption,
      selectedAddOns,
      totalPrice,
    };

    dispatch(
      addToCart({
        ...localCartItem,

        baseUnitPrice:
          selectedFood.priceInfo?.hasVariation
            ? selectedOption === 'half'
              ? Number(selectedFood.priceInfo.halfPrice)
              : Number(selectedFood.priceInfo.fullPrice)
            : Number(selectedFood.priceInfo.staticPrice),

        addOnsUnitPrice: addonsTotal,

        baseTotal,

        addonsTotal,

        totalPrice,
      }),

      
    );

    const addAndNavigate = async () => {
      try {
        await dispatch(
          addItemToPetpoojaCart({
            restaurantId: resId,
            cartItem: localCartItem,
          }),
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

  const handleGoToCart = async () => {
    const navigateToCart = (cartData = null) => {
      navigation.navigate('OderCartScreen', {
        petpoojaCartData: cartData,
        fromPetpoojaSync: true,
      });
    };

    Animated.timing(boxAnim, {
      toValue: 150,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      setBottomBoxVisible(false);

      try {
        const cartResponse = await dispatch(fetchPetpoojaCart()).unwrap();
        navigateToCart(cartResponse?.cart || null);
      } catch (e) {
        navigateToCart(null);
      }
    });
  };

  // ================= RENDER ITEM =================

const renderItem = ({item}) => {
  const dataItem = item?.food || item;
 
  console.log(dataItem, '-----------------------dataitem');

  const isFoodAvailable =
    resId && dataItem?.available !== false;

  // ================= IMAGE =================
  const foodImage =
    dataItem?.image ||
    dataItem?.raw?.item_image_url ||
    dataItem?.raw?.rawPayload?.item_image_url ||
    'https://cdn-icons-png.flaticon.com/512/1046/1046784.png';

  // ================= PRICE =================
  const hasVariation =
    dataItem?.priceInfo?.hasVariation;

  const staticPrice =
    dataItem?.priceInfo?.staticPrice ||
    dataItem?.raw?.price ||
    0;

  const halfPrice =
    dataItem?.priceInfo?.halfPrice || 0;

  const fullPrice =
    dataItem?.priceInfo?.fullPrice || 0;

  // ================= CUISINE =================
  const cuisineText = Array.isArray(
    dataItem?.cuisineType,
  )
    ? dataItem?.cuisineType?.join(', ')
    : dataItem?.cuisineType || 'Delicious Food';

  const resolvedType = (dataItem?.type || '').toLowerCase().trim();
  const isVegItem =
    resolvedType === 'veg' ||
    resolvedType === '1' ||
    resolvedType === 'vegetarian';
  const isVeg = isVegItem;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={styles.card}>
      {/* ================= FOOD IMAGE ================= */}
      <View style={styles.imageWrapper}>
        <Image
          source={{uri: foodImage}}
          style={styles.image}
        />

        {/* VEG / NON VEG BADGE */}
        <View
          style={[
            styles.vegBadge,
            {
              borderColor: isVeg
                ? '#1BA672'
                : '#D7263D',
            },
          ]}>
          <View
            style={[
              styles.vegDot,
              {
                backgroundColor: isVeg
                  ? '#1BA672'
                  : '#D7263D',
              },
            ]}
          />
        </View>
      </View>

      {/* ================= DETAILS ================= */}
      <View style={styles.details}>
        <Text
          style={styles.name}
          numberOfLines={1}>
          {dataItem?.name || 'Food Item'}
        </Text>

        <Text
          style={styles.cuisine}
          numberOfLines={1}>
          {cuisineText}
        </Text>

        {/* PRICE */}
        {hasVariation ? (
          <View style={{marginTop: 6}}>
            <Text style={styles.priceText}>
              Half: ₹{halfPrice}
            </Text>

            <Text style={styles.priceText}>
              Full: ₹{fullPrice}
            </Text>
          </View>
        ) : (
          <Text style={styles.priceMain}>
            ₹{staticPrice}
          </Text>
        )}

        {/* DESCRIPTION */}
        {!!dataItem?.description && (
          <Text
            style={styles.description}
            numberOfLines={2}>
            {dataItem?.description}
          </Text>
        )}
      </View>

      {/* ================= ADD BUTTON ================= */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.addBtn,
          !isFoodAvailable && styles.disabledBtn,
        ]}
        onPress={() => {
          if (!isFoodAvailable) {
            alert('Food not available');
            return;
          }

          openModal(dataItem);
        }}>
        <Text style={styles.addText}>
          {isFoodAvailable
            ? 'ADD '
            : 'Unavailable'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

  // ================= KEY =================

  const keyExtractor = (item, index) => {
    const baseKey =
      item?.food?._id ??
      item?._id ??
      item?.food?.name ??
      item?.name ??
      'menu-item';

    return `${String(baseKey)}-${index}`;
  };

  // ================= UI =================

  return (
    <>
      <CustomHeader title="All Menu" />

      {isRestaurantActive ? (
        <DashboardScreen scrollable={false}>
          {/* SEARCH */}

          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search food..."
              placeholderTextColor="#666"
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          {/* LIST */}

          <Animated.View
            style={{
              flex: 1,
              opacity: fadeAnim,
            }}>
            {/** Keep search local and prevent pagination spam during search typing */}
            {(() => {
              const isSearchActive = searchText.trim().length > 0;
              return (
            <FlatList
              data={filteredFoods}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 140,
                paddingHorizontal: 12,
              }}
              onEndReached={isSearchActive || !hasInlineItems ? undefined : handleLoadMore}
              onEndReachedThreshold={0.5}
              onMomentumScrollBegin={() => {
                onEndReachedDuringMomentum.current = false;
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              }
              ListFooterComponent={
                loading && hasMore && !isSearchActive && hasInlineItems ? (
                  <ActivityIndicator
                    size="large"
                    color="#FF4D4D"
                    style={{marginBottom: 20}}
                  />
                ) : null
              }
              ListEmptyComponent={
                loading || loadingItems ? (
                  <View style={{padding: 12}}>
                    {[...Array(6)].map((_, idx) => (
                      <View
                        key={idx}
                        style={styles.shimmerRow}>
                        <ShimmerPlaceHolder
                          LinearGradient={
                            LinearGradient
                          }
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 10,
                          }}
                        />

                        <View
                          style={{
                            flex: 1,
                            marginLeft: 10,
                          }}>
                          <ShimmerPlaceHolder
                            LinearGradient={
                              LinearGradient
                            }
                            style={{
                              width: '50%',
                              height: 12,
                              borderRadius: 4,
                              marginBottom: 8,
                            }}
                          />

                          <ShimmerPlaceHolder
                            LinearGradient={
                              LinearGradient
                            }
                            style={{
                              width: '70%',
                              height: 14,
                              borderRadius: 4,
                            }}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View
                    style={{
                      padding: 40,
                      alignItems: 'center',
                    }}>
                    <Text>
                      {!resId
                        ? 'Please select a branch first'
                        : searchText
                        ? 'No items match your search'
                        : 'No items found'}
                    </Text>
                  </View>
                )
              }
            />
              );
            })()}
          </Animated.View>

          {/* MODAL */}

          <Modal
            transparent
            visible={modalVisible}
            animationType="none">
            <TouchableWithoutFeedback
              onPress={closeModal}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <Animated.View
                    style={[
                      styles.modalContent,
                      {
                        transform: [
                          {
                            translateY:
                              slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [300, 0],
                              }),
                          },
                        ],
                      },
                    ]}>
                    <View style={styles.modalHandle} />

                    {selectedFood && (
                      <>
                        <View style={styles.modalHeader}>
                          <Image
                            source={{
                              uri: selectedFood.image,
                            }}
                            style={styles.modalImg}
                          />

                          <View
                            style={{
                              flex: 1,
                              marginLeft: 12,
                            }}>
                            <Text
                              style={
                                styles.modalCuisine
                              }>
                              {
                                selectedFood.cuisineType
                              }
                            </Text>

                            <Text
                              style={
                                styles.modalFoodName
                              }>
                              {selectedFood.name}
                            </Text>
                               <Text
                              style={
                                styles.modalFoodName
                              }>
                              {selectedFood.description}
                            </Text>

                         
                          </View>
                        </View>

                        {/* VARIATION */}

                        {selectedFood.priceInfo
                          ?.hasVariation ? (
                          <View
                            style={styles.optionRow}>
                            {['half', 'full'].map(
                              option => (
                                <TouchableOpacity
                                  key={option}
                                  style={[
                                    styles.optionBtn,
                                    selectedOption ===
                                      option &&
                                      styles.selectedOption,
                                  ]}
                                  onPress={() =>
                                    setSelectedOption(
                                      option,
                                    )
                                  }>
                                  <Text
                                    style={[
                                      styles.optionText,
                                      selectedOption ===
                                        option &&
                                        styles.optionTextSelected,
                                    ]}>
                                    {option}
                                  </Text>
                                </TouchableOpacity>
                              ),
                            )}
                          </View>
                        ) : (
                          <Text
                            style={styles.staticPrice}>
                            ₹
                            {
                              selectedFood.priceInfo
                                ?.staticPrice
                            }
                          </Text>
                        )}

                        {/* DESCRIPTION */}

                        {selectedFood.description ? (
                          <Text
                            style={
                              styles.modalDescription
                            }>
                            {
                              selectedFood.description
                            }
                          </Text>
                        ) : null}

                        {/* ADDONS */}

                        {selectedFood.addOns
                          ?.length > 0 && (
                          <View
                            style={{
                              marginTop: 15,
                            }}>
                            <Text
                              style={
                                styles.addonTitle
                              }>
                              Add-ons
                            </Text>

                            {selectedFood.addOns.map(
                              (addon, index) => {
                                const isSelected =
                                  selectedAddOns.some(
                                    item =>
                                      item.name ===
                                      addon.name,
                                  );

                                return (
                                  <TouchableOpacity
                                    key={index}
                                    style={[
                                      styles.addonItem,
                                      isSelected && {
                                        borderColor:
                                          '#FF4D4D',
                                        borderWidth: 1.5,
                                      },
                                    ]}
                                    onPress={() =>
                                      toggleAddOn(
                                        addon,
                                      )
                                    }>
                                    <Image
                                      source={{
                                        uri: addon.image,
                                      }}
                                      style={
                                        styles.addonImage
                                      }
                                    />

                                    <View
                                      style={{
                                        flex: 1,
                                      }}>
                                      <Text
                                        style={
                                          styles.addonName
                                        }>
                                        {
                                          addon.name
                                        }
                                      </Text>

                                      <Text
                                        style={
                                          styles.addonPrice
                                        }>
                                        ₹
                                        {
                                          addon.price
                                        }
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                );
                              },
                            )}
                          </View>
                        )}

                        {/* QTY */}

                        <View
                          style={styles.quantityBox}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() =>
                              quantity > 1 &&
                              setQuantity(
                                quantity - 1,
                              )
                            }>
                            <Text style={styles.qtyText}>
                              -
                            </Text>
                          </TouchableOpacity>

                          <Text
                            style={styles.qtyValue}>
                            {quantity}
                          </Text>

                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() =>
                              setQuantity(
                                quantity + 1,
                              )
                            }>
                            <Text style={styles.qtyText}>
                              +
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* FOOTER */}

                        <View
                          style={styles.modalFooter}>
                          <Text
                            style={
                              styles.totalPrice
                            }>
                            ₹{totalPrice}
                          </Text>

                          <TouchableOpacity
                            style={
                              styles.confirmBtn
                            }
                            onPress={
                              handleConfirmAdd
                            }>
                            <Text
                              style={
                                styles.confirmBtnText
                              }>
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

          {/* BOTTOM BOX */}

          {bottomBoxVisible && (
            <Animated.View
              style={[
                styles.bottomBox,
                {
                  transform: [
                    {
                      translateY: boxAnim,
                    },
                  ],
                },
              ]}>
              <LinearGradient
                colors={[
                  '#ff4d4d',
                  '#ff6f61',
                  '#ff8a65',
                ]}
                style={styles.bottomGradient}>
                <Text style={styles.bottomMsg}>
                  ✓ Item added successfully (
                  {totalCount} in cart)
                </Text>

                <TouchableOpacity
                  style={styles.bottomBtn}
                  onPress={handleGoToCart}>
                  <Text
                    style={styles.bottomBtnText}>
                    Go to Cart
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}
        </DashboardScreen>
      ) : (
        <View style={styles.closedContainer}>
          <Text style={styles.closedTitle}>
            Restaurant not available
          </Text>

          <Text style={styles.closedSubtitle}>
            Please try again later
          </Text>
        </View>
      )}
    </>
  );
};

export default CatItemScreen;

// ================= STYLES =================



const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  vegBadge: {
     position: 'absolute',
     top: 6,
     left: 6,

     width: 18,
     height: 18,

     borderWidth: 1.5,
     borderRadius: 4,

     justifyContent: 'center',
     alignItems: 'center',

     backgroundColor: '#fff',
   },

   vegDot: {
     width: 8,
     height: 8,
     borderRadius: 10,
   },

     searchInput: {
    backgroundColor: '#fff',
    height: 50,
    borderRadius: 30,
    paddingHorizontal: 20,
     color: '#000',
     fontSize: 15,

     shadowColor: '#000',
     shadowOpacity: 0.05,
     shadowOffset: {
      width: 0,
       height: 2,
     },
    shadowRadius: 5,

     elevation: 3,
   },

    searchBox: {
     paddingHorizontal: 16,
    // paddingTop: 12,
     paddingBottom: 10,
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
    bottom: Platform.OS === "android" ? 90 : 50,
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
     shimmerRow: {
     flexDirection: 'row',
     backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
     marginHorizontal: 14,
     marginVertical: 8,
     alignItems: 'center',
    height: 100,

    elevation: 2,
  },
});