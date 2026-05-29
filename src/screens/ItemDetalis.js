// ⭐ MY ORDERS SCREEN — MODERN UI + FULLY FIXED
import React, {useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  BackHandler,
  Dimensions,
} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import {fetchFoodOrders} from '../redux/slice/getfoodorderSlice';

import DashboardScreen from '../components/DashboardScreen';
import CustomHeader from '../components/CustomHeader';

import {
  CommonActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Theme from '../assets/theme';
const { width } = Dimensions.get('window');
const ItemDetalis = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const {orders, loading, error} = useSelector(
    state => state.foodOrder,
  );

  const orderData = Array.isArray(orders) ? orders : [];
  console.log(orderData,"-----------------orderData in order screen");
  

  /* ================= BACK HANDLER ================= */

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Bottom',
                  state: {
                    routes: [{name: 'HomeScreen'}],
                  },
                },
              ],
            }),
          );

          return true;
        },
      );

      return () => backHandler.remove();
    }, [navigation]),
  );

  /* ================= FETCH ORDERS ================= */

  useEffect(() => {
    dispatch(fetchFoodOrders());
  }, [dispatch]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={Theme.colors.red}
        />
      </View>
    );
  }

  /* ================= ERROR ================= */

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  }

  /* ================= EMPTY ================= */

  if (orderData.length === 0) {
    return (
      <View style={styles.center}>
        <Image
          source={{
            uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076500.png',
          }}
          style={styles.emptyImage}
        />

        <Text style={styles.noDataText}>
          No Orders Found
        </Text>

        <Text style={styles.emptySubText}>
          Start ordering delicious food 🍔
        </Text>
      </View>
    );
  }

  /* ================= HELPERS ================= */

  const getStatusColor = status => {
    switch (String(status).toUpperCase()) {
      case 'DELIVERED':
        return '#22C55E';

      case 'CANCELLED':
        return '#EF4444';

      case 'PENDING':
        return '#F59E0B';

      default:
        return '#FF7A00';
    }
  };

  /* ================= UI ================= */

  return (
    <>
      <CustomHeader title="My Orders" />

      <DashboardScreen scrollable={false}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}>

          {orderData.map((item, index) => {
            const foodItems = item?.items || [];
            const customer = item?.customer || {};
            const deliveryAddress =
              item?.deliveryAddress || {};
            const totals = item?.totals || {};

            const orderId = item?._id
              ? `#${String(item._id)
                  .slice(-6)
                  .toUpperCase()}`
              : 'N/A';

            const status =
              item?.status || 'PENDING';

            const statusColor =
              getStatusColor(status);

            return (
              <TouchableOpacity
                key={item?._id || index}
                activeOpacity={0.92}
                style={styles.orderCard}>

                {/* ================= HEADER ================= */}

                <View style={styles.headerRow}>
                  <View style={styles.restaurantLeft}>
                    <Image
                      source={{
                        uri: 'src/assets/images/project_logo.png',
                      }}
                      style={styles.restaurantImage}
                    />

                    <View style={{flex: 1}}>
                      <Text style={styles.restaurantName}>
                        Hatari Restaurant
                      </Text>

                      <Text style={styles.orderId}>
                        {orderId}
                      </Text>

                      <View style={styles.timeRow}>
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color="#888"
                        />

                        <Text style={styles.timeText}>
                          {item?.created_on ||
                            'Order placed'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          statusColor + '15',
                        borderColor: statusColor,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: statusColor,
                        },
                      ]}>
                      {status}
                    </Text>
                  </View>
                </View>

                {/* ================= ITEMS ================= */}

                <View style={styles.itemsContainer}>
                  {foodItems.map((food, idx) => {
                    const quantity = Number(
                      food?.quantity || 1,
                    );

                    const price = Number(
                      food?.final_price ||
                        food?.price ||
                        0,
                    );

                    const total =
                      quantity * price;

                    return (
                      <View
                        key={idx}
                        style={styles.foodCard}>

                        <Image
                          source={{
                            uri: 'src/assets/images/project_logo.png',
                          }}
                          style={styles.foodImage}
                        />

                        <View
                          style={styles.foodInfo}>
                          <Text
                            style={styles.foodName}>
                            {food?.name}
                          </Text>
                            {food?.customization || food?.note ? (
                            <View style={styles.noteTag}>
                              <Text style={styles.noteText}>
                                📝 {food.customization || food.note}
                              </Text>
                            </View>
                          ) : null}

                          <Text
                            style={styles.foodMeta}>
                            Qty: {quantity}
                          </Text>

                          {!!food?.variation_name && (
                            <Text
                              style={
                                styles.foodVariation
                              }>
                              {
                                food?.variation_name
                              }
                            </Text>
                          )}
                        </View>

                        <View
                          style={styles.priceBox}>
                          <Text
                            style={styles.priceText}>
                            ₹ {total.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* ================= BILL SUMMARY ================= */}

                <View style={styles.billContainer}>
                  <Text style={styles.billTitle}>
                    Bill Summary
                  </Text>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>
                      Subtotal
                    </Text>

                    <Text style={styles.billValue}>
                      ₹ {totals?.subtotal || 0}
                    </Text>
                  </View>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>
                      Tax
                    </Text>

                    <Text style={styles.billValue}>
                      ₹ {totals?.tax_total || 0}
                    </Text>
                  </View>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>
                      Delivery Fee
                    </Text>

                    <Text style={styles.billValue}>
                      ₹{' '}
                      {totals?.delivery_charges ||
                        0}
                    </Text>
                  </View>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>
                      Packing Charges
                    </Text>

                    <Text style={styles.billValue}>
                      ₹{' '}
                      {totals?.packing_charges ||
                        0}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.billRow}>
                    <Text style={styles.totalLabel}>
                      Grand Total
                    </Text>

                    <Text style={styles.totalValue}>
                      ₹ {totals?.total || 0}
                    </Text>
                  </View>
                </View>

                {/* ================= ADDRESS ================= */}

                <View style={styles.addressBox}>
                  <View style={styles.locationIcon}>
                    <MaterialIcons
                      name="location-on"
                      size={22}
                      color="#fff"
                    />
                  </View>

                  <View style={styles.addressInfo}>
                    <Text style={styles.addressTitle}>
                      Delivery Address
                    </Text>

                    <Text style={styles.addressName}>
                      {customer?.name}
                    </Text>

                    <Text style={styles.addressText}>
                      {
                        deliveryAddress?.address
                      }
                    </Text>

                    <Text style={styles.phoneText}>
                      📞 {customer?.phone}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={{height: 30}} />
        </ScrollView>
      </DashboardScreen>
    </>
  );
};

export default ItemDetalis;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
    paddingHorizontal: 14,
    paddingTop: 12,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  emptyImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 20,
  },

  noDataText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
  },

  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
  },

  errorText: {
    color: 'red',
    fontSize: 15,
    fontWeight: '600',
  },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 18,
    padding: 16,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowRadius: 10,

    elevation: 4,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  restaurantLeft: {
    flexDirection: 'row',
    flex: 1,
  },

  restaurantImage: {
    width: 65,
    height: 65,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#F4F4F4',
  },

  restaurantName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222',
  },

  orderId: {
    fontSize: 13,
    marginTop: 4,
    color: '#888',
    fontWeight: '600',
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  timeText: {
    marginLeft: 4,
    color: '#888',
    fontSize: 12,
  },

  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  itemsContainer: {
    marginTop: 18,
  },

  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },

  foodImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#EFEFEF',
  },

  foodInfo: {
    flex: 1,
    marginLeft: 12,
  },

  foodName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
    noteTag: {
    marginTop: 6,
    backgroundColor: '#FFF6E5',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
    padding: 6,
    borderRadius: 6,
    width: width * 0.3,
  },
  noteText: { fontSize: width * 0.035, color: '#444' },

  foodMeta: {
    marginTop: 6,
    fontSize: 13,
    color: '#777',
  },

  foodVariation: {
    marginTop: 4,
    fontSize: 12,
    color: Theme.colors.red,
    fontWeight: '600',
  },

  priceBox: {
    backgroundColor: '#FFF1EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.red,
  },

  billContainer: {
    marginTop: 12,
    backgroundColor: '#FFF8F3',
    borderRadius: 18,
    padding: 14,
  },

  billTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },

  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },

  billLabel: {
    color: '#666',
    fontSize: 13,
  },

  billValue: {
    color: '#222',
    fontSize: 13,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#E7E7E7',
    marginVertical: 10,
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222',
  },

  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.red,
  },

  addressBox: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#FFF4EE',
    borderRadius: 18,
    padding: 14,
    alignItems: 'flex-start',
  },

  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  addressInfo: {
    flex: 1,
  },

  addressTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },

  addressName: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
  },

  addressText: {
    marginTop: 5,
    color: '#666',
    lineHeight: 20,
    fontSize: 13,
  },

  phoneText: {
    marginTop: 6,
    color: '#444',
    fontWeight: '600',
    fontSize: 13,
  },

});