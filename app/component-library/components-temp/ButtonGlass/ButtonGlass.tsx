import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Button,
  ButtonVariant,
  type ButtonBaseProps,
} from '@metamask/design-system-react-native';
import { useTailwind } from '@metamask/design-system-twrnc-preset';

import GlassSurface from '../GlassSurface';
import { useTheme } from '../../../util/theme';
import { useLiquidGlass } from '../../hooks/useLiquidGlass';
import { BLUR_INTENSITY } from '../../hooks/useBlurMaterial';

export type ButtonGlassVariant =
  | typeof ButtonVariant.Primary
  | typeof ButtonVariant.Secondary
  | typeof ButtonVariant.Tertiary;

export type ButtonGlassProps = ButtonBaseProps & {
  /** False renders the plain `Button` in the same variant. */
  isGlass?: boolean;
  /** Without glass, draws the button on a blurred material (iOS < 26). */
  isBlur?: boolean;
  /** Keeps the button's own fill under the glass; saturated tints wash out. */
  hasSolidFill?: boolean;
  /** Primary: tinted with its fill. Secondary: brand sheen. Tertiary: clear glass. */
  variant?: ButtonGlassVariant;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * The design-system `Button` drawn on Liquid Glass, kept out of the package
 * until the design system takes it. Callers gate `isGlass` on their screen flag.
 */
const ButtonGlass = ({
  isGlass = true,
  isBlur = false,
  hasSolidFill = false,
  variant = ButtonVariant.Secondary,
  containerStyle,
  twClassName,
  ...props
}: ButtonGlassProps) => {
  const tw = useTailwind();
  const { colors } = useTheme();
  const { blurTint } = useLiquidGlass();
  // Fills a sized wrapper; otherwise hugs its label, as the plain Button does.
  const isFullWidth = props.isFullWidth ?? containerStyle !== undefined;

  if (!isGlass && isBlur) {
    return (
      <BlurView
        tint={blurTint}
        intensity={BLUR_INTENSITY}
        style={[tw.style('overflow-hidden rounded-full'), containerStyle]}
      >
        <Button
          {...props}
          variant={variant}
          twClassName="bg-transparent border-transparent"
          isFullWidth={isFullWidth}
        />
      </BlurView>
    );
  }

  if (!isGlass) {
    return (
      <Button
        {...props}
        variant={variant}
        twClassName={twClassName}
        style={props.style ?? containerStyle}
      />
    );
  }

  const isTinted = variant === ButtonVariant.Primary && !hasSolidFill;

  return (
    <GlassSurface
      radiusClassName="rounded-full"
      isInteractive={!props.isDisabled}
      hasSheen={variant === ButtonVariant.Secondary && !hasSolidFill}
      tintColor={isTinted ? colors.icon.default : undefined}
      containerStyle={containerStyle}
    >
      <Button
        {...props}
        variant={variant}
        twClassName={
          hasSolidFill ? twClassName : 'bg-transparent border-transparent'
        }
        isFullWidth={isFullWidth}
      />
    </GlassSurface>
  );
};

export default ButtonGlass;
