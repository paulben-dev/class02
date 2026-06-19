# Font Size Setting — Design Spec

**Date:** 2026-06-19
**Status:** approved

## Overview

Add a font size setting to the Profile page that lets users switch between three preset sizes. The setting persists via the existing `localStorage` state mechanism and applies globally to all pages in the app.

## Interaction

- **Entry point:** A new menu item "字体大小" in the Profile page's `.menu-list`, between "批改记录" and "恢复出厂设置".
- **Display:** The menu item shows the current size label (小/标准/大) as its right-side text.
- **Picker:** Clicking the menu item opens a modal (following the existing modal pattern used for subscription and profile editing — centered overlay with card-style content) with three size options presented as tappable cards:

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│    小    │  │  标准 ✓  │  │    大    │
│ 13/12/10 │  │ 16/14/12 │  │ 19/16/14 │
└──────────┘  └──────────┘  └──────────┘
```

- Active option has green border + checkmark. Tapping another option applies it immediately and closes the picker.

## CSS Variables

Three font-size tiers defined via `data-font-size` attribute on `<html>`:

| Tier | `data-font-size` | `--font-lg` | `--font-md` | `--font-sm` |
|------|-------------------|-------------|-------------|-------------|
| Small | `small` | 13px | 12px | 10px |
| Medium (default) | `medium` | 16px | 14px | 12px |
| Large | `large` | 19px | 16px | 14px |

CSS rules:

```css
html[data-font-size="small"] { --font-lg: 13px; --font-md: 12px; --font-sm: 10px; }
html[data-font-size="medium"] { --font-lg: 16px; --font-md: 14px; --font-sm: 12px; }
html[data-font-size="large"] { --font-lg: 19px; --font-md: 16px; --font-sm: 14px; }
```

All existing font-size references use these variables, so no other CSS changes needed.

## State Persistence

- Store `fontSize` field (`'small' | 'medium' | 'large'`) in the existing `hwa_state` localStorage key.
- `loadState()` reads `state.fontSize`, defaults to `'medium'` if absent.
- `saveState()` writes `fontSize` alongside existing fields.
- On app init, apply `document.documentElement.setAttribute('data-font-size', value)`.

## Scope

- Applies to all in-app text (pages, tabs, modals, toasts, cards).
- Does NOT affect `@media print` output.
- Does NOT affect the phone-shell chrome (the outer device frame).

## Implementation Checklist

1. Add CSS rules for three `data-font-size` tiers in `<style>` block.
2. Add "字体大小" menu item in `#page-profile .menu-list` HTML.
3. Add font-size picker modal HTML.
4. Add `fontSize` field to `saveState()` / `loadState()`.
5. Add `applyFontSize()` function to set `data-font-size` on `<html>`.
6. Call `applyFontSize()` in init.
7. Wire up menu item click → show picker → select → save → apply.
