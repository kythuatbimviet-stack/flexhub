# Design Rules & UX Guidelines - My Wallet

This document defines the standard design rules for the My Wallet application to ensure visual consistency and a premium user experience across all modules.

## 1. Core Principles
- **Style**: Modern, Premium, Apple-inspired (iOS/macOS).
- **Feel**: Clean, high contrast, smooth transitions, and subtle elevations.
- **Responsiveness**: Mobile-first design with a fluid Sidebar/Main layout for Desktop.

## 2. Typography
- **Primary Font**: `Inter`, sans-serif (imported from Google Fonts).
- **Fallbacks**: `ui-sans-serif`, `system-ui`, `-apple-system`.
- **Weights**: 
  - Regular (400): Body text.
  - Medium (500): Navigation, labels.
  - Semi-Bold (600): Headings, emphasized buttons.
- **Anti-aliasing**: Always enabled (`antialiased`).

## 3. Color Palette (Apple Standard)
| Category | Variable | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary** | `--color-primary` | `#007AFF` | Action buttons, active states, highlights. |
| **Income** | `--color-income` | `#34C759` | Positive numbers, "Thu", Success icons. |
| **Expense** | `--color-expense` | `#FF3B30` | Negative numbers, "Chi", Error icons. |
| **Warning** | `--color-warning` | `#FF9500` | Alerts, pending states. |
| **Foreground** | -- | `#1D1D1F` | Primary text. |
| **Background** | -- | `#F5F5F7` | System-wide background (Light mode). |
| **Border** | -- | `#E5E5EA` | Standard separators and card borders. |

### Dark Mode Support
- **Background**: `#1C1C1E` (Dark Grey).
- **Border**: `#38383A`.

## 4. Components & Layout

### Cards (`.card`)
- **Border Radius**: `12px` (`rounded-xl`).
- **Padding**: `20px` (`p-5`).
- **Border**: `1px solid #E5E5EA`.
- **Shadow**: `shadow-sm` (Subtle elevation).

### Buttons (`.btn-primary`)
- **Border Radius**: `8px` (`rounded-lg`) or `12px` (`rounded-xl`) for large actions.
- **Padding**: `12px 20px` (`px-5 py-3`).
- **Interaction**: `active:scale-[0.98]` (Micro-animation on click).

### Forms & Inputs
- **Background**: `#F5F5F7` (Light Mode) or `#2C2C2E` (Dark Mode).
- **Radius**: `12px`.
- **Labels**: Geometric style (`text-[11px]` or `text-xs`, bold, uppercase, tracking-widest).

## 5. Visual Rhythm
- **Gutters**: `16px` for Mobile, `32px` for Desktop.
- **Transitions**: `transition-all duration-200` for all interactive elements.
- **Icons**: Use `lucide-react` with consistent stroke width.
