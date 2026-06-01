import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import DashboardScreen from '../../components/DashboardScreen';
import SectionDivider from '../../components/SectionDivider';
import ToggleComponents from '../../components/ToggleComponents';
import { setExperience, setRestaurant } from '../../redux/slice/experienceSlice';
import { fetchRestaurants } from '../../redux/slice/AllRestaurantSlice';
import { fetchBanners } from '../../redux/slice/BannerSlice';
import { fetchAllFoodCat } from '../../redux/slice/foodCategorySlice';
import { fetchFoodPagination } from '../../redux/slice/SearchFoodPaginationSlice';
import { fetchPetpoojaCart } from '../../redux/slice/CartApiSlice';
import Theme from '../../assets/theme';
import {
  getClosedHoursMessage,
  isOrderTypeBlockedNow,
} from '../../utils/restaurantHours';

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const tabBarHeight = useBottomTabBarHeight();

  // Redux states
  const cartItems = useSelector(state => state.cart.items || []);
  const totalCount = cartItems.length;
  const isVeg = useSelector(state => state.foodFilter.isVeg);
  const { experienceId, selectedRestaurant, experienceType } = useSelector(
    state => state.experience,
  );
  const restaurantId = selectedRestaurant?._id;
  const { categories } = useSelector(state => state.foodCategory);
  const { list: restaurantsArray } = useSelector(state => state.restaurants);
  const { bannerlist } = useSelector(state => state.banners);
  const { AllFoodsData = [], page = 1, hasMore = false } = useSelector(
    state => state.FoodPagination,
  );

  // Local states
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(experienceType);

  const flatListRef = useRef(null);

  const topPicksData = (categories?.foods && categories.foods.length > 0) ? categories.foods : AllFoodsData;

  // Fetch data
  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchBanners());
    dispatch(fetchAllFoodCat());

    if (restaurantId) {
      dispatch(
        fetchFoodPagination({
          page: 1,
          limit: 10,
          type: isVeg === null ? '' : isVeg ? 'veg' : 'non-veg',
          restaurantId,
        }),
      );
    }

    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [dispatch, restaurantId, isVeg]);

  const handleLoadMore = () => {
    if (hasMore && restaurantId) {
      dispatch(
        fetchFoodPagination({
          page: page + 1,
          limit: 9,
          type: isVeg === null ? '' : isVeg ? 'veg' : 'non-veg',
          restaurantId,
        }),
      );
    }
  };

  const handleGoToCart = async () => {
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

  const experiences = [
    {
      id: 1,
      title: 'Delivery',
      img: require('../../assets/images/deliveryH.png'),
      redirection: 'HomeScreen',
      allowOrder: true,
    },
    {
      id: 2,
      title: 'Dine In',
      img: require('../../assets/images/dineH.png'),
      redirection: 'DineSection',
      allowOrder: false,
    },
    {
      id: 3,
      title: 'Takeaway',
      img: require('../../assets/images/takeawayH.png'),
      redirection: 'HomeScreen',
      allowOrder: true,
    },
  ];

  return (
    <DashboardScreen scrollable={false}>
      {/* Header */}
      <View style={styles.headerContainer}>
        {/* Left - Location */}
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={() => setShowDropdown(!showDropdown)}>
          <Image
            source={require('../../assets/images/location.png')}
            style={styles.locationIcon}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.locationText}>
              {selectedOutlet || selectedRestaurant?.name || 'Select Branch'}
            </Text>
            <Image
              source={require('../../assets/images/downarrow.png')}
              style={styles.dropdownIcon}
            />
          </View>
        </TouchableOpacity>

        {/* Right - Logo */}
        <Image
          source={require('../../assets/images/project_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Dropdown */}
      {showDropdown && (
        <View style={styles.dropdownList}>
          <ScrollView style={{ maxHeight: 200 }}>
            {restaurantsArray?.map((restaurant, index) => (
              <TouchableOpacity
                key={restaurant._id || index}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedOutlet(restaurant.name);
                  setShowDropdown(false);
                  dispatch(setRestaurant(restaurant));
                  dispatch(
                    setExperience({
                      id: experienceId,
                      type: experienceType,
                      restaurant: restaurant,
                    }),
                  );
                }}>
                <Text style={styles.dropdownText}>{restaurant.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ✅ Main Scrollable FlatList (no nested scroll issues) */}
      <FlatList
        ref={flatListRef}
        data={topPicksData.slice(0, visibleCount)}
        keyExtractor={(item, index) => item?._id || item?.food?._id || index.toString()}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 100,
          backgroundColor: '#fff',
          paddingHorizontal: 8,
        }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TouchableOpacity style={styles.searchBox}>
                <Image
                  source={require('../../assets/images/search.png')}
                  style={styles.searchIcon}
                />
                <Text style={styles.searchPlaceholder}>
                  Search your favorite food
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cartBtn}
                onPress={handleGoToCart}
                >
                <Image
                  source={require('../../assets/images/cart.png')}
                  style={styles.cartIcon}
                />
                {totalCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartCount}>{totalCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Veg/Non-Veg Toggle */}
            <ToggleComponents />

            {/* Experience Tabs */}
            <View style={styles.experienceContainer}>
              {experiences.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.experienceCard,
                    selectedExperience === item.title && styles.activeExperience,
                  ]}
                  onPress={() => {
                    if (isOrderTypeBlockedNow(item.title, selectedRestaurant?.openingTime, selectedRestaurant?.closingTime)) {
                      Alert.alert('Restaurant Closed', getClosedHoursMessage(selectedRestaurant?.openingTime, selectedRestaurant?.closingTime));
                      return;
                    }

                    setSelectedExperience(item.title);
                    navigation.navigate(item.redirection);
                    dispatch(setExperience({ id: item.id, type: item.title }));
                  }}>
                  <Image source={item.img} style={styles.experienceImg} />
                  <Text
                    style={[
                      styles.experienceText,
                      selectedExperience === item.title && { color: '#fff' },
                    ]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Banner Section */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {loading ? (
                [1, 2, 3].map(i => (
                  <ShimmerPlaceholder key={i} style={styles.bannerShimmer} />
                ))
              ) : (
                bannerlist?.map((banner, index) => (
                  <LinearGradient
                    key={index}
                    colors={['#fce3ec', '#f8f8f8']}
                    style={styles.bannerCard}>
                    <Image
                      source={{ uri: banner?.fullImageUrl || banner?.imageUrl || banner?.image }}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                  </LinearGradient>
                ))
              )}
            </ScrollView>

            {/* Categories */}
            <SectionDivider title="Choose What You Like" />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories?.foods || []}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryCard}
                  onPress={() =>
                    navigation.navigate('CatItemScreen', {
                      categoryId: item._id,
                      categoryName: item.name,
                      categoryType: item.type,
                      categoryIngredients: item?.ingredients,
                      restaurantId: selectedRestaurant?._id,
                    })
                  }>
                  <Image
                    source={{ uri: item?.image }}
                    style={styles.categoryImage}
                  />
                  <Text style={styles.categoryName}>{item?.name}</Text>
                </TouchableOpacity>
              )}
            />

            {/* Top Picks Title */}
            <SectionDivider title="Top Picks" containerStyle={{ marginVertical: 10 }} />
          </>
        }
        renderItem={({ item }) => {
          const display = item?.food || item;
          return (
            <TouchableOpacity
              style={styles.topPickCard}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('CatItemScreen', {
                  categoryId: display?._id,
                  categoryName: display?.name,
                  categoryType: display?.type,
                  categoryIngredients: display?.ingredients,
                  restaurantId: selectedRestaurant?._id,
                })
              }>
              <View style={styles.topPickCircle}>
                <Image
                  source={{ uri: display?.image }}
                  style={styles.topPickImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.topPickTitle} numberOfLines={1}>
                {display?.name}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={() =>
          visibleCount < topPicksData.length ? (
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => {
                const newCount = visibleCount + 9;
                if (newCount <= topPicksData.length) {
                  setVisibleCount(newCount);
                } else if (hasMore && restaurantId) {
                  dispatch(
                    fetchFoodPagination({
                      page: page + 1,
                      limit: 9,
                      type: isVeg === null ? '' : isVeg ? 'veg' : 'non-veg',
                      restaurantId,
                    }),
                  );
                }
              }}>
              <View style={styles.exploreContainer}>
                <View style={styles.line} />
                <Text style={styles.exploreText}>Explore More</Text>
                <View style={styles.line} />
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={styles.endText}>You’ve reached the end!</Text>
          )
        }
      />
    </DashboardScreen>
  );
};

