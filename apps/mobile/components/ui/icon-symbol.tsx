// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

/**
 * SF Symbol name → Material Icon name. Add an entry here before using a new icon.
 */
export const ICON_MAPPING = {
  'house.fill': 'home',
  'book.closed.fill': 'menu-book',
  'chart.bar.fill': 'bar-chart',
  sparkles: 'auto-awesome',
  'gearshape.fill': 'settings',
  plus: 'add',
  trash: 'delete-outline',
  pencil: 'edit',
  eye: 'visibility',
  'eye.slash': 'visibility-off',
  checkmark: 'check',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.seal.fill': 'verified',
  xmark: 'close',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'arrow.clockwise': 'refresh',
  'arrow.up.right': 'north-east',
  'arrow.down.right': 'south-east',
  'arrow.up': 'arrow-upward',
  'arrow.down': 'arrow-downward',
  calendar: 'calendar-today',
  'rectangle.portrait.and.arrow.right': 'logout',
  'chart.line.uptrend.xyaxis': 'show-chart',
  'lightbulb.fill': 'lightbulb',
  'doc.text.fill': 'description',
  'exclamationmark.triangle.fill': 'warning',
  'lock.fill': 'lock',
  'envelope.fill': 'mail',
  'person.fill': 'person',
  'tray.fill': 'inbox',
  'square.and.pencil': 'edit-note',
  'circle.fill': 'circle',
  'wand.and.stars': 'auto-fix-high',
} as const satisfies Record<string, ComponentProps<typeof MaterialIcons>['name']>;

export type IconSymbolName = keyof typeof ICON_MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={ICON_MAPPING[name]} style={style} />;
}
