jest.mock('react-native/Libraries/Utilities/useWindowDimensions');

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props: Record<string, unknown>) =>
    jest.requireActual('react').createElement('Ionicons', props),
}));

jest.mock('../icons/PlakaIcon', () => ({
  PlakaIcon: (props: Record<string, unknown>) =>
    jest.requireActual('react').createElement('PlakaIcon', props),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { AppTabBar } from './AppTabBar';
import { colors } from '../../design/tokens';
import { useAuthStore } from '../../stores/authStore';

const mockUseWindowDimensions = useWindowDimensions as jest.Mock;

const TITLES: Record<string, string> = {
  index: 'Inicio',
  pets: 'Mascotas',
  map: 'Radar',
  services: 'Servicios',
  profile: 'Perfil',
};

function buildProps(
  overrides: Partial<{ routeNames: string[]; index: number }> = {},
): BottomTabBarProps & { navigation: { emit: jest.Mock; navigate: jest.Mock } } {
  const routeNames = overrides.routeNames ?? ['index', 'pets', 'map', 'services', 'profile'];
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

  it('renders the 5 PRD tabs in order: Inicio, Mascotas, Radar, Servicios, Perfil', () => {
    const { getByTestId } = render(<AppTabBar {...buildProps()} />);

    expect(getByTestId('tab.index')).toBeTruthy();
    expect(getByTestId('tab.pets')).toBeTruthy();
    expect(getByTestId('tab.map')).toBeTruthy();
    expect(getByTestId('tab.services')).toBeTruthy();
    expect(getByTestId('tab.profile')).toBeTruthy();
  });

  it('colors the focused tab with primary and other tabs with textSecondary', () => {
    const { getByText } = render(<AppTabBar {...buildProps({ index: 0 })} />);

    expect(StyleSheet.flatten(getByText('Inicio').props.style).color).toBe(colors.primary);
    expect(StyleSheet.flatten(getByText('Mascotas').props.style).color).toBe(colors.textSecondary);
  });

  it('renders PlakaIcon for the map, pets, and profile tabs', () => {
    const { UNSAFE_getByProps } = render(<AppTabBar {...buildProps({ index: 0 })} />);

    expect(UNSAFE_getByProps({ name: 'radar' })).toBeTruthy();
    expect(UNSAFE_getByProps({ name: 'contacto' })).toBeTruthy();
    expect(UNSAFE_getByProps({ name: 'carnet-id' })).toBeTruthy();
  });

  it('renders a storefront Ionicon for the services tab', () => {
    const focused = render(<AppTabBar {...buildProps({ index: 3 })} />);
    expect(focused.UNSAFE_getByProps({ name: 'storefront' })).toBeTruthy();
    focused.unmount();

    const unfocused = render(<AppTabBar {...buildProps({ index: 0 })} />);
    expect(unfocused.UNSAFE_getByProps({ name: 'storefront-outline' })).toBeTruthy();
  });

  it('swaps the Inicio Ionicon between filled and outline based on focus', () => {
    const focused = render(<AppTabBar {...buildProps({ index: 0 })} />);
    expect(focused.UNSAFE_getByProps({ name: 'home' })).toBeTruthy();
    focused.unmount();

    const unfocused = render(<AppTabBar {...buildProps({ index: 1 })} />);
    expect(unfocused.UNSAFE_getByProps({ name: 'home-outline' })).toBeTruthy();
  });

  it('does not render nested routes', () => {
    const { queryByTestId } = render(
      <AppTabBar {...buildProps({ routeNames: ['index', 'profile/settings'] })} />,
    );

    expect(queryByTestId('tab.profile/settings')).toBeNull();
  });

  it('does not render routes outside the main tab set', () => {
    const { queryByTestId } = render(
      <AppTabBar {...buildProps({ routeNames: ['index', 'notifications', 'alerts'] })} />,
    );

    expect(queryByTestId('tab.notifications')).toBeNull();
    expect(queryByTestId('tab.alerts')).toBeNull();
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

  describe('AppTabBar en modo invitado', () => {
    beforeEach(() => {
      mockUseWindowDimensions.mockReturnValue({ width: 375, height: 812, scale: 2, fontScale: 1 });
      useAuthStore.setState({ isGuest: true });
    });

    afterEach(() => {
      useAuthStore.setState({ isGuest: false });
    });

    it('no navega y muestra el modal de login al tocar Inicio', () => {
      const props = buildProps({ index: 2 });
      const { getByTestId } = render(<AppTabBar {...props} />);

      fireEvent.press(getByTestId('tab.index'));

      expect(props.navigation.navigate).not.toHaveBeenCalled();
      expect(getByTestId('authRequiredModal.signIn')).toBeTruthy();
    });

    it('no navega y muestra el modal de login al tocar Mascotas', () => {
      const props = buildProps({ index: 2 });
      const { getByTestId } = render(<AppTabBar {...props} />);

      fireEvent.press(getByTestId('tab.pets'));

      expect(props.navigation.navigate).not.toHaveBeenCalled();
      expect(getByTestId('authRequiredModal.signIn')).toBeTruthy();
    });

    it('no navega y muestra el modal de login al tocar Perfil', () => {
      const props = buildProps({ index: 2 });
      const { getByTestId } = render(<AppTabBar {...props} />);

      fireEvent.press(getByTestId('tab.profile'));

      expect(props.navigation.navigate).not.toHaveBeenCalled();
      expect(getByTestId('authRequiredModal.signIn')).toBeTruthy();
    });

    it('navega normalmente al tocar Radar', () => {
      const props = buildProps({ index: 0 });
      const { getByTestId, queryByTestId } = render(<AppTabBar {...props} />);

      fireEvent.press(getByTestId('tab.map'));

      expect(props.navigation.navigate).toHaveBeenCalledWith('map');
      expect(queryByTestId('authRequiredModal.signIn')).toBeNull();
    });

    it('navega normalmente al tocar Servicios', () => {
      const props = buildProps({ index: 0 });
      const { getByTestId, queryByTestId } = render(<AppTabBar {...props} />);

      fireEvent.press(getByTestId('tab.services'));

      expect(props.navigation.navigate).toHaveBeenCalledWith('services');
      expect(queryByTestId('authRequiredModal.signIn')).toBeNull();
    });
  });
});
