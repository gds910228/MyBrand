# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A professional portfolio and blog website called "MisoTech - Decode the Stack" built with Next.js 14, TypeScript, and Tailwind CSS. The site features bilingual support (English/Chinese), dark mode, and uses Notion as a headless CMS for dynamic content.

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **Fonts**: Inter (body), Space Grotesk (headings), JetBrains Mono (monospace) via Next.js font optimization
- **Icons**: FontAwesome and Heroicons
- **CMS**: Notion API integration for projects, blog posts, and comments
- **Internationalization**: next-intl for EN/ZH language support
- **Email**: EmailJS for contact form functionality
- **Animations**: Framer Motion for smooth transitions
- **Analytics**: Vercel Analytics and Google Analytics

## Architecture

### Core Structure
- **App Router**: Uses Next.js 14 App Router with file-based routing
- **Component System**: Modular React components in `/src/components`
- **Data Layer**: Hybrid approach with local JSON data and Notion API integration
- **Internationalization**: Locale-based routing with middleware handling
- **Theme System**: Dark/light mode with CSS variables and Tailwind classes

### Key Directories
- `/src/app` - Next.js App Router pages and API routes
- `/src/components` - Reusable React components
- `/src/services` - Notion API integration and data fetching
- `/src/data` - Local JSON data for projects and blog posts
- `/src/i18n` - Internationalization configuration and translations
- `/src/styles` - Global styles and Tailwind configuration

## Development Commands

```bash
# Development
npm run dev          # Standard Next.js dev server (port 3000)
npm run dev:env      # Custom dev server with environment config (port 4000, loads .env.local)

# Build & Production
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests (currently placeholder)
```

## Environment Setup

Create `.env.local` with these variables:
```bash
# Required
NOTION_API_KEY=your_notion_api_key
NOTION_PROJECTS_DATABASE_ID=your_projects_db_id
NOTION_BLOG_DATABASE_ID=your_blog_db_id
NOTION_COMMENTS_DATABASE_ID=your_comments_db_id

# Optional
NEXT_PUBLIC_EMAILJS_SERVICE_ID=emailjs_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=emailjs_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=emailjs_public_key
NEXT_PUBLIC_SITE_URL=http://localhost:4000

# Development
DISABLE_NOTION_CACHE=true  # 禁用 Notion 数据缓存，方便实时预览更新
```

## Content Management

### Notion Integration
- **Projects**: Fetched from Notion database with properties for title, description, technologies, etc.
- **Blog Posts**: Dynamic content with rich text support via Notion blocks
- **Comments**: Nested comment system with Notion database storage
- **About Page**: Personal information and skills from Notion
- **Fallback**: Local JSON data when Notion API unavailable

### Content Structure
- Projects: `/src/data/projects.ts` (local fallback)
- Blog posts: `/src/data/blog.ts` (local fallback)
- Comments: Local storage with Notion sync capability

## Routing & Internationalization

### URL Structure
- English (default): `/about`, `/projects`, `/blog`
- Chinese: `/zh/about`, `/zh/projects`, `/zh/blog`
- Dynamic routes: `/projects/[slug]`, `/blog/[slug]`

### Language Detection
- Middleware-based routing in `/src/middleware.ts`
- Automatic locale switching via `LanguageSwitcher` component
- Content served based on URL prefix or user preference

## Design System

### Tailwind Configuration
- Custom color palette with dark mode variants
- Extended spacing and typography scales
- Responsive breakpoints: xs, sm, md, lg, xl, 2xl
- Custom font families: Inter (body), Space Grotesk (headings), JetBrains Mono (mono)

### Component Patterns
- **Container**: Responsive wrapper with max-width constraints
- **Section**: Consistent spacing and layout sections
- **Card Components**: BlogCard, ProjectCard with hover effects
- **Form Elements**: ContactForm, CommentForm with validation
- **Navigation**: Responsive Navbar with mobile menu

## API Routes

- `/api/comments` - CRUD operations for blog comments
- `/api/test-email` - Email functionality testing endpoint

## Performance Optimizations

- Next.js Image optimization with custom device sizes
- Font optimization with display swap
- Static page generation for content
- Code splitting and lazy loading
- 60-second caching for blog lists (Notion API)
- Console log removal in production

## Key Files to Know

- `/src/middleware.ts` - Language routing logic
- `/src/services/notion.ts` - Notion API integration (comprehensive content management)
- `/src/i18n/locales.ts` - Language configuration
- `/tailwind.config.js` - Design tokens and theme
- `/next.config.js` - Next.js configuration and optimizations
- `/start-dev.js` - Custom dev server configuration

## Notion API Features

The Notion integration (`/src/services/notion.ts`) includes:
- **Rich Text Processing**: Converts Notion blocks to HTML
- **Media Support**: Images, videos, YouTube embeds
- **Comparison Tables**: JSON parsing for product/tool comparisons
- **Review System**: Rating and review functionality
- **Language Filtering**: Content served by locale
- **Tree Structure**: Nested comments with parent-child relationships
- **Caching**: Performance optimization with TTL

## Development Workflow

1. **Content Updates**: Primary content managed through Notion databases
2. **Local Development**: Use `npm run dev:env` for full environment setup
3. **Testing**: Email functionality via `/api/test-email` endpoint
4. **Deployment**: Static generation with dynamic API routes
5. **Analytics**: Vercel Analytics and Google Analytics integrated