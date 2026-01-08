# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

This is the official PolaRecords website hosted at `polarecords.net` via GitHub Pages. It's a **static HTML/CSS/JavaScript site** showcasing three music personas (John Polar, PølarAF, and PolarX) created by a single artist.

## Technology Stack

- **Framework**: Static HTML/CSS/JavaScript (no build process)
- **Deployment**: GitHub Pages (automatic deployment from `main` branch)
- **Domain**: Custom domain via CNAME (`polarecords.net`)
- **Assets**: Local images, Google Fonts, inline JavaScript

## Architecture & Structure

### Site Organization

The site follows a **hub-and-spoke** architecture:
- **Hub**: `index.html` - Main landing page introducing all three personas
- **Spokes**: Three subdirectories for each persona with dedicated pages
  - `johnpolar/index.html` - Singer-songwriter persona (acoustic, introspective)
  - `polaraf/index.html` - Raw/unfiltered persona (aggressive hip-hop)
  - `polarx/index.html` - DJ/remixer persona (experimental electronic)

### File Structure

```
.
├── index.html              # Main landing page
├── style.css               # Base/shared styles
├── johnpolar-theme.css     # Theme for John Polar (warm, acoustic aesthetic)
├── polaraf-theme.css       # Theme for PølarAF (intense, street aesthetic)
├── polarx-theme.css        # Theme for PolarX (futuristic, electronic aesthetic)
├── xp-theme.css            # Additional theme (Windows XP style)
├── CNAME                   # Custom domain configuration
├── README.md               # Basic project description
├── images/                 # Image assets (logo, screenshots)
├── johnpolar/
│   └── index.html          # John Polar artist page
├── polaraf/
│   └── index.html          # PølarAF artist page
└── polarx/
    └── index.html          # PolarX artist page
```

### CSS Theme System

Each persona has a distinct visual identity through dedicated theme CSS files:

- **`style.css`**: Base styles, navigation, buttons, cards, and shared components
- **`johnpolar-theme.css`**: Warm cream/brown colors (white guitar aesthetic)
  - Color palette: `#f0d9b5` (cream), `#8d6e63` (earthy brown), `#3498db` (accent blue)
  - Warm, intimate, acoustic feel with subtle animations
- **`polaraf-theme.css`**: Intense red/black colors (raw, aggressive aesthetic)
  - Color palette: `#FF4141` (primary red), `#661818` (dark red), `#050505` (near-black)
  - Grid patterns, scan-line animations, dramatic shadows
- **`polarx-theme.css`**: Purple/red gradient colors (futuristic, experimental)
  - Color palette: `#9b59b6` (purple), `#e74c3c` (red), gradient effects
  - Futuristic animations and electronic vibes

### Key Design Patterns

1. **Consistent Navigation**: All pages share the same header with logo and navigation links
2. **Hero Sections**: Each page features a prominent hero section with persona identity
3. **Card Components**: Reusable `.card` class for content blocks
4. **Button Styles**: `.btn-primary` and `.btn-secondary` for CTAs
5. **Accessibility**: ARIA labels, semantic HTML, role attributes throughout
6. **Responsive Design**: Mobile-first approach with flexbox/grid layouts
7. **Scroll Animations**: IntersectionObserver-based animations for sections
8. **Back-to-Top Button**: Shared across all pages for navigation

### JavaScript Functionality

Each page includes identical inline JavaScript for:
- **Scroll animations**: Fade-in effects using IntersectionObserver
- **Back-to-top button**: Shows after scrolling 300px
- **Form validation**: Email validation for newsletter signup (main page only)

## Common Development Tasks

### Local Development

Since this is a static site with no build process, use any HTTP server:

```powershell
# Python 3 (recommended)
python -m http.server 8000

# Node.js
npx http-server -p 8000

# VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then navigate to: `http://localhost:8000`

### Testing Changes

1. Make edits to HTML/CSS files
2. Refresh browser (no build step required)
3. Test all persona pages individually
4. Verify navigation between pages works
5. Check responsive design at different viewport sizes

### Adding New Content

**Adding a new persona:**
1. Create new directory: `newpersona/`
2. Create `newpersona/index.html` (copy from existing persona)
3. Create `newpersona-theme.css` for unique styling
4. Update navigation in ALL HTML files to include new persona
5. Update main `index.html` to feature the new persona

**Updating social links:**
- Links are hardcoded in each persona's page
- Update Instagram/YouTube/other platform URLs in respective HTML files

**Adding images:**
- Place in `images/` directory
- Reference with relative paths: `../images/filename.png` (from persona pages)
- Update `alt` text for accessibility

### SEO & Metadata

Each page includes comprehensive meta tags:
- Standard meta tags (description, keywords, author)
- Open Graph tags for social sharing
- Twitter Card tags
- Canonical URLs pointing to `polarecords.net`
- Structured data with ARIA labels

When editing pages, maintain these metadata sections for SEO.

## GitHub Pages Deployment

### Deployment Process

- **Branch**: `main` (default branch)
- **Source**: Root directory
- **Domain**: Custom domain configured via `CNAME` file
- **Deployment**: Automatic on push to `main`

### Making Updates

```powershell
# 1. Make changes to HTML/CSS files
# 2. Test locally
# 3. Commit changes
git add .
git commit -m "Description of changes

Co-Authored-By: Warp <agent@warp.dev>"

# 4. Push to GitHub (automatic deployment)
git push origin main
```

Changes typically appear live within 1-2 minutes.

### Verifying Deployment

- Check GitHub Actions tab for deployment status
- Visit `https://polarecords.net` to verify changes
- Test all pages and navigation

## Content Strategy

### Three Personas Concept

The site revolves around **one artist expressing three different creative sides**:

1. **John Polar**: "When I'm in my feels"
   - Introspective singer-songwriter
   - Acoustic guitar, melodic rap, spoken word
   - Warm, intimate aesthetic
   - Instagram: @thejohnpolar, YouTube: @thejohnpolar

2. **PølarAF**: "When I need to let it out"
   - Raw, unfiltered energy
   - Aggressive flows, no filter
   - Dark, intense aesthetic with red accents
   - Instagram: @polarafmusic

3. **PolarX**: "When I just wanna create"
   - Experimental DJ/producer
   - Remixes, electronic, sound design
   - Futuristic purple/red gradient aesthetic
   - Instagram: @polarxmusic

### Voice & Tone Guidelines

- **Overall brand**: Authentic, raw, creative expression
- **Copy style**: Conversational, self-aware, honest
- **Avoid**: Corporate speak, overly polished language
- **Embrace**: Real talk, artistic expression, personal journey

## Maintenance Notes

### Common Edits

1. **Updating "Coming Soon" sections**: Replace placeholder `.coming-soon` divs with actual content
2. **Adding music/video embeds**: Use proper embed codes from platforms (YouTube, Spotify, etc.)
3. **Social media links**: Update hardcoded URLs in persona pages
4. **Navigation updates**: Remember to update ALL pages when adding/removing nav items

### Performance Considerations

- Site uses Google Fonts - ensure font loading is optimized
- Images should be compressed/optimized before upload
- Consider lazy loading for below-the-fold images
- Inline JavaScript is minimal - no need for external files yet

### Browser Compatibility

- Uses modern CSS (Grid, Flexbox, CSS variables)
- IntersectionObserver for animations (IE11 not supported)
- Target: Modern browsers (Chrome, Firefox, Safari, Edge)

## Git Workflow

Always include co-author attribution in commits:
```powershell
git commit -m "Your commit message

Co-Authored-By: Warp <agent@warp.dev>"
```
