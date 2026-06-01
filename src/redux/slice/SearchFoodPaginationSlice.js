import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../global_Url/axiosInstance";
import { API } from "../../global_Url/GlobalUrl";

// ----------------------------------------------
// THUNK
// ----------------------------------------------
export const fetchFoodPagination = createAsyncThunk(
  "foods/fetchFoodPagination",
  async (
    { page = 1, limit = 10, type = "", search = "", restaurantId = "" },
    { rejectWithValue }
  ) => {
    try {
      const params = { page, limit, type, search, restaurantId };

      const response = await axiosInstance.get(API.getfoodpagination, { params });

      const data = response?.data || {};

      const foods = Array.isArray(data.items) ? data.items : [];

      const pagination = data.pagination || {};

      const total = Number(pagination.totalItems || 0);
      const returnedPage = Number(pagination.page || page);
      const returnedLimit = Number(pagination.limit || limit);

      const attributeMap = {};

      (data.attributes || []).forEach((a) => {
        const key = a.attributeId || a._id || "";
        attributeMap[String(key)] = (a.name || "").toLowerCase();
      });

      const resolveFoodType = ({ attrId = "", attrName = "", name = "", raw = {} }) => {
        const normalizedAttrId = String(attrId || "").trim();
        const normalizedAttr = String(attrName || "").toLowerCase();
        const text = `${name || ""} ${raw?.rawPayload?.itemname || ""}`.toLowerCase();

        // Priority 0: known Petpooja/common attribute-id fallback when name map is missing.
        // This runs first only because attrName can be empty in partial payloads.
        const knownAttrIdMap = {
          "1": "veg",
          "2": "non-veg",
          "3": "egg",
          "24": "egg",
        };

        if (!normalizedAttr && knownAttrIdMap[normalizedAttrId]) {
          return knownAttrIdMap[normalizedAttrId];
        }

        // Priority 1: explicit attribute mapping from API
        if (normalizedAttr.includes("non")) return "non-veg";
        if (normalizedAttr.includes("egg")) return "egg";
        if (normalizedAttr.includes("veg")) return "veg";

        // Priority 2: keyword fallback when attributes are missing/inconsistent
        const eggWords = ["egg", "omelette", "omelet"];
        const nonVegWords = [
          "non veg",
          "non-veg",
          "chicken",
          "mutton",
          "lamb",
          "fish",
          "prawn",
          "shrimp",
          "crab",
          "seafood",
          "bacon",
          "ham",
          "pepperoni",
          "sausage",
          "meat",
          "kebab",
          "keema",
        ];
        const vegHints = ["(veg)", " veg ", "veg.", "paneer", "mushroom", "soya", "tofu"];

        if (eggWords.some((word) => text.includes(word))) return "egg";
        if (nonVegWords.some((word) => text.includes(word))) return "non-veg";
        if (vegHints.some((word) => text.includes(word))) return "veg";

        // Safe default for unknown items
        return "veg";
      };

      // ----------------------------------------------
      // NORMALIZER
      // ----------------------------------------------
      const normalizePetpooja = (raw = {}) => {
        const id = raw.itemId || raw._id || raw.item_id || "";

        const image =
          raw.item_image_url ||
          raw.image ||
          raw.rawPayload?.item_image_url ||
          null;

        const name =
          raw.name ||
          raw.itemname ||
          raw.rawPayload?.itemname ||
          "";

        const available =
          raw.active !== false &&
          (raw.in_stock === undefined || raw.in_stock > 0);

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

          priceInfo.halfPrice = Number(half.price || 0);
          priceInfo.fullPrice = Number(full.price || 0);
        } else {
          priceInfo.staticPrice = Number(
            raw.price || raw.rawPayload?.price || 0
          );
        }

        const addOns = Array.isArray(raw.addons)
          ? raw.addons
          : Array.isArray(raw.rawPayload?.addon)
          ? raw.rawPayload.addon
          : [];

        const cuisineType =
          raw.cuisines?.[0] || raw.rawPayload?.cuisine || "";

        const attrId =
          raw.attribute || raw.attributeId || raw.rawPayload?.attributeid || "";

        const attrName = (attributeMap[String(attrId)] || "").toLowerCase();
        const resolvedType = resolveFoodType({ attrId, attrName, name, raw });

        return {
          food: {
            _id: id,
            name,
            image,
            cuisineType,
            type: resolvedType,
            priceInfo,
            addOns,
            description: raw.description || raw.rawPayload?.itemdescription || "",
            available,
            raw,
          },
          _id: id,
          name,
          image,
          cuisineType,
          type: resolvedType,
          priceInfo,
          addOns,
          description: raw.description || "",
          available,
        };
      };

      const normalized = foods.map(normalizePetpooja);

      const hasMore =
        returnedLimit > 0 &&
        returnedPage * returnedLimit < total &&
        normalized.length > 0;

      return {
        foods: normalized,
        parentCategories: data.parentcategories || [],
        groupCategories: data.groupcategories || [],
        categories: data.categories || [],
        addOnGroups: data.addongroups || [],
        addOnItems: data.addonitems || [],
        attributes: data.attributes || [],
        discounts: data.discounts || [],
        taxes: data.taxes || [],
        menu: data.menu || {},
        page: returnedPage,
        hasMore,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ----------------------------------------------
// SLICE
// ----------------------------------------------
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
      state.AllFoodsData = [];
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

        state.parentCategories = action.payload.parentCategories;
        state.groupCategories = action.payload.groupCategories;
        state.categories = action.payload.categories;

        state.addOnGroups = action.payload.addOnGroups;
        state.addOnItems = action.payload.addOnItems;
        state.attributes = action.payload.attributes;
        state.discounts = action.payload.discounts;
        state.taxes = action.payload.taxes;
        state.menu = action.payload.menu;

        if (action.payload.page === 1) {
          state.AllFoodsData = action.payload.foods;
        } else {
          state.AllFoodsData.push(...action.payload.foods);
        }
      })

      .addCase(fetchFoodPagination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch foods";
      });
  },
});

export const { clearFoods } = SearchFoodPaginationSlice.actions;
export default SearchFoodPaginationSlice.reducer;