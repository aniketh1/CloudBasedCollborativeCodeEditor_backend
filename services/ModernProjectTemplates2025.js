// services/ModernProjectTemplates2025.js
// Updated project templates following 2025 best practices and latest framework versions

const File = require('../models/File');

class ModernProjectTemplates2025 {
  /**
   * Create project files based on latest 2025 standards
   * @param {string} projectId - Project identifier
   * @param {string} userId - User creating the project
   * @param {string} templateType - Type of template to create
   * @returns {Promise<Array>} - Created files
   */
  static async createProjectFiles(projectId, userId, templateType = 'react-vite-2025') {
    const templateFiles = this.getTemplate(templateType);
    const createdFiles = [];

    try {
      for (const fileTemplate of templateFiles) {
        const fileData = {
          projectId,
          name: fileTemplate.name,
          path: fileTemplate.path,
          content: fileTemplate.content,
          language: fileTemplate.language,
          type: fileTemplate.type,
          createdBy: userId,
          version: 1
        };

        const file = await File.create(fileData);
        createdFiles.push(file);
      }

      console.log(`✅ Created ${createdFiles.length} files for ${templateType} template`);
      return createdFiles;
    } catch (error) {
      console.error('❌ Error creating template files:', error);
      throw error;
    }
  }

  /**
   * Get template files based on project type
   */
  static getTemplate(templateType) {
    const templates = {
      'react-vite-2025': this.getReactViteTemplate(),
      'nextjs-15-app': this.getNextJS15Template(),
      'vue3-vite-ts': this.getVue3Template(),
      'node-express-ts': this.getNodeExpressTemplate(),
      'python-fastapi': this.getPythonFastAPITemplate(),
      'fullstack-trpc': this.getFullStackTRPCTemplate(),
      'html-css-js': this.getHTMLTemplate()
    };

    return templates[templateType] || templates['react-vite-2025'];
  }

  /**
   * React 18 + Vite 5 + TypeScript 5.6 (Most Popular 2025)
   */
  static getReactViteTemplate() {
    return [
      // package.json
      {
        name: 'package.json',
        path: 'package.json',
        type: 'file',
        language: 'json',
        content: JSON.stringify({
          name: 'react-vite-app',
          private: true,
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
            preview: 'vite preview',
            test: 'vitest'
          },
          dependencies: {
            react: '^18.3.1',
            'react-dom': '^18.3.1',
            '@tanstack/react-query': '^5.56.0',
            zustand: '^4.5.5',
            'react-router-dom': '^6.26.2',
            axios: '^1.7.7'
          },
          devDependencies: {
            '@types/react': '^18.3.11',
            '@types/react-dom': '^18.3.0',
            '@typescript-eslint/eslint-plugin': '^8.8.1',
            '@typescript-eslint/parser': '^8.8.1',
            '@vitejs/plugin-react': '^4.3.2',
            autoprefixer: '^10.4.20',
            eslint: '^9.12.0',
            'eslint-plugin-react-hooks': '^5.1.0-rc',
            'eslint-plugin-react-refresh': '^0.4.12',
            postcss: '^8.4.47',
            tailwindcss: '^3.4.15',
            typescript: '^5.6.3',
            vite: '^5.4.8',
            vitest: '^2.1.0',
            '@testing-library/react': '^16.0.1',
            '@testing-library/jest-dom': '^6.5.0'
          }
        }, null, 2)
      },

      // vite.config.ts
      {
        name: 'vite.config.ts',
        path: 'vite.config.ts',
        type: 'file',
        language: 'typescript',
        content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
`
      },

      // tsconfig.json
      {
        name: 'tsconfig.json',
        path: 'tsconfig.json',
        type: 'file',
        language: 'json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            useDefineForClassFields: true,
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: 'react-jsx',
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true,
            baseUrl: '.',
            paths: {
              '@/*': ['./src/*']
            }
          },
          include: ['src'],
          references: [{ path: './tsconfig.node.json' }]
        }, null, 2)
      },

      // tailwind.config.js
      {
        name: 'tailwind.config.js',
        path: 'tailwind.config.js',
        type: 'file',
        language: 'javascript',
        content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};
`
      },

      // index.html
      {
        name: 'index.html',
        path: 'index.html',
        type: 'file',
        language: 'html',
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
      },

      // src directory
      {
        name: 'src',
        path: 'src',
        type: 'directory',
        language: '',
        content: ''
      },

      // src/main.tsx
      {
        name: 'main.tsx',
        path: 'src/main.tsx',
        type: 'file',
        language: 'typescript',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
`
      },

      // src/App.tsx
      {
        name: 'App.tsx',
        path: 'src/App.tsx',
        type: 'file',
        language: 'typescript',
        content: `import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import './App.css';

// Example API call
const fetchGreeting = async (): Promise<string> => {
  // Simulated API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('Hello from React + Vite! 🚀');
    }, 500);
  });
};

