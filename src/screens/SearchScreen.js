import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

import DashboardScreen from '../components/DashboardScreen';
import CustomHeader from '../components/CustomHeader';
import {fetchFoodPagination} from '../redux/slice/SearchFoodPaginationSlice';
import {addToCart} from '../redux/slice/cartSlice';
import {
  addItemToPetpoojaCart,
  fetchPetpoojaCart,
} from '../redux/slice/CartApiSlice';
import LinearGradient from 'react-native-linear-gradient';
import Theme from '../assets/theme';
import {
  getFoodTypeMeta,
  shouldIncludeByVegFilter,
} from '../utils/foodType';

const SearchScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedFood, setSelectedFood] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [bottomBoxVisible, setBottomBoxVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const boxAnim = useRef(new Animated.Value(150)).current;

  // Redux states
  const {AllFoodsData, page, hasMore, loading} = useSelector(
    state => state.FoodPagination,
  );
  const isVeg = useSelector(state => state.foodFilter.isVeg);
  const selectedRestaurant = useSelector(state => state.experience.selectedRestaurant);
  const restaurantId =
    selectedRestaurant?.restaurantId ||
    selectedRestaurant?.petpoojaRestaurantId ||
    selectedRestaurant?.id ||
    selectedRestaurant?._id;
  const cartItems = useSelector(state => state.cart.items);
  const apiType = isVeg === null ? '' : isVeg ? 'veg' : 'non-veg';

  const totalItemCount = cartItems.length;
  const totalPrice = selectedFood ? selectedFood.price * quantity : 0;

  useEffect(() => {
    if (!restaurantId) return;

    const timer = setTimeout(() => {
      dispatch(
        fetchFoodPagination({
          page: 1,
          limit: 70,
          type: apiType,
          search,
          restaurantId,
        }),
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [dispatch, restaurantId, apiType, search]);

  // ✅ Proper Veg / Non-Veg + Search filter
  const filteredResults = AllFoodsData.filter(item => {
    const food = item?.food || {};
    const name = food?.name?.toLowerCase() || '';

    // Match search text
    const matchSearch =
      search.trim().length === 0 || name.includes(search.toLowerCase());

    // Match Veg / Non-Veg toggle
    const matchVegFilter = shouldIncludeByVegFilter(food, isVeg);

    return matchSearch && matchVegFilter;
  });

  // ✅ Load more pagination
  const loadMore = useCallback(() => {
    if (!loading && hasMore && restaurantId) {
      dispatch(
        fetchFoodPagination({
          page: page + 1,
          limit: 10,
          type: apiType,
          search,
          restaurantId,
        }),
      );
    }
  }, [dispatch, page, hasMore, loading, restaurantId, apiType, search]);

  // ✅ Footer Loader
  const renderFooter = () => {
    if (loading && page > 1) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="large" color="red" />
        </View>
      );
    }
    return null;
  };

  // ✅ Modal Animation Handlers
  const openModal = food => {
    setSelectedFood(food);
    setQuantity(1);
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
    }).start(() => setModalVisible(false));
  };

  // ✅ Add to cart confirm
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
    };

    dispatch(addToCart(localCartItem));

    const addAndNavigate = async () => {
      try {
        await dispatch(
          addItemToPetpoojaCart({
            restaurantId,
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

        // Keep current UX when API fails
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
    Animated.timing(boxAnim, {
      toValue: 150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setBottomBoxVisible(false));

    navigation.navigate('OderCartScreen');
  };

  // ✅ Render food card
  const renderItem = ({item}) => {
    const food = item?.food || {};
    const typeMeta = getFoodTypeMeta(food);
    return (
      <TouchableOpacity
        key={food?._id?.toString()}
        style={styles.card}
        activeOpacity={0.9}
    >
        <Image source={{uri: food?.image}} style={styles.image} />
        <View style={styles.details}>

     {/* Cuisine */}
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Image
                    source={require('../assets/images/dineBlack.png')}
                    style={{width: 12, height: 12, tintColor: '#555'}}
                  />
                  <Text style={styles.cuisine}>
                    {item?.food?.cuisineType}
                  </Text>
                </View>
          
          <View style={styles.typeRow}>
            <View
              style={[
                styles.typeIndicator,
                {
                  borderColor: typeMeta.color,
                },
              ]}>
              <View
                style={[
                  styles.typeDot,
                  {
                    backgroundColor: typeMeta.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.name}>{food?.name}</Text>
          </View>
       
          <View style={styles.ratingWrapper}>
            <Ionicons name="star" color="#fff" size={10} />
            <Text style={styles.ratingText}>{food?.rating || 4.5}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => openModal(food)}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <DashboardScreen scrollable={false}>
      <CustomHeader title="Search Food" />

      {/* Search Box */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={22} color="red" />
        <TextInput
          style={styles.input}
          placeholder="Try Pizza, Biryani, Sushi..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      {/* Food List */}
      {loading && page === 1 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="red" />
        </View>
      ) : filteredResults?.length > 0 ? (
        <FlatList
          data={filteredResults}
          keyExtractor={(item, index) =>
            item?.food?._id?.toString() || index.toString()
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      ) : (
        <View style={styles.emptyState}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076505.png',
            }}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyText}>No items found</Text>
          <Text style={styles.emptySubText}>
            Try searching with a different keyword.
          </Text>
        </View>
      )}

      {/* Quantity Modal */}
      <Modal transparent visible={modalVisible} animationType="none">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeModal}
          />
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
                <View style={styles.modalFoodRow}>
                  <Image
                    source={{uri: selectedFood.image}}
                    style={styles.modalImage}
                  />
                  <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={styles.modalFoodName}>
                      {selectedFood.name}
                    </Text>
                    <Text style={styles.modalFoodPrice}>
                      ₹{selectedFood.price}
                    </Text>
                  </View>
                </View>

                <View style={styles.quantityBox}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() =>
                      setQuantity(quantity > 1 ? quantity - 1 : 1)
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

                <View style={styles.modalFooter}>
                  <Text style={styles.totalText}>Total: ₹{totalPrice}</Text>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirmAdd}>
                    <Text style={styles.confirmBtnText}>Confirm Add</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Bottom Confirmation Box */}
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
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.gradientBackground}>
            <View style={styles.bottomBoxContent}>
              <Text style={styles.bottomText}>
                ✅ Item added successfully ({totalItemCount} item
                {totalItemCount > 1 ? 's' : ''} in cart)
              </Text>
              <TouchableOpacity
                style={styles.bottomButton}
                onPress={handleGoToCart}>
                <Text style={styles.bottomButtonText}>Go to Cart</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </DashboardScreen>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'red',
    elevation: 2,
    marginHorizontal: 10,
    marginTop: 10,
  },
  input: {marginLeft: 8, fontSize: 16, flex: 1, color: '#333'},
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
  },
  image: {width: 80, height: 80, borderRadius: 10},
  details: {flex: 1, marginLeft: 10},
  typeRow: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
    cuisine: {
    marginLeft: 10,
    color: 'black',
    fontSize: Theme.fontSizes.small,
    fontWeight: '500',
  },
  typeIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeDot: {width: 7, height: 7, borderRadius: 50},
  name: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
    color: '#000',
    flexShrink: 1,
  },
  price: {fontSize: 14, color: '#000', marginVertical: 5, fontWeight: '500'},
  ratingWrapper: {
    backgroundColor: '#2e7d32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  ratingText: {color: '#fff', fontSize: 10, fontWeight: '600', marginLeft: 2},
  listContent: {padding: 16, paddingBottom: 120},
  footerLoader: {paddingVertical: 30},
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyImage: {width: 90, height: 90, tintColor: '#ccc'},
  emptyText: {fontSize: 16, fontWeight: '600', marginTop: 12, color: '#555'},
  emptySubText: {fontSize: 13, color: '#999', marginTop: 4},
  addBtn: {
    backgroundColor: '#FF4D4D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addText: {color: '#fff', fontWeight: '600', fontSize: 13},
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHandle: {
    width: 50,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalFoodRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 15},
  modalImage: {width: 70, height: 70, borderRadius: 10},
  modalFoodName: {fontSize: 16, fontWeight: 'bold', color: '#000'},
  modalFoodPrice: {fontSize: 14, color: '#777', marginTop: 4},
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F1F1',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 10,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  qtyText: {fontSize: 18, fontWeight: 'bold', color: '#FF4D4D'},
  qtyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginHorizontal: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  totalText: {fontSize: 16, fontWeight: 'bold', color: '#000'},
  confirmBtn: {
    backgroundColor: '#FF4D4D',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  confirmBtnText: {color: '#fff', fontSize: 15, fontWeight: 'bold'},
  bottomBox: {
    position: 'absolute',
    bottom: '15%',
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // elevation: 10,
    // paddingVertical: 20,
    // paddingHorizontal: 20,
  },
  bottomBoxContent: {alignItems: 'center'},
  bottomText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  bottomButton: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  bottomButtonText: {color: '#fff', fontWeight: 'bold', fontSize: 15},
  gradientBackground: {
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
});
