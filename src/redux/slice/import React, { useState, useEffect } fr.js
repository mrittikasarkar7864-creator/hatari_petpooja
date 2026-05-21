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
import { getDistance } from 'geolib';

import ToggleComponents from './ToggleComponents';

import {
  setExperience,
  setRestaurant,
} from '../redux/slice/experienceSlice';

const { width } = Dimensions.get('window');

const DELIVERY_RADIUS_KM = 10;

const HomeHeader = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { experienceId, selectedRestaurant } = useSelector(
    state => state.experience,
  );

  const restaurantList = useSelector(
    state => state.nearestRestaurants.data || [],
  );

  const cartItems = useSelector(state => state.cart.items || []);

  const totalCount = cartItems.length;

  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedExperience] = useState('Delivery');

  const [filteredRestaurants, setFilteredRestaurants] = useState([]);

  const [nearbyBranches, setNearbyBranches] = useState([]);

  const getRestaurantId = restaurant =>
    restaurant?.restaurantId ?? restaurant?._id ?? restaurant?.id;

  const selectedRestaurantId = getRestaurantId(selectedRestaurant);

  /* ================= GET USER LOCATION ================= */

  useEffect(() => {
    if (restaurantList.length > 0) {
      getUserLocation();
    }
  }, [restaurantList]);

  const getUserLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;

        console.log('USER LOCATION =>', latitude, longitude);

        /* ================= CALCULATE DISTANCE ================= */

        const sortedByDistance = restaurantList
          .map(branch => {
            const distanceInMeters = getDistance(
              {
                latitude,
                longitude,
              },
              {
                latitude: Number(branch.latitude),
                longitude: Number(branch.longitude),
              },
            );

            return {
              ...branch,
              distance_km: distanceInMeters / 1000,
            };
          })

          .sort(
            (a, b) =>
              Number(a.distance_km) -
              Number(b.distance_km),
          );

        console.log(
          'SORTED RESTAURANTS =>',
          sortedByDistance,
        );

        /* ================= FILTER WITHIN RANGE ================= */

        const withinDeliveryRange =
          sortedByDistance.filter(
            branch =>
              branch.distance_km <= DELIVERY_RADIUS_KM,
          );

        setNearbyBranches(withinDeliveryRange);

        setFilteredRestaurants(sortedByDistance);

        /* ================= AUTO SELECT NEAREST ================= */

        const selectedIsInRange =
          withinDeliveryRange.some(
            branch =>
              getRestaurantId(branch) ===
              selectedRestaurantId,
          );

        if (!selectedRestaurant || !selectedIsInRange) {
          const nearestBranch =
            withinDeliveryRange[0] ||
            sortedByDistance[0];

          if (nearestBranch) {
            dispatch(setRestaurant(nearestBranch));

            dispatch(
              setExperience({
                id: experienceId,
                type: selectedExperience,
                restaurant: nearestBranch,
              }),
            );
          }
        }
      },

      error => {
        console.log('LOCATION ERROR =>', error);

        /* ================= FALLBACK ================= */

        const fallbackRestaurants = restaurantList.map(
          branch => ({
            ...branch,
            distance_km: null,
          }),
        );

        setFilteredRestaurants(fallbackRestaurants);

        if (fallbackRestaurants.length > 0) {
          dispatch(setRestaurant(fallbackRestaurants[0]));

          dispatch(
            setExperience({
              id: experienceId,
              type: selectedExperience,
              restaurant: fallbackRestaurants[0],
            }),
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  /* ================= SELECTABLE IDS ================= */

  const selectableIds = new Set(
    nearbyBranches.map(branch => getRestaurantId(branch)),
  );

  const inRangeCount = nearbyBranches.length;

  /* ================= UI ================= */

  return (
    <>
      {/* STATUS BAR */}

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <SafeAreaView
        style={{ backgroundColor: '#ef2435' }}
      />

      {/* ================= HEADER ================= */}

      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={['#ef2435', '#fefefe']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.headerBackground,

            Platform.OS === 'android'
              ? {
                  paddingTop:
                    StatusBar.currentHeight,
                }
              : {},
          ]}
        >
          <View style={{ paddingHorizontal: 15 }}>
            {/* TOP ROW */}

            <View style={styles.headerTop}>
              {/* BRANCH SELECTOR */}

              <TouchableOpacity
                style={styles.branchSelector}
                onPress={() =>
                  setShowDropdown(!showDropdown)
                }
                activeOpacity={0.8}
              >
                <Image
                  source={require('../assets/images/location.png')}
                  style={styles.locationIcon}
                />

                <View style={{ maxWidth: '75%' }}>
                  <Text
                    style={styles.branchText}
                    numberOfLines={1}
                  >
                    {selectedRestaurant?.name ||
                      'Select Branch'}
                  </Text>
                </View>

                <Image
                  source={require('../assets/images/downarrow.png')}
                  style={styles.downArrow}
                />
              </TouchableOpacity>

              {/* CART */}

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(
                    'OderCartScreen',
                  )
                }
                style={styles.cartContainer}
              >
                <Image
                  source={require('../assets/images/cart.png')}
                  style={styles.cartIcon}
                />

                {totalCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartCount}>
                      {totalCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* SEARCH */}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('Bottom', {
                  screen: 'MenuScreen',
                })
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

      {/* ================= DROPDOWN ================= */}

      {showDropdown && (
        <View style={styles.dropdownList}>
          {/* INFO BOX */}

          {filteredRestaurants.length > 0 && (
            <View style={styles.nearestInfoBox}>
              <Text style={styles.nearestInfoText}>
                📍 Nearest:{' '}
                {filteredRestaurants[0]?.name}
              </Text>

              <Text style={styles.nearestSubText}>
                {inRangeCount > 0
                  ? `${inRangeCount} branches available within ${DELIVERY_RADIUS_KM} km`
                  : `No branches within ${DELIVERY_RADIUS_KM} km`}
              </Text>
            </View>
          )}

          {/* RESTAURANTS */}

          <ScrollView
            style={{ maxHeight: 260 }}
            showsVerticalScrollIndicator={false}
          >
            {filteredRestaurants.map(
              (restaurant, index) => {
                const restaurantId = getRestaurantId(restaurant);
                const nearestRestaurantId = getRestaurantId(
                  filteredRestaurants[0],
                );

                const isNearest =
                  nearestRestaurantId === restaurantId;

                const isWithinRange =
                  selectableIds.has(restaurantId);

                const isClosed =
                  restaurant.is_open === false ||
                  restaurant.isOpen === false;

                const isDisabled =
                  !isWithinRange || isClosed;

                return (
                  <TouchableOpacity
                    key={restaurantId || index}
                    style={[
                      styles.dropdownItem,

                      isNearest &&
                        styles.nearestHighlight,

                      isDisabled &&
                        styles.disabledItem,
                    ]}
                    disabled={isDisabled}
                    activeOpacity={
                      isDisabled ? 1 : 0.7
                    }
                    onPress={() => {
                      if (!isDisabled) {
                        setShowDropdown(false);

                        dispatch(
                          setRestaurant(
                            restaurant,
                          ),
                        );

                        dispatch(
                          setExperience({
                            id: experienceId,
                            type: selectedExperience,
                            restaurant,
                          }),
                        );
                      }
                    }}
                  >
                    <View
                      style={styles.restaurantRow}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.dropdownText,

                            selectedRestaurantId === restaurantId && {
                              color: '#ef2435',
                              fontWeight: 'bold',
                            },

                            isDisabled &&
                              styles.disabledText,
                          ]}
                        >
                          {restaurant.name}
                        </Text>

                        <Text
                          style={styles.addressText}
                        >
                          {restaurant.address}
                        </Text>

                        {restaurant.distance_km !=
                          null && (
                          <Text
                            style={
                              styles.distanceText
                            }
                          >
                            📍{' '}
                            {restaurant.distance_km.toFixed(
                              1,
                            )}{' '}
                            km away
                          </Text>
                        )}

                        {!isWithinRange && (
                          <Text
                            style={
                              styles.outOfRangeText
                            }
                          >
                            Outside delivery range
                          </Text>
                        )}
                      </View>

                      {/* BADGE */}

                      {isNearest && (
                        <View
                          style={
                            styles.nearestBadgeContainer
                          }
                        >
                          <Text
                            style={
                              styles.nearestBadge
                            }
                          >
                            Nearest
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              },
            )}
          </ScrollView>

          {/* FOOTER */}

          <View style={styles.dropdownFooter}>
            <Text style={styles.footerText}>
              📍 Branches within{' '}
              {DELIVERY_RADIUS_KM} km are
              selectable
            </Text>
          </View>
        </View>
      )}

      {/* TOGGLE */}

      <View style={styles.toggleWrapper}>
        <ToggleComponents />
      </View>
    </>
  );
};

export default HomeHeader;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  headerWrapper: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
  },

  headerBackground: {
    width: width,
    justifyContent: 'center',
    height:
      Platform.OS === 'android'
        ? 120 + StatusBar.currentHeight
        : 120,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  branchSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '75%',
  },

  locationIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
    marginRight: 6,
  },

  branchText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  downArrow: {
    width: 14,
    height: 14,
    tintColor: '#fff',
    marginLeft: 6,
  },

  cartContainer: {
    position: 'relative',
  },

  cartIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },

  cartBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },

  cartCount: {
    color: '#ef2435',
    fontSize: 10,
    fontWeight: '700',
  },

  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 15,
    paddingHorizontal: 15,
    height: 42,
    justifyContent: 'center',
  },

  placeholder: {
    color: '#666',
    fontSize: 14,
  },

  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 10,
    marginTop: 6,
    paddingVertical: 6,
    elevation: 5,
  },

  nearestInfoBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
  },

  nearestInfoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B5E20',
  },

  nearestSubText: {
    fontSize: 12,
    marginTop: 4,
    color: '#2E7D32',
  },

  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  nearestHighlight: {
    backgroundColor: '#F1FFF3',
  },

  disabledItem: {
    opacity: 0.5,
  },

  disabledText: {
    color: '#999',
  },

  restaurantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dropdownText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
  },

  addressText: {
    fontSize: 11,
    color: '#777',
    marginTop: 5,
  },

  distanceText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontWeight: '600',
  },

  outOfRangeText: {
    fontSize: 11,
    color: '#D32F2F',
    marginTop: 5,
    fontWeight: '700',
  },

  nearestBadgeContainer: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'center',
  },

  nearestBadge: {
    color: '#1B5E20',
    fontSize: 11,
    fontWeight: '700',
  },

  dropdownFooter: {
    padding: 12,
    backgroundColor: '#FFFDE7',
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
    backgroundColor: '#f4eaea',
    paddingVertical: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});