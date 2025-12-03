// frontend/src/theme.ts

import { createTheme } from "@mantine/core";

export const theme = createTheme({
  fontFamily: "Inter, sans-serif",
  primaryColor: "galaxy",
  defaultRadius: "lg",

  colors: {
    galaxy: [
      "#f3f0ff", // 0
      "#e5dbff", // 1
      "#d0bfff", // 2
      "#b197fc", // 3
      "#9775fa", // 4
      "#845ef7", // 5
      "#7950f2", // 6
      "#7048e8", // 7
      "#6741d9", // 8
      "#5f3dc4", // 9
    ],
    // Deep space darks for dark mode background
    space: [
      "#e0e7ff", // 0
      "#c7d2fe", // 1
      "#a5b4fc", // 2
      "#818cf8", // 3
      "#6366f1", // 4
      "#4f46e5", // 5
      "#4338ca", // 6
      "#3730a3", // 7
      "#312e81", // 8
      "#1e1b4b", // 9 (Very dark blue/purple)
    ],
  },

  shadows: {
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    glow: "0 0 15px rgba(121, 80, 242, 0.5)", // Custom glow shadow
  },

  headings: {
    fontFamily: "Inter, sans-serif",
    fontWeight: "700",
  },

  components: {
    Button: {
      defaultProps: {
        radius: "lg",
        fw: 600,
      },
      styles: (theme: any, params: any) => {
        if (params.variant === "filled") {
          return {
            root: {
              backgroundImage:
                "linear-gradient(135deg, #7950f2 0%, #4f46e5 100%)",
              border: "none",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: theme.shadows.glow,
              },
            },
          };
        }
        return {};
      },
    },
    TextInput: {
      defaultProps: {
        radius: "lg",
        variant: "default",
      },
      styles: (theme: any) => ({
        input: {
          backgroundColor:
            "light-dark(var(--mantine-color-white), var(--mantine-color-dark-6))",
          borderColor:
            "light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))",
          color:
            "light-dark(var(--mantine-color-black), var(--mantine-color-white))",
          transition: "all 0.2s",
          "&:focus": {
            borderColor: theme.colors.galaxy[5],
            boxShadow: `0 0 0 3px ${theme.colors.galaxy[1]}`,
          },
        },
      }),
    },
    PasswordInput: {
      defaultProps: {
        radius: "lg",
        variant: "default",
      },
    },
    Select: {
      defaultProps: {
        radius: "lg",
        variant: "default",
      },
      styles: (theme: any) => ({
        input: {
          backgroundColor:
            "light-dark(var(--mantine-color-white), var(--mantine-color-dark-6))",
          borderColor:
            "light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))",
          color:
            "light-dark(var(--mantine-color-black), var(--mantine-color-white))",
        },
        dropdown: {
          backgroundColor:
            "light-dark(var(--mantine-color-white), var(--mantine-color-dark-6))",
          borderColor:
            "light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))",
        },
      }),
    },
    Paper: {
      defaultProps: {
        shadow: "sm",
        p: "xl",
        radius: "lg",
        withBorder: false,
      },
      styles: (theme: any) => ({
        root: {
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            boxShadow: theme.shadows.md,
          },
        },
      }),
    },
    Card: {
      defaultProps: {
        shadow: "sm",
        p: "xl",
        radius: "lg",
        withBorder: false,
      },
      styles: (theme: any) => ({
        root: {
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            boxShadow: theme.shadows.md,
          },
        },
      }),
    },
    Modal: {
      defaultProps: {
        radius: "lg",
        padding: 0,
        overlayProps: {
          backgroundOpacity: 0.55,
          blur: 5,
        },
        transitionProps: {
          transition: "pop",
        },
      },
      styles: (theme: any) => ({
        content: {
          display: "flex",
          flexDirection: "column",
          padding: 0,
          gap: 0,
          overflow: "hidden",
        },

        header: {
          padding: theme.spacing.md,
          margin: 0,
          borderBottom: `1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-4))`,
          backgroundColor:
            "light-dark(var(--mantine-color-white), var(--mantine-color-dark-6))",
          width: "100%",
          flex: "0 0 auto",
          minHeight: "auto",

          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        },

        body: {
          padding: theme.spacing.md,
          width: "100%",
          flex: "1 1 auto",
          overflowY: "auto",
        },
      }),
    },
    Badge: {
      defaultProps: {
        radius: "md",
        fw: 600,
        variant: "gradient",
        gradient: { from: "indigo", to: "cyan", deg: 45 },
      },
    },
  },
});
