// ==========================================
// src/screens/cart/CartScreen.js
// PETPOOJA API BASED FULL CART SCREEN
// ==========================================

import React, {useEffect, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
  ToastAndroid,
  Alert,
  ActivityIndicator,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';

import {
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';

import {useDispatch, useSelector} from 'react-redux';

import Ionicons from 'react-native-vector-icons/Ionicons';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import DashboardScreen from '../components/DashboardScreen';

import CustomHeader from '../components/CustomHeader';

import Theme from '../assets/theme';

import {
  updatePetpoojaCart,
  removePetpoojaCartItem,
  fetchPetpoojaCart,
} from '../redux/slice/CartPetpoojaSlice';

const {width, height} = Dimensions.get('window');

const OderCartScreen = () => {
  const navigation = useNavigation();

  const dispatch = useDispatch();

  const insets = useSafeAreaInsets();

  // ==========================================
  // REDUX
  // ==========================================

  const {
    cartData,
    fetchingCart,
    syncing,
    error,
  } = useSelector(state => state.cartPetpooja);
  console.log(cartData, fetchingCart, syncing, error,"----------------cartData, fetchingCart, syncing, error,");
  

  // ==========================================
  // LOCAL STATES
  // ==========================================

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [noteText, setNoteText] = useState('');

  // ==========================================
  // PETPOOJA ITEMS
  // ==========================================

  const cartItems = Array.isArray(cartData?.items)
    ? cartData.items
    : [];

  const restaurantId =
    cartData?.restaurantId || '52120';

  // ==========================================
  // FETCH CART
  // ==========================================

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchPetpoojaCart());
    }, [dispatch]),
  );

  // ==========================================
  // HELPERS
  // ==========================================

  const formatCurrency = amount =>
    `₹${Number(amount || 0).toLocaleString(
      'en-IN',
    )}`;

  const getItemTotal = item => {
    const base =
      Number(
        item?.price ||
          item?.unitPrice ||
          item?.amount,
      ) || 0;

    const addons =
      item?.addons?.reduce(
        (sum, addon) =>
          sum + Number(addon?.price || 0),
        0,
      ) || 0;

    return (base + addons) * Number(item.quantity);
  };

  const getItemId = item =>
    item?.itemId || item?.itemid || item?.item_id || item?.id || item?._id;

  const getVariationId = item =>
    item?.variationId || item?.variationid || item?.variation_id || '';

  // ==========================================
  // INCREMENT
  // ==========================================

  const incrementQty = async item => {
    try {
      await dispatch(
        updatePetpoojaCart({
          restaurantId,

          cartItem: {
            ...item,

            itemId: getItemId(item),

            variationId: getVariationId(item),

            quantity:
              Number(item.quantity || 1) + 1,
          },
        }),
      ).unwrap();

      dispatch(fetchPetpoojaCart());
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================================
  // DECREMENT
  // ==========================================

  const decrementQty = async item => {
    try {
      const updatedQty =
        Number(item.quantity || 1) > 1
          ? Number(item.quantity) - 1
          : 1;

      if (Number(item.quantity || 1) <= 1) {
        await dispatch(
          removePetpoojaCartItem({
            itemId: getItemId(item),
            variationId: getVariationId(item),
          }),
        ).unwrap();

        dispatch(fetchPetpoojaCart());
        return;
      }

      await dispatch(
        updatePetpoojaCart({
          restaurantId,

          cartItem: {
            ...item,

            itemId: getItemId(item),

            variationId: getVariationId(item),

            quantity: updatedQty,
          },
        }),
      ).unwrap();

      dispatch(fetchPetpoojaCart());
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================================
  // DELETE ITEM
  // ==========================================

  const deleteItem = async item => {
    try {
      await dispatch(
        removePetpoojaCartItem({
          itemId: getItemId(item),
          variationId: getVariationId(item),
        }),
      ).unwrap();

      dispatch(fetchPetpoojaCart());

      if (Platform.OS === 'android') {
        ToastAndroid.show(
          'Item removed from cart',
          ToastAndroid.SHORT,
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================================
  // MODAL
  // ==========================================

  const openModal = item => {
    setSelectedItem(item);

    setNoteText(item?.customization || item?.note || '');
  };

  const closeModal = () => {
    setSelectedItem(null);

    setNoteText('');
  };

  const handleSaveNote = async () => {
    if (!selectedItem) {
      return;
    }

    try {
      await dispatch(
        updatePetpoojaCart({
          restaurantId,
          cartItem: {
            ...selectedItem,
            itemId: getItemId(selectedItem),
            variationId: getVariationId(selectedItem),
            customization: noteText,
          },
        }),
      ).unwrap();

      dispatch(fetchPetpoojaCart());

      if (Platform.OS === 'android') {
        ToastAndroid.show(
          'Customization saved!',
          ToastAndroid.SHORT,
        );
      } else {
        Alert.alert(
          'Success',
          'Customization saved!',
        );
      }

      closeModal();
    } catch (err) {
      console.log('Customize save error:', err);

      Alert.alert(
        'Error',
        'Unable to save customization. Please try again.',
      );
    }
  };

  // ==========================================
  // CHECKOUT
  // ==========================================

  const handleCheckout = () => {
    navigation.navigate(
      'OrderSummaryScreen',
      {
        petpoojaCartData: cartData,
      },
    );
  };

  // ==========================================
  // RENDER ITEM
  // ==========================================

  const renderItem = ({item}) => {
    const isVeg =
      item?.type?.toLowerCase() === 'veg';

    const typeColor = isVeg ? 'green' : 'red';

    return (
      <View style={styles.itemCard}>
        <Image
          source={{
            uri:
              item?.image ||
              item?.imageUrl ||
              'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
          }}
          style={styles.itemImage}
        />

        <View style={styles.detailsContainer}>
          <View style={styles.itemHeader}>
            <View
              style={[
                styles.typeIndicator,
                {
                  borderColor: typeColor,
                },
              ]}>
              <View
                style={[
                  styles.typeDot,
                  {
                    backgroundColor: typeColor,
                  },
                ]}
              />
            </View>

            <Text
              style={styles.itemName}
              numberOfLines={1}>
              {item?.name || 'Food Item'}
            </Text>
          </View>

          <Text style={styles.itemPrice}>
            {formatCurrency(
              getItemTotal(item),
            )}
          </Text>

          {/* ADDONS */}

          {item?.addons?.length > 0 && (
            <Text style={styles.addonText}>
              {item?.addons
                ?.map(
                  addon =>
                    `${addon?.name} ₹${addon?.price}`,
                )
                .join(', ')}
            </Text>
          )}

          {/* ACTIONS */}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.customizeBtn}
              onPress={() => openModal(item)}>
              <Ionicons
                name="pencil-outline"
                size={16}
                color={Theme.colors.red}
              />

              <Text style={styles.customizeText}>
                Customize
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => deleteItem(item)}>
              <Ionicons
                name="trash-outline"
                size={18}
                color="red"
              />

              <Text style={styles.deleteText}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>

          {/* NOTE */}

          {item?.customization ? (
            <View style={styles.customizeSection}>
              <Text style={styles.customizeLabel}>
                Special instructions:
              </Text>

              <Text style={styles.noteText}>
                📝 {item.customization}
              </Text>
            </View>
          ) : null}
        </View>

        {/* QUANTITY */}

        <View style={styles.quantityBox}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() =>
              decrementQty(item)
            }>
            <Text style={styles.qtyText}>
              -
            </Text>
          </TouchableOpacity>

          <Text style={styles.qtyValue}>
            {item?.quantity || 1}
          </Text>

          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() =>
              incrementQty(item)
            }>
            <Text style={styles.qtyText}>
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <>
      <CustomHeader title="My Cart" />

      <DashboardScreen scrollable={false}>
        <SafeAreaView style={{flex: 1}}>
          <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={
              Platform.OS === 'ios'
                ? 'padding'
                : undefined
            }>
            {/* ADD MORE */}

            <TouchableOpacity
              style={styles.addMore}
              onPress={() =>
                navigation.navigate(
                  'Bottom',
                  {
                    screen:
                      'HomeScreen',
                  },
                )
              }>
              <Text
                style={{
                  color:
                    Theme.colors.red,
                  fontWeight: '700',
                }}>
                + Add more Items
              </Text>
            </TouchableOpacity>

       

            {/* LOADER */}

            {fetchingCart ? (
              <View
                style={{
                  marginTop: 20,
                }}>
                {Array.from({
                  length: 3,
                }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      marginVertical: 8,
                    }}>
                    <ShimmerPlaceHolder
                      LinearGradient={
                        LinearGradient
                      }
                      style={{
                        width:
                          width * 0.9,
                        height: 90,
                        borderRadius: 12,
                        alignSelf:
                          'center',
                      }}
                    />
                  </View>
                ))}
              </View>
            ) : cartItems.length === 0 ? (
              // EMPTY
              <View
                style={
                  styles.emptyContainer
                }>
                <Image
                  source={{
                    uri:
                      'https://cdn-icons-png.flaticon.com/512/2038/2038854.png',
                  }}
                  style={{
                    width:
                      width * 0.35,
                    height:
                      width * 0.35,
                  }}
                />

                <Text
                  style={
                    styles.emptyText
                  }>
                  Your cart is empty
                </Text>
              </View>
            ) : (
              <>
                {/* LIST */}

                <FlatList
                  data={cartItems}
                  keyExtractor={(
                    item,
                    index,
                  ) =>
                    `${
                      item?.itemId ||
                      item?.id
                    }-${index}`
                  }
                  renderItem={
                    renderItem
                  }
                  showsVerticalScrollIndicator={
                    false
                  }
                  contentContainerStyle={{
                    paddingBottom:
                      height * 0.18,
                  }}
                />

                {/* BOTTOM BAR */}

                <View
                  style={[
                    styles.bottomBar,
                    {
                      paddingBottom:
                        insets.bottom ||
                        10,
                    },
                  ]}>
                  <View>
                    <Text
                      style={{
                        fontWeight:
                          '700',
                        color:
                          '#28a745',
                      }}>
                      {
                        cartItems.length
                      }{' '}
                      Item(s)
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.checkoutBtn
                    }
                    onPress={
                      handleCheckout
                    }>
                    <Text
                      style={
                        styles.checkoutText
                      }>
                      {syncing
                        ? 'Syncing...'
                        : 'Continue'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* MODAL */}

        <Modal
          visible={!!selectedItem}
          animationType="slide"
          transparent
          onRequestClose={closeModal}>
          <View
            style={
              styles.modalOverlay
            }>
            <View
              style={
                styles.modalContainer
              }>
              <Text
                style={
                  styles.modalTitle
                }>
                Customize Item:{' '}
                {
                  selectedItem?.name
                }
              </Text>

              <Text
                style={
                  styles.modalSubtitle
                }>
                Add a special instruction or preference.
              </Text>

              <TextInput
                style={
                  styles.modalInput
                }
                placeholder="Enter customization details..."
                placeholderTextColor="#999"
                value={noteText}
                onChangeText={setNoteText}
                multiline
              />

              <View
                style={
                  styles.modalActions
                }>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor:
                        '#ccc',
                    },
                  ]}
                  onPress={
                    closeModal
                  }>
                  <Text
                    style={{
                      color:
                        '#333',
                    }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor:
                        Theme.colors.red,
                    },
                  ]}
                  onPress={
                    handleSaveNote
                  }>
                  <Text
                    style={
                      styles.modalBtnText
                    }>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </DashboardScreen>
    </>
  );
};

