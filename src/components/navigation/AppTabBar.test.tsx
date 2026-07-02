jest.mock('react-native/Libraries/Utilities/useWindowDimensions');

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props: Record<string, unknown>) =>
    jest.requireActual('react').createElement('Ionicons', props),
}));

jest.mock(
  '@expo/vector-icons/FontAwesome5',
  () => (props: Record<string, unknown>) =>
    jest.requireActual('react').createElement('FontAwesome5', props),
);

import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { AppTabBar } from './AppTabBar';
import { colors } from '../../design/tokens';

const mockUseWindowDimensions = useWindowDimensions as jest.Mock;

const TITLES: Record<string, string> = {
  index: 'Inicio',
  map: 'Radar',
  alerts: 'Reportar',
  pets: 'Mascotas',
  profile: 'Comunidad',
};

function buildProps(
  overrides: Partial<{ routeNames: string[]; index: number }> = {},
): BottomTabBarProps & { navigation: { emit: jest.Mock; navigate: jest.Mock } } {
  const routeNames = overrides.routeNames ?? ['index', 'map', 'alerts', 'pets', 'profile'];
  const routes = routeNames.map((name) => ({ key: name, name }));
  const descriptors = Object.fromEntries(
    routes.map((route) => [route.key, { options: { title: TITLES[route.name] } }]),
  );

  return {
    state: { routes, index: overrides.index ?? 0 },
    descriptors,
    navigation: {
      emit: jest.fn().mockReturnValue({ defaultPrevented: false }),
      navigate: jest.fn(),
    },
  } as unknown as BottomTabBarProps & { navigation: { emit: jest.Mock; navigate: jest.Mock } };
}

describe('AppTabBar', () => {
  beforeEach(() => {
    mockUseWindowDimensions.mockReturnValue({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1,
    });
  });

  it('renders full-bar style on screens narrower than 400pt', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 375, height: 812, scale: 2, fontScale: 1 });
    const { getByTestId } = render(<AppTabBar {...buildProps()} />);

    const flat = StyleSheet.flatten(getByTestId('appTabBar.wrap').props.style);

    expect(flat.marginHorizontal).toBeUndefined();
    expect(flat.borderTopLeftRadius).toBeDefined();
  });

  it('renders floating style on screens 400pt or wider', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 420, height: 900, scale: 2, fontScale: 1 });
    const { getByTestId } = render(<AppTabBar {...buildProps()} />);

    const flat = StyleSheet.flatten(getByTestId('appTabBar.wrap').props.style);

    expect(flat.marginHorizontal).toBe(16);
    expect(flat.borderRadius).toBeDefined();
  });

  it('keeps the alert FAB coral regardless of focus state', () => {
    const focused = render(<AppTabBar {...buildProps({ index: 2 })} />);
    expect(StyleSheet.flatten(focused.getByTestId('tab.alert').props.style).backgroundColor).toBe(
      colors.danger,
    );
    focused.unmount();

    const unfocused = render(<AppTabBar {...buildProps({ index: 0 })} />);
    expect(StyleSheet.flatten(unfocused.getByTestId('tab.alert').props.style).backgroundColor).toBe(
      colors.danger,
    );
  });

  it('renders the alert label in coral', () => {
    const { getByText } = render(<AppTabBar {...buildProps()} />);
    expect(StyleSheet.flatten(getByText('Reportar').props.style).color).toBe(colors.danger);
  });

  it('colors the focused tab with primary and other tabs with textSecondary', () => {
    const { getByText } = render(<AppTabBar {...buildProps({ index: 0 })} />);

    expect(StyleSheet.flatten(getByText('Inicio').props.style).color).toBe(colors.primary);
    expect(StyleSheet.flatten(getByText('Mascotas').props.style).color).toBe(colors.textSecondary);
  });

  it('shows filled/outline icons based on focus state', () => {
    const { UNSAFE_getByProps } = render(<AppTabBar {...buildProps({ index: 0 })} />);

    expect(UNSAFE_getByProps({ name: 'home' })).toBeTruthy();
    expect(UNSAFE_getByProps({ name: 'location-outline' })).toBeTruthy();
    expect(UNSAFE_getByProps({ name: 'person-outline' })).toBeTruthy();
    expect(UNSAFE_getByProps({ name: 'bone' })).toBeTruthy();
  });

  it('does not render nested routes', () => {
    const { queryByTestId } = render(
      <AppTabBar {...buildProps({ routeNames: ['index', 'profile/settings'] })} />,
    );

    expect(queryByTestId('tab.profile/settings')).toBeNull();
  });

  it('does not render routes outside the main tab set', () => {
    const { queryByTestId } = render(
      <AppTabBar {...buildProps({ routeNames: ['index', 'notifications'] })} />,
    );

    expect(queryByTestId('tab.notifications')).toBeNull();
  });

  it('navigates to a pressed, unfocused tab', () => {
    const props = buildProps({ index: 0 });
    const { getByTestId } = render(<AppTabBar {...props} />);

    fireEvent.press(getByTestId('tab.map'));

    expect(props.navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tabPress', target: 'map' }),
    );
    expect(props.navigation.navigate).toHaveBeenCalledWith('map');
  });

  it('does not navigate when the tabPress event is defaultPrevented', () => {
    const props = buildProps({ index: 0 });
    props.navigation.emit.mockReturnValue({ defaultPrevented: true });
    const { getByTestId } = render(<AppTabBar {...props} />);

    fireEvent.press(getByTestId('tab.map'));

    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });

  it('does not navigate when pressing the already-focused tab', () => {
    const props = buildProps({ index: 0 });
    const { getByTestId } = render(<AppTabBar {...props} />);

    fireEvent.press(getByTestId('tab.index'));

    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });
});
