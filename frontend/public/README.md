# Logo and Favicon Files

This directory contains the logo and favicon files for the Barangay Management Information System.

## Required Files

Please place the following files in this directory:

### Logo Files
- **`logo.png`** - Main logo image (recommended: 512x512px or larger, PNG with transparent background)
  - This logo will be displayed in:
    - Login page
    - Sidebar header (desktop and mobile)
    - Portal login page
    - Mobile header

### Favicon Files
- **`favicon.ico`** - Main favicon file (16x16, 32x32, 48x48 sizes)
- **`favicon-16x16.png`** - 16x16 PNG favicon
- **`favicon-32x32.png`** - 32x32 PNG favicon
- **`apple-touch-icon.png`** - 180x180 PNG for Apple devices (optional but recommended)

## Logo Specifications

The logo should be:
- **Format**: PNG with transparent background (preferred) or white background
- **Size**: At least 512x512px for best quality
- **Aspect Ratio**: Square (1:1) works best
- **Content**: El Nido Municipality Seal

## Favicon Generation

You can generate favicon files from your logo using online tools like:
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

## Current Status

The system is configured to use these files. Once you place the logo image (`logo.png`) in this directory, it will automatically appear throughout the application.

## File Structure

```
frontend/
  public/
    logo.png              ← Main logo (required)
    favicon.ico           ← Main favicon (required)
    favicon-16x16.png     ← Small favicon (required)
    favicon-32x32.png     ← Medium favicon (required)
    apple-touch-icon.png  ← Apple device icon (optional)
```

## Notes

- The logo will be automatically optimized by Next.js Image component
- Favicons are referenced in `app/layout.tsx` metadata
- Logo is used in `components/Layout.tsx` and `app/login/page.tsx`
- All image paths are relative to the `/public` directory (e.g., `/logo.png`)

