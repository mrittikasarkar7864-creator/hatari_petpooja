import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import axiosInstance from "../../global_Url/axiosInstance";
import { API } from "../../global_Url/GlobalUrl";


// ✅ Async thunk to POST address
export const addAddress = createAsyncThunk(
  "address/addAddress",
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API.addAddressPost, addressData);
      console.log(response,"----------------------responseaddress");
      
      return response.data; // Expect { message, success, newAddress }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to add address" }
      );
    }
  }
);


// ✅ Initial State
const initialState = {
  savedAddress: null,
  loading: false,
  success: false,
  error: null,
  data: null,
};

// ✅ Slice
const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    saveAddress: (state, action) => {
      state.savedAddress = action.payload;
    },
    clearAddress: (state) => {
      state.savedAddress = null;
    },
    resetAddressState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addAddress.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
        // API returns `address` not `newAddress`
        state.savedAddress = action.payload.address || action.payload.newAddress || null;
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to add address";
      });
  },
});

// ✅ Export actions and reducer
export const { saveAddress, clearAddress, resetAddressState } =
  addressSlice.actions;

export default addressSlice.reducer;
