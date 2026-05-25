// ==========================================
// src/redux/slice/CartPetpoojaSlice.js
// ==========================================

import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import axiosInstance from '../../global_Url/axiosInstance';
import {API} from '../../global_Url/GlobalUrl';

const resolveItemId = item =>
  item?.itemId || item?.itemid || item?.item_id || item?.id || item?._id;

const normalizeAddons = addons =>
  (addons || []).map(addon => ({
    addonItemId: String(addon?.addonItemId || addon?.id),
    quantity: Number(addon?.quantity || 1),
  }));

// ==========================================
// FETCH PETPOOJA CART
// ==========================================

export const fetchPetpoojaCart = createAsyncThunk(
  'cartPetpooja/fetchCart',

  async (_, {rejectWithValue}) => {
    try {
      const response = await axiosInstance.get(
        API.getPetpoojaCart,
      );

      console.log(
        'PETPOOJA CART RESPONSE ====>>',
        response.data,
      );

      return response.data;
    } catch (error) {
      console.log(
        'FETCH CART ERROR ====>>',
        error?.response?.data || error.message,
      );

      return rejectWithValue(
        error?.response?.data || error.message,
      );
    }
  },
);

// ==========================================
// UPDATE CART
// ==========================================

export const updatePetpoojaCart = createAsyncThunk(
  'cartPetpooja/updateCart',

  async (
    {restaurantId, cartItem},
    {rejectWithValue},
  ) => {
    try {
      if (!restaurantId) {
        return rejectWithValue('Restaurant ID is required');
      }

      if (!cartItem) {
        return rejectWithValue('Cart item is required');
      }

      const itemId = resolveItemId(cartItem);

      if (!itemId) {
        return rejectWithValue('Valid item ID is required');
      }

      const payload = {
        restaurantId,

        item: {
          itemId: String(itemId),

          variationId:
            cartItem?.variationId || '',

          quantity: Number(
            cartItem?.quantity || 1,
          ),

          addons: normalizeAddons(
            cartItem?.selectedAddOns || cartItem?.addons,
          ),
        },
      };

      console.log(
        'UPDATE CART PAYLOAD ====>>',
        payload,
      );

      const response = await axiosInstance.post(
        API.postPetpoojaCartUpdate,
        payload,
      );

      console.log(
        'UPDATE CART RESPONSE ====>>',
        response.data,
      );

      return response.data;
    } catch (error) {
      console.log(
        'UPDATE CART ERROR ====>>',
        error?.response?.data || error.message,
      );

      return rejectWithValue(
        error?.response?.data || error.message,
      );
    }
  },
);

// ==========================================
// GET CART CALCULATE
// ==========================================

export const fetchPetpoojaCartCalculate = createAsyncThunk(
  'cartPetpooja/fetchCartCalculate',
  async (params = {}, {rejectWithValue}) => {
    try {
      const response = await axiosInstance.get(
        API.getPetpoojaCartCalculate,
        {params},
      );

      console.log(
        'GET CART CALCULATE RESPONSE ====>>',
        response.data,
      );

      return response.data;
    } catch (error) {
      console.log(
        'GET CART CALCULATE ERROR ====>>',
        error?.response?.data || error.message,
      );

      return rejectWithValue(
        error?.response?.data || error.message,
      );
    }
  },
);

// ==========================================
// POST CART CALCULATE
// ==========================================

export const calculatePetpoojaCart = createAsyncThunk(
  'cartPetpooja/calculateCart',
  async (payload, {rejectWithValue}) => {
    try {
      const response = await axiosInstance.post(
        API.postPetpoojaCartCalculate,
        payload,
      );

      console.log(
        'POST CART CALCULATE RESPONSE ====>>',
        response.data,
      );

      return response.data;
    } catch (error) {
      console.log(
        'POST CART CALCULATE ERROR ====>>',
        error?.response?.data || error.message,
      );

      return rejectWithValue(
        error?.response?.data || error.message,
      );
    }
  },
);

// ==========================================
// POST CART REMOVE
// ==========================================

