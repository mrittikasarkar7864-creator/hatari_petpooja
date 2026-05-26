// 🌟 HomeScreen.js — Clean, Fast & Beautiful
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Easing,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { fetchRestaurants } from '../../redux/slice/AllRestaurantSlice';
import { fetchBanners } from '../../redux/slice/BannerSlice';
import { fetchAllFoodCat } from '../../redux/slice/foodCategorySlice';
import { fetchCategoryFoods } from '../../redux/slice/catItemSlice';
import { fetchFoodPagination } from '../../redux/slice/SearchFoodPaginationSlice';

import DashboardScreen from '../../components/DashboardScreen';
import SectionDivider from '../../components/SectionDivider';
import HomeHeader from '../../components/Homeheader';
import HomeCatModal from '../../components/HomeCatModal';
import { addToCart } from '../../redux/slice/cartSlice';
import { fetchCategories } from '../../redux/slice/CategoriSlice';
import { setExperience } from '../../redux/slice/experienceSlice';
import { closeCuisineModal, openCuisineModal } from '../../redux/slice/ModalSlice';
import { shouldIncludeByVegFilter } from '../../utils/foodType';
import {
  addItemToPetpoojaCart,
  fetchPetpoojaCart,
} from '../../redux/slice/CartApiSlice';


