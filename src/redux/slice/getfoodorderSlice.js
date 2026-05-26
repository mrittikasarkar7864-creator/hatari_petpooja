import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../global_Url/axiosInstance';
import { API } from '../../global_Url/GlobalUrl';

export const fetchFoodOrders = createAsyncThunk(
  'foodOrder/fetchFoodOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API.getfoodOrder);
      console.log(response,"-------------------------------foodOrders");
      
      // ✅ Return only the array
      return response.data?.orders || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

const initialState = {
  orders: [],
  loading: false,
  error: null,
};

const getFoodOrderSlice = createSlice({
  name: 'foodOrder',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchFoodOrders.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFoodOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchFoodOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default getFoodOrderSlice.reducer;
