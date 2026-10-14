import React from 'react';
import { Text, processColor } from 'react-native';
import { render } from '@testing-library/react-native';
import GlassFooter from './GlassFooter';
import { mockTheme } from '../../../util/theme';
import { colorWithOpacity } from '../../../util/colors/colorWithOpacity';

const mockInsets = { top: 0, right: 0, bottom: 34, left: 0 };
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => mockInsets,
}));

describe('GlassFooter', () => {
  it('fades the content above into the screen colour', () => {
    const { getByTestId, getByText } = render(
      <GlassFooter testID="footer">
        <Text>Buy</Text>
      </GlassFooter>,
    );

    expect(getByText('Buy')).toBeOnTheScreen();
    expect(getByTestId('footer-fade').props.colors).toEqual(
      [0, 0.35, 0.7, 1].map((opacity) =>
        processColor(
          colorWithOpacity(mockTheme.colors.background.default, opacity),
        ),
      ),
    );
    expect(getByTestId('footer-fade')).toHaveStyle({
      bottom: '100%',
    });
  });

  it('pads for the bottom inset only when asked', () => {
    const { getByTestId, rerender } = render(
      <GlassFooter testID="footer">
        <Text>Buy</Text>
      </GlassFooter>,
    );

    expect(getByTestId('footer')).not.toHaveStyle({ paddingBottom: 34 });

    rerender(
      <GlassFooter testID="footer" includesBottomInset>
        <Text>Buy</Text>
      </GlassFooter>,
    );

    expect(getByTestId('footer')).toHaveStyle({ paddingBottom: 34 });
  });

  it('floats at the bottom with the fade behind it when overlaid', () => {
    const { getByTestId } = render(
      <GlassFooter testID="footer" isOverlay>
        <Text>Buy</Text>
      </GlassFooter>,
    );

    expect(getByTestId('footer')).toHaveStyle({
      position: 'absolute',
      bottom: 0,
    });
    expect(getByTestId('footer-fade')).toHaveStyle({ top: -32, bottom: 0 });
  });

  it('leaves the fade without a test ID when the footer has none', () => {
    const { queryByTestId } = render(
      <GlassFooter>
        <Text>Buy</Text>
      </GlassFooter>,
    );

    expect(queryByTestId('undefined-fade')).toBeNull();
  });
});
