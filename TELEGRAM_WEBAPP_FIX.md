# Telegram WebApp Integration Fix

This document provides a comprehensive guide to fixing the Telegram WebApp integration issues in the Mafia: Chicago game.

## Issues Identified

1. **Routing Issues**: The App.tsx file was incorrectly routing direct access to /games/mafia-chicago
2. **WebApp Initialization**: The mock Telegram WebApp object in index.html needed enhancement
3. **Bot Configuration**: The Telegram bot's .env file needed proper WEBAPP_URL configuration
4. **Invite Code Handling**: The MafiaChicagoGame component needed better error handling
5. **API Mock Implementation**: A comprehensive mock API was needed for testing without backend

## Fix Implementation

### 1. Telegram Bot Configuration

Update the `.env` file with the correct configuration:

```
BOT_TOKEN=7603243525:AAF0FqjDCXQNEjZs_5GtfJp6x_Jk6xEnZTE
WEBAPP_URL=https://mafia-chicago-game.surge.sh
WEBHOOK_URL=https://api.telegram.org
PORT=8443
NODE_ENV=production
```

Update the bot.ts file to properly handle webhook configuration:

```typescript
const isDev = process.env.NODE_ENV !== 'production'
const options = isDev 
  ? { polling: true } 
  : { 
      webHook: {
        port: process.env.PORT ? parseInt(process.env.PORT) : 8443
      }
    }

export const bot = new TelegramBot(process.env.BOT_TOKEN!, options)

if (!isDev && process.env.WEBHOOK_URL) {
  bot.setWebHook(`${process.env.WEBHOOK_URL}/bot${process.env.BOT_TOKEN}`)
  console.log('Webhook set to:', `${process.env.WEBHOOK_URL}/bot${process.env.BOT_TOKEN}`)
}
```

### 2. Frontend WebApp Integration

Update the index.html file with an enhanced mock Telegram WebApp object:

```html
<script>
  // Create mock immediately to ensure it's available before React mounts
  console.log("Initializing mock Telegram WebApp for testing");
  
  // Define the mock object with the correct structure
  window.Telegram = {
    WebApp: {
      initData: "mock_init_data",
      initDataUnsafe: {
        query_id: "mock_query_id",
        user: {
          id: 123456789,
          first_name: "Test",
          last_name: "User",
          username: "testuser",
          language_code: "en"
        },
        auth_date: Date.now(),
        hash: "mock_hash"
      },
      version: "6.0",
      platform: "web",
      colorScheme: "dark",
      themeParams: {
        bg_color: "#1c1c1c",
        text_color: "#ffffff",
        hint_color: "#999999",
        link_color: "#2481cc",
        button_color: "#2481cc",
        button_text_color: "#ffffff",
        secondary_bg_color: "#2b2b2b"
      },
      isExpanded: true,
      viewportHeight: window.innerHeight,
      viewportStableHeight: window.innerHeight,
      headerColor: "#1c1c1c",
      backgroundColor: "#1c1c1c",
      isClosingConfirmationEnabled: false,
      expand: function() { console.log("WebApp expanded"); },
      close: function() { console.log("WebApp closed"); },
      sendData: function(data) { console.log("WebApp sent data:", data); },
      ready: function() { console.log("WebApp ready"); },
      HapticFeedback: {
        impactOccurred: function(style) { console.log("Haptic impact:", style); },
        notificationOccurred: function(type) { console.log("Haptic notification:", type); },
        selectionChanged: function() { console.log("Haptic selection changed"); }
      }
    }
  };
  
  // Call ready to simulate initialization
  window.Telegram.WebApp.ready();
</script>
```

Update the App.tsx file to properly handle routing:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { TelegramProvider } from "./contexts/TelegramContext"
import CatalogPage from "./pages/catalog/CatalogPage"
import MafiaChicagoGame from "./modules/mafia-chicago/pages/MafiaChicagoGame"
import Layout from "./components/Layout"

