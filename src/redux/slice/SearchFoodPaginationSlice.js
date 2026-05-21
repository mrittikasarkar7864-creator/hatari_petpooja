// src/redux/slice/SearchFoodPaginationSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../global_Url/axiosInstance";
import { API } from "../../global_Url/GlobalUrl";


export const fetchFoodPagination = createAsyncThunk(
  "foods/fetchFoodPagination",
  async (
    { page = 1, limit = 10, type = "", search = "", restaurantId = "" },
    { rejectWithValue }
  ) => {
    try {
      const params = { page, limit, type, search, restaurantId };
      console.log('fetchFoodPagination -> params:', params);

      const response = await axiosInstance.get(API.getfoodpagination, { params });

      console.log('fetchFoodPagination -> status:', response.status);
      const foods = response?.data?.items || [];
      const parentCategories = response?.data?.parentcategories || [];
      const groupCategories = response?.data?.groupcategories || [];
      const categories = response?.data?.categories || [];
      const addOnGroups = response?.data?.addongroups || [];
      const addOnItems = response?.data?.addonitems || [];
      const attributes = response?.data?.attributes || [];
      const discounts = response?.data?.discounts || [];
      const taxes = response?.data?.taxes || [];
      const menu = response?.data?.menu || {};

      console.log('fetchFoodPagination -> returned items count:', (foods && foods.length) || 0);

      // Build a quick lookup for attributeId -> attribute name (petpooja)
      const attributeMap = {};
      if (Array.isArray(attributes)) {
        attributes.forEach((a) => {
          const key = a.attributeId || a.attributeid || a._id || '';
          attributeMap[String(key)] = (a.name || (a.rawPayload && a.rawPayload.attribute) || '').toLowerCase();
        });
      }

      // Petpooja items come in a round format (itemId, price, variations, addons)
      // Normalize each item to the shape expected by MenuScreen/HomeScreen
      const normalizePetpooja = (it) => {
        const raw = it || {};

        // prefer `itemId` or `_id` as stable id
        const id = raw.itemId || raw._id || raw.item_id || '';

        // image
        const image = raw.item_image_url || raw.rawPayload?.item_image_url || raw.image || null;

        // name
        const name = raw.name || raw.itemname || raw.rawPayload?.itemname || '';

        // availability
        const available = raw.active !== false && (raw.in_stock === undefined || raw.in_stock > 0);

        // priceInfo: handle `variations` or single `price`
        const priceInfo = {
          hasVariation: false,
          halfPrice: 0,
          fullPrice: 0,
          staticPrice: 0,
        };

        if (Array.isArray(raw.variations) && raw.variations.length > 0) {
          priceInfo.hasVariation = true;
          const half = raw.variations[0] || {};
          const full = raw.variations[1] || raw.variations[0] || {};
          priceInfo.halfPrice = Number(half.price || half.price || 0);
          priceInfo.fullPrice = Number(full.price || full.price || 0);
        } else if (raw.price !== undefined && raw.price !== null) {
          priceInfo.staticPrice = Number(raw.price || 0);
        } else if (raw.rawPayload && raw.rawPayload.price) {
          priceInfo.staticPrice = Number(raw.rawPayload.price || 0);
        }

        // addOns
        const addOns = Array.isArray(raw.addons) && raw.addons.length > 0
          ? raw.addons
          : Array.isArray(raw.rawPayload?.addon) && raw.rawPayload.addon.length > 0
          ? raw.rawPayload.addon
          : [];

        // cuisine/category
        const cuisineType = raw.cuisines && raw.cuisines.length > 0 ? raw.cuisines[0] : raw.rawPayload?.cuisine || '';

        // Resolve attribute id/name to canonical type (veg / non-veg / egg / etc.)
        const attrId = raw.attribute || raw.attributeId || raw.attributeid || raw.rawPayload?.attributeid || '';
        const attrName = (attributeMap[String(attrId)] || raw.rawPayload?.attribute || raw.attributeName || '').toLowerCase();
        let resolvedType = 'veg';
        if (attrName) {
          if (attrName.includes('non')) resolvedType = 'non-veg';
          else if (attrName.includes('egg')) resolvedType = 'egg';
          else if (attrName.includes('veg')) resolvedType = 'veg';
          else resolvedType = attrName;
        } else {
          // fallback to legacy numeric check
          resolvedType = raw.attribute === '2' || raw.attribute === 2 ? 'non-veg' : 'veg';
        }

        return {
          // keep wrapper for components that expect `item.food`
          food: {
            _id: id,
            name,
            image,
            cuisineType,
            type: resolvedType,
            priceInfo,
            addOns,
            description: raw.rawPayload?.itemdescription || raw.description || '',
            available,
            raw: raw,
          },
          // flattened top-level fields also useful elsewhere
          _id: id,
          name,
          image,
          cuisineType,
          type: resolvedType,
          priceInfo,
          addOns,
          description: raw.rawPayload?.itemdescription || raw.description || '',
          available,
          raw,
        };
      };

      const pagination = response?.data?.pagination || {};

      const total = Number(pagination.totalItems || 0);
      const returnedPage = Number(pagination.page || page);
      const returnedLimit = Number(pagination.limit || limit);

      console.log("TOTAL:", total);
      console.log("PAGE:", returnedPage);

      const normalized = foods.map(normalizePetpooja);

      return {
        foods: normalized,
        parentCategories,
        groupCategories,
        categories,
        addOnGroups,
        addOnItems,
        attributes,
        discounts,
        taxes,
        menu,
        page: returnedPage,
        hasMore:
          normalized.length > 0 &&
          returnedPage * returnedLimit < total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);


const SearchFoodPaginationSlice = createSlice({
  name: "FoodPagination",
  initialState: {
    AllFoodsData: [],
    parentCategories: [],
    groupCategories: [],
    categories: [],
    addOnGroups: [],
    addOnItems: [],
    attributes: [],
    discounts: [],
    taxes: [],
    menu: {},
    page: 1,
    hasMore: true,
    loading: false,
    error: null,
  },

  reducers: {
    clearFoods: (state) => {
      // 🚀 FIX 2 — Reset everything on new search/filter
      state.AllFoodsData = [];
      state.parentCategories = [];
      state.groupCategories = [];
      state.categories = [];
      state.addOnGroups = [];
      state.addOnItems = [];
      state.attributes = [];
      state.discounts = [];
      state.taxes = [];
      state.menu = {};
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchFoodPagination.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchFoodPagination.fulfilled, (state, action) => {
        state.loading = false;
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
        state.parentCategories = action.payload.parentCategories || [];
        state.groupCategories = action.payload.groupCategories || [];
        state.categories = action.payload.categories || [];
        state.addOnGroups = action.payload.addOnGroups || [];
        state.addOnItems = action.payload.addOnItems || [];
        state.attributes = action.payload.attributes || [];
        state.discounts = action.payload.discounts || [];
        state.taxes = action.payload.taxes || [];
        state.menu = action.payload.menu || {};

        // 🚀 FIX 3 — Replace list when page === 1
        if (action.payload.page === 1) {
          state.AllFoodsData = action.payload.foods; // fresh data
        } else {
          state.AllFoodsData = [
            ...state.AllFoodsData,
            ...action.payload.foods,
          ];
        }
      })

      .addCase(fetchFoodPagination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch foods";
      });
  },
});

// ----------------------------------------------
// Exports
// ----------------------------------------------

export const { clearFoods } = SearchFoodPaginationSlice.actions;
export default SearchFoodPaginationSlice.reducer;
