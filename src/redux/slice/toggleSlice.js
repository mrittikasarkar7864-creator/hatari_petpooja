import { createSlice } from '@reduxjs/toolkit';

const foodFilterSlice = createSlice({
  name: 'foodFilter',
  initialState: { isVeg: null }, // null = all, false = non-veg, true = veg
  reducers: {
    toggleFilter: (state) => {
      if (state.isVeg === null) {
        state.isVeg = true;
      } else {
        state.isVeg = !state.isVeg;
      }
    },
    setFilter: (state, action) => {
      if (action.payload === null || action.payload === undefined) {
        state.isVeg = null;
      } else {
        state.isVeg = !!action.payload;
      }
    },
  },
});

export const { toggleFilter, setFilter } = foodFilterSlice.actions;
export default foodFilterSlice.reducer;
