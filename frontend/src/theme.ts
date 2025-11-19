// frontend/src/theme.ts

import { createTheme } from "@mantine/core";

export const theme = createTheme({
  fontFamily: "Inter, sans-serif",
  primaryColor: "indigo",

  defaultRadius: "md",

  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    TextInput: {
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
        shadow: "xs",
        p: "xl",
        radius: "lg",
        withBorder: true,
      },
    },
    Card: {
      defaultProps: {
        shadow: "xs",
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
      },
    },
  },
});
