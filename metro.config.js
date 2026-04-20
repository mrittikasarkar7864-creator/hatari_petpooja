const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
	resolver: {
		resolveRequest: (context, moduleName, platform) => {
			if (moduleName === 'react-native-screens') {
				return {
					filePath: path.resolve(__dirname, 'src/shims/react-native-screens.js'),
					type: 'sourceFile',
				};
			}

			return context.resolveRequest(context, moduleName, platform);
		},
		extraNodeModules: {
			'react-native-screens': path.resolve(
				__dirname,
				'src/shims/react-native-screens.js',
			),
		},
	},
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
