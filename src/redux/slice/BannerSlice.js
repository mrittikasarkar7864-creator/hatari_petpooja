// redux/slice/bannerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API, petpooja_url } from "../../global_Url/GlobalUrl";
import axiosInstance from "../../global_Url/axiosInstance";


// Async thunk to fetch banners from API
export const fetchBanners = createAsyncThunk(
  "banners/fetchBanners",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API.getbannerHome);
      console.log(response, "----------response banner");

      const data = response?.data;
      console.log(data, "----------data banner");
      
      let banners = [];

      if (Array.isArray(data)) {
        banners = data;
      } else if (Array.isArray(data?.data)) {
        banners = data.data;
      } else if (Array.isArray(data?.banners)) {
        banners = data.banners;
      } else if (Array.isArray(data?.bannerList)) {
        banners = data.bannerList;
      } else if (data) {
        banners = [data];
      }

      const baseImageUrl = petpooja_url.replace(/\/api\/?$/i, '');
      const normalizedBanners = banners.map((banner) => {
        const imageUrl = banner?.imageUrl || banner?.image || banner?.bannerImage || '';
        const fullImageUrl = imageUrl
          ? imageUrl.startsWith('http')
            ? imageUrl
            : `${baseImageUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
          : '';

        return {
          ...banner,
          fullImageUrl,
        };
      });

      return normalizedBanners;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const bannerSlice = createSlice({
  name: "banners",
  initialState: {
    bannerlist: [],       // array of banners
    loading: false,
    error: null,
  },
  reducers: {
    clearBanners: (state) => {
      state.bannerlist = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false;
        state.bannerlist = action.payload || [];
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch banners";
      });
  },
});

export const { clearBanners } = bannerSlice.actions;
export default bannerSlice.reducer;
