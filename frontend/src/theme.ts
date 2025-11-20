// frontend/src/theme.ts

import { createTheme } from "@mantine/core";

export const theme = createTheme({
  fontFamily: "Inter, sans-serif",
  primaryColor: "violet",
  defaultRadius: "md",

  colors: {
    // Custom violet palette if needed, or rely on Mantine's default
    brand: [
      "#f3f0ff",
      "#e5dbff",
      "#d0bfff",
      "#b197fc",
      "#9775fa",
      "#845ef7",
      "#7950f2",
      "#7048e8",
      "#6741d9",
      "#5f3dc4",
    ],
  },

  shadows: {
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },

  headings: {
    fontFamily: "Inter, sans-serif",
    fontWeight: "700",
  },

  components: {
    Button: {
      defaultProps: {
        radius: "md",
        fw: 500,
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
        variant: "filled",
      },
      styles: (theme: any) => ({
        input: {
          transition: "all 0.2s",
          "&:focus": {
            transform: "translateY(-1px)",
          },
        },
      }),
    },
    PasswordInput: {
      defaultProps: {
        radius: "md",
        variant: "filled",
      },
    },
    Select: {
      defaultProps: {
        radius: "md",
        variant: "filled",
      },
    },
    Paper: {
      defaultProps: {
        shadow: "sm",
        p: "xl",
        radius: "lg",
        withBorder: true,
      },
    },
    Card: {
      defaultProps: {
        shadow: "sm",
        p: "xl",
        radius: "lg",
        withBorder: true,
      },
    },
    Modal: {
      defaultProps: {
        radius: "lg",
        overlayProps: {
          backgroundOpacity: 0.55,
          blur: 3,
        },
        transitionProps: {
          transition: "pop",
        },
      },
    },
    Badge: {
      defaultProps: {
        radius: "sm",
        fw: 600,
      },
    },
  },
});
