import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubCategories } from "../redux/slice/subCategoriSlice";
import { fetchAllCategories } from "../redux/slice/GetAllCategorySlice";
import { useRoute } from "@react-navigation/native";
import DashboardScreen from "../components/DashboardScreen";
import CustomHeader from "../components/CustomHeader";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { openCuisineModal } from "../redux/slice/ModalSlice";
import { fetchCategories } from "../redux/slice/CategoriSlice";
import { fetchAllSubCategories } from "../redux/slice/AllSubCategorySlice";
import { shouldIncludeByVegFilter } from "../utils/foodType";

const { width, height } = Dimensions.get("window");

const CuisineTypeSubCat = ({ navigation }) => {
  const route = useRoute();
  const { id, cuisineType } = route.params || {};
  const dispatch = useDispatch();

  // 🔹 Modal States
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [childCategories, setChildCategories] = useState([]);

  // 🔹 Chicken Modal States
  const [chickenModalVisible, setChickenModalVisible] = useState(false);
  const [chickenTypes, setChickenTypes] = useState([]); // ✅ fixed state
  console.log(chickenTypes, "------chickenTypes");


  // 🔹 Side menu states
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(id);
  const [expandedParent, setExpandedParent] = useState(null);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  // 🔹 Redux state
  const isVeg = useSelector((state) => state.foodFilter.isVeg);
  const subcategories = useSelector((state) => state.subCategories);
  const categoriesState = useSelector((state) => state.categoriesAllcat);
  const categoridata = useSelector((state) => state.categories);
  const data = useSelector((state) => state.allSubCategory);
  console.log(data, "-------data");

  const subCategory2 = data || [];
  console.log(subCategory2, "-------subCategory2");

  const subcateData = subcategories?.data || [];
  const categoriesData = categoriesState?.categories?.categories || [];
  const categoridataList = categoridata?.categoridata || [];

  const categoryDisplayOrder = [0, 2, 1];
  const orderedCategories = categoryDisplayOrder
    .map((index) => categoridataList[index])
    .filter(Boolean);

  const filteredCategories = categoriesData.filter((item) => {
    return shouldIncludeByVegFilter(item, isVeg);
  });

  // 🔹 Fetch categories on mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, []);

  // 🔹 Fetch subcategories when selection changes
  useEffect(() => {
    if (selectedCategory) {
      dispatch(
        fetchSubCategories({ page: 1, limit: 100, categoryId: selectedCategory })
      );
    }
    if (cuisineType?._id) {
      const apiType = isVeg === null ? "" : isVeg ? "veg" : "non-veg";
      dispatch(
        fetchAllCategories({
          mainCategory: cuisineType._id,
          type: apiType,
        })
      );
    }
  }, [selectedCategory, cuisineType, isVeg]);

  // 🔹 Animate side menu
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: menuOpen ? width - 240 : width,
      useNativeDriver: false,
      damping: 20,
      stiffness: 120,
    }).start();
  }, [menuOpen]);

  // 🔹 Handle side menu category select
  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setMenuOpen(false);
  };

  const toggleParent = async (parentId) => {
    if (expandedParent === parentId) {
      setExpandedParent(null);
      return;
    }
    setLoadingChildren(true);
    await dispatch(
      fetchAllCategories({
        mainCategory: parentId,
        type: isVeg === null ? "" : isVeg ? "veg" : "non-veg",
      })
    );
    setExpandedParent(parentId);
    setLoadingChildren(false);
  };

  // 🔹 Grid item
  const renderItem = ({ item }) => {
    console.log(item?._id, "-------alllfood");

    const hasSubCategory =
      Array.isArray(item?.subCategories) && item.subCategories.length > 0;

    const onPressHandler = async () => {
      const hasSubCategory =
        Array.isArray(item?.subCategories) && item.subCategories.length > 0;

      try {
        // 1️⃣ Fetch subCategory2 for this clicked category
        const response = await dispatch(
          fetchAllSubCategories({
            subCategoryId: item._id, // clicked category id
            type: isVeg === null ? "" : isVeg ? "veg" : "non-veg",
          })
        );

        const allSubCategory2 = response.payload?.subCategory2 || [];

        // 2️⃣ Filter subCategory2 that matches this category _id
        const filteredSubCategory2 = allSubCategory2.filter(
          (sub) => sub.subCategory?._id === item._id
        );

        if (filteredSubCategory2.length > 0) {
          // 🔹 Only open modal if there is a match
          setChickenTypes(filteredSubCategory2);
          setChickenModalVisible(true);
          return; // exit so normal flow is not executed
        }
      } catch (error) {
        console.log("Error fetching subCategory2:", error);
      }

      // 🔹 Normal subcategory flow
      if (hasSubCategory) {
        setSelectedSubCategory(item);
        setChildCategories(item.subCategories);
        setSubModalVisible(true);
      } else {
        navigation.navigate("TopPicksScreen", {
          categoryId: item._id,
          categoryName: item.name,
          cuisineType,
        });
      }
    };



    return (
      <TouchableOpacity
        style={styles.touchCard}
        onPress={onPressHandler}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#ff9a9e", "#fad0c4"]}
          style={styles.gradientCard}
        >
          <Image source={{ uri: item.image }} style={styles.image} />
          <Text style={styles.name} numberOfLines={1}>
            {item?.name}
          </Text>

        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const onBack = () => {
    dispatch(openCuisineModal(cuisineType));
  };


//   useEffect(() => {
//   const backAction = () => {
//     onBack(); // Call your custom onBack function
//     return true; // Prevent default behavior (don't close the app)
//   };

//   const backHandler = BackHandler.addEventListener(
//     "hardwareBackPress",
//     backAction
//   );

//   return () => backHandler.remove(); // Clean up when component unmounts
// }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <CustomHeader title="Sub-categories" onBackPress={onBack} />

      <DashboardScreen scrollEnabled={false}>
        <FlatList
          data={subcateData}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={3}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
        <View style={{ height: 78 }} />
      </DashboardScreen>

      {/* FAB */}
      {menuOpen && (
        <TouchableWithoutFeedback onPress={() => setMenuOpen(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setMenuOpen(true)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#ff6b6b", "#ff8e72"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="menu" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Side Menu */}
      <Animated.View style={[styles.sideBox, { left: slideAnim }]}>
        <View style={styles.sideHeader}>
          <Text style={styles.sideTitle}>Categories</Text>
          <TouchableOpacity onPress={() => setMenuOpen(false)}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={orderedCategories}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isExpanded = expandedParent === item._id;
            const children = filteredCategories.filter(
              (sub) => sub.mainCategory?._id === item._id
            );

            return (
              <View>
                <TouchableOpacity
                  style={[styles.sideItem, isExpanded && styles.activeSideItem]}
                  onPress={() => toggleParent(item._id)}
                >
                  <LinearGradient
                    colors={
                      isExpanded ? ["#ffe6e6", "#fff0f0"] : ["#fff", "#fff"]
                    }
                    style={styles.sideItemCard}
                  >
                    {item.image && (
                      <Image source={{ uri: item.image }} style={styles.sideIcon} />
                    )}
                    <Text
                      style={[
                        styles.sideItemText,
                        isExpanded && { color: "#ff6b6b", fontWeight: "700" },
                      ]}
                    >
                      {item.name}
                    </Text>

                    <Ionicons
                      name={
                        isExpanded ? "remove-circle-outline" : "add-circle-outline"
                      }
                      size={18}
                      color="#ff6b6b"
                      style={{ marginLeft: "auto" }}
                    />
                  </LinearGradient>
                </TouchableOpacity>

                {isExpanded && (
                  <View>
                    {loadingChildren ? (
                      <ActivityIndicator
                        size="small"
                        color="#ff6b6b"
                        style={{ marginLeft: 20 }}
                      />
                    ) : (
                      children.map((child) => (
                        <TouchableOpacity
                          key={child._id}
                          style={styles.childRow}
                          onPress={() => handleCategorySelect(child._id)}
                          activeOpacity={0.85}
                        >
                          {child.image && (
                            <Image source={{ uri: child.image }} style={styles.sideIcon} />
                          )}
                          <Text style={styles.childText}>
                            {child.name?.replace(/\s*\(.*?veg.*?\)\s*/gi, "").trim()}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      </Animated.View>

      {/* Sub-category Modal */}
      {subModalVisible && (
        <TouchableWithoutFeedback onPress={() => setSubModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>{selectedSubCategory?.name}</Text>
                <FlatList
                  data={childCategories}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        setSubModalVisible(false);
                        navigation.navigate("TopPicksScreen", {
                          categoryId: item._id,
                          categoryName: item.name,
                          cuisineType,
                        });
                      }}
                    >
                      {item.image && (
                        <Image source={{ uri: item.image }} style={styles.modalImage} />
                      )}
                      <Text style={styles.modalText}>{item.name}</Text>
                      {/* <Text style={styles.modalText}>{item._id}</Text> */}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* 🔹 Chicken Type Modal */}
      {chickenModalVisible && (
        <TouchableWithoutFeedback onPress={() => setChickenModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Select Type</Text>
                <FlatList
                  data={chickenTypes}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        setChickenModalVisible(false);
                        navigation.navigate("TopPicksScreen", {
                          subCategory2: item._id,
                          categoryName: item.name,
                          cuisineType,
                        });
                      }}
                    >
                      <Image source={{ uri: item.image }} style={styles.modalImage} />
                      <Text style={styles.modalText}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default CuisineTypeSubCat;

// 🔹 Styles remain unchanged
const styles = StyleSheet.create({
  grid: { paddingHorizontal: 15, paddingTop: 20 },
  touchCard: {
    width: width / 3 - 20,
    height: width / 3 + 40,
    borderRadius: 20,
    marginHorizontal: 5,
    marginBottom: 15,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.15, shadowOffset: { width: 0, height: 6 }, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  gradientCard: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 20, paddingVertical: 12 },
  image: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: "#ff6b6b33", marginBottom: 10, resizeMode: "cover" },
  name: { fontSize: 14, fontWeight: "700", color: "#242121", textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 70 : 60,
    right: 20,
    zIndex: 20,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      android: { elevation: 10 },
      ios: { shadowColor: "#ff6b6b", shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 8 },
    }),
  },
  overlay: { position: "absolute", top: 0, left: 0, width, height, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 10 },
  sideBox: {
    position: "absolute",
    top: Platform.OS === "ios" ? 140 : 150,
    width: 240,
    height: height - 280,
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    paddingTop: 30,
    paddingHorizontal: 15,
    zIndex: 15,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: -2, height: 4 }, shadowRadius: 10 },
      android: { elevation: 12 },
    }),
  },
  sideHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  sideTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  sideItem: { marginBottom: 12 },
  activeSideItem: { borderRadius: 12 },
  sideItemCard: {
    flexDirection: "row",
    alignItems: "center",
    height: width / 7,
    paddingHorizontal: 2,
    paddingVertical: Platform.OS === "ios" ? 6 : 0,
    borderRadius: 18,
    marginBottom: 8,
    backgroundColor: "#fff",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  sideItemText: { fontSize: 16, color: "#333", lineHeight: 22, fontWeight: Platform.OS === "ios" ? "500" : "600", flex: 1 },
  sideIcon: { width: 28, height: 28, resizeMode: "contain", marginRight: 12 },
  childRow: { flexDirection: "row", alignItems: "center", paddingLeft: 36, paddingVertical: 12, borderRadius: 14, backgroundColor: "#fff5f5", marginBottom: 6 },
  childText: { fontSize: 14, color: "#333", fontWeight: "600" },
  modalOverlay: { position: "absolute", top: 0, left: 0, width, height, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end", zIndex: 50 },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: "65%" },
  modalTitle: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  modalItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.6, borderColor: "#eee" },
  modalImage: { width: 44, height: 44, borderRadius: 10, marginRight: 12 },
  modalText: { fontSize: 15, fontWeight: "600", color: "#333" },
});
