import React, {useMemo, useRef} from 'react';
import {Animated, View} from 'react-native';

const createViewComponent = displayName => {
  const Component = React.forwardRef(({children, ...props}, ref) => {
    return React.createElement(View, {...props, ref}, children);
  });

  Component.displayName = displayName;
  return Component;
};

export const Screen = createViewComponent('Screen');
export const ScreenContainer = createViewComponent('ScreenContainer');
export const ScreenStack = createViewComponent('ScreenStack');
export const ScreenStackItem = createViewComponent('ScreenStackItem');
export const ScreenFooter = createViewComponent('ScreenFooter');
export const ScreenContentWrapper = createViewComponent('ScreenContentWrapper');
export const FullWindowOverlay = createViewComponent('FullWindowOverlay');
export const SearchBar = createViewComponent('SearchBar');
export const ScreenStackHeaderConfig = createViewComponent(
  'ScreenStackHeaderConfig',
);
export const ScreenStackHeaderSubview = createViewComponent(
  'ScreenStackHeaderSubview',
);
export const ScreenStackHeaderLeftView = createViewComponent(
  'ScreenStackHeaderLeftView',
);
export const ScreenStackHeaderCenterView = createViewComponent(
  'ScreenStackHeaderCenterView',
);
export const ScreenStackHeaderRightView = createViewComponent(
  'ScreenStackHeaderRightView',
);
export const ScreenStackHeaderBackButtonImage = createViewComponent(
  'ScreenStackHeaderBackButtonImage',
);
export const ScreenStackHeaderSearchBarView = createViewComponent(
  'ScreenStackHeaderSearchBarView',
);

export const Tabs = {
  Host: createViewComponent('TabsHost'),
  Screen: createViewComponent('TabsScreen'),
  BottomAccessory: createViewComponent('TabsBottomAccessory'),
  BottomAccessoryContent: createViewComponent('TabsBottomAccessoryContent'),
};

export const compatibilityFlags = {};
export const featureFlags = {
  experiment: {
    iosPreventReattachmentOfDismissedScreens: false,
  },
};

export const enableScreens = () => {};
export const enableFreeze = () => {};
export const screensEnabled = () => false;
export const freezeEnabled = () => false;
export const executeNativeBackPress = () => {};
export const isSearchBarAvailableForCurrentPlatform = () => false;

export const useTransitionProgress = () => {
  const progress = useRef(new Animated.Value(1)).current;
  const closing = useRef(new Animated.Value(0)).current;
  const goingForward = useRef(new Animated.Value(1)).current;

  return useMemo(
    () => ({progress, closing, goingForward}),
    [closing, goingForward, progress],
  );
};

export default {
  Screen,
  ScreenContainer,
  ScreenStack,
  ScreenStackItem,
  ScreenFooter,
  ScreenContentWrapper,
  FullWindowOverlay,
  SearchBar,
  ScreenStackHeaderConfig,
  ScreenStackHeaderSubview,
  ScreenStackHeaderLeftView,
  ScreenStackHeaderCenterView,
  ScreenStackHeaderRightView,
  ScreenStackHeaderBackButtonImage,
  ScreenStackHeaderSearchBarView,
  Tabs,
  compatibilityFlags,
  featureFlags,
  enableScreens,
  enableFreeze,
  screensEnabled,
  freezeEnabled,
  executeNativeBackPress,
  isSearchBarAvailableForCurrentPlatform,
  useTransitionProgress,
};