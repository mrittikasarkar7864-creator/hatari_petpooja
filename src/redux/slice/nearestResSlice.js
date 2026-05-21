import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API } from "../../global_Url/GlobalUrl";
import axiosInstance from "../../global_Url/axiosInstance";

/* ================= FETCH NEAREST RESTAURANTS ================= */

export const fetchNearestRestaurants = createAsyncThunk(
  "restaurants/fetchNearest",

  async ({ lat, lng }, { rejectWithValue }) => {
    console.log("FETCHING NEAREST RESTAURANTS =>", lat, lng);
    
    try {
      console.log("FETCHING RESTAURANTS =>", lat, lng);

      const response = await axiosInstance.get(
        API.nearestRasturance,
        {
          params: {
            lat,
            lng,
            mode: "nearest",
          },
        }
      );

      console.log(
        "NEAREST RESTAURANTS RESPONSE =>",
        response
      );

      // API response array
      const restaurants =
        response?.data?.restaurants || [];

      // sort nearest first
      const sortedRestaurants = [...restaurants].sort(
        (a, b) =>
          Number(a?.distance_km || 0) -
          Number(b?.distance_km || 0)
      );

      return sortedRestaurants;
    } catch (error) {
      console.log(
        "FETCH RESTAURANTS ERROR =>",
        error?.response?.data || error.message
      );

      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong"
      );
    }
  }
);

/* ================= SLICE ================= */

const nearestResSlice = createSlice({
  name: "nearestRestaurants",

  initialState: {
    data: [],
    loading: false,
    error: null,
  },

  reducers: {
    clearRestaurants: state => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },

  extraReducers: builder => {
    builder

      /* ===== PENDING ===== */

      .addCase(
        fetchNearestRestaurants.pending,
        state => {
          state.loading = true;
          state.error = null;
        }
      )

      /* ===== SUCCESS ===== */

      .addCase(
        fetchNearestRestaurants.fulfilled,
        (state, action) => {
          state.loading = false;
          state.data = action.payload || [];
        }
      )

      /* ===== FAILED ===== */

      .addCase(
        fetchNearestRestaurants.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to fetch restaurants";
        }
      );
  },
});

/* ================= EXPORTS ================= */

export const { clearRestaurants } =
  nearestResSlice.actions;

export default nearestResSlice.reducer;