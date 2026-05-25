import {configureStore} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import HomeReducer from '../slice/HomeSlice';
import authReducer from '../slice/authSlice';
import nearestResReucer from '../slice/nearestResSlice';
import AllRestaurantReucer from '../slice/AllRestaurantSlice';
import bannerReucer from '../slice/BannerSlice';
import AllFoodsReucer from '../slice/AllFoodsSlice';
import cartReucer from '../slice/cartSlice';
import addressReucer from '../slice/addressSlice';
import foodCategoryReducer from '../slice/foodCategorySlice';
import foodCustomizationReducer from '../slice/CustomizeSlice';
import catItemReducer from '../slice/catItemSlice';
import menucuisineTypeReducer from '../slice/menucuisineTypeSlice';
import experienceReducer from '../slice/experienceSlice';
import SearchFoodPaginationReducer from '../slice/SearchFoodPaginationSlice';
import deliverySettingsReducer from '../slice/deliverySettingsSlice';
import TableBookingRducer from '../slice/TableBookingSlice';
import postBillingReducer from '../slice/postBillingSlice';
import couponReducer from '../slice/couponSlice';
import getFoodOrderReducer from '../slice/getfoodorderSlice';
import toggleReducer from '../slice/toggleSlice';
import saveAddressReducer from '../slice/saveaddressSlice';
import subCategoryReducer from '../slice/subCategoriSlice';
import searchReducer from '../slice/searchSlice';
import TopPickerReducer from '../slice/TopPickerSlice';
import profileReducer from '../slice/profileSlice';
import deleteAddressReducer from '../slice/AddressDeleteSlice';
import GetAllCategoryReducer from '../slice/GetAllCategorySlice';
import CategoriSliceReducer from '../slice/CategoriSlice';
import modalReducer from '../slice/ModalSlice'
import allSubCategoryReducer from '../slice/AllSubCategorySlice'
import CartPetpoojaReducer from '../slice/CartPetpoojaSlice'
import CartApiReducer from '../slice/CartApiSlice'

const cartPersistConfig = {
  key: 'cart',
  storage: AsyncStorage,
};

const persistedCartReducer = persistReducer(cartPersistConfig, cartReucer);

const store = configureStore({
  reducer: {
    home: HomeReducer,
    auth: authReducer,
    nearestRestaurants: nearestResReucer,
    restaurants: AllRestaurantReucer,
    banners: bannerReucer,
    allFoods: AllFoodsReucer,
    cart: persistedCartReducer,
    address: addressReucer,
    foodCategory: foodCategoryReducer,
    foodCustomization: foodCustomizationReducer,
    catItems: catItemReducer,
    menuItems: menucuisineTypeReducer,
    experience: experienceReducer,
    FoodPagination: SearchFoodPaginationReducer,
    deliverySettings: deliverySettingsReducer,
    tableBooking: TableBookingRducer,
    coupons: couponReducer,
    billing: postBillingReducer,
    foodOrder: getFoodOrderReducer,
    foodFilter: toggleReducer,
    address: saveAddressReducer,
    subCategories: subCategoryReducer,
    search: searchReducer,
    catItemsbySubcat: TopPickerReducer,
    profile: profileReducer,
    deleteAddress: deleteAddressReducer,
    categoriesAllcat: GetAllCategoryReducer,
    categories:CategoriSliceReducer,
    modal:modalReducer,
   allSubCategory: allSubCategoryReducer,
    cartPetpooja: CartPetpoojaReducer,
    cartApi : CartApiReducer
  },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
});

  export const persistor = persistStore(store);
export default store;
