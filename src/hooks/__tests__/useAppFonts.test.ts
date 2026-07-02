import { renderHook } from '@testing-library/react-native';
import { useFonts } from 'expo-font';

import { useAppFonts } from '../useAppFonts';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
jest.mock('@expo-google-fonts/montserrat', () => ({ Montserrat_700Bold: 1 }));
jest.mock('@expo-google-fonts/inter', () => ({ Inter_400Regular: 2, Inter_700Bold: 3 }));

const mockUseFonts = jest.mocked(useFonts);

describe('useAppFonts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false while fonts are loading', () => {
    mockUseFonts.mockReturnValue([false, null]);

    const { result } = renderHook(() => useAppFonts());

    expect(result.current).toBe(false);
  });

  it('returns true once fonts finish loading', () => {
    mockUseFonts.mockReturnValue([true, null]);

    const { result } = renderHook(() => useAppFonts());

    expect(result.current).toBe(true);
  });

  it('requests exactly the three PLAKA font weights', () => {
    mockUseFonts.mockReturnValue([true, null]);

    renderHook(() => useAppFonts());

    expect(mockUseFonts).toHaveBeenCalledWith({
      Montserrat_700Bold: 1,
      Inter_400Regular: 2,
      Inter_700Bold: 3,
    });
  });
});
