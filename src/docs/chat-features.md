
# Chat Features Implementation Guide

This document outlines the implementation details of the chat functionalities in the Flyin.AI application.

## 1. Core Chat Functionality

The core chat system allows users to send messages and receive AI-generated responses. Conversations are organized into sessions and persisted in the browser's local storage.

### Key Files:

*   **`src/app/page.tsx`**:
    *   **State Management**: Manages the application's primary chat state, including `allConversations` (a record of message arrays keyed by chat ID), `chatSessions` (an array of chat session metadata like ID, title, timestamp), and `activeChatId`.
    *   **Message Handling**: The `handleSendMessage` function is central. It takes the user's prompt, creates a user message, sends it to the AI flow, and then adds the AI's response to the conversation.
    *   **Session Management**: Handles creation of new chat sessions when a message is sent in a new context. The session title is derived from the first user message.
    *   **Local Storage Integration**: Uses `useEffect` hooks to load chat sessions, conversations, and the active chat ID from local storage on component mount. It also saves these states back to local storage whenever they change using functions from `src/lib/storage.ts`.
*   **`src/ai/flows/chat-flow.ts`**:
    *   **AI Interaction**: This Genkit flow (`chatFlow`) is responsible for communicating with the AI model (Gemini). It takes the user's prompt as input and returns the AI's textual response.
*   **`src/types/chat.ts`**:
    *   **Data Structures**: Defines the TypeScript interfaces `Message` (for individual chat messages) and `ChatSession` (for chat session metadata).
*   **`src/lib/storage.ts`**:
    *   **Persistence**: Provides functions (`loadChatSessions`, `saveChatSessions`, `loadConversations`, `saveConversations`, `loadActiveChatId`, `saveActiveChatId`) to interact with the browser's `localStorage`, allowing chat data to persist across sessions. It includes date revival logic for timestamps.

### How it Works:

1.  When the application loads, `src/app/page.tsx` attempts to load existing chat sessions and conversations from local storage.
2.  The user types a message into the `PromptComposer`.
3.  Upon sending, `handleSendMessage` in `src/app/page.tsx` is triggered.
    *   If it's a new chat, a new `ChatSession` is created and added to `chatSessions`. `activeChatId` is set to the new session's ID.
    *   The user's message is added to the `allConversations` state for the `activeChatId`.
    *   The `chatFlow` (from `src/ai/flows/chat-flow.ts`) is called with the user's prompt.
    *   The AI's response is then added as another message to `allConversations`.
    *   Timestamps for sessions are updated to reflect recent activity.
4.  All changes to `chatSessions`, `allConversations`, and `activeChatId` are automatically saved to local storage.
5.  The `ChatWindow` component re-renders to display the updated conversation.

## 2. Chat User Interface (UI)

The chat UI is built with several reusable React components using Next.js and ShadCN UI library.

### Key Files:

*   **`src/components/layout/app-layout.tsx`**: The main layout component that arranges the sidebar, chat window, and prompt composer. It also handles the mobile layout using a `Sheet` for the sidebar.
*   **`src/components/chat/chat-window.tsx`**:
    *   Displays the list of messages for the currently active chat.
    *   Uses `ScrollArea` for scrollable content.
    *   Automatically scrolls to the bottom when new messages are added or when the AI is typing.
    *   Renders `ChatMessage` for each message and `InitialPromptDisplay` if the conversation is empty.
*   **`src/components/chat/chat-message.tsx`**:
    *   Renders an individual message bubble, styled differently for user and AI messages.
    *   Displays sender avatar (Bot or User icon), message text, and a formatted timestamp.
    *   Shows a loading indicator (`Loader2`) if the message is from the AI and `isLoading` is true.
*   **`src/components/chat/initial-prompt-display.tsx`**:
    *   Shown when a new chat is started or no chat is active.
    *   Displays a welcome message and suggestion cards related to travel and flights to help users get started.
*   **`src/components/prompt/prompt-composer.tsx`**:
    *   The text input area where users type their messages.
    *   Includes a `Textarea` that auto-adjusts its height.
    *   Features a send button and integrates the voice input functionality.
*   **`src/components/sidebar/sidebar-navigation.tsx`**:
    *   The main container for the left sidebar.
    *   Organizes chat sessions into time-based categories (Today, Yesterday, Previous 7 Days, etc.) using `SidebarHistorySection`.
*   **`src/components/sidebar/sidebar-header.tsx`**: Displays the "Flyin.AI" title at the top of the sidebar.
*   **`src/components/sidebar/sidebar-search-actions.tsx`**: Contains the "New Chat" button. (Chat search functionality is basic).
*   **`src/components/sidebar/sidebar-history-section.tsx`**: Renders a titled section (e.g., "Today") with a list of chat sessions. Each session is a clickable button that activates that chat.
*   **`src/components/layout/mobile-header.tsx`**: Provides the top header for mobile views, including a menu button to toggle the sidebar and a new chat button.

## 3. Voice Input

Users can provide input via voice by holding down the microphone button.

### Key Files:

