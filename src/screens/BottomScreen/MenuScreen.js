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

  const [baseTotal, setBaseTotal] = useState(0);

  const [addonsTotal, setAddonsTotal] = useState(0);

  const [totalPrice, setTotalPrice] = useState(0);

  // ================= REFS =================

  const initialLoaded = useRef(false);
  const lastResIdRef = useRef('');
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

  const isRestaurantActive =
    selectedRestaurant?.available !== false;

  // ================= INITIAL LOAD =================

  useEffect(() => {
    if (!resId) {
      return;
    }

    const restaurantChanged = lastResIdRef.current !== resId;
    lastResIdRef.current = resId;

    if (!initialLoaded.current || restaurantChanged) {
      initialLoaded.current = true;

      dispatch(clearFoods());
      dispatch(
        fetchFoodPagination({
          page: 1,
          limit: 10,
          type: '',
          search: '',
          restaurantId: resId,
        }),
      );
    }
  }, [resId, dispatch]);

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

  // ================= REFRESH =================

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      dispatch(clearFoods());

      await dispatch(
        fetchFoodPagination({
          page: 1,
          limit: 10,
          type: '',
          search: '',
          restaurantId: resId,
        }),
      ).unwrap();
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
        type: '',
        search: '',
        restaurantId: resId,
      }),
    ).finally(() => {
      isPaginatingRef.current = false;
    });
  };

  // ================= FILTER =================

  const filteredFoods = AllFoodsData.filter(item => {
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
          useNativeDriver: true,
        }).start();
      }
    };

    addAndNavigate();
  };

  const handleGoToCart = () => {
    Animated.timing(boxAnim, {
      toValue: 150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setBottomBoxVisible(false);
    });

    navigation.navigate('OderCartScreen');
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
            ? 'ADD +'
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
              onEndReached={isSearchActive ? undefined : handleLoadMore}
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
                loading && hasMore && !isSearchActive ? (
                  <ActivityIndicator
                    size="large"
                    color="#FF4D4D"
                    style={{marginBottom: 20}}
                  />
                ) : null
              }
              ListEmptyComponent={
                loading ? (
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
    backgroundColor: '#F8F8F8',
  },

  // ================= SEARCH =================
  searchBox: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
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

  // ================= FOOD CARD =================
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',

  
    marginVertical: 8,

    borderRadius: 20,
    padding: 12,

    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowRadius: 6,

    elevation: 4,
    borderWidth: 1,
    borderColor: '#F5E9E2',
  },

  imageWrapper: {
    position: 'relative',
  },

  image: {
    width: 95,
    height: 95,
    borderRadius: 16,
    backgroundColor: '#F1F1F1',
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

  details: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },

  cuisine: {
    fontSize: 12,
    color: '#8A8A8A',
    fontWeight: '600',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  typeBox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    width: '90%',
  },

  description: {
    marginTop: 6,
    fontSize: 12,
    color: '#777',
    lineHeight: 18,
  },

  priceMain: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '800',
    color: '#E53935',
  },

  priceText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },

  addBtn: {
    backgroundColor: '#E53935',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 85,
  },

  disabledBtn: {
    backgroundColor: '#BDBDBD',
  },

  addText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ================= SHIMMER =================
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

  // ================= MODAL =================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 25,
    maxHeight: '90%',
  },

  modalHandle: {
    width: 65,
    height: 6,
    borderRadius: 10,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 18,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalImg: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#F3F3F3',
  },

  modalCuisine: {
    color: '#8A8A8A',
    fontSize: 13,
    marginBottom: 4,
  },

  modalFoodName: {
    color: '#111',
    fontSize: 20,
    fontWeight: '800',
  },

  // ================= VARIANTS =================
  optionRow: {
    flexDirection: 'row',
    marginTop: 18,
  },

  optionBtn: {
    borderWidth: 1.5,
    borderColor: '#E53935',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
  },

  selectedOption: {
    backgroundColor: '#E53935',
  },

  optionText: {
    color: '#E53935',
    fontWeight: '700',
  },

  optionTextSelected: {
    color: '#fff',
  },

  staticPrice: {
    marginTop: 14,
    color: '#E53935',
    fontWeight: '800',
    fontSize: 20,
  },

  modalDescription: {
    marginTop: 14,
    color: '#666',
    lineHeight: 22,
    fontSize: 14,
  },

  // ================= ADDONS =================
  addonTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 18,
    color: '#111',
  },

  addonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },

  addonImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F2F2F2',
  },

  addonName: {
    fontWeight: '700',
    color: '#111',
    fontSize: 14,
  },

  addonPrice: {
    color: '#E53935',
    marginTop: 4,
    fontWeight: '600',
  },

  // ================= QUANTITY =================
  quantityBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },

  qtyBtn: {
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: '#FFEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  qtyText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E53935',
  },

  qtyValue: {
    marginHorizontal: 24,
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },

  // ================= FOOTER =================
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  totalPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },

  confirmBtn: {
    backgroundColor: '#E53935',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },

  confirmBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  // ================= BOTTOM BOX =================
  bottomBox: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 90 : 60,
    width: '100%',
    paddingHorizontal: 16,
  },

  bottomGradient: {
    padding: 18,
    borderRadius: 22,
  },

  bottomMsg: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '700',
    fontSize: 14,
  },

  bottomBtn: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: 'center',
  },

  bottomBtnText: {
    color: '#E53935',
    fontWeight: '800',
    fontSize: 14,
  },

  // ================= CLOSED =================
  closedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },

  closedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E53935',
  },

  closedSubtitle: {
    marginTop: 10,
    color: '#777',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});