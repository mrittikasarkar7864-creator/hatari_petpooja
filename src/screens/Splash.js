import { Image, StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';

import Theme from '../assets/theme';
import { useNavigation } from '@react-navigation/native';
import DashboardScreen from '../components/DashboardScreen';

const Splash = () => {
    const navigation = useNavigation();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('LoginScreen');
        }, 200);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <DashboardScreen
            scrollable={false}
            contentStyle={styles.container}
            statusBarColor="#f4ebeaff"
            barStyle="light-content"
        >
        <View> 
            <Image
                source={require('../assets/images/project_logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.subTagline}>Elevate Your Dining Experience</Text>
            <Text style={styles.cuisine}>Simmer</Text>
            </View>
         </DashboardScreen>
    );
};

export default Splash;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.colors.background,
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 10,
    },
    tagline: {
        fontSize: 18,
        color: Theme.colors.error,
        fontWeight: '600',
        marginTop: 10,
        fontStyle: 'italic',
    },
    subTagline: {
        fontSize: 14,
        color: '#333',
        marginTop: 8,
    },
    cuisine: {
        fontSize: 14,
        color: Theme.colors.error,
        marginTop: 8,
        fontWeight: '500',
    },
});
