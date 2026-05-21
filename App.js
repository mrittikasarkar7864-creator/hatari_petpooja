// App.js
import React, { useEffect, useRef } from 'react';
import { Alert, Linking, StyleSheet, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import StackNav from './src/navigation/StackNav';
import { Provider } from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import store, {persistor} from './src/redux/store/store';
import VersionCheck from 'react-native-version-check';

const App = () => {
  const hasCheckedForUpdate = useRef(false);
{/* <text>ghgyhg</text> */}
  useEffect(() => {
    if (hasCheckedForUpdate.current) {
      return;
    }

    hasCheckedForUpdate.current = true;

    const checkForAppUpdate = async () => {
      try {
        const update = await VersionCheck.needUpdate({
          provider: Platform.OS === 'ios' ? 'appStore' : 'playStore',
          ignoreErrors: true,
        });

        if (!update?.isNeeded || !update.storeUrl) {
          return;
        }

        Alert.alert(
          'Update available',
          `A new version (${update.latestVersion}) of Hatari is available. Please install it to get the latest features and improvements.`,
          [
            {
              text: 'Later',
              style: 'cancel',
            },
            {
              text: 'Update now',
              onPress: async () => {
                try {
                  await Linking.openURL(update.storeUrl);
                } catch (error) {
                  console.warn('Unable to open store URL', error);
                }
              },
            },
          ],
          { cancelable: true }
        );
      } catch (error) {
        console.warn('App update check failed', error);
      }
    };

    checkForAppUpdate();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer>
          <StackNav />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
};

export default App;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
