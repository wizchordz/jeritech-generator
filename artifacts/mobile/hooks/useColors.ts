import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';

type Palette = typeof colors.light;

/**
 * Returns the design tokens for the current color scheme.
 *
 * Falls back to the light palette when no dark key is defined.
 * When a `dark` key is synced into constants/colors.ts, this hook
 * automatically switches based on the device's appearance setting.
 */
export function useColors(): Palette & { radius: number } {
  const scheme = useColorScheme();
  const hasDark = 'dark' in colors && colors.dark != null;
  const palette: Palette =
    scheme === 'dark' && hasDark
      ? (colors as unknown as { dark: Palette }).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
