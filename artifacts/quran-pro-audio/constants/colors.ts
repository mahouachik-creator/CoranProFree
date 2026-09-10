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
    text: '#F5F2EA',
    tint: '#98B8A5',

    // Core surfaces
    background: '#0B1820',
    foreground: '#F5F2EA',

    // Cards / elevated surfaces
    card: '#122630',
    cardForeground: '#F5F2EA',

    // Primary action color (buttons, links, active states)
    primary: '#98B8A5',
    primaryForeground: '#0B1820',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#1C3540',
    secondaryForeground: '#D8E2DB',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#19313B',
    mutedForeground: '#91A8A3',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#D2A85A',
    accentForeground: '#0B1820',

    // Destructive actions (delete, error states)
    destructive: '#D96B67',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#26434A',
    input: '#2D5056',
  },

  dark: {
    text: '#F5F2EA',
    tint: '#98B8A5',
    background: '#0B1820',
    foreground: '#F5F2EA',
    card: '#122630',
    cardForeground: '#F5F2EA',
    primary: '#98B8A5',
    primaryForeground: '#0B1820',
    secondary: '#1C3540',
    secondaryForeground: '#D8E2DB',
    muted: '#19313B',
    mutedForeground: '#91A8A3',
    accent: '#D2A85A',
    accentForeground: '#0B1820',
    destructive: '#D96B67',
    destructiveForeground: '#FFFFFF',
    border: '#26434A',
    input: '#2D5056',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