// ✅ Styles
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    elevation: 3,
  },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  locationIcon: { width: 20, height: 20, tintColor: '#e63946', marginRight: 6 },
  locationText: { fontSize: 16, fontWeight: '600', color: '#333' },
  dropdownIcon: { width: 14, height: 14, marginLeft: 4, tintColor: '#555' },
  logo: { width: 90, height: 35 },
  dropdownList: {
    backgroundColor: '#fff',
    elevation: 5,
    borderRadius: 10,
    margin: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  dropdownText: { fontSize: 14, color: '#333' },
  searchContainer: { flexDirection: 'row', margin: 12 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: { width: 20, height: 20, tintColor: '#888', marginRight: 8 },
  searchPlaceholder: { color: '#777', fontSize: 14 },
  cartBtn: {
    marginLeft: 10,
    width: 50,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: { width: 22, height: 22 },
  cartBadge: {
    position: 'absolute',
    top: 3,
    right: 6,
    backgroundColor: '#e63946',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  cartCount: { color: '#fff', fontSize: 10, fontWeight: '700' },
  experienceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginVertical: 10,
  },
  experienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  activeExperience: { backgroundColor: '#e63946', borderColor: '#e63946' },
  experienceImg: { width: 22, height: 22 },
  experienceText: { marginLeft: 6, fontSize: 13, fontWeight: '500' },
  bannerShimmer: { width: 300, height: 130, borderRadius: 12, margin: 10 },
  bannerCard: { width: 300, height: 130, borderRadius: 12, margin: 10, overflow: 'hidden' },
  bannerImage: { width: '100%', height: '100%' },
  categoryCard: {
    width: 110,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    elevation: 3,
  },
  categoryImage: { width: 70, height: 70, borderRadius: 35 },
  categoryName: { marginTop: 8, fontSize: 13, fontWeight: '600', color: '#333' },
  topPickCard: { alignItems: 'center', width: '30%', marginBottom: 20 },
  topPickCircle: {
    backgroundColor: '#fff',
    borderRadius: 70,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  topPickImage: { width: 80, height: 80, borderRadius: 40 },
  topPickTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    width: '90%',
  },
  exploreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingVertical: 8,
    backgroundColor: '#fff5f5',
    borderRadius: 30,
    elevation: 3,
    marginHorizontal: 60,
  },
  line: { height: 1, flex: 1, backgroundColor: '#e63946', marginHorizontal: 10, opacity: 0.4 },
  exploreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e63946',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  endText: { textAlign: 'center', color: '#999', marginVertical: 12, fontStyle: 'italic' },
});

export default HomeScreen;
