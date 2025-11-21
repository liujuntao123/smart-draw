# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Draw is an AI-powered diagram generation tool that supports two rendering engines (Draw.io and Excalidraw). Users describe diagrams in natural language, and LLMs generate the corresponding XML (Draw.io) or JSON (Excalidraw) code, which is then rendered on an interactive canvas.

**Tech Stack:** Next.js 16 (App Router) · React 19 · Draw.io · Excalidraw · Tailwind CSS 4 · Monaco Editor

## Development Commands

```bash
# Install dependencies (project uses pnpm)
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build --webpack

# Start production server
pnpm start

# Run linter
eslint
```

The dev server runs on `http://localhost:3000`. Use `--webpack` flag when building to ensure compatibility with the project setup.

## Architecture Overview

### Dual-Engine System

The application implements a **Strategy Pattern** for diagram engines:

- **Engine Selection:** `hooks/useEngine.js` dynamically returns either `useDrawioEngine` or `useExcalidrawEngine` based on runtime `engineType` state
- **Engine Interface (IEngine):** Each engine hook exposes:
  - `usedCode`: XML (Draw.io) or JSON (Excalidraw) applied to canvas
  - `messages`: LLM message history
  - `isGenerating`: generation state flag
  - `streamingContent`: real-time streaming content from LLM
  - `conversationId`: unique conversation identifier
  - `handleSendMessage()`: send user input to LLM
  - `handleApplyCode()`: apply generated code to canvas
  - `handleCanvasChange()`: handle user edits on canvas
  - `handleNewChat()`: reset conversation state
  - `handleRestoreHistory()`: restore from history

### LLM Integration Flow

**Frontend → Backend Proxy → LLM Provider:**

1. **Frontend** (`hooks/useDrawioEngine.js` or `hooks/useExcalidrawEngine.js`):
   - Constructs complete `messages` array with system prompt + user prompt
   - Reads active config via `getConfig()` from `lib/config.js`
   - POSTs `{ config, messages }` to `/api/llm/stream`

2. **Backend Proxy** (`app/api/llm/stream/route.js`):
   - Validates `config` and `messages`
   - Calls `callLLM()` from `lib/llm-client.js`
   - Returns SSE (Server-Sent Events) stream: `data: {"content": "..."}\n\n`
   - Terminates with `data: [DONE]\n\n`

3. **LLM Client** (`lib/llm-client.js`):
   - Supports OpenAI and Anthropic APIs
   - Handles streaming responses and multimodal content (text + images)
   - Normalizes different provider formats

### Configuration System

**Multi-config + Access Password:**

- **Local Configs:** Managed by `lib/config-manager.js` (CRUD operations in `localStorage`)
- **Remote Config:** When access password is enabled, backend config is fetched and stored in `localStorage` as `smart-diagram-remote-config`
- **Active Config Resolution:** `lib/config.js` → `getConfig()` returns the final effective config:
  - If `smart-diagram-use-password === 'true'`: use remote config
  - Otherwise: use active local config from `config-manager.js`
- All components call `getConfig()` to get the current LLM configuration

### Code Post-Processing

**Draw.io (XML):**
- Extract from code fences: `` ```xml ... ``` ``
- Fix unclosed tags: `lib/fixUnclosed.js` repairs malformed XML
- Clean BOM and zero-width characters
- Function: `postProcessDrawioCode()` in `hooks/useDrawioEngine.js`

**Excalidraw (JSON):**
- Extract from code fences: `` ```json ... ``` ``
- Repair incomplete JSON: `lib/fixUnclosed.js` → `fixJSON()`
- Optimize arrow coordinates: `lib/optimizeArrows.js` → `optimizeExcalidrawCode()`
- Function: `postProcessExcalidrawCode()` in `hooks/useExcalidrawEngine.js`

### History & Persistence

- **IndexedDB:** `lib/indexeddb.js` provides low-level DB operations
- **History Manager:** `lib/history-manager.js` wraps IndexedDB:
  - Stores conversations with messages, chart type, config, and binary attachments (images/files)
  - Each conversation has a unique `conversationId` and can be restored
  - Binary attachments stored as blobs with references in messages
