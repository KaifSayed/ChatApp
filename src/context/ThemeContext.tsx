// # Dark/Light Mode Management

import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { colors } from "../theme/colors";

type ThemeType = typeof colors.light;

const ThemeContext = createContext<{ theme: ThemeType; isDark: boolean }>({
  theme: colors.light,
  isDark: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