export default OderCartScreen;

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  addMore: {
    alignSelf: 'flex-end',
    marginVertical: 10,
    marginRight: 15,
  },

  syncInfoCard: {
    backgroundColor: '#fff7ef',
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
  },

  syncInfoTitle: {
    color: '#d9480f',
    fontWeight: '700',
    fontSize: 15,
  },

  syncInfoSub: {
    marginTop: 4,
    color: '#555',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#555',
  },

  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    padding: 12,
    elevation: 3,
  },

  itemImage: {
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: 10,
  },

  detailsContainer: {
    flex: 1,
    marginLeft: 12,
  },

  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  typeIndicator: {
    width: 16,
    height: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
  },

  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  itemName: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },

  itemPrice: {
    marginTop: 4,
    color: '#777',
    fontWeight: '700',
  },

  addonText: {
    marginTop: 4,
    color: '#555',
    fontSize: 13,
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
  },

  customizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 10,
  },

  customizeText: {
    marginLeft: 5,
    color: Theme.colors.red,
    fontWeight: '600',
  },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  deleteText: {
    marginLeft: 5,
    color: 'red',
    fontWeight: '600',
  },

  noteTag: {
    marginTop: 6,
    backgroundColor: '#FFF6E5',
    padding: 6,
    borderRadius: 6,
  },

  customizeSection: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fcf7f7',
    borderColor: '#f1dfdf',
    borderWidth: 1,
  },

  customizeLabel: {
    fontSize: 12,
    color: '#8f3740',
    fontWeight: '700',
    marginBottom: 6,
  },

  customizeHint: {
    color: '#777',
    fontSize: 12,
  },

  noteText: {
    color: '#4a4a4a',
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },

  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  qtyBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    elevation: 2,
  },

  qtyText: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.red,
  },

  qtyValue: {
    marginHorizontal: 10,
    fontWeight: '700',
    color: '#000',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '3%',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 10,
  },

  checkoutBtn: {
    backgroundColor: Theme.colors.red,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },

  checkoutText: {
    color: '#fff',
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  modalSubtitle: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
  },

  modalInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 10,
    minHeight: 70,
    color: '#000',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },

  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 10,
  },

  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});