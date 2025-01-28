# Sitemap Analyzer React

A modern sitemap analysis tool built with React, TypeScript, and Supabase.

## Prerequisites

- Node.js >= 18.17.0
- npm >= 9.0.0

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Supabase credentials
4. Start the development server:
   ```bash
   npm run dev
   ```

## Features

- XML sitemap analysis
- User authentication
- Analysis history tracking
- Detailed analysis results
- Real-time updates
- Interactive visualizations

## Tech Stack

- React (Vite)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Supabase
- Zustand
- TanStack Query
- Recharts

## Project Structure

```
src/
  ├── components/
  │   ├── ui/          # Shadcn UI components
  │   ├── layout/      # Layout components
  │   ├── features/    # Feature-specific components
  │   └── charts/      # Chart components
  ├── hooks/           # Custom hooks
  ├── stores/          # Zustand stores
  ├── services/        # API services
  ├── types/          # TypeScript interfaces
  ├── utils/          # Utility functions
  ├── constants/      # App constants
  ├── styles/         # Global styles
  └── assets/         # Images, icons, etc.
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
