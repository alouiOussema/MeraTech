# منصّة إبصار - IBSAR Inclusive Platform

## 📱 About the Project
**IBSAR** is a responsive, accessible web application prototype designed for the visually impaired, elderly, and people with limited mobility. The interface uses **Tunisian Darja** and is optimized for screen readers, voice interaction, and keyboard navigation.

## 🛠️ Tech Stack
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS (Mobile-first, Dark Mode support)
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **Accessibility:** WCAG 2.1 guidelines (Semantic HTML, ARIA, Focus management)

## ✨ Key Features

### ♿ Accessibility First
- **High Contrast:** Clear color combinations and distinct focus rings.
- **Screen Reader Friendly:** Semantic headings, landmarks, and ARIA labels.
- **Keyboard Navigation:** Full support with a "Skip to content" link.
- **Customization:** Settings to adjust font size, toggle dark mode, and reduce motion.

### 🗣️ Voice Interaction (Simulation)
- **Voice Assistant:** Integrated into Banking and Shopping pages.
- **Darja Commands:** Supports simulated commands like "شنوّة رصيدي؟" (What's my balance?) or "زيد حليب" (Add milk).

### 📄 Pages
1.  **Landing:** Main entry with large "Start Voice" action.
2.  **Authentication:** Accessible Login and Register forms.
3.  **Banque (Bank):** Check balance, view history, and simulate transfers.
4.  **Courses (Shopping):** Manage shopping list with voice or buttons.
5.  **Settings:** Accessibility preferences (Theme, Font Size, Voice Feedback).

## 🚀 How to Run

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Development Server:**
    ```bash
    npm run dev
    ```

3.  **Open in Browser:**
    Navigate to `http://localhost:5173`

## 🧪 Testing Accessibility
- Use **Tab** key to navigate through interactive elements.
- Turn on a screen reader (NVDA, VoiceOver) to hear aria-labels.
- Try the **Voice Assistant** buttons to simulate voice commands.
