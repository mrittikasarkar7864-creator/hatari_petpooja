// CatItemScreen.js — Fully fixed & production-ready
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
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import DashboardScreen from '../../components/DashboardScreen';
import CustomHeader from '../../components/CustomHeader';

import {
  fetchFoodPagination,
  clearFoods,
} from '../../redux/slice/SearchFoodPaginationSlice';

import {addToCart} from '../../redux/slice/cartSlice';

const {width} = Dimensions.get('window');

const CatItemScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Redux state
  const isVeg = useSelector(s => s.foodFilter.isVeg); // true / false / null
  const {
    AllFoodsData = [],
    loading,
    page = 1,
    hasMore,
  } = useSelector(s => s.FoodPagination);

  const cartItems = useSelector(s => s.cart.items || []);
    const totalCount = cartItems.length;
  // UI state
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedOption, setSelectedOption] = useState('half'); // 'half' | 'full'
  const [totalPrice, setTotalPrice] = useState(0);

  const [quantity, setQuantity] = useState(1);

  const [modalVisible, setModalVisible] = useState(false);

  const [bottomBoxVisible, setBottomBoxVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // Tracks selected add-ons in the modal
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  const [baseTotal, setBaseTotal] = useState(0);
  const [addonsTotal, setAddonsTotal] = useState(0);

  // animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const boxAnim = useRef(new Animated.Value(150)).current;

  // API filter param
  const type = isVeg === null ? '' : isVeg ? 'veg' : 'non-veg';
   const selectedRestaurant = useSelector(
    state => state.experience.selectedRestaurant,
  );

  // derive a stable restaurant id from multiple possible fields
  const getRestaurantId = (restaurant) =>
    restaurant?.restaurantId ?? restaurant?._id ?? restaurant?.id ?? '';

  const resId = getRestaurantId(selectedRestaurant);

  useFocusEffect(
    useCallback(() => {
      return () => {
        // Hide bottom modal when leaving this screen
        setBottomBoxVisible(false);
        boxAnim.setValue(150);
      };
    }, []),
  );

  const toggleAddOn = addon => {
    const exists = selectedAddOns.some(a => a.name === addon.name);

    if (exists) {
      setSelectedAddOns(selectedAddOns.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  // -------------------------
  // API calls
  // -------------------------
  const loadFirstPage = useCallback(() => {
    dispatch(clearFoods());
    dispatch(
      fetchFoodPagination({
        page: 1,
        limit: 10,
        type,
        search: searchText,
        restaurantId: resId,
      }),
    );
  }, [dispatch, type, searchText, resId]);

  // Debounce API calls when searchText or type changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadFirstPage();
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [loadFirstPage]);

  // initial fade-in
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      dispatch(
        fetchFoodPagination({
          page: page + 1,
          limit: 10,
          type,
          search: searchText,
          restaurantId: resId,
        }),
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(clearFoods());
      await dispatch(
        fetchFoodPagination({
          page: 1,
          limit: 10,
          type,
          search: searchText,
          restaurantId: resId,
        }),
      ).unwrap();
    } catch (err) {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const computeUnitPrice = () => {
    if (!selectedFood) return 0;

    const basePrice = selectedFood.priceInfo.hasVariation
      ? selectedOption === 'half'
        ? Number(selectedFood.priceInfo.halfPrice)
        : Number(selectedFood.priceInfo.fullPrice)
      : Number(selectedFood.priceInfo.staticPrice);

    const addOnsTotal = selectedAddOns.reduce(
      (sum, a) => sum + Number(a.price || 0),
      0,
    );

    return {
      basePrice, // price for 1 base
      addOnsTotal, // add-ons price (NOT multiplied)
    }; // ❗ NO MULTIPLY BY quantity
  };

  const updateTotal = (qty = quantity) => {
    if (!selectedFood) return;

    const {basePrice, addOnsTotal} = computeUnitPrice();

    // Base price × quantity
    const baseTotal = basePrice * qty;

    // Add-ons not multiplied
    const addonsFinalTotal = addOnsTotal;

    // Final Total
    const finalTotal = baseTotal + addonsFinalTotal;

    // Save individually
    setBaseTotal(baseTotal);
    setAddonsTotal(addonsFinalTotal);
    setTotalPrice(finalTotal);
  };

const filteredFoods = AllFoodsData.filter(item => {
  const food = item.food || item; // match renderItem
  if (!food) return false;

  let typeStr = String(food.type || '').toLowerCase();
  if (typeStr === 'nonveg') typeStr = 'non-veg';
  if (typeStr === 'vegetarian') typeStr = 'veg';

  if (isVeg === true && typeStr !== 'veg') return false;
  if (isVeg === false && typeStr !== 'non-veg') return false;

  if (searchText) {
    return food.name.toLowerCase().includes(searchText.toLowerCase());
  }
  return true;
});



  // -------------------------
  // Modal open / close
  // -------------------------
  const openModal = food => {
    const defaultOption = food?.priceInfo?.hasVariation ? 'half' : 'full';
    setSelectedFood(food);
    setSelectedOption(defaultOption); // default sensible option
    setQuantity(1);
    setSelectedAddOns([]); // reset add-ons

    // compute initial totals using the passed `food` (avoid relying on state updates)
    const basePrice = food.priceInfo?.hasVariation
      ? defaultOption === 'half'
        ? Number(food.priceInfo.halfPrice)
        : Number(food.priceInfo.fullPrice)
      : Number(food.priceInfo.staticPrice || 0);
    setBaseTotal(basePrice);
    setAddonsTotal(0);
    setTotalPrice(basePrice);

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
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      // reset selected food after close
      setSelectedFood(null);
    });
  };

  // -------------------------
  // Add to cart
  // -------------------------
  const handleConfirmAdd = () => {
    if (!selectedFood) return;

    dispatch(
      addToCart({
        ...selectedFood,
        quantity,
        selectedOption,
        selectedAddOns: selectedAddOns || [],

        // NEW VALUES
        baseUnitPrice: computeUnitPrice().basePrice, // base price of 1 item
        addOnsUnitPrice: computeUnitPrice().addOnsTotal, // addon price (no qty)

        baseTotal, // basePrice × quantity
        addonsTotal, // addonsTotal × 1
        totalPrice, // finalTotal = baseTotal + addonsTotal
      }),
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

    navigation.navigate('OderCartScreen');
  };

const renderItem = ({ item }) => {
  const dataItem = item?.food || item; // fallback


  const isFoodAvailable = resId && dataItem.available !== false; // true if available

  return (
    <View style={styles.card}>
      <Image source={{ uri: dataItem.image }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.cuisine}>{dataItem.cuisineType || ''}</Text>
        <View style={styles.row}>
          <View
            style={[
              styles.typeBox,
              {
                borderColor:
                  (dataItem.type || '').toLowerCase() === 'veg' ? 'green' : 'red',
              },
            ]}
          >
            <View
              style={[
                styles.typeDot,
                {
                  backgroundColor:
                    (dataItem.type || '').toLowerCase() === 'veg' ? 'green' : 'red',
                },
              ]}
            />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {dataItem?.name}
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
            Price: ₹{dataItem.priceInfo?.staticPrice}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.addBtn,
          !isFoodAvailable && { backgroundColor: '#ccc' },
        ]}
        onPress={() => {
          if (!isFoodAvailable) {
            alert('Food not available right now');
            return;
          }
          openModal(dataItem);
        }}
      >
        <Text style={styles.addText}>
          {isFoodAvailable ? 'Add' : 'Not Available'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};


  // -------------------------
  // stable key extractor
  // -------------------------
  const keyExtractor = (item, idx) => {
    const id = item?.food?._id ?? item?._id ?? String(idx);
    return String(id);
  };

  // -------------------------
  // Effects to keep modal totals in sync with changes
  // -------------------------
  useEffect(() => {
    updateTotal(quantity, selectedOption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, selectedOption, selectedFood]);

 

  const isRestaurantActive = selectedRestaurant?.available !== false;

  return (
    <>
      <CustomHeader title="All Menu" />

      {isRestaurantActive ? (
        <DashboardScreen scrollable={false}>
          {/* Search Box */}
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search food..."
              placeholderTextColor="black"
              value={searchText}
              onChangeText={t => setSearchText(t)}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => {
                // immediate trigger if user submits keyboard
                loadFirstPage();
                Keyboard.dismiss();
              }}
            />
          </View>

          {/* FOOD LIST */}
          <Animated.View style={{flex: 1, opacity: fadeAnim}}>
            <FlatList
              data={filteredFoods}
              showsVerticalScrollIndicator={false}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              contentContainerStyle={{
                paddingBottom: 140,
                paddingHorizontal: 12,
              }}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListFooterComponent={
                loading && hasMore ? (
                  <ActivityIndicator
                    size="large"
                    color="#FF4D4D"
                    style={{marginBottom: 10}}
                  />
                ) : null
              }
              ListEmptyComponent={
                loading && page === 1 ? (
                  <View style={{padding: 12}}>
                    {[...Array(6)].map((_, idx) => (
                      <View key={idx} style={styles.card}>
                        {/* Image Placeholder */}
                        <ShimmerPlaceHolder
                          LinearGradient={LinearGradient}
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 10,
                            backgroundColor: '#eee',
                          }}
                        />
                        {/* Details */}
                        <View style={{flex: 1, marginLeft: 10}}>
                          <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={{
                              width: '50%',
                              height: 12,
                              borderRadius: 4,
                              marginBottom: 6,
                            }}
                          />
                          <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={{
                              width: '70%',
                              height: 14,
                              borderRadius: 4,
                              marginBottom: 4,
                            }}
                          />
                          <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={{
                              width: '30%',
                              height: 12,
                              borderRadius: 4,
                              marginTop: 6,
                            }}
                          />
                        </View>
                        {/* Add button placeholder */}
                        <ShimmerPlaceHolder
                          LinearGradient={LinearGradient}
                          style={{
                            width: 50,
                            height: 25,
                            borderRadius: 12,
                            marginLeft: 8,
                          }}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={{padding: 30, alignItems: 'center'}}>
                    <Text style={{color: '#555'}}>No items found.</Text>
                  </View>
                )
              }
            />
          </Animated.View>

          {/* ========================= MODAL ======================== */}
          <Modal transparent visible={modalVisible} animationType="none">
            <TouchableWithoutFeedback onPress={closeModal}>
              <View style={styles.modalOverlay}>
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
                    ]}>
                    <View style={styles.modalHandle} />

                    {selectedFood && (
                      <>
                        {/* Food Header */}
                        <View style={styles.modalHeader}>
                          <Image
                            source={{uri: selectedFood.image}}
                            style={styles.modalImg}
                          />
                          <View style={{flex: 1, marginLeft: 12}}>
                              <Text style={styles.modalCuisine}>
                              {selectedFood?.cuisineType}
                            </Text>
                            <Text style={styles.modalFoodName}>
                              {selectedFood.name}
                            </Text>
                          
                          </View>
                        </View>

                        {/* Price / Variation */}
                        {selectedFood?.priceInfo?.hasVariation ? (
                          <View style={styles.optionRow}>
                            {['half', 'full'].map(opt => (
                              <TouchableOpacity
                                key={opt}
                                style={[
                                  styles.optionBtn,
                                  selectedOption === opt &&
                                    styles.selectedOption,
                                ]}
                                onPress={() => setSelectedOption(opt)}>
                                <Text
                                  style={[
                                    styles.optionText,
                                    selectedOption === opt &&
                                      styles.optionTextSelected,
                                  ]}>
                                  {opt.charAt(0).toUpperCase() + opt.slice(1)} –
                                  ₹
                                  {opt === 'half'
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

                        {/* Description */}
                        {selectedFood?.description && (
                          <Text style={styles.modalDescription}>
                            {selectedFood.description}
                          </Text>
                        )}

                        {/* Add-ons Section */}
                        {selectedFood?.addOns?.length > 0 && (
                          <View style={{marginTop: 15}}>
                            <Text style={styles.addonTitle}>Add-ons</Text>
                            {selectedFood.addOns.map((addon, index) => {
                              const isSelected = selectedAddOns.some(
                                a => a.name === addon.name,
                              );
                              return (
                                <TouchableOpacity
                                  key={index}
                                  style={[
                                    styles.addonItem,
                                    isSelected && {
                                      borderColor: '#FF4D4D',
                                      borderWidth: 1.5,
                                    },
                                  ]}
                                  onPress={() => toggleAddOn(addon)}>
                                  <Image
                                    source={{uri: addon.image}}
                                    style={styles.addonImage}
                                  />
                                  <View style={{flex: 1}}>
                                    <Text style={styles.addonName}>
                                      {addon.name}
                                    </Text>
                                    <Text style={styles.addonPrice}>
                                      ₹{addon.price}
                                    </Text>
                                  </View>
                                  <View
                                    style={
                                      isSelected
                                        ? styles.checkmarkSelected
                                        : styles.checkmarkBox
                                    }>
                                    {isSelected && (
                                      <Text style={styles.checkmark}>✓</Text>
                                    )}
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
                          <View style={{flex: 1}}>
                            <Text style={styles.totalPrice}>
                              {/* Base Price × Quantity */}
                              Base: ₹{baseTotal}{' '}
                              {selectedOption === 'half'
                                ? '(Half)'
                                : selectedOption === 'full'
                                ? '(Full)'
                                : ''}
                              {/* Add-ons */}
                              {selectedAddOns.length > 0 &&
                                `  +  Add-ons: ${selectedAddOns
                                  .map(a => `${a.name} ₹${a.price}`)
                                  .join(', ')}`}
                              {/* Final Total */}
                              {/* {`\nTotal: ₹${totalPrice}`} */}
                            </Text>
                          </View>
                          <View style={{flex: 1, alignItems: 'flex-end'}}>
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

          {/* ========================= ADDED TO CART BOX ========================= */}
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
              ]}>
              <LinearGradient
                colors={['#ff4d4d', '#ff6f61', '#ff8a65']}
                style={styles.bottomGradient}>
                <Text style={styles.bottomMsg}>
                  ✓ Item added successfully ({totalCount} in cart)
                </Text>

                <TouchableOpacity
                  style={styles.bottomBtn}
                  onPress={handleGoToCart}>
                  <Text style={styles.bottomBtnText}>Go to Cart</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}
        </DashboardScreen>
      ) : (
        // 🚫 RESTAURANT CLOSED UI (DESIGNED – NOT BLANK)
        <View style={styles.closedContainer}>
          <Text style={styles.closedTitle}>Restaurant not available</Text>

          <Text style={styles.closedSubtitle}>
            Please check back later or choose another branch
          </Text>
        </View>
      )}
    </>
  );
};

export default CatItemScreen;

// ======================= STYLES =======================
const styles = StyleSheet.create({
  searchBox: {margin: 15, marginTop: -10},
  searchInput: {
    backgroundColor: 'hsla(0, 0%, 100%, 1.00)',
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 35,
    color: '#000',
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
  },

  image: {width: 80, height: 80, borderRadius: 10, backgroundColor: '#eee'},
  details: {flex: 1, marginLeft: 10},
  cuisine: {fontSize: 12, color: 'black', fontWeight: '600'},
  name: {fontSize: 15, fontWeight: '600', color: 'black', width: '90%'},

  row: {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  totalText: {fontSize: 16, fontWeight: 'bold', color: '#eb2626ff'},

  typeBox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeDot: {width: 7, height: 7, borderRadius: 7},

  priceText: {color: '#000', marginTop: 4, fontSize: 13},
  rating: {
    marginTop: 4,
    backgroundColor: 'green',
    color: '#fff',
    paddingHorizontal: 8,
    borderRadius: 10,
    fontSize: 10,
    alignSelf: 'flex-start',
  },

  addBtn: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'center',
    marginLeft: 8,
  },
  addText: {color: '#fff', fontWeight: '600'},

  modalFoodPrice: {fontSize: 14, color: '#777', marginTop: 4},

  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  modalImg: {width: 70, height: 70, borderRadius: 10, backgroundColor: '#eee'},
  modalName: {fontSize: 17, fontWeight: '700'},

  optionSelected: {
    backgroundColor: '#e82b2b',
    borderColor: '#ff6600',
  },

  optionTextSel: {color: '#fff', fontWeight: 'bold'},

  qtySign: {fontSize: 18, color: '#FF4D4D', fontWeight: 'bold'},
  qtyTextValue: {marginHorizontal: 15, fontSize: 16, fontWeight: 'bold'},

  totalText: {fontSize: 16, fontWeight: '700', color: '#000'},

  shimmerRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
    // elevation: 3,
    height: 89,
    width: '100%',
  },

  bottomBox: {
    position: 'absolute',
       bottom: Platform.OS === 'android' ? 90 : 60, 
    width: '100%',
    paddingHorizontal: 16,
  },
 bottomGradient: {padding: 15, borderRadius: 20,  height:
      Platform.OS === 'android'
      ? Math.max(99, width - 600) // Android: slightly taller, never below 120
      : Math.max(100, width - 270) },
  bottomMsg: {color: '#fff', textAlign: 'center', marginBottom: 10},
  bottomBtn: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignSelf: 'center',
  },
  bottomBtnText: {fontWeight: '700', color: 'red'},

  // 🌟 BEAUTIFUL & ATTRACTIVE MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHandle: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#eee',
  },
  modalFoodName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  modalCuisine: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  modalDescription: {
    marginTop: 12,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF4D4D',
    marginRight: 10,
    backgroundColor: '#fff',
    shadowColor: '#FF4D4D',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOption: {
    backgroundColor: '#FF4D4D',
    borderColor: '#FF4D4D',
  },
  optionText: {
    color: '#FF4D4D',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#fff',
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
    shadowColor: '#FF4D4D',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
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
    shadowOffset: {width: 0, height: 2},
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
  checkmark: {color: '#fff', fontSize: 14, fontWeight: '700'},
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
    shadowOffset: {width: 0, height: 3},
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
  closedSubtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});
