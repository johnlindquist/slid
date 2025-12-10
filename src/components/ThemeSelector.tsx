import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { THEMES, type AppTheme } from '../utils/themes.js';

type ThemeSelectorProps = {
  currentTheme: AppTheme;
  onSelect: (theme: AppTheme) => void;
  onClose: () => void;
};

export const ThemeSelector = ({ currentTheme, onSelect, onClose }: ThemeSelectorProps) => {
  const themeKeys = Object.keys(THEMES);
  const [selectedIndex, setSelectedIndex] = useState(
    themeKeys.indexOf(currentTheme.id)
  );

  useInput((input, key) => {
    if (key.escape || input === 't') {
      onClose();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => (i > 0 ? i - 1 : themeKeys.length - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((i) => (i < themeKeys.length - 1 ? i + 1 : 0));
    }
    if (key.return) {
      const selectedId = themeKeys[selectedIndex];
      if (selectedId && THEMES[selectedId]) {
        onSelect(THEMES[selectedId]!);
        onClose();
      }
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={currentTheme.colors.ui.border}
      paddingX={2}
      paddingY={1}
      width={40}
    >
      <Box marginBottom={1} justifyContent="center">
        <Text bold underline color={currentTheme.colors.ui.highlight}>
          SELECT THEME
        </Text>
      </Box>

      {themeKeys.map((key, index) => {
        const theme = THEMES[key]!;
        const isSelected = index === selectedIndex;
        const isActive = theme.id === currentTheme.id;

        return (
          <Box key={key} justifyContent="space-between">
            <Text color={isSelected ? currentTheme.colors.ui.highlight : currentTheme.colors.ui.text}>
              {isSelected ? '> ' : '  '}
              {theme.name}
            </Text>
            {isActive && <Text color={currentTheme.colors.ui.dim}> [Active]</Text>}
          </Box>
        );
      })}

      <Box marginTop={1} justifyContent="center">
        <Text color={currentTheme.colors.ui.dim}>Enter to select | Esc to cancel</Text>
      </Box>
    </Box>
  );
};
