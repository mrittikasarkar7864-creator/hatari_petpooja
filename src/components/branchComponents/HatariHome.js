import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import SectionDivider from '../../components/SectionDivider';
import DashboardScreen from '../../components/DashboardScreen';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
// import { useNavigation } from '@react-navigation/native';
import SmallbtnReuseable from '../../components/SmallbtnReuseable';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchRestaurants} from '../../redux/slice/AllRestaurantSlice';
import {fetchBanners} from '../../redux/slice/BannerSlice';
import {fetchAllFoods} from '../../redux/slice/AllFoodsSlice';
import Theme from '../../assets/theme';
import {fetchAllFoodCat} from '../../redux/slice/foodCategorySlice';
import {isAsyncThunkAction} from '@reduxjs/toolkit';
import {setExperience, setRestaurant} from '../../redux/slice/experienceSlice';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';

const HatariHome = ({route}) => {
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  console.log(totalCount, '-------------totalCount');
  const {experienceId, selectedRestaurant, experienceType} = useSelector(
    state => state.experience,
  );
  // console.log(experienceType, '--------------go90998sselectedRestaurant');
  const experienceState = useSelector(state => state.experience);
  console.log(selectedRestaurant?._id, '---------------home');
  const selectedRestaurantName = route?.params?.selectedRestaurantName;
  const [selectedExperience, setSelectedExperience] = useState(experienceType);
  const [loading, setLoading] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const list = useSelector(state => state.restaurants);
  const restaurantsArray = list?.list || [];
  const bannerlist = useSelector(state => state.banners);
  const bannerlistBanner = bannerlist?.bannerlist || [];
  console.log(bannerlistBanner, '---------------bannerlistBanner');
  
  const AllFoodsData = useSelector(state => state.allFoods);
  console.log(AllFoodsData,"----------------AllFoodsData");
  
  const topPicks = AllFoodsData?.AllFoodsData?.data;
  const {categories, error} = useSelector(state => state.foodCategory);
  const homeCategories = categories?.foods;
  console.log(homeCategories, '---------------alcategorieslFoods');

  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchBanners());
    dispatch(fetchAllFoods());
    dispatch(fetchAllFoodCat());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Simulate API load
    return () => clearTimeout(timer);
  }, []);

  // 👇 your existing array
  const experiences = [
    {
      id: 1,
      title: 'Delivery',
      img: require('../../assets/images/deliveryH.png'),
      redirection: 'HomeScreen',
      allowOrder: true, // ✅ orders allowed
    },
    {
      id: 2,
      title: 'Dine in',
      img: require('../../assets/images/dineH.png'),
      redirection: 'DineSection',
      allowOrder: false, // ❌ no orders
    },
    {
      id: 3,
      title: 'Takeaway',
      img: require('../../assets/images/takeawayH.png'),
      redirection: 'HomeScreen',
      allowOrder: true, // ✅ orders allowed
    },
  ];

  return (
    <DashboardScreen scrollable={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{flexDirection: 'row', width: '60%'}}>
          <Image
            source={require('../../assets/images/location.png')}
            style={styles.logo}
          />
          <Text style={styles.locationText}>
            {selectedOutlet ? selectedOutlet : selectedRestaurant?.name}
          </Text>

          <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)}>
            <Image
              source={require('../../assets/images/downarrow.png')} // Your arrow icon
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
        </View>
        <Image
          source={require('../../assets/images/project_logo.png')}
          style={styles.projectLogo}
        />
      </View>

      {/* Dropdown list */}
      {showDropdown && (
        <View style={styles.dropdownList}>
          <ScrollView style={{maxHeight: 200}}>
            {restaurantsArray?.map((restaurant, index) => (
              <TouchableOpacity
                key={restaurant._id || index}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedOutlet(restaurant.name);
                  setShowDropdown(false);

                  // Option 1: Just update restaurant
                  dispatch(setRestaurant(restaurant));

                  // Option 2: If you want to also update experience
                  dispatch(
                    setExperience({
                      id: experienceId, // keep current experience
                      type: experienceType,
                      restaurant: restaurant,
                    }),
                  );
                }}>
                <Text style={styles.dropdownItemText}>{restaurant.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBox}
            onPress={() => {
              navigation.navigate('SearchScreen');
            }}>
            <Image
              source={require('../../assets/images/search.png')}
              style={styles.searchIcon} 
            />
          
            <Text style={{color: 'black'}}>Search your favorite food</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => {
              navigation.navigate('CartScreen');
            }}>
            <Image
              source={require('../../assets/images/cart.png')}
              style={styles.cartIcon}
            />
            <View style={styles.cartBadge}>
              <Text style={styles.cartCount}>{totalCount}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Experiences */}
        <View style={styles.experienceContainer}>
          {experiences.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.experienceCard,
                selectedExperience === item.title && styles.activeExperience,
              ]}
              onPress={() => {
                setSelectedExperience(item.title),
                  navigation.navigate(item?.redirection);
                dispatch(setExperience({id: item.id, type: item.title}));
              }}>
              <Image source={item.img} style={styles.experienceImg} />
              <Text
                style={[
                  styles.experienceText,
                  selectedExperience === item.title && {color: '#fff'},
                ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Banner Section with Shimmer */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bannerScroll}>
          {loading ? (
            [1, 2, 3].map(i => (
              <ShimmerPlaceholder
                key={i}
                style={{
                  width: 300,
                  height: 130,
                  borderRadius: 10,
                  marginRight: 10,
                }}
              />
            ))
          ) : bannerlistBanner?.length > 0 ? (
            bannerlistBanner.map((banner, index) => (
              <Image
                key={index}
                source={{uri: banner?.fullImageUrl || banner?.imageUrl || banner?.image}}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ))
          ) : (
            <Text style={{margin: 10}}>No banners available</Text>
          )}
        </ScrollView>

        {/* Categories */}
        <SectionDivider title="Choose what you like" />
        {loading ? (
          <View style={{flexDirection: 'row', paddingVertical: 10}}>
            {[1, 2, 3, 4].map(i => (
              <ShimmerPlaceholder
                key={i}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  marginRight: 15,
                }}
              />
            ))}
          </View>
        ) : (
          <FlatList
            horizontal
            data={homeCategories}
            showsHorizontalScrollIndicator={false}
            // keyExtractor={item => item.id.toString()}
            contentContainerStyle={{paddingVertical: 10}}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => {
                  navigation.navigate('CatItemScreen', {
                    categoryId: item._id,
                    categoryName: item.name,
                    categoryType: item.type,
                    categoryIngredients: item?.ingredients,
                    restaurantId: selectedRestaurant?._id,
                  });
                }}>
                <Image
                  source={{uri: item?.image}}
                  style={styles.categoryImage}
                />
                {/* <Text style={{color: 'red'}}>{item?.name}</Text> */}
              </TouchableOpacity>
            )}
          />
        )}

        {/* Top Picks */}
        <SectionDivider
          title="Top Picks"
          containerStyle={{marginVertical: 10}}
        />
        {loading
          ? [1, 2].map(i => (
              <View key={i} style={[styles.foodCard, {alignItems: 'center'}]}>
                <ShimmerPlaceholder
                  style={{width: 80, height: 80, borderRadius: 10}}
                />
                <View style={{flex: 1, marginLeft: 10}}>
                  <ShimmerPlaceholder
                    style={{width: '60%', height: 12, marginBottom: 8}}
                  />
                  <ShimmerPlaceholder
                    style={{width: '40%', height: 12, marginBottom: 8}}
                  />
                  <ShimmerPlaceholder style={{width: '30%', height: 12}} />
                </View>
              </View>
            ))
          : topPicks.map(item => (
              <View key={item.food._id} style={styles.card}>
                {/* Food Image */}
                <Image source={{uri: item.food.image}} style={styles.image} />

                {/* Details */}
                <View style={styles.details}>
                  {/* Cuisine type (dynamic) */}
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Image
                      source={require('../../assets/images/dineBlack.png')}
                      style={{width: 12, height: 12}}
                    />
                    <Text
                      style={{
                        marginLeft: 10,
                        color: 'black',
                        fontSize: 13,
                        fontWeight: '500',
                      }}>
                      {item.food.cuisineType.join(', ')}
                    </Text>
                  </View>

                  {/* Veg / Non-Veg */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 5,
                    }}>
                    <View
                      style={[
                        styles.typeIndicator,
                        {
                          borderColor: item.food.type.includes('non-veg')
                            ? 'red'
                            : 'green',
                        },
                      ]}>
                      <View
                        style={[
                          styles.typeDot,
                          {
                            backgroundColor: item.food.type.includes('veg')
                              ? 'green'
                              : 'red',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.name}>{item.food.name}</Text>
                  </View>

                  {/* Price */}
                  <Text style={styles.price}>₹{item.food.price}</Text>

                  {/* Rating */}
                  <View style={styles.ratingWrapper}>
                    <Text style={styles.ratingText}>★ {item.food.rating}</Text>
                  </View>
                </View>

                {/* Button */}
                <SmallbtnReuseable
                  onPress={() => {
                    navigation.navigate('FoodDetailScreen', {
                      foodItem: item.food,
                    });
                  }}
                />
              </View>
            ))}
                <View style={{height:170}}/>
      </ScrollView>
  
    </DashboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {backgroundColor: '#fff'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginVertical: Theme.spacing.medium,
  },
  locationText: {
    fontSize: Theme.fontSizes.small,
    fontWeight: '500',
    flex: 1,
    marginLeft: Theme.spacing.tiny,
    color: Theme.colors.black,
  },
  logo: {width: 20, height: 20, resizeMode: 'contain'},
  projectLogo: {width: 50, height: 50, resizeMode: 'contain'},

  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  searchBox: {
    height: 46,
    width: '75%',
    borderWidth: 1,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderColor: '#ccc',
  },
  searchIcon: {width: 18, height: 18, marginRight: 8, tintColor: '#999'},
  searchInput: {flex: 1, fontSize: 14},
  cartBtn: {
    position: 'relative',
    height: 46,
    width: 60,
    borderWidth: 1,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#ccc',
  },
  cartIcon: {width: 22, height: 22},
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartCount: {color: '#fff', fontSize: Theme.fontSizes.xxs, textAlign: 'center'},

  experienceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,

    width:"100%",
   
  },
  experienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 5,
  },
  activeExperience: {backgroundColor: '#e63946', borderColor: '#e63946'},
  experienceText: {marginLeft: 6, fontSize: Theme.fontSizes.xs, color: Theme.colors.black},
  experienceImg: {width: 20, height: 20, resizeMode: 'contain'},

  bannerScroll: {marginTop: 20},
  bannerImage: {
    width: 300,
    height: 130,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 15,
  },

  categoryCard: {alignItems: 'center', marginRight: 15},
  categoryImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#eee',
  },
  categoryText: {marginTop: 5, fontSize: Theme.fontSizes.small, fontWeight: '500'},

  foodCard: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  foodImage: {width: 80, height: 80, borderRadius: 10},
  foodDetails: {flex: 1, marginLeft: 10},
  foodType: {fontSize: Theme.fontSizes.xs, color: '#555', marginLeft: 5},
  foodName: {fontSize: Theme.fontSizes.small, fontWeight: '600', marginVertical: 4},
  foodPrice: {fontSize: Theme, color: '#333'},
  foodTag: {fontSize: Theme.fontSizes.xs, color: 'red', marginTop: 4},
  foodRight: {justifyContent: 'space-between', alignItems: 'flex-end'},
  ratingBox: {
    backgroundColor: '#d4edda',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  ratingText: {fontSize: Theme.fontSizes.xs, color: '#155724'},
  addBtn: {
    backgroundColor: '#e63946',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  details: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: Theme.fontSizes.small,
    fontWeight: '600',
    marginLeft: 5,
    color: '#000',
  },
  price: {
    fontSize: Theme.fontSizes.small,
    color: '#000',
    marginVertical: 4,
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
  typeDot: {
    width: 7,
    height: 7,
    borderRadius: 50,
  },
  ratingWrapper: {
    backgroundColor: 'green',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ratingText: {
    color: '#fff',
    fontSize: Theme.fontSizes.xs,
    fontWeight: '600',
  },
  label: {fontSize: Theme.fontSizes.small, marginBottom: 8, color: '#444'},
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
  },
  dropdownText: {fontSize: Theme.fontSizes.smedium, color: '#444'},
  arrowIcon: {width: 20, height: 20, resizeMode: 'contain'},
  dropdownList: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: '#fff',
    maxHeight: 150,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {fontSize: Theme.fontSizes.small, color: '#444'},
});



export default HatariHome;
