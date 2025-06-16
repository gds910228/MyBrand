# Brand Website

A professional portfolio and blog website built with Next.js and Notion as CMS.

## Features

- Professional portfolio showcase
- Blog with articles
- About me page
- Contact information

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **CMS**: Notion API
- **Fonts**: Inter, Montserrat, Fira Code
- **Icons**: FontAwesome

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # Notion API
   NOTION_API_KEY=your_notion_api_key_here
   NOTION_DATABASE_ID=your_notion_database_id_here
   
   # Environment
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
├── docs/               # Documentation files
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # React components
│   ├── lib/            # Utility functions and configurations
│   └── styles/         # Global styles
├── .env.local          # Environment variables (create this file)
├── next.config.js      # Next.js configuration
├── package.json        # Project dependencies
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Design Resources

### Fonts
- [Inter](https://fonts.google.com/specimen/Inter)
- [Montserrat](https://fonts.google.com/specimen/Montserrat)
- [Fira Code](https://fonts.google.com/specimen/Fira+Code)

### Icons
- [FontAwesome](https://fontawesome.com/)

### Images
- [Unsplash](https://unsplash.com/)
- [Pexels](https://www.pexels.com/) 