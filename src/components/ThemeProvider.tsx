import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps as NextThemesProviderProps,
} from "next-themes";

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: NextThemesProviderProps["attribute"];
  defaultTheme?: NextThemesProviderProps["defaultTheme"];
  enableSystem?: NextThemesProviderProps["enableSystem"];
  disableTransitionOnChange?: NextThemesProviderProps["disableTransitionOnChange"];
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
