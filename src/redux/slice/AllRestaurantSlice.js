import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {API} from '../../global_Url/GlobalUrl';
import axiosInstance from '../../global_Url/axiosInstance';

// Async thunk to fetch all restaurants
export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async (_, {rejectWithValue}) => {
    try {
      const response = await axiosInstance.get(API.allRestaurant, {
        params: {
          mode: 'all',
        },
      });
      console.log(response, '--------------res');

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const AllRestaurantSlice = createSlice({
  name: 'restaurants',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearRestaurants: state => {
      state.list = [];
    },
    resetBranchInfo: state => {
      state.list = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchRestaurants.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.restaurants || [];
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {clearRestaurants,resetBranchInfo} = AllRestaurantSlice.actions;
export default AllRestaurantSlice.reducer;
