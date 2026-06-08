import { useCallback, useRef, useState } from 'react';
import { Dimensions, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../../design/tokens';

export const RADIUS_OPTIONS = [
  { km: 1, label: '1 km' },
  { km: 2, label: '2 km' },
  { km: 5, label: '5 km' },
  { km: 10, label: '10 km' },
] as const;

const SCREEN_W = Dimensions.get('window').width;

interface RadiusDropdownProps {
  value: number;
  onChange: (km: number) => void;
  /**
   * 'map'  → fondo transparente al abrirse (el mapa queda visible)
   * 'list' → fondo semitransparente oscuro (estándar para listas)
   */
  variant?: 'map' | 'list';
  testID?: string;
}

function closestOption(km: number): (typeof RADIUS_OPTIONS)[number] {
  return RADIUS_OPTIONS.reduce((prev, curr) =>
    Math.abs(curr.km - km) < Math.abs(prev.km - km) ? curr : prev,
  );
}

export function RadiusDropdown({
  value,
  onChange,
  variant = 'map',
  testID = 'radius-dropdown.trigger',
}: RadiusDropdownProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const chipRef = useRef<View>(null);

  const openMenu = useCallback(() => {
    const measure = (): void => {
      chipRef.current?.measureInWindow((x, y, width, height) => {
        setAnchor({ x, y, width, height });
        setOpen(true);
      });
    };
    if (Platform.OS === 'web') {
      requestAnimationFrame(measure);
    } else {
      measure();
    }
  }, []);

  const closeMenu = useCallback((): void => setOpen(false), []);

  const selected = closestOption(value);

  const dropdownStyle =
    anchor != null
      ? anchor.x > SCREEN_W / 2
        ? { right: SCREEN_W - anchor.x - anchor.width }
        : { left: anchor.x }
      : { left: spacing.md };

  return (
    <>
      <View ref={chipRef} collapsable={false}>
        <Pressable
          onPress={openMenu}
          style={({ pressed }) => [
            styles.chip,
            variant === 'map' ? styles.chipMap : styles.chipList,
            pressed && styles.chipPressed,
          ]}
          testID={testID}
        >
          <Ionicons color={colors.textSecondary} name="radio-outline" size={12} />
          <Text style={[styles.chipLabel, variant === 'list' && styles.chipLabelList]}>
            {selected.label}
          </Text>
          <Ionicons color={colors.textSecondary} name="chevron-down" size={12} />
        </Pressable>
      </View>

      {open && anchor != null ? (
        <Modal animationType="fade" onRequestClose={closeMenu} transparent visible>
          <View style={styles.modalRoot}>
            <Pressable
              accessibilityLabel="Cerrar menú"
              onPress={closeMenu}
              style={[styles.overlay, variant === 'map' && styles.overlayTransparent]}
              testID="radius-dropdown.overlay"
            />
            <View
              style={[styles.dropdown, { top: anchor.y + anchor.height + 6 }, dropdownStyle]}
              testID="radius-dropdown.menu"
            >
              <Text style={styles.dropdownCaption}>Radio de búsqueda</Text>
              {RADIUS_OPTIONS.map((opt) => {
                const isSelected = value === opt.km;
                return (
                  <Pressable
                    key={opt.km}
                    onPress={() => {
                      onChange(opt.km);
                      closeMenu();
                    }}
                    style={[styles.row, isSelected && styles.rowSelected]}
                    testID={`radius-dropdown.option.${opt.km}`}
                  >
                    <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  chipMap: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  chipList: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    gap: 6,
  },
  chipPressed: { opacity: 0.85 },
  chipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  chipLabelList: {
    fontWeight: '600',
  },
  modalRoot: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
  },
  overlayTransparent: {
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    minWidth: 180,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sm,
    paddingBottom: 4,
  },
  row: {
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
  },
  rowSelected: { backgroundColor: '#ECEFF5' },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  rowLabelSelected: { fontWeight: '600' },
});