function App() {
  const [count, setCount] = useState(0);
  
  // Using React Query for data fetching
  const { data: greeting, isLoading } = useQuery({
    queryKey: ['greeting'],
    queryFn: fetchGreeting,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            React + Vite + TypeScript
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            {isLoading ? 'Loading...' : greeting}
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
              Counter: {count}
            </h2>
            <button
              onClick={() => setCount((c) => c + 1)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Increment
            </button>
          </div>

          <div className="space-y-4 text-left bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              ✨ Features Included
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>✅ React 18.3 with latest features</li>
              <li>✅ Vite 5.4 for lightning-fast HMR</li>
              <li>✅ TypeScript 5.6 for type safety</li>
              <li>✅ TanStack Query for data fetching</li>
              <li>✅ Tailwind CSS for styling</li>
              <li>✅ Vitest for testing</li>
              <li>✅ ESLint for code quality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
`
      },

      // src/index.css
      {
        name: 'index.css',
        path: 'src/index.css',
        type: 'file',
        language: 'css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  width: 100%;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
}
`
      },

      // src/App.css
      {
        name: 'App.css',
        path: 'src/App.css',
        type: 'file',
        language: 'css',
        content: `/* Add your custom styles here */

.container {
  max-width: 1200px;
}

/* Add smooth scrolling */
html {
  scroll-behavior: smooth;
}
`
      },

      // README.md
      {
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        language: 'markdown',
        content: `# React + Vite + TypeScript Project (2025)

A modern React application built with the latest tools and best practices.

## 🚀 Tech Stack

- **React 18.3** - Latest React with concurrent features
- **Vite 5.4** - Next generation frontend tooling
- **TypeScript 5.6** - Type-safe JavaScript
- **TanStack Query** - Powerful data synchronization
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Vitest** - Fast unit testing framework

## 📦 Getting Started

### Prerequisites

- Node.js 20+ LTS
- npm or pnpm

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build

\`\`\`bash
npm run build
\`\`\`

### Test

\`\`\`bash
npm test
\`\`\`

## 📁 Project Structure

\`\`\`
├── src/
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── package.json
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── tailwind.config.js  # Tailwind configuration
\`\`\`

## 🎨 Features

- ⚡️ Lightning fast HMR with Vite
- 🎯 Type-safe with TypeScript
- 🎨 Styled with Tailwind CSS
- 🔄 Data fetching with React Query
- ✅ Testing with Vitest
- 📦 Optimized build with tree-shaking

## 🤝 Contributing

This is a collaborative project. Feel free to:
- Add new features
- Fix bugs
- Improve documentation
- Share your ideas

Happy coding! 🎉
`
      }
    ];
  }

  /**
   * Next.js 15 + App Router Template
   */
  static getNextJS15Template() {
    return [
      {
        name: 'package.json',
        path: 'package.json',
        type: 'file',
        language: 'json',
        content: JSON.stringify({
          name: 'nextjs-15-app',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev --turbo',
            build: 'next build',
            start: 'next start',
            lint: 'next lint'
          },
          dependencies: {
            next: '^15.0.3',
            react: '^18.3.1',
            'react-dom': '^18.3.1',
            '@tanstack/react-query': '^5.56.0'
          },
          devDependencies: {
            '@types/node': '^22',
            '@types/react': '^18',
            '@types/react-dom': '^18',
            typescript: '^5.6.3',
            eslint: '^9',
            'eslint-config-next': '15.0.3',
            tailwindcss: '^3.4.15',
            postcss: '^8',
            autoprefixer: '^10'
          }
        }, null, 2)
      },
      {
        name: 'app',
        path: 'app',
        type: 'directory',
        language: '',
        content: ''
      },
      {
        name: 'layout.tsx',
        path: 'app/layout.tsx',
        type: 'file',
        language: 'typescript',
        content: `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Next.js 15 App',
  description: 'Built with Next.js 15 and App Router',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
`
      },
      {
        name: 'page.tsx',
        path: 'app/page.tsx',
        type: 'file',
        language: 'typescript',
        content: `export default function Home() {
  return (
    <main className="min-h-screen p-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Next.js 15! 🚀
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Built with the App Router and latest React Server Components
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">⚡ Turbopack</h2>
            <p className="text-gray-600">
              700x faster than Webpack, built with Rust
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">🎯 Server Actions</h2>
            <p className="text-gray-600">
              Progressive enhancement with server-side mutations
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">🔄 Partial Prerendering</h2>
            <p className="text-gray-600">
              Combine static and dynamic rendering
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">⚡ Edge Runtime</h2>
            <p className="text-gray-600">
              Deploy globally with minimal latency
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
`
      },
      {
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        language: 'markdown',
        content: `# Next.js 15 Project

Modern full-stack application with Next.js 15 App Router.

## Features

- ⚡ Turbopack for ultra-fast dev experience
- 🎯 React Server Components
- 🔄 Server Actions for mutations
- ⚡ Edge Runtime support
- 🎨 Tailwind CSS for styling

## Getting Started

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
`
      }
    ];
  }

  /**
   * Simple HTML/CSS/JS Template for quick prototyping
   */
  static getHTMLTemplate() {
    return [
      {
        name: 'index.html',
        path: 'index.html',
        type: 'file',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML/CSS/JS Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to Your Project! 🚀</h1>
    <p class="subtitle">Start building something amazing</p>
    
    <div class="counter-container">
      <button id="decrementBtn" class="btn">-</button>
      <span id="counter" class="counter">0</span>
      <button id="incrementBtn" class="btn">+</button>
    </div>
    
    <div class="features">
      <h2>Features</h2>
      <ul>
        <li>✅ Modern HTML5</li>
        <li>✅ Responsive CSS</li>
        <li>✅ Vanilla JavaScript</li>
        <li>✅ Live Preview</li>
      </ul>
    </div>
  </div>
  
  <script src="script.js"></script>
</body>
</html>
`
      },
      {
        name: 'styles.css',
        path: 'styles.css',
        type: 'file',
        language: 'css',
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.container {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

h1 {
  color: #333;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.counter-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 2rem 0;
}

.counter {
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
  min-width: 100px;
}

.btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:hover {
  background: #764ba2;
  transform: scale(1.1);
}

.btn:active {
  transform: scale(0.95);
}

.features {
  margin-top: 2rem;
  text-align: left;
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 10px;
}

.features h2 {
  color: #333;
  margin-bottom: 1rem;
}

.features ul {
  list-style: none;
}

.features li {
  padding: 0.5rem 0;
  color: #555;
  font-size: 1.1rem;
}

@media (max-width: 600px) {
  .container {
    padding: 2rem;
  }
  
  h1 {
    font-size: 2rem;
  }
}
`
      },
      {
        name: 'script.js',
        path: 'script.js',
        type: 'file',
        language: 'javascript',
        content: `// Simple counter application
let count = 0;

// Get DOM elements
const counterElement = document.getElementById('counter');
const incrementBtn = document.getElementById('incrementBtn');
const decrementBtn = document.getElementById('decrementBtn');

// Update counter display
function updateCounter() {
  counterElement.textContent = count;
  
  // Add animation
  counterElement.style.transform = 'scale(1.2)';
  setTimeout(() => {
    counterElement.style.transform = 'scale(1)';
  }, 200);
}

// Event listeners
incrementBtn.addEventListener('click', () => {
  count++;
  updateCounter();
  console.log('Counter incremented:', count);
});

decrementBtn.addEventListener('click', () => {
  count--;
  updateCounter();
  console.log('Counter decremented:', count);
});

// Welcome message
console.log('🎉 JavaScript loaded successfully!');
console.log('Try clicking the buttons to update the counter.');

// Add smooth transition
counterElement.style.transition = 'transform 0.2s ease';
`
      },
      {
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        language: 'markdown',
        content: `# HTML/CSS/JS Project

A simple, modern web project with vanilla JavaScript.

## Features

- Clean HTML5 structure
- Modern CSS with gradients and animations
- Interactive JavaScript functionality
- Responsive design
- Live preview support

## How to Use

1. Edit the HTML in \`index.html\`
2. Style with \`styles.css\`
3. Add functionality with \`script.js\`
4. View changes in real-time!

## Quick Start

Open \`index.html\` in your browser or use the live preview feature.

Happy coding! 🚀
`
      }
    ];
  }

  /**
   * Get list of available templates
   */
  static getAvailableTemplates() {
    return [
      {
        id: 'react-vite-2025',
        name: 'React 18 + Vite 5',
        description: 'Modern React with Vite, TypeScript, TanStack Query, and Tailwind CSS',
        icon: '⚛️',
        category: 'Frontend',
        popular: true,
        tags: ['React', 'Vite', 'TypeScript', 'Tailwind']
      },
      {
        id: 'nextjs-15-app',
        name: 'Next.js 15 App Router',
        description: 'Full-stack Next.js with Server Components, Turbopack, and Edge Runtime',
        icon: '▲',
        category: 'Full-Stack',
        popular: true,
        tags: ['Next.js', 'React', 'TypeScript', 'Server Components']
      },
      {
        id: 'html-css-js',
        name: 'HTML/CSS/JavaScript',
        description: 'Simple web project with vanilla JavaScript - perfect for beginners',
        icon: '🌐',
        category: 'Frontend',
        popular: true,
        tags: ['HTML', 'CSS', 'JavaScript', 'Beginner']
      },
      {
        id: 'vue3-vite-ts',
        name: 'Vue 3 + Vite',
        description: 'Vue 3 with Composition API, TypeScript, and Pinia',
        icon: '🟢',
        category: 'Frontend',
        popular: false,
        tags: ['Vue', 'Vite', 'TypeScript', 'Pinia']
      },
      {
        id: 'node-express-ts',
        name: 'Node.js + Express',
        description: 'Backend API with Express, TypeScript, and Prisma',
        icon: '🟩',
        category: 'Backend',
        popular: false,
        tags: ['Node.js', 'Express', 'TypeScript', 'API']
      }
    ];
  }
}

module.exports = ModernProjectTemplates2025;
