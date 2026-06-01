import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllCategories } from '../redux/slice/GetAllCategorySlice';
import { useNavigation } from '@react-navigation/native';

const HomeCatModal = ({ visible, onClose, cuisineType }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const isVeg = useSelector(state => state.foodFilter.isVeg);
  const categoriesState = useSelector(state => state.categoriesAllcat);

  const categoriesData =
    categoriesState?.categories?.categories ||
    categoriesState?.categories ||
    [];

  // ✅ Check if menu already contains categories
  // Example: Bakery -> Cakes, Pastry
  const isMenuGroup =
    cuisineType && Array.isArray(cuisineType.categories);

  const menuCategories = cuisineType?.categories || [];
  console.log(menuCategories,"------------------menuCategories");
  

  // ✅ Veg / NonVeg Filter
  const categoryFilter = item => {
    if (!item) return false;

    if (item?.isActive === false) return false;

    return true;
  };

  // ✅ Final categories
  const filteredCategories = isMenuGroup
    ? menuCategories
    : categoriesData.filter(categoryFilter);

  // ✅ Fetch Categories
  useEffect(() => {
    if (!visible) return;

    // If already has categories, no API needed
    if (isMenuGroup) return;

    const mainCategoryId =
      cuisineType?.parentId ||
      cuisineType?.rawPayload?.id ||
      cuisineType?.categoryId ||
      cuisineType?.id ||
      cuisineType?._id ||
      cuisineType?.parentCategoryId;

    const apiType = isVeg === null ? '' : isVeg ? 'veg' : 'non-veg';

    if (mainCategoryId) {
      dispatch(
        fetchAllCategories({
          mainCategory: mainCategoryId,
          type: apiType,
        }),
      );
    }
  }, [visible, cuisineType, isVeg]);

  // ✅ CATEGORY CLICK
  // Bakery -> Cakes -> Navigate Screen
  const handleCategoryClick = item => {
    console.log(item,"-------> clicked category");
    
    if (!item) return;

    onClose?.();

    setTimeout(() => {
      const selectedCategoryId =
        item?.categoryId ||
        item?.rawPayload?.categoryid ||
        item?.id ||
        item?._id ||
        item?.parentCategoryId ||
        item?.groupId;

      const selectedCategoryName =
        item?.name ||
        item?.categoryName ||
        item?.title ||
        'Category';

      navigation.navigate('TopPicksScreen', {
        id: selectedCategoryId,
        title: selectedCategoryName,
        categoryName: selectedCategoryName,
        categoryData: {
          ...item,
          name: selectedCategoryName,
          image:
            item?.image ||
            item?.category_image_url ||
            item?.icon ||
            '',
        },
        cuisineType,
      });
    }, 100);
  };

  // ✅ Capitalize
  const capitalizeFirstWord = text => {
    if (!text) return '';

    const str = String(text);

    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // ✅ Clean Name
  const getCleanFoodName = name => {
    if (!name) return '';

    return name
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(
        /\b(veg|non\s?-?\s?veg|nonveg|indian)\b/gi,
        '',
      )
      .replace(/[-_/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={styles.container}>
          {/* HEADER */}
          <LinearGradient
            colors={['#ff3b3b', '#ffc9c9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <SafeAreaView style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {capitalizeFirstWord(
                  cuisineType?.name || 'Cuisine',
                )}
              </Text>
            </SafeAreaView>
          </LinearGradient>

          {/* CATEGORY GRID */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 25,
            }}
          >
            <View style={styles.grid}>
              {/* LOADING */}
              {categoriesState.loading && (
                <ActivityIndicator
                  size="large"
                  color="#ff3b3b"
                  style={{ marginTop: 20 }}
                />
              )}

              {/* EMPTY */}
              {!categoriesState.loading &&
                filteredCategories.length === 0 && (
                  <Text style={styles.emptyText}>
                    No categories found
                  </Text>
                )}

              {/* CATEGORY LIST */}
              {!categoriesState.loading &&
                filteredCategories.map(
                  (item, index) => (
                    <TouchableOpacity
                      key={
                        item?._id ||
                        item?.categoryId ||
                        item?.id ||
                        index
                      }
                      style={styles.card}
                      activeOpacity={0.85}
                      onPress={() =>
                        handleCategoryClick(item)
                      }
                    >
                      <LinearGradient
                        colors={[
                          '#ffecec',
                          '#fff0f0',
                        ]}
                        style={styles.categoryCircle}
                      >
                        <Image
                          source={{
                            uri:
                              item?.image ||
                              item?.category_image_url ||
                              item?.icon ||
                              '',
                          }}
                          style={styles.foodImage}
                        />
                      </LinearGradient>

                      <Text
                        style={styles.name}
                        numberOfLines={1}
                      >
                        {getCleanFoodName(
                          item?.name ||
                            item?.categoryName ||
                            item?.title,
                        )}
                      </Text>
                    </TouchableOpacity>
                    
                  ),
                )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default HomeCatModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  backdrop: {
    flex: 1,
  },

  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '83%',

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },

      android: {
        elevation: 15,
      },
    }),
  },

  headerGradient: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingHorizontal: 22,
    paddingVertical: 14,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',

    paddingHorizontal: 18,
    paddingTop: 16,
  },

  card: {
    width: '48%',
    alignItems: 'center',

    marginBottom: 16,
    borderRadius: 20,

    backgroundColor: '#fff',

    paddingVertical: 14,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 5,
      },

      android: {
        elevation: 4,
      },
    }),
  },

  categoryCircle: {
    width: 90,
    height: 90,

    borderRadius: 45,

    justifyContent: 'center',
    alignItems: 'center',

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },

      android: {
        elevation: 4,
      },
    }),
  },

  foodImage: {
    width: 70,
    height: 70,

    borderRadius: 35,

    borderWidth: 2,
    borderColor: '#fff',
  },

  name: {
    fontSize: 14,
    fontWeight: '600',

    color: '#333',

    marginTop: 8,
    textAlign: 'center',
  },

  emptyText: {
    width: '100%',
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
    fontSize: 15,
  },
});

