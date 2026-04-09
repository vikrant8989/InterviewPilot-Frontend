# AI Interview Simulator - Frontend

A modern React-based web application for AI-powered interview simulation and evaluation.

## Features

- 🎭 Role-based interview simulations (SDE, Frontend, Backend, Data Science, etc.)
- 🏢 Company-specific interviews (Google, Amazon, Stripe, Startups, etc.)
- 🎯 Multiple difficulty levels (Easy, Medium, Hard)
- 💬 Multiple interview modes (Text, Voice, Video)
- 📊 Performance analytics and detailed reports
- 🌙 Dark/Light theme support
- 📱 Responsive design

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Routing**: React Router
- **Charts**: Victory
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <frontend-repo-url>
   cd InterviewPilot-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your API URL in `.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |

## Build & Deploy

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Connect your repository to Vercel
2. Set `VITE_API_BASE_URL` environment variable in Vercel dashboard
3. Deploy automatically on push to main branch

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── store/              # Zustand state management
├── lib/                # Utility functions and API clients
├── api/                # API client and types
└── styles/             # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details
