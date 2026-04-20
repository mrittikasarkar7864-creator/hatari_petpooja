import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import axiosInstance from '../../global_Url/axiosInstance';
import {API} from '../../global_Url/GlobalUrl';

export const fetchCategoryFoods = createAsyncThunk(
  'catItems/fetch',
  async (
    {
      categoryId,
      categoryIngredients,
      restaurantId,
      cuisineType,
      page = 1,
      limit = 100,
      search = '',
      isTrending = true,
    },
    {rejectWithValue},
  ) => {
    console.log('FETCHING CATEGORY FOODS - Params:', {
      categoryId,
      categoryIngredients,
      restaurantId,
      cuisineType,
      page,
      limit,
      search,
      isTrending,
    });

    try {
      const params = new URLSearchParams();

      if (categoryId) params.append('categoryId', categoryId);
      if (categoryIngredients)
        params.append('ingredients', categoryIngredients);
      if (restaurantId) params.append('restaurantId', restaurantId);
      if (cuisineType) params.append('cuisineType', cuisineType); // 👈 use correct key
      if (search) params.append('search', search);
      params.append('page', page);
      params.append('limit', limit);
      params.append('isTrending', isTrending);
      const url = `${API.getCatItemfoods}?${params.toString()}`;
      console.log('🔍 Final URL:', url);

      const response = await axiosInstance.get(url);
      console.log('cattem-------222 Category Foods Response:', response.data);

      // extract actual data array safely
      const items = response.data?.data || [];
      console.log('🍽️ Fetched Items:', items);

      return {page, data: items};
    } catch (error) {
      console.log(
        '❌ Fetch Category Foods Error:',
        error.response || error.message,
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const catItemSlice = createSlice({
  name: 'catItems',
  initialState: {
    data: [],
    loading: false,
    error: null,
    page: 1,
    hasMore: true,
  },
  reducers: {
    clearCategoryFoods: state => {
      state.data = [];
      state.page = 1;
      state.hasMore = true;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCategoryFoods.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryFoods.fulfilled, (state, action) => {
        state.loading = false;
        const {page, data} = action.payload;
        if (page === 1) {
          state.data = data;
        } else {
          state.data = [...state.data, ...data];
        }
        state.hasMore = data.length > 0;
        state.page = page;
      })
      .addCase(fetchCategoryFoods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch category items';
      });
  },
});

export const {clearCategoryFoods} = catItemSlice.actions;
export default catItemSlice.reducer;
