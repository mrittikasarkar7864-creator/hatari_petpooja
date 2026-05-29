import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Dimensions,
  ScrollView,
  Keyboard,
  Alert,
  ToastAndroid,
  ImageBackground,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { sendOtp } from '../../redux/slice/authSlice';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.auth);

  const [phone, setPhone] = useState('');
  console.log(phone,"---------phone");
  

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        bounciness: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePhoneChange = text => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhone(cleaned);
    if (cleaned.length === 10) Keyboard.dismiss();
  };

  const handleSendOtp = () => {
    if (phone.length !== 10) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid 10-digit mobile number.',
      );
      return;
    }

    dispatch(sendOtp(phone)).then(res => {
      console.log(res,"----------res");
      
      if (res.meta.requestStatus === 'fulfilled') {
        Platform.OS === 'android'
          ? ToastAndroid.show('OTP Sent Successfully ✔', ToastAndroid.SHORT)
          : Alert.alert('Success', 'OTP sent successfully');

        navigation.navigate('OtpScreen', { phone });
      } else {
        const msg = res.payload?.message || 'Failed to send OTP. Try again!';
        Platform.OS === 'android'
          ? ToastAndroid.show(msg, ToastAndroid.LONG)
          : Alert.alert('Error', msg);
      }
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/Cover/coverpost.jpg')}
        style={styles.bgImage}
        resizeMode="cover">
        <View style={styles.overlay} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled">
            {/* Logo */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                alignItems: 'center',
                marginBottom: 20,
              }}>
              <Image
                source={require('../../assets/images/Cover/logo.png')}
                style={styles.logo}
              />
              {/* <Text style={styles.tagline}>Simmer</Text> */}
            </Animated.View>

            {/* Login Card */}
            <Animated.View
              style={[
                styles.card,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}>
              <Text style={styles.title}>Login to Continue</Text>

              <View style={styles.inputRow}>
                <View style={styles.countryBox}>
                  <Text style={styles.countryText}>+91</Text>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                  value={phone}
                  maxLength={10}
                  onChangeText={handlePhoneChange}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={phone.length !== 10 || loading}
                onPress={handleSendOtp}>
                <View
                  style={[
                    styles.loginBtn,
                    { backgroundColor: phone.length === 10 ? '#ff3b30' : '#888' },
                  ]}>
                  <Text style={styles.loginText}>
                    {loading ? 'Sending...' : 'Get OTP'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* <Text style={styles.footerText}>
                By continuing, you agree to our{' '}
                <TouchableOpacity>
            <Text style={styles.highlight}>Terms & Conditions</Text>
            
                </TouchableOpacity>
    
              </Text> */}


              <View >
                <Text style={styles.footerText}>
                  By continuing, you agree to our{' '}
                  <TouchableOpacity onPress={() => navigation.navigate('TermsConditionsScreen')}>
                    <Text style={styles.highlight}>Terms & Conditions <Text style={{color:"white"}}>and </Text></Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicyScreen')}>
                    <Text style={styles.highlight}>Privacy Policy</Text>
                  </TouchableOpacity>
                  .
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  logo: { width: width * 0.55, height: width * 0.55, resizeMode: 'contain', marginBottom: 10 },
  tagline: { color: '#fff', fontSize: 15, fontWeight: '600', opacity: 0.9, letterSpacing: 1 },
  card: { backgroundColor: 'rgba(249, 238, 238, 0.15)', padding: 20, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, marginBottom: 20 },
  countryBox: { paddingVertical: 8, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, marginRight: 10 },
  countryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  loginBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  loginText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footerText: { color: '#eee', fontSize: 12, textAlign: 'center', marginTop: 18 },
  highlight: { color: '#ff3b30', fontWeight: '800' },
});
