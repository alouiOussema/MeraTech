# IBSAR Automation & MCP Setup

This directory contains the automation suite for IBSAR, designed to be used by AI Agents via MCP or developers directly.

## Prerequisites
- Node.js installed
- Chrome/Chromium installed (for Puppeteer)

## Installation
```bash
cd automation
npm install
```

## Running Tests
You can run the E2E smoke tests and Unit tests using the following commands:

### 1. E2E Smoke Tests (Puppeteer)
Ensures the app is running and critical paths (Home -> Login -> Products) are accessible.
*Note: Make sure the frontend is running on http://localhost:5173*

```bash
npm run test:e2e
```

### 2. Unit Tests (Number Parsing)
Validates the Arabic number parsing logic used in the voice menus.

```bash
npm run test:units
```

## MCP Integration (For AI Agents)

To enable an AI Agent (like Claude or Trae) to control and test this application, we recommend using the **Puppeteer MCP Server**.

### Option A: Using `chrome-devtools-mcp` (Recommended)
This is a standard MCP server that allows agents to control a browser instance.

1. **Install the server**:
   ```bash
   npx -y @modelcontextprotocol/server-puppeteer
   ```
   *Or configure it in your MCP client settings.*

2. **Usage**:
   The agent can now use tools like `puppeteer_navigate`, `puppeteer_click`, `puppeteer_screenshot` to interact with the running IBSAR app.

### Option B: Custom Automation Script (Included)
We have provided `e2e.js` which is a self-contained Puppeteer script. An agent can simply run this script to verify the application state without needing a full interactive session.

```bash
node automation/e2e.js
```

## Test Coverage
- **Voice Menus**: Validates parsing of Arabic digits (١, ٢) and words (واحد, اثنين).
- **Navigation**: Checks routing between Home, Login, and Products.
- **Content**: Verifies products are loaded on the products page.