export const removePetpoojaCartItem = createAsyncThunk(
  'cartPetpooja/removeItem',
  async ({itemId, variationId = ''}, {rejectWithValue}) => {
    try {
      if (!itemId) {
        return rejectWithValue('itemId is required');
      }

      const payload = {
        itemId: String(itemId),
        variationId: String(variationId || ''),
      };

      const response = await axiosInstance.post(
        API.postPetpoojaCartRemove,
        payload,
      );

      console.log(
        'POST CART REMOVE RESPONSE ====>>',
        response.data,
      );

      return response.data;
    } catch (error) {
      console.log(
        'POST CART REMOVE ERROR ====>>',
        error?.response?.data || error.message,
      );

      return rejectWithValue(
        error?.response?.data || error.message,
      );
    }
  },
);

// ==========================================
// SLICE
// ==========================================

const CartPetpoojaSlice = createSlice({
  name: 'cartPetpooja',

  initialState: {
    cartData: null,
    calculatedCart: null,

    fetchingCart: false,
    calculating: false,
    removing: false,

    syncing: false,

    success: false,

    error: null,
  },

  reducers: {
    clearPetpoojaCartState: state => {
      state.error = null;
      state.success = false;
      state.calculatedCart = null;
      state.calculating = false;
      state.removing = false;
      state.syncing = false;
      state.fetchingCart = false;
    },
  },

  extraReducers: builder => {
    // ==========================================
    // FETCH CART
    // ==========================================

    builder
      .addCase(
        fetchPetpoojaCart.pending,
        state => {
          state.fetchingCart = true;

          state.error = null;
        },
      )

      .addCase(
        fetchPetpoojaCart.fulfilled,
        (state, action) => {
          state.fetchingCart = false;

          // IMPORTANT
          // YOUR API RETURNS { success, cart }

          state.cartData = action.payload?.cart;

          state.success = true;
        },
      )

      .addCase(
        fetchPetpoojaCart.rejected,
        (state, action) => {
          state.fetchingCart = false;

          state.error = action.payload;

          state.success = false;
        },
      );

    // ==========================================
    // UPDATE CART
    // ==========================================

    builder
      .addCase(
        updatePetpoojaCart.pending,
        state => {
          state.syncing = true;

          state.error = null;
        },
      )

      .addCase(
        updatePetpoojaCart.fulfilled,
        (state, action) => {
          state.syncing = false;

          state.cartData = action.payload?.cart || state.cartData;

          state.success = true;
        },
      )

      .addCase(
        updatePetpoojaCart.rejected,
        (state, action) => {
          state.syncing = false;

          state.error = action.payload;

          state.success = false;
        },
      );

    // ==========================================
    // GET CART CALCULATE
    // ==========================================

    builder
      .addCase(
        fetchPetpoojaCartCalculate.pending,
        state => {
          state.calculating = true;
          state.error = null;
        },
      )
      .addCase(
        fetchPetpoojaCartCalculate.fulfilled,
        (state, action) => {
          state.calculating = false;
          state.calculatedCart = action.payload;
          state.success = true;
        },
      )
      .addCase(
        fetchPetpoojaCartCalculate.rejected,
        (state, action) => {
          state.calculating = false;
          state.error = action.payload;
          state.success = false;
        },
      );

    // ==========================================
    // POST CART CALCULATE
    // ==========================================

    builder
      .addCase(
        calculatePetpoojaCart.pending,
        state => {
          state.calculating = true;
          state.error = null;
        },
      )
      .addCase(
        calculatePetpoojaCart.fulfilled,
        (state, action) => {
          state.calculating = false;
          state.calculatedCart = action.payload;
          state.success = true;
        },
      )
      .addCase(
        calculatePetpoojaCart.rejected,
        (state, action) => {
          state.calculating = false;
          state.error = action.payload;
          state.success = false;
        },
      );

    // ==========================================
    // POST CART REMOVE
    // ==========================================

    builder
      .addCase(
        removePetpoojaCartItem.pending,
        state => {
          state.removing = true;
          state.error = null;
        },
      )
      .addCase(
        removePetpoojaCartItem.fulfilled,
        (state, action) => {
          state.removing = false;
          state.cartData = action.payload?.cart || state.cartData;
          state.success = true;
        },
      )
      .addCase(
        removePetpoojaCartItem.rejected,
        (state, action) => {
          state.removing = false;
          state.error = action.payload;
          state.success = false;
        },
      );
  },
});

export const {clearPetpoojaCartState} = CartPetpoojaSlice.actions;
export default CartPetpoojaSlice.reducer;