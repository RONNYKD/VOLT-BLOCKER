# VOLT App Source Code Structure

This document provides an overview of the VOLT app source code organization.

## Directory Structure

```
src/
├── assets/           # Static assets like images, fonts, and icons
├── components/       # Reusable UI components
│   ├── ui/           # Basic UI components (buttons, inputs, etc.)
│   ├── forms/        # Form-related components
│   └── layout/       # Layout components (containers, headers, etc.)
├── constants/        # Application constants and configuration
├── navigation/       # Navigation configuration and components
├── screens/          # Screen components
│   ├── auth/         # Authentication screens
│   ├── focus/        # Focus session screens
│   ├── blocks/       # App and website blocking screens
│   └── profile/      # User profile and settings screens
├── services/         # Services for API, auth, blocking, etc.
│   ├── api/          # API service for backend communication
│   ├── auth/         # Authentication services
│   ├── blocking/     # App and website blocking services
│   ├── storage/      # Local storage services
│   └── native/       # Native module bridges
├── store/            # State management with Zustand
├── theme/            # Theme configuration and styling
├── types/            # TypeScript type definitions
└── utils/            # Utility functions and helpers
    ├── helpers/      # Helper functions
    ├── hooks/        # Custom React hooks
    └── validation/   # Validation utilities
```

## Import Aliases

The project uses path aliases for cleaner imports. Instead of using relative paths like `../../components/Button`, you can use:

```typescript
import { Button } from '@components/ui';
```

Available aliases:

- `@/*` - Imports from the src directory
- `@components/*` - UI components
- `@screens/*` - Screen components
- `@services/*` - Services
- `@utils/*` - Utilities
- `@assets/*` - Static assets
- `@theme/*` - Theme configuration
- `@constants/*` - Constants
- `@navigation/*` - Navigation
- `@store/*` - State management
- `@types/*` - TypeScript types

## Coding Standards

- Use TypeScript for all files
- Follow ESLint and Prettier rules
- Use functional components with hooks
- Keep components small and focused
- Write unit tests for utilities and components
- Use proper error handling
- Document complex logic with comments