const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const tabBarHeight = useBottomTabBarHeight();

  const isVeg = useSelector(state => state.foodFilter.isVeg);
  const { bannerlist } = useSelector(state => state.banners);
  console.log(bannerlist,"----------bannerlist");
  
  const cartItems = useSelector(s => s.cart.items || []);
  const totalCount = cartItems.length;
  console.log(totalCount, '----------------------totalCount');
   const selectedRestaurant = useSelector(
    state => state.experience.selectedRestaurant,
  );
  const resId =
    selectedRestaurant?.restaurantId ??
    selectedRestaurant?._id ??
    selectedRestaurant?.id ??
    null;
  console.log(resId, '----------------------resIdhome');

  const {
    AllFoodsData = [],
    parentCategories = [],
    categories: petpoojaCategories = [],
    menu = {},
    page = 1,
    hasMore = false,
  } = useSelector(state => state.FoodPagination);

  const menuGroups = Array.isArray(menu.groups) ? menu.groups : [];
  const menuCategories = menuGroups.flatMap(group => group.categories || []);

  const displayCategories = parentCategories.length
    ? parentCategories
    : petpoojaCategories.length
    ? petpoojaCategories
    : menuCategories.length
    ? menuCategories
    : [];

  const hour = new Date().getHours();
  const mealMoment = hour < 12 ? 'Breakfast' : hour < 17 ? 'Lunch' : 'Dinner';
  const categoryCount = displayCategories.length;
  const totalMenuItems = displayCategories.reduce(
    (sum, category) => sum + (category?.items?.length || 0),
    0,
  );
  const categorySectionTitle = `${mealMoment} Picks For You`;
  const categorySectionSubtitle = categoryCount
    ? `${categoryCount} curated categories • ${totalMenuItems} dishes available`
    : `Discover chef specials for ${mealMoment.toLowerCase()}`;

  const openMenuGroup = (group) => {
    dispatch(openCuisineModal(group));
  };

  // const [selectedCuisine, setSelectedCuisine] = React.useState(null);

  // my modal global state 
  const modalVisible = useSelector(state => state.modal.modalVisible);
  console.log(modalVisible,"---------------modalVisible88888");
  
  const selectedCuisine = useSelector(state => state.modal.selectedCuisine);

  console.log(selectedCuisine,"----------selectedCuisine66666");
  



  // const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleTop, setModalVisibleTop] = useState(false);
  const [subCategoryData, setSubCategoryData] = useState([]);
 

  const [loading, setLoading] = useState(true);

  const { experienceType } = useSelector(
    state => state.experience
  );

  const [selectedExperience, setSelectedExperience] = useState('Delivery');
  console.log(selectedExperience, "-----------------selectedExperience");

  const [selectedOption, setSelectedOption] = useState('half');
  const [quantity, setQuantity] = useState(1);
  const [foods, setFoods] = useState([]);
  console.log(foods, "-------------------foods");
  
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [baseTotal, setBaseTotal] = useState(0);
  const [addonsTotal, setAddonsTotal] = useState(0);
  const [bottomBoxVisible, setBottomBoxVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

  const [totalPrice, setTotalPrice] = useState(0);

  const scrollX = useRef(new Animated.Value(0)).current;
  const bannerScrollRef = useRef();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const boxAnim = useRef(new Animated.Value(150)).current;
  const initialDataLoadedRef = useRef(false);

  const foodPaginationLoading = useSelector(state => state.FoodPagination.loading);
    


  // Auto-scroll banners
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (bannerlist?.length > 0) {
        index = (index + 1) % bannerlist.length;
        bannerScrollRef.current?.scrollTo({ x: index * width, animated: true });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [bannerlist]);

  // Fetch static data once when Home tab is focused
  useEffect(() => {
    if (!isFocused) {
      return;
    }

    if (initialDataLoadedRef.current) {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          dispatch(fetchRestaurants()),
          dispatch(fetchBanners()),
          dispatch(fetchAllFoodCat()),
          dispatch(fetchCategories()),
        ]);
        initialDataLoadedRef.current = true;
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dispatch, isFocused]);

  // Fetch menu/trending food when branch or veg filter changes
  useEffect(() => {
    if (!isFocused || !resId) {
      return;
    }

    const foodType = isVeg === null ? '' : isVeg ? 'veg' : 'non-veg';

    const loadFoodData = async () => {
      try {
        await dispatch(
          fetchFoodPagination({
            page: 1,
            limit: 20,
            type: foodType,
            search: '',
            restaurantId: resId,
          }),
        ).unwrap();

        const res = await dispatch(
          fetchCategoryFoods({
            page: 1,
            limit: 1000,
            isTrending: true,
            type: foodType,
            restaurantId: resId,
          }),
        ).unwrap();
        console.log(res, "-------------------fetchCategoryFoods result-------------------");

        setFoods(res?.data || []);
      } catch (e) {
      }
    };

    loadFoodData();
  }, [dispatch, isVeg, resId, isFocused]);

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

  const toggleAddOn = addon => {
    const exists = selectedAddOns.some(a => a.name === addon.name);
    setSelectedAddOns(
      exists
        ? selectedAddOns.filter(a => a.name !== addon.name)
        : [...selectedAddOns, addon],
    );
  };

  const computeUnitPrice = (food, option = 'half') => {
    const info = food?.priceInfo || {};
    if (info.hasVariation)
      return option === 'half'
        ? Number(info.halfPrice || 0)
        : Number(info.fullPrice || 0);
    return Number(info.staticPrice || 0);
  };

  const openModal = (cuisineType) => {
    dispatch(openCuisineModal(cuisineType));
  };


  const [isCuisineModalVisible, setCuisineModalVisible] = useState(false);
  const route = useRoute();

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.openCuisineModal) {
        setCuisineModalVisible(true);

        // Clear param so it does NOT reopen again
        navigation.setParams({
          openCuisineModal: false,
        });
      }
    }, [route.params])
  );



  // const selectedRestaurant = useSelector(
  //   state => state.experience.selectedRestaurant,
  // );

   const isRestaurantActive = selectedRestaurant?.available !== false;

  const openModal2 = food => {
    setSelectedFood(food);
    setSelectedOption(food?.priceInfo?.hasVariation ? 'half' : 'full');
    setQuantity(1);
    setSelectedAddOns([]);
    const initialUnit = computeUnitPrice(
      food,
      food?.priceInfo?.hasVariation ? 'half' : 'full',
    );
    setTotalPrice(initialUnit);
    setModalVisibleTop(true);

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
      setModalVisibleTop(false);
      setSelectedFood(null);
      setSelectedAddOns([]);
    });
  };

  const handleConfirmAdd = () => {
    if (!selectedFood) return;
    const priceInfo = selectedFood.priceInfo || {};
    const unitPrice = priceInfo.hasVariation
      ? selectedOption === 'half'
        ? Number(priceInfo.halfPrice)
        : Number(priceInfo.fullPrice)
      : Number(priceInfo.staticPrice);
    const addonsPrice = selectedAddOns.reduce(
      (sum, a) => sum + Number(a.price || 0),
      0,
    );

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
      totalPrice: unitPrice * quantity + addonsPrice,
    };

    const resolvedRestaurantId =
      selectedRestaurant?.restaurantId ||
      selectedRestaurant?.petpoojaRestaurantId ||
      selectedRestaurant?.id ||
      selectedRestaurant?._id;

    dispatch(
      addToCart({
        ...localCartItem,
        hasVariation: priceInfo.hasVariation || false,
        halfPrice: Number(priceInfo.halfPrice || 0),
        fullPrice: Number(priceInfo.fullPrice || 0),
        staticPrice: Number(priceInfo.staticPrice || 0),
        unitPrice,
        totalPrice: localCartItem.totalPrice,
      }),
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

  const experiences = [
    {
      id: 1,
      title: 'Delivery',
      img: require('../../assets/images/deliveryH.png'),
    },
    {
      id: 2,
      title: 'Takeaway',
      img: require('../../assets/images/takeaway.png'),
    },
  ];

  const filteredFoods = foods.filter(item =>
    shouldIncludeByVegFilter(item?.food || item, isVeg),
  );

  const renderHeader = () => (
    <>
      <View style={styles.expContainer}>
        {experiences.map(exp => (
          <TouchableOpacity
            key={exp.id}
            activeOpacity={0.8}
            style={[
              styles.expButton,
              experienceType === exp.title && styles.expButtonActive,
            ]}
            onPress={() => dispatch(setExperience({ id: exp.id, type: exp.title }))}>

            <LinearGradient
              colors={
                experienceType === exp.title
                  ? ['#FF512F', '#DD2476']
                  : ['#fff', '#f3f3f3']
              }
              style={{ borderRadius: 20 }}
            >

              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 }}>
                <Image
                  source={exp.img}
                  style={[
                    styles.expIcon,
                    experienceType === exp.title && { tintColor: '#fff' },
                  ]}
                />
                <Text
                  style={[
                    styles.expText,
                    experienceType === exp.title && { color: '#fff' },
                  ]}>
                  {exp.title}
                </Text>
              </View>

            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>


      {/* Banners */}
      <Animated.ScrollView
        ref={bannerScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ marginVertical: 10 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}>
        {loading
          ? [1, 2, 3].map(i => (
            <ShimmerPlaceholder key={i} style={styles.bannerShimmer} />
          ))
          : bannerlist  ?.filter(banner => banner.isActive)?.map((banner, i) => (
            <View key={i} style={styles.bannerCard}>
              <Image
                source={{ uri: banner?.fullImageUrl }}
                style={styles.bannerImage}
                resizeMode="stretch"
              />
            </View>
          ))}
      </Animated.ScrollView>

      <View style={styles.dotsContainer}>
        {bannerlist  ?.filter(banner => banner.isActive)?.map((_, i) => {
          const opacity = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return <Animated.View key={i} style={[styles.dot, { opacity }]} />;
        })}
      </View>
      {/* <Text>jjhjjj</Text> */}

      {/* Categories */}
      <SectionDivider title={categorySectionTitle} />
      <Text style={styles.categorySubtitle}>{categorySectionSubtitle}</Text>
      {foodPaginationLoading && displayCategories.length === 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryWrapper}
        >
          {[1, 2, 3, 4].map(index => (
            <View key={index} style={styles.categoryShimmerCard}>
              <ShimmerPlaceholder style={styles.categoryShimmerCircle} />
              <ShimmerPlaceholder style={styles.categoryShimmerLabel} />
            </View>
          ))}
        </ScrollView>
      ) : displayCategories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryWrapper}
        >
          {displayCategories.map((item, index) => {
            const categoryImage = item?.image || item?.categoryImage || item?.item_image_url || item?.icon || '';
            const categoryName = item?.name || item?.categoryName || item?.title || item?.label || 'Category';
            const categoryKey = item?.categoryId || item?.id || item?._id || index;

            return (
              <TouchableOpacity
                key={categoryKey}
                style={styles.categoryCard}
                onPress={() => openModal(item)}>
                <LinearGradient
                  colors={['#fff', '#fff']}
                  style={styles.categoryCardInner}
                >
                  <LinearGradient
                    colors={['#FF6C6C', '#FF4D4D']}
                    style={styles.categoryCircle}
                  >
                    {categoryImage ? (
                      <Image source={{ uri: categoryImage }} style={styles.categoryImage} />
                    ) : (
                      <View style={styles.categoryPlaceholder}>
                        <Text style={styles.categoryPlaceholderText}>
                          {categoryName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </LinearGradient>
                <Text style={styles.categoryName} numberOfLines={2}>
                  {categoryName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}
      {/* <HomeCatModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={subCategoryData}
        cuisineType={subCategoryData}
      /> */}
      <HomeCatModal
        visible={modalVisible}
        cuisineType={selectedCuisine}
        onClose={() => dispatch(closeCuisineModal())}
      />

      {menuGroups.length > 0 && (
        <>
          <SectionDivider title="Explore Menu" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuGroupWrapper}>
            {menuGroups.map((group, index) => {
              const categoriesCount = group.categories?.length || 0;
              const itemsCount = group.categories?.reduce(
                (sum, category) => sum + (category.items?.length || 0),
                0,
              );
              return (
                <TouchableOpacity
                  key={group.groupId || group.name || index}
                  style={styles.menuGroupCard}
                  activeOpacity={0.85}
                  onPress={() => openMenuGroup(group)}>
                  <LinearGradient
                    colors={['#ff7559', '#ff4a3c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.menuGroupCardInner}>
                    <View style={styles.menuGroupBadge}>
                      <Text style={styles.menuGroupBadgeText}>Menu</Text>
                    </View>
                    <Text style={styles.menuGroupName} numberOfLines={2}>
                      {group.name}
                    </Text>
                    <Text style={styles.menuGroupMeta} numberOfLines={2}>
                      {itemsCount} items • {categoriesCount} categories
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

    </>
  );

  // const renderItem = ({ item }) => {
  //   console.log(item,"-------------------item in renderItem-------------------");
    

  //   const dataItem = item?.food || item; // fallback
  //   console.log(dataItem,"-------------------dataItem in renderItem-------------------");
    
  //   const isFoodAvailable = resId && dataItem.available !== false; // true if available and restaurant selected
  //   console.log(isFoodAvailable, '--------------------isFoodAvailable');

  //   return (
  //     <View style={styles.card}>
  //       <Image source={{ uri: dataItem.image }} style={styles.image} />
  //       <View style={styles.details}>
  //         <Text style={styles.cuisine}>
  //           {dataItem?.cuisineType
  //             ? dataItem.cuisineType.charAt(0).toUpperCase() +
  //             dataItem.cuisineType.slice(1)
  //             : ''}
  //         </Text>

  //         <View style={styles.row}>
  //           <View
  //             style={[
  //               styles.typeBox,
  //               {
  //                 borderColor:
  //                   (dataItem.type || '').toLowerCase() === 'veg'
  //                     ? 'green'
  //                     : 'red',
  //               },
  //             ]}>
  //             <View
  //               style={[
  //                 styles.typeDot,
  //                 {
  //                   backgroundColor:
  //                     (dataItem.type || '').toLowerCase() === 'veg'
  //                       ? 'green'
  //                       : 'red',
  //                 },
  //               ]}
  //             />
  //           </View>
  //           <Text style={styles.name} numberOfLines={1}>
  //             {dataItem?.name}
  //           </Text>
  //         </View>

  //         {dataItem.priceInfo?.hasVariation ? (
  //           <>
  //             <Text style={styles.priceText}>
  //               Half: ₹{dataItem.priceInfo.halfPrice}
  //             </Text>
  //             <Text style={styles.priceText}>
  //               Full: ₹{dataItem.priceInfo.fullPrice}
  //             </Text>
  //           </>
  //         ) : (
  //           <Text style={styles.priceText}>
  //             Price: ₹{dataItem.priceInfo?.staticPrice}
  //           </Text>
  //         )}
  //       </View>

  //       <TouchableOpacity
  //         style={[styles.addBtn, !isFoodAvailable && { backgroundColor: '#ccc' }]}
  //         onPress={() => {
  //           if (!isFoodAvailable) {
  //             alert('Food not available right now');
  //             return;
  //           }
  //           openModal2(dataItem);
  //         }}>
  //         <Text style={styles.addText}>
  //           {isFoodAvailable ? 'Add' : 'Not Available'}
  //         </Text>
  //       </TouchableOpacity>
  //     </View>
  //   );
  // };






  return (
    <>
      <HomeHeader />

      {isRestaurantActive ? (
        <DashboardScreen scrollable={false}>
          <FlatList
            data={filteredFoods}
            keyExtractor={(item, index) => item?._id || index.toString()}
            // renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: tabBarHeight + 50,
              paddingHorizontal: 10,
            }}
          />

          {/* MODAL */}
          <Modal transparent visible={modalVisibleTop} animationType="none">
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
                    ]}>
                    <View style={styles.modalHandle} />

                    {selectedFood && (
                      <>
                        {/* Food Header */}
                        <View style={styles.modalHeader}>
                          <Image
                            source={{ uri: selectedFood.image }}
                            style={styles.modalImg}
                          />
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.modalCuisine}>
                              {selectedFood?.cuisineType
                                ? selectedFood.cuisineType
                                  .charAt(0)
                                  .toUpperCase() +
                                selectedFood.cuisineType.slice(1)
                                : ''}
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

                        {/* Add-ons */}
                        {selectedFood?.addOns?.length > 0 && (
                          <View style={{ marginTop: 15 }}>
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
                                    source={{ uri: addon.image }}
                                    style={styles.addonImage}
                                  />
                                  <View style={{ flex: 1 }}>
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

          {/* ADDED TO CART BOX */}
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

export default HomeScreen;

/* ------------------------------ STYLES ------------------------------ */
const styles = StyleSheet.create({
  expContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    // spacing between buttons (iOS doesn't support gap)
    paddingHorizontal: 10,
  },

  expButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 40,
    // shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    // elevation for Android
    elevation: 6,
    marginHorizontal: 7, // replaces gap

  },

  expButtonActive: {
    shadowColor: '#FF512F',
    shadowOpacity: 0.4,
    shadowRadius: 8,
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

  image: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#eee' },
  details: { flex: 1, marginLeft: 10 },
  cuisine: { fontSize: 12, color: 'black', fontWeight: '600' },
  name: { fontSize: 15, fontWeight: '600', color: 'black', width: '90%' },

  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#eb2626ff' },
  // totalPrice: {fontSize: 16, fontWeight: 'bold', color: '#0e0d0dff'},
  expIcon: { width: 24, height: 24, marginRight: 8 },
  expText: { fontWeight: '700', fontSize: 15, color: '#333' },

  typeBox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeDot: { width: 7, height: 7, borderRadius: 7 },

  priceText: { color: '#000', marginTop: 4, fontSize: 13 },
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
  addText: { color: '#fff', fontWeight: '600' },
  bannerCard: {
    width: width,
    height: 180,
    alignItems: 'center',
  },
  bannerImage: {
    width: '95%',
    height: '100%',
  },
  bannerShimmer: {
    width: width,
    height: 180,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF512F',
    marginHorizontal: 5,
  },

  categoryWrapper: {
    paddingLeft: 16,
    paddingBottom: 12,
  },
  categorySubtitle: {
    paddingHorizontal: 16,
    marginTop: -4,
    marginBottom: 10,
    color: '#575757',
    fontSize: 13,
    fontWeight: '500',
  },
  menuGroupWrapper: {
    paddingLeft: 16,
    paddingBottom: 22,
    paddingRight: 16,
  },
  menuGroupCard: {
    width: 172,
    borderRadius: 22,
    marginRight: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  menuGroupCardInner: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    minHeight: 135,
  },
  menuGroupBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.24)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuGroupBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  menuGroupName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 22,
  },
  menuGroupMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 18,
  },
  categoryCard: {
    width: 100,
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 4,
  },
  categoryCardInner: {
    width: 76,
    height: 76,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4D4D',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  categoryPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPlaceholderText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  categoryName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 17,
  },
  categoryShimmerCard: {
    width: 100,
    alignItems: 'center',
    marginRight: 14,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  categoryShimmerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  categoryShimmerLabel: {
    width: 60,
    height: 16,
    borderRadius: 8,
  },

  exploreBtn: {
    alignItems: 'center',
    marginVertical: 25,
  },
  exploreGradient: {
    borderRadius: 30,
    paddingHorizontal: 50,
    paddingVertical: 14,
    elevation: 8,
    shadowColor: '#FF512F',
  },
  exploreText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  modalFoodPrice: { fontSize: 14, color: '#777', marginTop: 4 },

  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  modalName: { fontSize: 17, fontWeight: '700' },

  optionSelected: {
    backgroundColor: '#e82b2b',
    borderColor: '#ff6600',
  },

  optionTextSel: { color: '#fff', fontWeight: 'bold' },

  qtySign: { fontSize: 18, color: '#FF4D4D', fontWeight: 'bold' },
  qtyTextValue: { marginHorizontal: 15, fontSize: 16, fontWeight: 'bold' },

  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: { fontSize: 16, fontWeight: '700' },
  // confirmBtn: {
  //   backgroundColor: '#FF4D4D',
  //   paddingHorizontal: 20,
  //   paddingVertical: 12,
  //   borderRadius: 25,
  // },
  // confirmBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
  bottomBox: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 90 : 60,
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
    shadowOffset: { width: 0, height: -4 },
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
    shadowOffset: { width: 0, height: 2 },
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
  closedSubtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});
