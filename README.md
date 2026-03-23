# 💜 PurpleChat Neural

**PurpleChat Neural** is a high-performance, AI-powered chat interface built with Next.js 15 and Google's Gemini 2.0 Flash-Lite model. It features a clean, professional "Neural" aesthetic with real-time responsiveness and robust error handling.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Gemini API](https://img.shields.io/badge/Gemini_API-Flash--Lite-blue?style=for-the-badge&logo=google-gemini)

## ✨ Key Features

* **⚡ Ultra-Fast AI:** Powered by the latest Gemini 2.0 Flash-Lite for near-instant responses.
* **🧠 Intelligent Memory:** Maintains conversation context across multiple messages.
* **🌗 Adaptive UI:** Professional dark/light mode support via `next-themes`.
* **🛡️ Resilient Architecture:** Custom "Hydration Shield" and rate-limit retry logic to prevent crashes.
* **📱 Mobile-First:** Fully responsive design built with Tailwind CSS and Framer Motion.

## 🚀 Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **AI Engine:** [Google Generative AI SDK](https://ai.google.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)

## 🛠️ Getting Started

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/GeorgeMichael13/purplechat.git](https://github.com/GeorgeMichael13/purplechat.git)
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory and add your API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 🌐 Deployment

This project is optimized for deployment on **Netlify** or **Vercel**. 

> **Important:** Ensure you add your `GEMINI_API_KEY` to the environment variables in your deployment dashboard settings.

## 👤 Author

**George Victor**
- GitHub: [@GeorgeMichael13](https://github.com/GeorgeMichael13)
- Role: Computer Programmer & Next.js Developer