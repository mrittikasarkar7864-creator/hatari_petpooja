import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ToastAndroid,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import LinearGradient from 'react-native-linear-gradient';
import { sendOtp, verifyOtp, setAuth } from '../../redux/slice/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CELL_COUNT = 6;
const { width } = Dimensions.get('window');
const CELL_WIDTH = Math.min(60, (width - 80) / 8);

const OtpScreen = ({ route, navigation }) => {
  const phone = route?.params?.phone;
  const dispatch = useDispatch();
  const { token, user } = useSelector(state => state.auth);

  const [value, setValue] = useState('');
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Navigate if already logged in
  useEffect(() => {
    if (token && user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'ExperienceScreen', params: { token, user } }],
      });
    }
  }, [token, user]);

  // Store userId
  useEffect(() => {
    const storeUserId = async () => {
      if (user?._id) {
        try {
          await AsyncStorage.setItem('userId', user._id);
        } catch (error) {}
      }
    };
    storeUserId();
  }, [user]);

  const handleVerify = () => {
    if (value.length !== CELL_COUNT) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
      return;
    }

    dispatch(verifyOtp({ phone, value })).then(async res => {
      if (res.meta.requestStatus === 'fulfilled') {
        const { token, user } = res.payload;
        console.log(token, "------------ TOKEN");
        

        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        dispatch(setAuth({ token, user }));

        navigation.reset({
          index: 0,
          routes: [{ name: 'ExperienceScreen' }],
        });
      } else {
        const errMsg = res.payload?.message || 'OTP verification failed';
        Platform.OS === 'android'
          ? ToastAndroid.show(errMsg, ToastAndroid.LONG)
          : Alert.alert('Error', errMsg);
      }
    });
  };

  const handleResend = () => {
    dispatch(sendOtp(phone)).then(res => {
      if (res.meta.requestStatus === 'fulfilled') {
        Platform.OS === 'android'
          ? ToastAndroid.show('OTP Resent ✅', ToastAndroid.SHORT)
          : Alert.alert('Success', 'OTP Resent ✅');
      } else {
        const errMsg = res.payload?.message || 'Failed to resend OTP.';
        Platform.OS === 'android'
          ? ToastAndroid.show(errMsg, ToastAndroid.LONG)
          : Alert.alert('Error', errMsg);
      }
    });
  };

  const isButtonActive = value.length === CELL_COUNT;

  // Animate button
  useEffect(() => {
    if (isButtonActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScale, {
            toValue: 1.05,
            duration: 700,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(buttonScale, {
            toValue: 1,
            duration: 700,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      buttonScale.stopAnimation();
      buttonScale.setValue(1);
    }
  }, [isButtonActive]);

  return (
    <ImageBackground
      source={require('../../assets/images/Cover/coverpost.jpg')}
      style={styles.bgImage}
      resizeMode="cover">
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled">
          <Image
            source={require('../../assets/images/Cover/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.tagline}>Chinese • Indian • Tandoor</Text>

          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}>
            <Text style={styles.heading}>Enter the OTP</Text>
            <Text style={styles.subText}>Sent to +91 {phone}</Text>

            {/* OTP Input */}
            <CodeField
              ref={ref}
              {...props}
              value={value}
              onChangeText={setValue}
              cellCount={CELL_COUNT}
              rootStyle={styles.codeFieldRoot}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              renderCell={({ index, symbol, isFocused }) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.cell,
                    {
                      borderColor: isFocused ? '#FF3B30' : '#E5E5E5',
                      transform: [{ scale: isFocused ? 1.1 : 1 }],
                    },
                  ]}
                  onLayout={getCellOnLayoutHandler(index)}>
                  <Text style={styles.cellText}>
                    {symbol || (isFocused ? <Cursor /> : null)}
                  </Text>
                </Animated.View>
              )}
            />

            {/* Verify Button */}
            <Animated.View
              style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
              <TouchableOpacity
                onPress={isButtonActive ? handleVerify : null}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={
                    isButtonActive ? ['#FF3B30', '#FF6F61'] : ['#ccc', '#bbb']
                  }
                  style={styles.gradientBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}>
                  <Text style={styles.btnText}>Verify OTP</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.resendText}>
              Didn’t receive code?{' '}
              <Text style={styles.resendLink} onPress={handleResend}>
                Resend
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    backgroundColor: 'rgba(249, 238, 238, 0.15)',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.55,
    height: width * 0.55,
    resizeMode: 'contain',
    marginBottom: 15,
  },
  tagline: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 40,
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  subText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 25,
  },
  codeFieldRoot: {
    marginBottom: 25,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cell: {
    width: CELL_WIDTH,
    height: CELL_WIDTH * 1.1,
    borderWidth: 1.5,
    borderRadius: 10,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 238, 238, 0.15)',
    elevation: 2,
  },
  cellText: {
    fontSize: CELL_WIDTH * 0.45,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  gradientBtn: {
    height: Platform.OS === 'ios' ? 55 : 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: 4,
    marginTop: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 15,
    textAlign: 'center',
  },
  resendLink: {
    color: '#FF3B30',
    fontWeight: '700',
  },
});
