/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: "#1c1c1e",
    tint: "#0d9488",

    // Core surfaces
    background: "#fbf9f4",
    foreground: "#1c1c1e",

    // Cards / elevated surfaces
    card: "#ffffff",
    cardForeground: "#1c1c1e",

    // Primary action color (buttons, links, active states) — teal, discovery vibe
    primary: "#0d9488",
    primaryForeground: "#ffffff",

    // Secondary / less-emphasis interactive surfaces — warm cream
    secondary: "#fef3e7",
    secondaryForeground: "#92400e",

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: "#f1efea",
    mutedForeground: "#78716c",

    // Accent highlights (labels, badges, selected items) — coral
    accent: "#f97355",
    accentForeground: "#ffffff",

    // Destructive actions (delete, error states)
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",

    // Borders and input outlines
    border: "#e7e4dc",
    input: "#e7e4dc",
  },

  dark: {
    text: "#f5f5f0",
    tint: "#2dd4bf",

    background: "#121212",
    foreground: "#f5f5f0",

    card: "#1e1e1e",
    cardForeground: "#f5f5f0",

    primary: "#2dd4bf",
    primaryForeground: "#0b1120",

    secondary: "#2a241b",
    secondaryForeground: "#fbbf66",

    muted: "#262626",
    mutedForeground: "#a3a3a3",

    accent: "#fb7a5c",
    accentForeground: "#1c1c1e",

    destructive: "#f87171",
    destructiveForeground: "#1c1c1e",

    border: "#2e2e2e",
    input: "#2e2e2e",
  },

  // Border radius (in px). Applies to cards, buttons, inputs, and modals.
  radius: 16,
};

export default colors;