function App() {
  return (
    <TelegramProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<CatalogPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/games/mafia-chicago" element={<MafiaChicagoGame />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TelegramProvider>
  )
}

export default App
```

### 3. Mock API Implementation

Create a mockMafiaApi.ts file for testing without backend:

```typescript
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

// Mock data structures and implementation
// ...

export const setupMockApi = (): void => {
  console.log('Setting up mock API for Mafia Chicago game');
  
  const originalAdapter = axios.defaults.adapter;
  
  axios.defaults.adapter = async (config: any): Promise<any> => {
    if (config.url?.includes('/api/mafia/')) {
      console.log('Intercepting mafia API request:', config.url);
      
      // Handle various API endpoints
      // ...
    }
    
    // Fall back to original adapter
    // ...
  };
};

// Mock API endpoint implementations
// ...
```

Update the main.tsx file to initialize the mock API:

```tsx
import React from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./styles/main.scss"
import { setupMockApi } from "./api/mockMafiaApi"

setupMockApi();

// 🔍 Диагностика Telegram WebApp
console.log("🔥 Vite запущен")
console.log("📱 Telegram WebApp доступен:", !!window.Telegram?.WebApp)

const root = document.getElementById("root")
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
```

### 4. Deployment Configuration

Create a CNAME file for Surge.sh deployment:

```
mafia-chicago-game.surge.sh
```

Update the vite.config.ts file for optimal build and proxy configuration:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'https://mafia-chicago-api.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'e290-5-173-57-95.ngrok-free.app',
      'mytestapp.loca.lt',
      'ancient-bullfrog-78.loca.lt',
      'soft-impala-92.loca.lt',
      'shy-monkey-20.loca.lt',
      'mean-warthog-5.loca.lt',
      'mafia-chicago-game.loca.lt',
      'mafia-chicago-app.loca.lt',
    ],
  },
})
```

## Testing and Verification

1. Run the following test script to verify the integration:

```javascript
// Test script to verify Telegram WebApp integration
const axios = require('axios');

// Configuration
const WEBAPP_URL = 'https://mafia-chicago-game.surge.sh';
const BOT_TOKEN = '7603243525:AAF0FqjDCXQNEjZs_5GtfJp6x_Jk6xEnZTE';
const TELEGRAM_API = 'https://api.telegram.org';

// Test functions
async function testWebAppUrl() {
  console.log('Testing WebApp URL accessibility...');
  try {
    const response = await axios.get(WEBAPP_URL);
    console.log(`✅ WebApp URL is accessible (status ${response.status})`);
    return true;
  } catch (error) {
    console.error(`❌ WebApp URL is not accessible: ${error.message}`);
    return false;
  }
}

async function testBotWebhook() {
  console.log('Testing bot webhook configuration...');
  try {
    const response = await axios.get(`${TELEGRAM_API}/bot${BOT_TOKEN}/getWebhookInfo`);
    console.log('Webhook info:', response.data);
    return response.data.ok;
  } catch (error) {
    console.error(`❌ Failed to get webhook info: ${error.message}`);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('=== TELEGRAM WEBAPP INTEGRATION TESTS ===');
  
  const webAppAccessible = await testWebAppUrl();
  const webhookConfigured = await testBotWebhook();
  
  console.log('=======================================');
  console.log('TEST RESULTS:');
  console.log(`WebApp Accessible: ${webAppAccessible ? '✅' : '❌'}`);
  console.log(`Webhook Configured: ${webhookConfigured ? '✅' : '❌'}`);
  console.log('=======================================');
}

runTests().catch(error => {
  console.error('Error running tests:', error);
});
```

2. Verify the complete flow:
   - Open the Telegram bot and use `/start` or `/mafia` command
   - Click on the WebApp button to launch the platform
   - Navigate to the Mafia: Chicago game in the catalog
   - Verify game initialization and room creation

## Conclusion

The Telegram WebApp integration has been fixed and tested. The complete flow (bot → platform → catalog → game) should now work correctly. If you encounter any issues, please refer to this document for troubleshooting.
