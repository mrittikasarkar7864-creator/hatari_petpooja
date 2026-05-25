// src/redux/slice/CartPetpoojaSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../global_Url/axiosInstance';
import { API } from '../../global_Url/GlobalUrl';

/**
 * Thunk: Add item to Petpooja cart
 * Transforms cart item into Petpooja API format and POSTs to /cart/update
 */
export const addItemToPetpoojaCart = createAsyncThunk(
  'cartApi/addItem',
  async (
    { restaurantId, cartItem },
    { rejectWithValue }
  ) => {
    try {
      if (!restaurantId) {
        return rejectWithValue('Restaurant ID is required');
      }

      if (!cartItem) {
        return rejectWithValue('Cart item is required');
      }

      const resolvedItemId =
        cartItem?.itemId ||
        cartItem?.itemid ||
        cartItem?.item_id ||
        cartItem?.id ||
        cartItem?._id;

      if (!resolvedItemId) {
        return rejectWithValue('Valid item ID is required');
      }

      // Transform cart item to Petpooja format
      const payload = {
        restaurantId,
        item: {
          itemId: String(resolvedItemId),
          variationId: cartItem.variationId || '',
          quantity: Number(cartItem.quantity || 1),
          addons: (cartItem.selectedAddOns || []).map(addon => ({
            addonItemId: String(addon.addonItemId || addon.id),
            quantity: Number(addon.quantity || 1),
          })),
        },
      };

      console.log('Adding to Petpooja cart:', payload);

      const response = await axiosInstance.post(
        API.postCatAdd,
        payload,
      );

      console.log('Petpooja cart response:', response.data);

      return {
        success: true,
        data: response.data,
        itemId: String(resolvedItemId),
      };
    } catch (error) {
      console.error('Error adding to Petpooja cart:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data || error.message,
      );
    }
  },
);

/**
 * Thunk: Get Petpooja cart data
 */
export const fetchPetpoojaCart = createAsyncThunk(
  'cartApi/getCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API.getPetpoojaCart);
      return response.data;
    } catch (error) {
      console.error(
        'Error fetching Petpooja cart:',
        error.response?.data || error.message,
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

/**
 * Thunk: Sync entire cart to Petpooja
 * Sends all items in the cart to Petpooja
 */
export const syncCartToPetpooja = createAsyncThunk(
  'cartPetpooja/syncCart',
  async (
    { restaurantId, cartItems = [] },
    { rejectWithValue }
  ) => {
    try {
      if (!restaurantId) {
        return rejectWithValue('Restaurant ID is required');
      }

      if (!cartItems || cartItems.length === 0) {
        return rejectWithValue('Cart is empty');
      }

      // Transform all items
      const items = cartItems.map(cartItem => ({
        itemId: String(cartItem.id || cartItem.itemId),
        variationId: cartItem.variationId || '',
        quantity: Number(cartItem.quantity || 1),
        addons: (cartItem.selectedAddOns || []).map(addon => ({
          addonItemId: String(addon.addonItemId || addon.id),
          quantity: Number(addon.quantity || 1),
        })),
      }));

      console.log(`Syncing ${items.length} items to Petpooja cart`);

      // Post each item individually
      const responses = await Promise.all(
        items.map(item =>
          axiosInstance.post(API.postCatAdd, {
            restaurantId,
            item,
          }),
        ),
      );

      console.log('All items synced to Petpooja:', responses);

      return {
        success: true,
        itemsSynced: items.length,
        responses: responses.map(r => r.data),
      };
    } catch (error) {
      console.error('Error syncing cart to Petpooja:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data || error.message,
      );
    }
  },
);

const CartApiSlice = createSlice({
  name: 'cartApi',
  initialState: {
    syncing: false,
    fetchingCart: false,
    syncedItems: [],
    cartData: null,
    lastSyncTime: null,
    error: null,
    success: null,
  },

  reducers: {
    clearSyncState: state => {
      state.syncing = false;
      state.error = null;
      state.success = null;
    },
    clearSyncedItems: state => {
      state.syncedItems = [];
      state.lastSyncTime = null;
    },
  },

  extraReducers: builder => {
    // Add single item
    builder
      .addCase(addItemToPetpoojaCart.pending, state => {
        state.syncing = true;
        state.error = null;
      })
      .addCase(addItemToPetpoojaCart.fulfilled, (state, action) => {
        state.syncing = false;
        state.success = true;
        state.syncedItems.push(action.payload.itemId);
        state.lastSyncTime = new Date().toISOString();
        console.log('Item added to Petpooja cart successfully');
      })
      .addCase(addItemToPetpoojaCart.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload;
        state.success = false;
        console.error('Failed to add item to Petpooja cart:', action.payload);
      });

    // Sync entire cart
    builder
      .addCase(syncCartToPetpooja.pending, state => {
        state.syncing = true;
        state.error = null;
      })
      .addCase(syncCartToPetpooja.fulfilled, (state, action) => {
        state.syncing = false;
        state.success = true;
        state.lastSyncTime = new Date().toISOString();
        console.log(`Successfully synced ${action.payload.itemsSynced} items to Petpooja`);
      })
      .addCase(syncCartToPetpooja.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload;
        state.success = false;
        console.error('Failed to sync cart to Petpooja:', action.payload);
      })
      .addCase(fetchPetpoojaCart.pending, state => {
        state.fetchingCart = true;
      })
      .addCase(fetchPetpoojaCart.fulfilled, (state, action) => {
        state.fetchingCart = false;
        state.cartData = action.payload;
      })
      .addCase(fetchPetpoojaCart.rejected, (state, action) => {
        state.fetchingCart = false;
        state.error = action.payload;
      });
  },
});

export const { clearSyncState, clearSyncedItems } = CartApiSlice.actions;
export default CartApiSlice.reducer;
