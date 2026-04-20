/**
 * @format
 */

import React from 'react';
import {AppRegistry, SafeAreaView, ScrollView, StyleSheet, Text} from 'react-native';
import {name as appName} from './app.json';

const StartupErrorScreen = ({error}) => (
	<SafeAreaView style={styles.container}>
		<ScrollView contentContainerStyle={styles.content}>
			<Text style={styles.title}>Startup error</Text>
			<Text style={styles.message}>
				The app failed before the root component finished loading.
			</Text>
			<Text style={styles.errorText}>{String(error?.stack || error?.message || error)}</Text>
		</ScrollView>
	</SafeAreaView>
);

const RootComponent = () => {
	try {
		const App = require('./App').default;
		return <App />;
	} catch (error) {
		console.error('Failed to load root App component', error);
		return <StartupErrorScreen error={error} />;
	}
};

AppRegistry.registerComponent(appName, () => RootComponent);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#101217',
	},
	content: {
		padding: 20,
		gap: 12,
	},
	title: {
		color: '#ff6b6b',
		fontSize: 24,
		fontWeight: '700',
	},
	message: {
		color: '#f5f5f5',
		fontSize: 16,
		lineHeight: 22,
	},
	errorText: {
		color: '#f5f5f5',
		fontSize: 14,
		lineHeight: 20,
	},
});
