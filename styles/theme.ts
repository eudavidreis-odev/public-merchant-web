// Design System para o app Lojista
export const palette = {
    primary: '#E53935', // tomate
    primaryDark: '#B71C1C',
    secondary: '#F9A825', // mostarda
    secondaryDark: '#B28704',
    accent: '#FF7043', // molho/laranja
    success: '#2E7D32',
    info: '#0288D1',
    warning: '#F57C00',
    danger: '#D32F2F',
    white: '#FFFFFF',
    black: '#121212',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
};

export const lightTheme = {
    colors: {
        background: palette.white,
        surface: palette.gray50,
        text: palette.black,
        mutedText: palette.gray700,
        border: palette.gray200,
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent,
        success: palette.success,
        info: palette.info,
        warning: palette.warning,
        danger: palette.danger,
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
    },
    radius: {
        sm: 6,
        md: 10,
        lg: 16,
        pill: 999,
    },
    typography: {
        fontFamily: 'System',
        sizes: {
            // atomic sizes (kept for backward compatibility)
            xs: 12,
            sm: 14,
            md: 16,
            lg: 20,
            xl: 24,
            xxl: 32,
            // semantic sizes for app-wide consistency
            caption: 10,
            body: 12,
            helper: 12,
            subtitle: 14,
            title: 20,
            // semantic aliases
            pageTitle: 26,
            cardTitle: 20,
            cardDescription: 14,
            heading5: 16,
            heading4: 18,
            heading3: 22,
            heading2: 26,
            heading1: 32,
        },
        lineHeight: {
            tight: 1.1,
            normal: 1.4,
            relaxed: 1.6,
        },
    },
} as const;

export const darkTheme: typeof lightTheme = {
    ...lightTheme,
    colors: {
        ...lightTheme.colors,
        background: palette.black,
        surface: palette.gray900,
        text: palette.white,
        mutedText: palette.gray400,
        border: palette.gray800,
        primary: palette.primaryDark,
        secondary: palette.secondaryDark,
    },
};

export type AppTheme = typeof lightTheme;

// Conveniência: exportar tamanhos tipográficos para importação direta
export const typography = lightTheme.typography.sizes;

// Espaçamentos semânticos para títulos e descrições
export const textSpacing = {
    pageTitle: 16,
    cardTitle: 8,
    cardDescription: 6,
} as const;
