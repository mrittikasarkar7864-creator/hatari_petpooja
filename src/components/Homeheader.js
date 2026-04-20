import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';
import ToggleComponents from './ToggleComponents';
import { setExperience, setRestaurant } from '../redux/slice/experienceSlice';
import { getNearbybranches, sortBranchesByDistance } from '../utils/locationHelper';

const { width } = Dimensions.get('window');
const DELIVERY_RADIUS_KM = 10;

const HomeHeader = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { experienceId, selectedRestaurant } = useSelector(
    state => state.experience
  );
  const restaurantList = useSelector(state => state.restaurants.list || []);
  
  const cartItems = useSelector(state => state.cart.items || []);
  const totalCount = cartItems.length;

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState('Delivery');
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyBranches, setNearbyBranches] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);

  // Get user location and filter branches - branches within 10km are selectable
  useEffect(() => {
    const getUserLocation = () => {
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          
          setUserLocation({ latitude, longitude });

          // Sort all branches by distance
          const sortedByDistance = sortBranchesByDistance(
            restaurantList,
            { latitude, longitude }
          );

          // Branches in delivery area (<= 10km) are selectable
          const withinDeliveryRange = getNearbybranches(
            restaurantList,
            { latitude, longitude },
            DELIVERY_RADIUS_KM
          );

          setNearbyBranches(withinDeliveryRange);

          // Show all branches sorted by nearest first
          setFilteredRestaurants(sortedByDistance);

          // Auto-select nearest in-range branch if current selection is missing/out-of-range
          const selectedIsInRange = withinDeliveryRange.some(
            branch => branch._id === selectedRestaurant?._id
          );

          if (!selectedRestaurant || !selectedIsInRange) {
            const branchToSelect = withinDeliveryRange[0] || sortedByDistance[0];

            if (branchToSelect) {
              dispatch(setRestaurant(branchToSelect));
              dispatch(
                setExperience({
                  id: experienceId,
                  type: selectedExperience,
                  restaurant: branchToSelect,
                })
              );
            }
          }
        },
        error => {
          // Fallback: show all branches. First one is selectable.
          const withDefault = restaurantList.length > 0
            ? [restaurantList[0], ...restaurantList.slice(1)]
            : [];
          setFilteredRestaurants(withDefault);
          setNearbyBranches(restaurantList.length > 0 ? [restaurantList[0]] : []);

          if (!selectedRestaurant && withDefault.length > 0) {
            dispatch(setRestaurant(withDefault[0]));
            dispatch(
              setExperience({
                id: experienceId,
                type: selectedExperience,
                restaurant: withDefault[0],
              })
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    };

    if (restaurantList.length > 0) {
      getUserLocation();
    }
  }, [restaurantList]);

  const selectableIds = new Set(nearbyBranches.map(branch => branch._id));
  const inRangeCount = nearbyBranches.length;

  return (
    <>
      {/* StatusBar */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* SafeArea */}
      <SafeAreaView style={{ backgroundColor: '#ef2435' }} />

      {/* Header */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={['#ef2435', '#fefefe']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.headerBackground,
            Platform.OS === 'android'
              ? { paddingTop: StatusBar.currentHeight }
              : {},
          ]}
        >
          <View style={{ paddingHorizontal: 15 }}>
            {/* Header Top */}
            <View style={styles.headerTop}>
              {/* Branch Selector */}
              <TouchableOpacity
                style={styles.branchSelector}
                onPress={() => setShowDropdown(!showDropdown)}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../assets/images/location.png')}
                  style={styles.locationIcon}
                />
                <View style={{ maxWidth: '70%' }}>
                  <Text style={styles.branchText} numberOfLines={1}>
                    {selectedRestaurant
                      ? selectedRestaurant.isActive
                        ? selectedRestaurant.name
                        : 'Restaurant not available'
                      : 'Select Branch'}
                  </Text>
                </View>
                <Image
                  source={require('../assets/images/downarrow.png')}
                  style={styles.downArrow}
                />
              </TouchableOpacity>

              {/* Cart */}
              <TouchableOpacity
                onPress={() => navigation.navigate('OderCartScreen')}
                style={styles.cartContainer}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../assets/images/cart.png')}
                  style={styles.cartIcon}
                />
                {totalCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartCount}>{totalCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Search */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('Bottom', { screen: 'MenuScreen' })
              }
              style={styles.searchInput}
            >
              <Text style={styles.placeholder}>
                Search dishes or restaurants…
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Dropdown */}
      {showDropdown && (
        <View style={styles.dropdownList}>
          {/* Nearest Restaurant Indicator */}
          {filteredRestaurants.length > 0 && (
            <View style={styles.nearestInfoBox}>
              <Text style={styles.nearestInfoText}>
                📍 Nearest: {filteredRestaurants[0]?.name || 'Loading...'}
              </Text>
              <Text style={styles.nearestSubText}>
                {inRangeCount > 0
                  ? `${inRangeCount} branches available within ${DELIVERY_RADIUS_KM} km`
                  : `No branches within ${DELIVERY_RADIUS_KM} km. Showing nearest only.`}
              </Text>
            </View>
          )}

          <ScrollView style={{ maxHeight: 250 }}>
            {filteredRestaurants.map((restaurant, index) => {
              // Check if this is the nearest restaurant
              const isNearest =
                filteredRestaurants.length > 0 &&
                filteredRestaurants[0]._id === restaurant._id;

              // Selectable if within 10km delivery range (or fallback first branch)
              const isWithinRange = selectableIds.has(restaurant._id);

              // Disable if out of range or inactive
              const isDisabled = !isWithinRange || restaurant.isActive === false;

              return (
                <TouchableOpacity
                  key={restaurant._id || index}
                  style={[
                    styles.dropdownItem,
                    isNearest && styles.nearestHighlight,
                    isDisabled && styles.disabledItem,
                  ]}
                  onPress={() => {
                    // Allow selection only for branches in delivery range
                    if (!isDisabled) {
                      setShowDropdown(false);
                      dispatch(setRestaurant(restaurant));
                      dispatch(
                        setExperience({
                          id: experienceId,
                          type: selectedExperience,
                          restaurant,
                        })
                      );
                    }
                  }}
                  disabled={isDisabled}
                  activeOpacity={!isDisabled ? 0.7 : 1}
                >
                  <View style={styles.restaurantRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.dropdownText,
                          selectedRestaurant?._id === restaurant._id && {
                            color: '#e91e3c',
                            fontWeight: 'bold',
                          },
                          isDisabled && styles.disabledText,
                          restaurant.isActive === false && { color: 'red' },
                        ]}
                      >
                        {restaurant.name || 'Restaurant'}
                      </Text>
                      {restaurant.isActive === false && (
                        <Text style={styles.inactiveText}>Currently unavailable</Text>
                      )}
                      {restaurant.distance && (
                        <Text 
                          style={[
                            styles.distanceText,
                            isDisabled && styles.disabledDistanceText,
                          ]}
                        >
                          {restaurant.distance.toFixed(1)} km away
                        </Text>
                      )}
                      {!isWithinRange && restaurant.distance < Number.POSITIVE_INFINITY && (
                        <Text style={styles.outOfRangeText}>
                          Outside {DELIVERY_RADIUS_KM} km delivery range
                        </Text>
                      )}
                    </View>
                    
                    {/* Show badge for nearest */}
                    {isNearest && (
                      <View style={styles.nearestBadgeContainer}>
                        <Text style={styles.nearestBadge}>✓</Text>
                        <Text style={styles.nearestBadgeText}>Nearest</Text>
                      </View>
                    )}

                    {/* Show disabled icon for others */}
                    {isDisabled && (
                      <Text style={styles.disabledIcon}>🚫</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Info Footer */}
          <View style={styles.dropdownFooter}>
            <Text style={styles.footerText}>
              📍 Branches within {DELIVERY_RADIUS_KM} km are selectable. Beyond that are view-only.
            </Text>
          </View>
        </View>
      )}

      {/* Veg / Non-Veg Toggle */}
      <View style={styles.toggleWrapper}>
        <ToggleComponents />
      </View>
    </>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  headerWrapper: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
  },
  headerBackground: {
    width: width,
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    height: Platform.OS === 'android' ? 120 + StatusBar.currentHeight : 120,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  branchSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '72%',
  },
  locationIcon: { width: 20, height: 20, tintColor: '#fff', marginRight: 6 },
  branchText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  downArrow: { width: 14, height: 14, tintColor: '#fff', marginLeft: 6 },

  cartContainer: { position: 'relative' },
  cartIcon: { width: 24, height: 24, tintColor: '#fff' },
  cartBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    zIndex: 10,
  },
  cartCount: { color: '#e91e3c', fontSize: 10, fontWeight: '700' },

  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 15,
    paddingHorizontal: 15,
    height: 42,
    justifyContent: 'center',
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  placeholder: { color: '#666', fontSize: 14 },

  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    marginTop: 5,
    paddingVertical: 5,
    width: width - 20,
    alignSelf: 'center',
  },

  // Nearest Restaurant Info Box
  nearestInfoBox: {
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nearestInfoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 4,
  },
  nearestSubText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },

  // Change Location Button
  changeLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF3E0',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
    marginBottom: 8,
  },
  changeLocationIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  changeLocationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E65100',
  },

  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },

  // Nearest Restaurant Highlight
  nearestHighlight: {
    backgroundColor: '#E8F5E9',
  },

  // Disabled State
  disabledItem: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  disabledText: {
    color: '#999',
  },
  disabledDistanceText: {
    color: '#BBB',
  },
  disabledIcon: {
    fontSize: 16,
    marginLeft: 8,
  },

  restaurantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: { 
    fontSize: 14, 
    color: '#333',
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },
  inactiveText: {
    fontSize: 11,
    color: '#D32F2F',
    marginTop: 2,
    fontWeight: '600',
  },
  outOfRangeText: {
    fontSize: 11,
    color: '#8D6E63',
    marginTop: 2,
    fontWeight: '600',
  },

  // Nearest Badge
  nearestBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nearestBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B5E20',
    marginRight: 4,
  },
  nearestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B5E20',
  },

  // Dropdown Footer Info
  dropdownFooter: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFDE7',
    borderTopWidth: 1,
    borderTopColor: '#FFF9C4',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#F57F17',
    fontWeight: '600',
    textAlign: 'center',
  },

  toggleWrapper: {
    paddingHorizontal: 20,
    marginTop: 8,
    alignItems: 'flex-end',
    backgroundColor: '#f4eaeaff',
    paddingVertical: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});
