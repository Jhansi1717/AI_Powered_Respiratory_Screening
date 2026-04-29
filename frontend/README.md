# 🏥 Respiratory AI — Frontend (React)

This is the interactive dashboard for the Respiratory AI diagnostic platform. It provides clinical professionals with real-time audio analysis, history tracking, and diagnostic report generation.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
The app automatically detects your environment:
- **Development**: Connects to `http://localhost:8000`
- **Production**: Connects to the Render backend URL.

### 3. Start Development Server
```bash
npm start
```

## ✨ Features

- **📊 Clinical Dashboard**: Comprehensive overview of respiratory screenings.
- **🎙️ Live Recording**: Real-time waveform visualization during audio capture.
- **🌍 Multi-Language**: English, Spanish, Hindi, and Telugu support via custom translation engine.
- **🌗 Dark Mode**: Premium dark theme with Framer Motion transitions.
- **📄 PDF Reports**: Automated generation of clinical findings.
- **🔐 Protected Routes**: Secure access via JWT and persistent session management.

## 🛠️ Tech Stack

- **React 18**
- **Framer Motion** (Animations)
- **Lucide React** (Iconography)
- **Tailwind CSS** (Styling)
- **jsPDF** (Reporting)
- **Axios** (API Requests)

## 📁 Structure

- `/src/pages`: Main view components (Dashboard, Login, Signup).
- `/src/services`: API integration layer.
- `/src/utils`: Authentication, translation, and formatting helpers.
- `/src/components`: Reusable UI elements (Buttons, Cards, Modals).
