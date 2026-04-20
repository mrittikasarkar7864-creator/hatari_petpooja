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
  console.log(categoriesState,"------------categoriesState");
  
  const categoriesData = categoriesState?.categories?.categories || [];
  console.log(categoriesData,"---------categoriesData");
  


  // Fetch categories when modal opens
  useEffect(() => {
    if (visible && cuisineType?._id) {
      dispatch(
        fetchAllCategories({
          mainCategory: cuisineType._id,
          type: isVeg ? 'veg' : 'non-veg',
        })
      );
    }
  }, [visible, cuisineType, isVeg]);

  // Filter categories based on veg/non-veg and isActive
  const filteredCategories = categoriesData.filter(item => {
    if (item?.isActive === false) return false;
    if (!item?.type) return !isVeg;
    const types = Array.isArray(item.type)
      ? item.type.map(t => t.toLowerCase())
      : [String(item.type).toLowerCase()];
    return isVeg ? types.includes('veg') : !types.includes('veg');
  });

  console.log(filteredCategories,"---------filteredCategories");
  

  // Handle category click
  // const handleCategoryClick = item => {
  //   navigation.navigate('CuisineTypeSubCat', { id: item?._id, cuisineType });
  //   onClose?.();
  // };

const handleCategoryClick = (item) => {
  onClose?.(); // close modal first
  setTimeout(() => {
    navigation.navigate('CuisineTypeSubCat', {
      id: item?._id,
      cuisineType: cuisineType,
      reopenModal: true, // <-- flag to reopen modal
    });
  }, 50);
};

const onCuisinePress = (cuisine) => {
  eventBus.emit('OPEN_CUISINE_MODAL', cuisine);
  navigation.navigate('Home');
};

  // Capitalize first word
  const capitalizeFirstWord = text => {
    if (!text) return '';
    const str = String(text);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Clean food name
  const getCleanFoodName = name => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/\b(veg|non\s?-?\s?veg|nonveg|indian)\b/gi, '')
      .replace(/[-_/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
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
                {capitalizeFirstWord(cuisineType?.name || 'Cuisine')}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </LinearGradient>

          {/* CATEGORY GRID */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 25 }}
          >
            <View style={styles.grid}>
              {/* Loading State */}
              {categoriesState.loading && (
                <ActivityIndicator size="large" color="#ff3b3b" style={{ marginTop: 20 }} />
              )}

              {/* Empty State */}
              {!categoriesState.loading && filteredCategories.length === 0 && (
                <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
                  No categories found
                </Text>
              )}

              {/* Categories */}
              {!categoriesState.loading &&
                filteredCategories.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={() => handleCategoryClick(item)}
                  >
                    <LinearGradient
                      colors={['#ffecec', '#fff0f0']}
                      style={styles.categoryCircle}
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={styles.foodImage}
                      />
                    </LinearGradient>
                    <Text style={styles.name} numberOfLines={1}>
                      {getCleanFoodName(item?.name)}
                    </Text>
                  </TouchableOpacity>
                ))}
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
  backdrop: { flex: 1 },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '83%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 15 },
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
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 24, color: '#fff', fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  card: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
      },
      android: { elevation: 4 },
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
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
});
