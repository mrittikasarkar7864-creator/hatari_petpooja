// OrderSummaryScreen.js
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  ToastAndroid,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import DashboardScreen from '../components/DashboardScreen';
import {clearCart} from '../redux/slice/cartSlice';
import {fetchDeliverySettings} from '../redux/slice/deliverySettingsSlice';
import {fetchCoupons} from '../redux/slice/couponSlice';
import {postBilling} from '../redux/slice/postBillingSlice';
import {fetchUserAddresses} from '../redux/slice/saveaddressSlice';
import {fetchPetpoojaCartCalculate} from '../redux/slice/CartPetpoojaSlice';
import {deleteUserAddress} from '../redux/slice/AddressDeleteSlice';
import CustomHeader from '../components/CustomHeader';
import {calculateTotalPackingCharge} from '../utils/packingChargesConfig';
import {
  getClosedHoursMessage,
  isOrderTypeBlockedNow,
} from '../utils/restaurantHours';

const {width} = Dimensions.get('window');

const OrderSummaryScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const {selectedRestaurant, experienceType, experienceId} = useSelector(
    state => state.experience,
  );
  const {addresses, loading} = useSelector(state => state.address);
  const {items: cartItems} = useSelector(state => state.cart);
  console.log(cartItems,"-------------------cartItems");
  const cartData = useSelector(state => state.cartPetpooja);
  console.log(cartData,"-------------------cartData");
  
  const calculatedCart = useSelector(state => state.cartPetpooja.calculatedCart);
  

  const {token} = useSelector(state => state.auth);
  const {data} = useSelector(state => state.deliverySettings);
  console.log(data, '------------------deliverySettings---------------------');
  
  const couponState = useSelector(state => state.coupons);



  const rawCouponList = Array.isArray(couponState?.list)
    ? couponState.list
    : couponState?.list?.data || [];

  const normalizeCoupon = c => ({
    ...c,
    description: c.description || c.discountName || '',
    minOrderAmount: c.minAmount ?? c.minOrderAmount ?? 0,
    discountDisplay:
      c.discountDisplay ||
      (c.discountType == '1' ? `${c.discountValue}%` : `₹${c.discountValue}`),
    code: c.couponCode || c.code || null,
    discountType:
      c.discountType === 'percentage' || c.discountType === '1' || c.discountType === 1
        ? 'percentage'
        : 'fixed',
    discountValue: c.discountValue ?? 0,
  });

  const couponList = (rawCouponList || []).map(normalizeCoupon);
  console.log(couponList, '------------------couponList---------------------');
  

  const [savedAddress, setSavedAddress] = useState(null);
  console.log(savedAddress,"------------------------savedAddress");
  
  const [userid, setUserId] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [codModalVisible, setCodModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [localAddresses, setLocalAddresses] = useState([]);

    const restaurantList = useSelector(state => state.restaurants.list || []);
    console.log(restaurantList,"restaurantList");
  
    const getRestaurantId = restaurant =>
      restaurant?.restaurantId ?? restaurant?._id ?? restaurant?.id;
  
    const selectedRestaurantId = getRestaurantId(selectedRestaurant);
    console.log(selectedRestaurantId,"---id--");

  // Fetch delivery settings, coupons, and addresses
  useEffect(() => {
    dispatch(fetchDeliverySettings());
    dispatch(fetchCoupons({ restaurantId: selectedRestaurantId }));
    dispatch(fetchUserAddresses(token));
  }, []);

  // Load saved address
  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem('savedAddress');
      if (saved) setSavedAddress(JSON.parse(saved));
      else if (addresses?.length > 0) {
        const first = addresses[0];
        setSavedAddress(first);
        await AsyncStorage.setItem('savedAddress', JSON.stringify(first));
      }
    };
    load();
    setLocalAddresses(addresses);
  }, [addresses]);

  // Recalculate petpooja cart when address or cart changes
  useEffect(() => {
    const lat =
      savedAddress?.latitude || savedAddress?.lat || savedAddress?.customerLatitude ;
    const lng =
      savedAddress?.longitude || savedAddress?.lng || savedAddress?.customerLongitude;
      console.log(lat, lng,"-------------------latlng for cart calculate---------------------");

    // dispatch only if we have cart items or address
    if ((cartItems && cartItems.length > 0) || savedAddress) {
      dispatch(
        fetchPetpoojaCartCalculate({
          customerLatitude: String(lat),
          customerLongitude: String(lng),
        }),
      );
    }
  }, [savedAddress, cartItems]);

  // Load user ID
  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem('userId');
      if (id) setUserId(id);
    })();
  }, []);

  // Format currency
  const formatCurrency = value => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      const n = Number(value) || 0;
      return `₹${n.toFixed(2)}`;
    }
  };

  const getItemTotal = item => {
    let price = 0;
    if (item.hasVariation) {
      const variant = item.selectedOption?.toLowerCase() || 'full';
      price =
        variant === 'full'
          ? Number(item.priceInfo?.fullPrice || 0)
          : Number(item.priceInfo?.halfPrice || 0);
    } else {
      price = Number(
        item.priceInfo?.staticPrice ?? item.totalPrice ?? item.unitPrice ?? 0,
      );
    }

    const addonsTotal = (item.selectedAddOns || []).reduce(
      (sum, a) => sum + Number(a.price) * (a.quantity || 1),
      0,
    );

    return (price + addonsTotal) * (Number(item.quantity) || 1);
  };

  // Support petpooja calculated cart response if available
  const displayItems = calculatedCart?.cart?.items || cartItems || [];

  const getDisplayItemTotal = item => {
    // Petpooja item shape: price / final_price and quantity as strings
    if (item && (item.price || item.final_price)) {
      const unit = Number(item.final_price ?? item.price ?? 0);
      const qty = Number(item.quantity ?? 1);
      return unit * qty;
    }

    return getItemTotal(item);
  };

  const itemTotal =
    Number(calculatedCart?.cart?.totals?.itemSubtotal) ||
    displayItems.reduce((sum, item) => sum + getDisplayItemTotal(item), 0);

  console.log(itemTotal, '------------------totalAmount---------------------');

  // Calculate packing fee:
  // - Top 22 items (whitelist) = NO packing charge
  // - All other API items = Apply packing_charge_per_item from backend settings
  // Prefer packagingCharge from calculated cart totals when available
  const packingFee =
    Number(calculatedCart?.cart?.totals?.packagingCharge) ||
    calculateTotalPackingCharge(cartItems, data?.packing_charge_per_item || 0);
  
  console.log('🛵 PACKING FEE CALCULATION:');
  console.log('   Packing Charge Per Item (from API):', data?.packing_charge_per_item || 0);
  console.log('   Total Packing Fee:', packingFee);
  console.log('   Cart Items:', cartItems.map(item => `${item.name} (Qty: ${item.quantity})`));
  

  let discount = 0;
  if (selectedCoupon) {
    discount =
      selectedCoupon.discountType === 'percentage'
        ? (itemTotal * selectedCoupon.discountValue) / 100
        : selectedCoupon.discountValue;

    if (itemTotal < selectedCoupon.minOrderAmount) discount = 0;
  }

  // Prefer tax breakdown from calculated cart when present
  const findTax = title => {
    const tax = (calculatedCart?.cart?.taxes || []).find(t => t.title === title || t.name === title);
    return tax ? Number(tax.tax || tax.amount || 0) : 0;
  };

  const cgstAmt =
    Number(calculatedCart?.cart?.taxes?.find(t => t.title === 'CGST' || t.name === 'CGST')?.tax) ||
    (data?.Cgst ? (itemTotal + packingFee) * parseFloat(data.Cgst) / 100 : 0);

  const sgstAmt =
    Number(calculatedCart?.cart?.taxes?.find(t => t.title === 'SGST' || t.name === 'SGST')?.tax) ||
    (data?.Sgst ? (itemTotal + packingFee) * parseFloat(data.Sgst) / 100 : 0);

  let convenienceAmt = 0;
  if (data?.convenience_charges_type === 'percentage') {
    convenienceAmt = (itemTotal * data.convenience_charges_value) / 100;
  } else if (data?.convenience_charges_type === 'flat') {
    convenienceAmt = data.convenience_charges_value || 0;
  }

  // Prefer grand total from calculated cart totals when available
  const grandTotal =
    Number(calculatedCart?.cart?.totals?.total) ||
    (itemTotal + (data?.delivery_charges_value || 0) + packingFee + cgstAmt + sgstAmt + convenienceAmt - discount);

  console.log(grandTotal, '------------------grandTotal---------------------');

  const applyCoupon = coupon => {
    if (itemTotal < coupon.minOrderAmount) {
      ToastAndroid.show(
        `Min order ₹${coupon.minOrderAmount} required`,
        ToastAndroid.SHORT,
      );
      return;
    }
    setSelectedCoupon(coupon);
    ToastAndroid.show(`${coupon.code} applied`, ToastAndroid.SHORT);
  };

  const handleProceed = () => {
    if (isOrderTypeBlockedNow(experienceType, selectedRestaurant?.openingTime, selectedRestaurant?.closingTime)) {
      Alert.alert('Restaurant Closed', getClosedHoursMessage(selectedRestaurant?.openingTime, selectedRestaurant?.closingTime));
      return;
    }

    if (itemTotal < 500) {
      ToastAndroid.show('Minimum order amount is ₹500', ToastAndroid.SHORT);
      return;
    }

    if (!savedAddress) {
      ToastAndroid.show('Add a delivery address.', ToastAndroid.SHORT);
      return;
    }

    setCodModalVisible(true);
  };

  const handleConfirmCOD = async () => {
    if (isOrderTypeBlockedNow(experienceType, selectedRestaurant?.openingTime, selectedRestaurant?.closingTime)) {
      Alert.alert('Restaurant Closed', getClosedHoursMessage(selectedRestaurant?.openingTime, selectedRestaurant?.closingTime));
      return;
    }

    const billingData = {
      userId: userid,
      restaurantId: selectedRestaurant?._id || '12345',
      address: savedAddress?._id || '54321',
      billingName: savedAddress?.name,
      billingMobile:
        savedAddress?.mobileNumber || savedAddress?.contact || '7864512300',
      type: experienceType?.toLowerCase() || 'delivery',
      deliveryCharges: Number(data?.delivery_charges_value) || 0,
      foodDetails: cartItems.map(item => {
        const quantity = Number(item.quantity || 1);

        return {
          foodId: item.id || item.foodId || item._id,
          quantity,
          variant: item.hasVariation ? item.selectedOption : null,
          note: item?.note || '',
          fullPrice:
            item.hasVariation && item.selectedOption === 'full'
              ? Number(item.priceInfo?.fullPrice || 0)
              : null,
          halfPrice:
            item.hasVariation && item.selectedOption === 'half'
              ? Number(item.priceInfo?.halfPrice || 0)
              : null,
          unitPrice: !item.hasVariation
            ? Number(item.priceInfo?.staticPrice || item.unitPrice || 0)
            : null,
          addOns: (item.selectedAddOns || []).map(add => ({
            name: add.name,
            image: add.image || '',
            type: add.type || '',
            price: Number(add.price || 0),
            quantity: add.quantity || 1,
          })),
        };
      }),
      totalAmount: grandTotal,
      grossAmount: itemTotal,
      packingCharge: packingFee,
      CGST: cgstAmt,
      SGST: sgstAmt,
      couponCode: selectedCoupon?.code || null,
      paymentStatus: 'Pending',
    };

    try {
      console.log(billingData, '--------------------------billingDataoderSummary');
      await dispatch(postBilling(billingData)).unwrap();
      dispatch(clearCart());
      setCodModalVisible(false);

      ToastAndroid.show('Order placed successfully!', ToastAndroid.LONG);
      navigation.navigate('OrderSuccessScreen');
    } catch (e) {
      console.log('Order confirmation failed:', e);
      ToastAndroid.show('Order failed. Try again.', ToastAndroid.SHORT);
    }
  };

  const handleDeleteAddress = id => {
    setLocalAddresses(prev => prev.filter(item => item._id !== id));
    Alert.alert('Delete Address', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteUserAddress(id)).unwrap();
            if (savedAddress?._id === id) {
              setSavedAddress(null);
              await AsyncStorage.removeItem('savedAddress');
            }
            ToastAndroid.show('Address deleted', ToastAndroid.SHORT);
          } catch (error) {
            ToastAndroid.show('Failed to delete address', ToastAndroid.SHORT);
          }
        },
      },
    ]);
  };

  return (
    <>
      <CustomHeader title=" My Order" />
      <DashboardScreen scrollable={false}>
        <ScrollView contentContainerStyle={{paddingBottom: 200}}>
          {/* ADDRESS CARD */}
          <View style={styles.addressCard}>
            {savedAddress ? (
              <>
                <View style={{flex: 1}}>
                  <Text style={styles.addrName}>
                    {savedAddress?.name} ({savedAddress?.addressType})
                  </Text>
                  <Text style={styles.addrDetails}>
                    {savedAddress.flat}, {savedAddress.address},{' '}
                    {savedAddress.pin}
                  </Text>
                  <Text style={styles.addrPhone}>{savedAddress?.mobileNumber}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  style={styles.changeBtn}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('MapScreen')}
                style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icon name="add-location-alt" size={22} color="red" />
                <Text style={styles.addAddressText}>Add Delivery Address</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* COUPONS */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Available Coupons</Text>
            {couponList.map(coupon => (
              <LinearGradient
                key={coupon._id}
                colors={
                  selectedCoupon?._id === coupon._id
                    ? ['#f50606e6', '#c16280ff']
                    : ['#e47369ff', '#db2b2bff']
                }
                style={styles.couponCard}>
                <View style={{flex: 1}}>
                  <Text style={styles.couponDesc}>{coupon.description}</Text>
                  <Text style={styles.couponDetails}>
                    Min ₹{coupon.minOrderAmount} | {coupon.discountDisplay}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => applyCoupon(coupon)}
                  style={[
                    styles.applyBtn,
                    selectedCoupon?._id === coupon._id && {
                      backgroundColor: '#ccc',
                    },
                  ]}>
                  <Text style={styles.applyText}>
                    {selectedCoupon?._id === coupon._id ? 'APPLIED' : 'APPLY'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            ))}
          </View>

          {/* CART ITEMS */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Your Items</Text>
            {(displayItems || []).map((item, idx) => {
              const key = item._id || item.id || item.itemId || idx;
              const qty = item.quantity ? Number(item.quantity) : 1;
              const unitPrice = Number(item.final_price ?? item.price ?? item.unitPrice ?? 0);
              const lineTotal = getDisplayItemTotal(item);

              return (
                <View key={key} style={styles.itemRow}>
                  <Image source={{uri: item.image || item.imageUrl || ''}} style={styles.itemImage} />
                  <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.foodQtyPrice}>Qty: {qty}</Text>
                    <View style={{flexDirection: 'row'}}>
                      <Text style={styles.itemPrice}>
                        {formatCurrency(lineTotal)}{' '}
                        {item.variation_name || item.selectedOption
                          ? `(${(item.selectedOption || item.variation_name || '').toString().charAt(0).toUpperCase()}${(item.selectedOption || item.variation_name || '').toString().slice(1)})`
                          : ''}
                      </Text>
                    </View>

                    {item.AddonItem?.details?.length > 0 || item.selectedAddOns?.length > 0 ? (
                      <Text style={{color: '#555', fontSize: 13}}>
                        {(item.AddonItem?.details || item.selectedAddOns || [])
                          .map(a => `${a.name} (+₹${a.price ?? a.amount ?? 0})`)
                          .join(', ')}
                      </Text>
                    ) : null}

                    {item.note && (
                      <View style={styles.noteTag}>
                        <Text style={styles.noteText}>📝 {item.note}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* BILL DETAILS */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Bill Details</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billLabel}>{formatCurrency(itemTotal)}</Text>
            </View>

            {cartItems.map((item, index) =>
              item.selectedAddOns?.length > 0 ? (
                <View key={index}>
                  <Text style={{fontWeight: '600', marginTop: 10}}>
                    {item.name}
                  </Text>
               
                </View>
              ) : null,
            )}

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billLabel}>
                {formatCurrency(Number(calculatedCart?.cart?.totals?.deliveryCharges) || data?.delivery_charges_value || 0)}
              </Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Packing Fee</Text>
              <Text style={styles.billLabel}>{formatCurrency(packingFee)}</Text>
            </View>

            {/* Render tax rows from calculatedCart if available, else fall back to CGST/SGST from settings */}
            {(calculatedCart?.cart?.taxes || []).length > 0 ? (
              calculatedCart.cart.taxes.map(t => (
                <View style={styles.billRow} key={t.id}>
                  <Text style={styles.billLabel}>{t.title || t.name}</Text>
                  <Text style={styles.billLabel}>{formatCurrency(Number(t.tax || t.amount || 0))}</Text>
                </View>
              ))
            ) : (
              <>
                {data?.Cgst && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>CGST ({data.Cgst}%)</Text>
                    <Text style={styles.billLabel}>{formatCurrency(cgstAmt)}</Text>
                  </View>
                )}
                {data?.Sgst && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>SGST ({data.Sgst}%)</Text>
                    <Text style={styles.billLabel}>{formatCurrency(sgstAmt)}</Text>
                  </View>
                )}
              </>
            )}
            {selectedCoupon && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Coupon Discount</Text>
                <Text style={styles.billLabel}>
                  - {formatCurrency(discount)}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.billRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(grandTotal)}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* BOTTOM BAR */}
        {cartItems.length > 0 && (
          <View style={styles.bottomBar}>
            <Text style={styles.bottomTotal}>{formatCurrency(grandTotal)}</Text>
            <TouchableOpacity
              onPress={handleProceed}
              style={styles.continueBtn}>
              <Text style={styles.continueText}>Proceed to Pay</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ADDRESS MODAL */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
            presentationStyle="overFullScreen"   // ✅ REQUIRED FOR iOS
  statusBarTranslucent                  
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.savemodalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Address</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={26} color="red" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.locationContainer}
         onPress={() => {
  setModalVisible(false);

  setTimeout(() => {
    navigation.navigate('MapScreen');
  }, 300); // allow modal close animation
}}
>
              <Text style={styles.locationText}>
                Select your current location +
              </Text>
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator color="red" />
            ) : (
              <ScrollView style={{maxHeight: 450}}>
                {localAddresses.map(item => (
                  <View key={item._id} style={styles.addressItem}>
                    <TouchableOpacity
                      style={{flex: 1}}
                      onPress={async () => {
                        setSavedAddress(item);
                        await AsyncStorage.setItem(
                          'savedAddress',
                          JSON.stringify(item),
                        );
                        setModalVisible(false);
                        ToastAndroid.show(
                          'Address selected!',
                          ToastAndroid.SHORT,
                        );
                      }}>
                      <Text style={styles.addressType}>{item.addressType}</Text>
                      <Text style={styles.addressText}>
                        {item.flat}, {item.address}
                      </Text>
                      <Text style={styles.nameText}>
                        {item.name} - {item.mobileNumber}
                      </Text>
                    </TouchableOpacity>

                    {savedAddress?._id === item._id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#f11b1b"
                      />
                    )}

                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('MapScreen', {editData: item})
                      }
                      style={{marginLeft: 10}}>
                      <Ionicons name="create-outline" size={22} color="blue" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteAddress(item._id)}
                      style={{marginLeft: 10}}>
                      <Ionicons name="trash-outline" size={22} color="red" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </Modal>

        {/* COD MODAL */}
        <Modal
          visible={codModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCodModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="cash-outline" size={50} color="red" />
              <Text style={styles.modalTitle}>Cash on Delivery</Text>
              <Text style={styles.modalText}>
                You’ll pay {formatCurrency(grandTotal)} on delivery.
              </Text>

              <TouchableOpacity
                onPress={handleConfirmCOD}
                style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Confirm Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCodModalVisible(false)}
                style={[
                  styles.modalBtn,
                  {backgroundColor: '#ccc', marginTop: 8},
                ]}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </DashboardScreen>
    </>
  );
};

export default OrderSummaryScreen;

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  addressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    margin: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 3,
  },
  addrName: {fontSize: 15, fontWeight: '600', color: '#000'},
  addrDetails: {fontSize: 13, color: '#444', marginTop: 4},
  addrPhone: {fontSize: 13, marginTop: 2, color: '#444'},
  changeBtn: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 8,
  },
  changeText: {color: 'red', fontWeight: '700', fontSize: 12},
  addAddressText: {
    color: 'red',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  sectionBox: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 14,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    color: 'black',
  },
  couponCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
 height: Platform.OS === 'android'
      ? Math.max(78, width - 400) // Android slightly taller
      : Math.max(130, width - 330),


  },
  couponDesc: {color: '#fff', fontSize: 13, fontWeight: 'bold'},
  couponDetails: {color: '#fff', fontSize: 12},
  applyBtn: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'center',
    right:20
  },
  applyText: {color: 'red', fontWeight: '700'},
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImage: {width: 55, height: 55, borderRadius: 8},
  itemName: {fontSize: 14, fontWeight: '600', color: '#000'},
  foodQtyPrice: {fontSize: 14, fontWeight: '600', color: '#8e8b8bff'},
  noteTag: {
    marginTop: 6,
    backgroundColor: '#FFF6E5',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
    padding: 6,
    borderRadius: 6,
    width: width * 0.55,
  },
  noteText: {fontSize: width * 0.035, color: '#444'},
  itemPrice: {fontSize: 13, color: '#444'},
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  billLabel: {fontSize: 13, color: '#555'},
  billValue: {fontSize: 13, color: '#555'},
  divider: {
    borderBottomWidth: 0.7,
    borderBottomColor: '#ccc',
    marginVertical: 6,
  },
  totalLabel: {fontSize: 15, fontWeight: '700'},
  totalValue: {fontSize: 15, fontWeight: '700', color: 'red'},
  bottomBar: {
    position: 'absolute',
    bottom: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#fff',
    width: '100%',
    elevation: 5,
  },
  bottomTotal: {fontSize: 16, fontWeight: '700', color: 'black'},
  continueBtn: {
    backgroundColor: 'red',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  continueText: {color: '#fff', fontWeight: '700', fontSize: 14},

  savemodalView: {
    position: 'absolute', // Make it absolute to position relative to screen
    bottom: 0, // Stick to bottom
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 15,
    elevation: 6,
    maxHeight: '80%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {fontSize: 16, fontWeight: '700', color: '#000'},
  locationContainer: {
    padding: 12,
    backgroundColor: '#FFECEC',
    borderRadius: 8,
    marginVertical: 12,
  },
  locationText: {color: 'red', fontWeight: '600', fontSize: 14},

  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  addressType: {fontWeight: '700', color: '#000'},
  addressText: {color: '#555'},
  nameText: {color: '#000', marginTop: 4},

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000066',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalText: {fontSize: 14, color: '#555', marginVertical: 10},
  modalBtn: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  modalBtnText: {color: '#fff', fontSize: 14, fontWeight: '600'},
});