- Engines call `historyManager.addHistory()` after each successful generation

### Main Page Flow

**`app/draw/page.js`** (routed from both `/` and `/draw`):

1. Manages `engineType` state ('drawio' | 'excalidraw')
2. Calls `useEngine(engineType)` to get active engine instance
3. Renders either `DrawioCanvas` or `ExcalidrawCanvas` based on `engineType`
4. Provides `FloatingChat` component with callbacks to engine methods
5. Handles engine switching with confirmation dialog (clears state)
6. Listens for config changes via `storage` events and custom events

**Canvas Components:**
- `DrawioCanvas`: Embeds Draw.io editor, passes XML via props, calls `onSave(xml)` on user edits
- `ExcalidrawCanvas`: Embeds Excalidraw, parses JSON to elements, calls `onChange(elements)` on user edits

## Key Conventions

### File Organization

- **Pages:** `app/**/*.js` (Next.js App Router)
- **Components:** `components/*.jsx` (client components)
- **Hooks:** `hooks/*.js` (custom React hooks)
- **Utilities:** `lib/*.js` (non-React logic)
- **Prompts:** `lib/prompts/drawio.js` and `lib/prompts/excalidraw.js` (LLM system/user prompts)
- **API Routes:** `app/api/**/route.js`

### Code Style

- ES modules only (`import`/`export`)
- Client components marked with `"use client";`
- Tailwind CSS for styling
- No license headers
- Follow AGENTS.md for detailed conventions (see that file for specifics)

### LLM Prompts

- **Draw.io:** `lib/prompts/drawio.js` exports `SYSTEM_PROMPT` and `USER_PROMPT_TEMPLATE`
- **Excalidraw:** `lib/prompts/excalidraw.js` exports `SYSTEM_PROMPT` and `USER_PROMPT_TEMPLATE`
- Prompts are constructed in engine hooks, not in API routes

### Environment Variables (Optional)

For server-side LLM configuration (see `.env.example`):

```bash
ACCESS_PASSWORD=your-secure-password
SERVER_LLM_TYPE=anthropic  # or 'openai'
SERVER_LLM_BASE_URL=https://api.anthropic.com/v1
SERVER_LLM_API_KEY=sk-ant-your-key-here
SERVER_LLM_MODEL=claude-sonnet-4-5-20250929
```

When configured, users can access LLM via password instead of providing their own API keys. Route: `app/api/llm/config/route.js`

## Testing & Validation

**This project does not use automated tests.** Do not run tests after making code changes. Validate changes manually via `pnpm dev` only. See AGENTS.md for explicit guidance on this policy.

## Important Implementation Notes

1. **Arrow Optimization:** When working with Excalidraw arrows, always use `optimizeExcalidrawCode()` to calculate optimal connection points between elements

2. **XML Repair:** For Draw.io, always run generated XML through `fixUnclosed()` before applying to canvas, as LLMs may generate incomplete tags

3. **Config Changes:** Listen for both `storage` events (cross-tab sync) and custom events like `password-settings-changed` when config state changes

4. **Engine Switching:** Always prompt user confirmation before switching engines, as it clears conversation state

5. **Streaming Display:** Use `streamingContent` state to show real-time LLM output in the chat UI, separate from finalized `messages`

6. **History Restoration:** Check `history.editor` field matches current `engineType` before restoring; prompt to switch engines if mismatch

7. **Binary Attachments:** Images and files are stored as blobs in IndexedDB and referenced via `blobId` in message content

## Bilingual Documentation

Both Chinese (`README.md`) and English (`README_EN.md`) versions exist. When updating user-facing docs, maintain both if changes affect core features. Product requirements are in `docs/prd.md` (Chinese).

## Related Files

- **`AGENTS.md`**: Detailed coding conventions, style guide, and architectural patterns (authoritative reference)
- **`package.json`**: Dependencies and scripts
- **`.env.example`**: Server-side configuration template
