// # Dark/Light Mode Management

import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { colors } from "../theme/colors";

type ThemeType = typeof colors.light;

const ThemeContext = createContext<{ 
  theme: ThemeType; 
  isDark: boolean;
  toggleTheme: () => void;
}>({
  theme: colors.light,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = React.useState(systemColorScheme === "dark");

  const theme = isDark ? colors.dark : colors.light;

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
