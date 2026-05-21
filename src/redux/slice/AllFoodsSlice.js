// AllFoodsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../global_Url/axiosInstance";
import { API } from "../../global_Url/GlobalUrl";

// ------------------- Thunk to fetch foods -------------------
export const fetchAllFoods = createAsyncThunk(
  "foods/fetchAll",
  async (
    { subCategory, subCategory2 = null, type = "", page = 1, limit = 10 },
    { rejectWithValue }
  ) => {
    console.log("Thunk called with:", { subCategory, subCategory2, type, page, limit });

    // Validate IDs before API call
    if (!subCategory && !subCategory2) {
      console.warn("No subCategory or subCategory2 provided. Aborting fetch.");
      return rejectWithValue("No subCategory or subCategory2 provided");
    }

    try {
      const response = await axiosInstance.get(API.getallfoods, {
        params: {
          subCategory,
          subCategory2,
          type,
          page,
          limit,
          restaurantId
        },
      });

      console.log("API response:", response?.data);

      return {
        foods: response.data?.data || [],
        total: response.data?.total || 0,
        page,
        limit,
        restaurantId
      };
    } catch (error) {
      console.error("Error fetching foods:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ------------------- Slice -------------------
const AllFoodsSlice = createSlice({
  name: "allFoods",
  initialState: {
    AllFoodsData: [],
    page: 1,
    hasMore: true,
    loading: false,
    error: null,
  },
  reducers: {
    clearFoods: (state) => {
      state.AllFoodsData = [];
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllFoods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllFoods.fulfilled, (state, action) => {
        state.loading = false;
        state.page = action.payload.page;
        state.hasMore = action.payload.page * action.payload.limit < action.payload.total;

        if (action.payload.page === 1) {
          state.AllFoodsData = action.payload.foods;
        } else {
          state.AllFoodsData.push(...action.payload.foods);
        }
      })
      .addCase(fetchAllFoods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch foods";
      });
  },
});

export const { clearFoods } = AllFoodsSlice.actions;
export default AllFoodsSlice.reducer;