*   **`src/components/prompt/prompt-composer.tsx`**:
    *   **Web Speech API**: Utilizes the browser's `SpeechRecognition` API (`window.SpeechRecognition` or `window.webkitSpeechRecognition`).
    *   **Mic Button**: A floating action button styled with a microphone icon.
        *   `onMouseDown`/`onTouchStart`: When the button is pressed, it clears the input field, starts speech recognition (`speechRecognitionRef.current.start()`), and sets `isListening` to true. The button shows a pulsing animation.
        *   `onMouseUp`/`onTouchEnd`/`onMouseLeave`: When the button is released (or mouse leaves), it stops speech recognition (`speechRecognitionRef.current.stop()`).
    *   **Event Handling**:
        *   `recognition.onresult`: As the user speaks, interim results update the input field (`inputValue`) in real-time. The `inputValueRef` is used to access the most current value in async handlers.
        *   `recognition.onend`: When speech recognition ends (mic released), the final transcript is retrieved from `inputValueRef.current`. If the transcript is not empty, `onSendMessage` is called to process it as a chat message. The input field and suggestions are then cleared.
        *   `recognition.onerror`: Handles any speech recognition errors.
    *   **UI Feedback**: The input placeholder changes to "Listening..." and the mic button pulses while recording.

### How it Works:

1.  User presses and holds the microphone button in `PromptComposer`.
2.  Speech recognition starts. The mic button pulses, and the input placeholder indicates listening.
3.  As the user speaks, the `Textarea` is updated with the interim transcript via the `inputValue` state.
4.  When the user releases the mic button, speech recognition stops.
5.  The `onend` event handler takes the final transcript from `inputValueRef.current`.
6.  If the transcript is valid, it's passed to `onSendMessage` (propagated from `src/app/page.tsx`) to be processed like a typed message.
7.  The input field is cleared.

## 4. Adaptive Suggestions

The application provides contextual follow-up suggestions based on the user's input.

### Key Files:

*   **`src/components/prompt/prompt-composer.tsx`**:
    *   **Fetching Suggestions**: A `useEffect` hook observes changes in `inputValue`. After a short delay (debouncing via `setTimeout`) and if the input meets certain criteria (length, contains space), it calls `fetchAdaptiveSuggestions`.
    *   `fetchAdaptiveSuggestions`: Calls the `generateSuggestions` Genkit flow with the current user input. Updates the `suggestions` state with the response.
*   **`src/components/prompt/suggestion-bar.tsx`**:
    *   **Display**: Renders a row of buttons, each representing a suggestion.
    *   **Interaction**: When a suggestion button is clicked, its text is appended to the current input in `PromptComposer`, and the textarea is focused.
    *   **Loading State**: Shows a loading indicator while suggestions are being fetched.
    *   **Icons**: Can display icons next to suggestions if an `iconMap` is provided (e.g., Search, Reason).
*   **`src/ai/flows/adaptive-suggestions.ts`**:
    *   **Genkit Flow**: `generateSuggestions` (and the internal `adaptiveSuggestionsFlow`) takes the user's input string and uses an AI prompt to generate a list of 1-2 word follow-up action suggestions.

### How it Works:

1.  As the user types in `PromptComposer`, a debounced effect triggers `fetchAdaptiveSuggestions`.
2.  This function calls the `generateSuggestions` flow in `src/ai/flows/adaptive-suggestions.ts`.
3.  The AI flow processes the `userInput` and returns an array of strings (suggestions).
4.  The `suggestions` state in `PromptComposer` is updated.
5.  `SuggestionBar` re-renders, displaying the new suggestions as clickable buttons.
6.  If the user clicks a suggestion, its text is appended to the `Textarea` in `PromptComposer`.

## 5. Local Storage for Chat Persistence

Chat sessions and conversations are saved in the browser's local storage to persist across browser sessions.

### Key Files:

*   **`src/lib/storage.ts`**:
    *   **Core Logic**: Contains functions to save and load chat sessions (`ChatSession[]`), conversations (`Record<string, Message[]>`), and the ID of the active chat.
    *   **Keys**: Uses `CHAT_SESSIONS_KEY`, `CONVERSATIONS_KEY`, and `ACTIVE_CHAT_ID_KEY` for storing data.
    *   **Error Handling**: Includes `try...catch` blocks for `JSON.parse` and `localStorage.setItem` to handle potential errors gracefully (e.g., corrupted data, storage full).
    *   **Date Revival**: The `safeJsonParse` helper function ensures that when loading data, timestamps (which are stored as ISO strings in JSON) are converted back into `Date` objects for both `ChatSession` and `Message` types.
*   **`src/app/page.tsx`**:
    *   **Integration**:
        *   On component mount (`useEffect` with an empty dependency array), it calls `loadChatSessions`, `loadConversations`, and `loadActiveChatId` to initialize the state from local storage.
        *   Separate `useEffect` hooks are set up to watch for changes in `chatSessions`, `allConversations`, and `activeChatId`. When these states change, the corresponding save functions from `src/lib/storage.ts` are called to update local storage.

### How it Works:

*   **Loading**: When `HomePage` mounts, it reads the stored chat data from local storage. If no data exists or if there's an error during parsing, it defaults to empty states (e.g., `[]` for sessions, `{}` for conversations). Corrupted data for a specific key will lead to that key being cleared from local storage.
*   **Saving**:
    *   Whenever a new chat session is created or an existing one is updated (e.g., its timestamp is updated on a new message), `saveChatSessions` is called.
    *   Whenever a message is added to any conversation, `saveConversations` is called.
    *   Whenever the active chat changes (user selects a different chat, starts a new one, or the last chat is removed), `saveActiveChatId` is called.
*   This mechanism ensures that the user's chat history and current active chat are preserved even if they close the browser tab or window and reopen it later.
      