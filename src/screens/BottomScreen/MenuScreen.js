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
    const dataItem = item.food || item;

    const isFoodAvailable =
      resId && dataItem.available !== false;

    return (
      <View style={styles.card}>
        <Image
          source={{uri: dataItem.image}}
          style={styles.image}
        />

        <View style={styles.details}>
          <Text style={styles.cuisine}>
            {dataItem.cuisineType || ''}
          </Text>

          <View style={styles.row}>
            <View
              style={[
                styles.typeBox,
                {
                  borderColor:
                    (dataItem.type || '').toLowerCase() ===
                    'veg'
                      ? 'green'
                      : 'red',
                },
              ]}>
              <View
                style={[
                  styles.typeDot,
                  {
                    backgroundColor:
                      (dataItem.type || '').toLowerCase() ===
                      'veg'
                        ? 'green'
                        : 'red',
                  },
                ]}
              />
            </View>

            <Text
              style={styles.name}
              numberOfLines={1}>
              {dataItem.name}
            </Text>
          </View>

          {dataItem.priceInfo?.hasVariation ? (
            <>
              <Text style={styles.priceText}>
                Half: ₹{dataItem.priceInfo.halfPrice}
              </Text>

              <Text style={styles.priceText}>
                Full: ₹{dataItem.priceInfo.fullPrice}
              </Text>
            </>
          ) : (
            <Text style={styles.priceText}>
              ₹{dataItem.priceInfo?.staticPrice}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.addBtn,
            !isFoodAvailable && {
              backgroundColor: '#ccc',
            },
          ]}
          onPress={() => {
            if (!isFoodAvailable) {
              alert('Food not available');

              return;
            }

            openModal(dataItem);
          }}>
          <Text style={styles.addText}>
            {isFoodAvailable ? 'Add' : 'Unavailable'}
          </Text>
        </TouchableOpacity>
      </View>
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
  searchBox: {
    margin: 15,
    marginTop: -10,
  },

  searchInput: {
    backgroundColor: '#fff',
    height: 45,
    borderRadius: 30,
    paddingHorizontal: 18,
    color: '#000',
    elevation: 3,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 14,
    alignItems: 'center',
    elevation: 3,
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#eee',
  },

  details: {
    flex: 1,
    marginLeft: 10,
  },

  cuisine: {
    fontSize: 12,
    color: '#666',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    width: '90%',
  },

  priceText: {
    color: '#444',
    marginTop: 5,
    fontSize: 13,
  },

  addBtn: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 22,
  },

  addText: {
    color: '#fff',
    fontWeight: '700',
  },

  shimmerRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
    height: 90,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },

  modalHandle: {
    width: 60,
    height: 6,
    borderRadius: 10,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 15,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },

  modalCuisine: {
    color: '#888',
    fontSize: 13,
  },

  modalFoodName: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },

  optionRow: {
    flexDirection: 'row',
    marginTop: 14,
  },

  optionBtn: {
    borderWidth: 1,
    borderColor: '#FF4D4D',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
  },

  selectedOption: {
    backgroundColor: '#FF4D4D',
  },

  optionText: {
    color: '#FF4D4D',
    fontWeight: '700',
  },

  optionTextSelected: {
    color: '#fff',
  },

  staticPrice: {
    marginTop: 10,
    color: '#FF4D4D',
    fontWeight: '700',
  },

  modalDescription: {
    marginTop: 12,
    color: '#666',
    lineHeight: 20,
  },

  addonTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    color: '#000',
  },

  addonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },

  addonImage: {
    width: 45,
    height: 45,
    borderRadius: 10,
    marginRight: 10,
  },

  addonName: {
    fontWeight: '600',
    color: '#000',
  },

  addonPrice: {
    color: '#FF4D4D',
    marginTop: 2,
  },

  quantityBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },

  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  qtyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF4D4D',
  },

  qtyValue: {
    marginHorizontal: 20,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  confirmBtn: {
    backgroundColor: '#FF4D4D',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
  },

  confirmBtnText: {
    color: '#fff',
    fontWeight: '700',
  },

  bottomBox: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 90 : 60,
    width: '100%',
    paddingHorizontal: 16,
  },

  bottomGradient: {
    padding: 15,
    borderRadius: 20,
  },

  bottomMsg: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },

  bottomBtn: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
  },

  bottomBtnText: {
    color: '#FF4D4D',
    fontWeight: '700',
  },

  closedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  closedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF4D4D',
  },

  closedSubtitle: {
    marginTop: 8,
    color: '#777',
  },
});