# 🎯 Charlotte PWA v2 - English Learning Assistant

An intelligent English learning Progressive Web App (PWA) with advanced pronunciation assessment, intelligent XP system, and retry logic.

## ✨ Features

### 🎤 **Audio Processing**
- Real-time speech transcription using Azure Speech Services
- Advanced pronunciation assessment with detailed scoring
- Intelligent retry logic for low-quality audio
- Multi-language support (Portuguese + English for beginners)

### 🤖 **AI Assistant**
- GPT-4 powered conversation assistant
- Level-adaptive responses (Novice, Intermediate, Advanced)
- Pronunciation-focused feedback without phonetic symbols
- Context-aware conversations

### 🎯 **Intelligent XP System**
- Dynamic XP calculation based on pronunciation quality
- Audio duration and complexity bonuses
- Level-appropriate scoring thresholds
- Retry protection (no XP for poor quality attempts)

### 💬 **Chat Interface**
- WhatsApp-style modern UI
- Text and audio message support
- Sequential message delivery
- Real-time processing indicators

### 📊 **Progress Tracking**
- Session and total XP tracking
- Supabase database integration
- User statistics and analytics
- Practice history

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Microsoft Entra ID
- **Database**: Supabase
- **AI Services**: OpenAI GPT-4, Azure Speech Services
- **Audio Processing**: Web Audio API
- **PWA**: Service Worker, Manifest

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Azure Speech Services account
- OpenAI API key
- Supabase project
- Microsoft Entra ID app registration

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/felipehubacademy/charlotte-pwa-02-final.git
   cd charlotte-pwa-02-final
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```env
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Azure Speech Services
   AZURE_SPEECH_KEY=your_azure_speech_key
   AZURE_SPEECH_REGION=your_azure_region

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Microsoft Entra ID
   NEXT_PUBLIC_AZURE_CLIENT_ID=your_azure_client_id
   NEXT_PUBLIC_AZURE_TENANT_ID=your_azure_tenant_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 PWA Installation

The app can be installed as a PWA on mobile devices and desktops for a native app experience.

## 🎯 Key Components

### Audio XP Service (`lib/audio-xp-service.ts`)
- Intelligent XP calculation based on pronunciation scores
- Retry logic for poor quality audio
- Level-adaptive scoring thresholds

### Assistant API (`app/api/assistant/route.ts`)
- Handles both text and audio messages
- Phonetic symbol cleaning
- Level-appropriate responses

### Chat Interface (`app/chat/page.tsx`)
- Real-time audio processing
- Sequential message delivery
- Retry logic integration

## 🔧 Configuration

### User Levels
- **Novice**: Beginner-friendly with Portuguese support
- **Intermediate**: Business English focus
- **Advanced**: Professional communication

### XP Scoring
- **Audio Quality**: 20-100 XP based on pronunciation scores
- **Duration Bonus**: Up to 50 XP for longer recordings
- **Level Multiplier**: Higher rewards for advanced users
- **Retry Protection**: No XP awarded for poor quality attempts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Microsoft Azure for Speech Services
- Supabase for database services
- Hub Academy for educational guidance

---

**Built with ❤️ for English learners worldwide**
