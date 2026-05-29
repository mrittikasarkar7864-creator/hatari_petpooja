// redux/slice/profileSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../global_Url/axiosInstance";
import { API } from "../../global_Url/GlobalUrl";

export const fetchUserProfile = createAsyncThunk(
  "profile/fetchUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API.profile);
      console.log("----------------------responsr", response);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Profile Fetch Failed");
    }
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    userData: null,
    loading: false,
    error: null,
  },

  reducers: {
    clearProfile(state) {
      state.userData = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.userData =
          action.payload?.user || action.payload?.profile || action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.userData = null;
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
