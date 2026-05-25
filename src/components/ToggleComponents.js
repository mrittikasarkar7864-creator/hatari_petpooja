import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFilter } from '../redux/slice/toggleSlice';


const VegNonVegToggle = () => {
  const dispatch = useDispatch();
  const isVeg = useSelector(state => state.foodFilter.isVeg);
  const resolvedIsVeg = isVeg === null ? true : isVeg;
  const anim = useRef(new Animated.Value(resolvedIsVeg ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: resolvedIsVeg ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [resolvedIsVeg]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#4CAF50', '#E53935'],
  });

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: resolvedIsVeg ? '#4CAF50' : '#999' }]}>Veg</Text>

      <TouchableOpacity onPress={() => dispatch(toggleFilter())} activeOpacity={0.8}>
        <Animated.View style={[styles.toggle, { backgroundColor: bgColor }]}>
          <Animated.View
            style={[styles.thumb, { transform: [{ translateX }] }]}
          />
        </Animated.View>
      </TouchableOpacity>

      <Text style={[styles.label, { color: !resolvedIsVeg ? '#E53935' : '#999' }]}>Non-Veg</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
     marginVertical: 10,},
  label: { fontSize: 14, fontWeight: '600', marginHorizontal: 6 },
  toggle: { width: 50, height: 26, borderRadius: 15, padding: 3, justifyContent: 'center' },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
});

export default VegNonVegToggle;
