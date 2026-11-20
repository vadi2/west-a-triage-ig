import type { ReactNode } from 'react';
import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';
import { rendererThemeComponentOverrides, rendererThemeOptions, useRendererQueryClient } from '@aehrc/smart-forms-renderer';

// The renderer's MUI theme, pulled into the app's look: one ink, square edges, no shadows,
// white fields with a full ink border, and a focus ring a nurse can see across the room.
const INK = '#0f1a33';
const FONT = '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, sans-serif';
const MONO = '"Atkinson Hyperlegible Mono", ui-monospace, monospace';

const base = createTheme({
  ...rendererThemeOptions,
  palette: {
    ...rendererThemeOptions.palette,
    primary: { main: INK, contrastText: '#ffffff' },
    secondary: { main: INK, contrastText: '#ffffff' },
    error: { main: INK },
    text: { primary: INK, secondary: INK, disabled: '#4a5468' },
    background: { paper: 'transparent', default: 'transparent' },
  },
  shape: { borderRadius: 0 },
  shadows: rendererThemeOptions.shadows?.map(() => 'none') as never,
  typography: {
    fontFamily: FONT,
    fontSize: 15,
    h1: { fontSize: 16, fontWeight: 700 },
    h2: { fontSize: 16, fontWeight: 700 },
    h3: { fontSize: 16, fontWeight: 700 },
    h4: { fontSize: 16, fontWeight: 700 },
    h5: { fontSize: 16, fontWeight: 700 },
    h6: { fontSize: 15, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' },
    subtitle1: { fontSize: 15, fontWeight: 700 },
    subtitle2: { fontSize: 14, fontWeight: 700 },
    body1: { fontSize: 15 },
    body2: { fontSize: 14 },
    caption: { fontSize: 13 },
  },
});

const focusRing = { outline: `3px solid ${INK}`, outlineOffset: 2 };

export const rendererTheme = (() => {
  const t = base;
  t.components = {
    ...rendererThemeComponentOverrides(t),
    MuiCssBaseline: { styleOverrides: { body: { background: 'transparent' } } },
    MuiScopedCssBaseline: { styleOverrides: { root: { backgroundColor: 'transparent', color: INK } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', boxShadow: 'none', backgroundColor: 'transparent' } } },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: 'none', borderRadius: 0, background: 'transparent', borderTop: `2px solid ${INK}`, overflow: 'visible' },
      },
    },
    MuiCardContent: { styleOverrides: { root: { padding: '12px 0 20px' } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          fontFamily: MONO,
          fontSize: 17,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: INK, borderWidth: 1.5 },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: INK, borderWidth: 2 },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: INK, borderWidth: 3 },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: INK, borderWidth: 3, borderStyle: 'dashed' },
        },
        input: { padding: '9px 10px' },
      },
    },
    MuiInputAdornment: { styleOverrides: { root: { color: INK, '& p': { color: INK, fontFamily: FONT, fontSize: 14 } } } },
    MuiAutocomplete: {
      styleOverrides: {
        paper: { backgroundColor: '#ffffff', border: `2px solid ${INK}`, borderRadius: 0 },
        option: { fontFamily: FONT, fontSize: 15, '&.Mui-focused': { backgroundColor: '#dfe5ea !important' } },
        inputRoot: { fontFamily: FONT, fontSize: 16 },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: { color: INK, padding: 7, '&.Mui-checked': { color: INK }, '&.Mui-focusVisible': focusRing },
      },
    },
    MuiCheckbox: { styleOverrides: { root: { color: INK, '&.Mui-checked': { color: INK }, '&.Mui-focusVisible': focusRing } } },
    MuiFormControlLabel: { styleOverrides: { label: { fontSize: 15 } } },
    MuiButtonBase: { styleOverrides: { root: { '&.Mui-focusVisible': focusRing } } },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 0, textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      },
    },
    MuiIconButton: { styleOverrides: { root: { color: INK, borderRadius: 0 } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: INK, borderRadius: 0, fontSize: 13 } } },
    MuiFormHelperText: { styleOverrides: { root: { fontSize: 13, marginLeft: 0, color: INK } } },
    MuiDivider: { styleOverrides: { root: { borderColor: INK } } },
  };
  return t;
})();

/** The renderer's theme and the query client it fetches terminology with. */
export function RendererTheme({ children }: { children: ReactNode }) {
  const queryClient = useRendererQueryClient();
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={rendererTheme}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
