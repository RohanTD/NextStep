# NextStep: Social Resource Chatbot

NextStep is a cross-platform Expo app that helps underserved patients and community members find local social services such as food, housing, healthcare, employment, and more. Users can chat with an AI assistant to get personalized resource recommendations based on their needs and location.

## Features

- Conversational AI assistant for social resource navigation
- Introductory survey to personalize recommendations
- Resource matching for food, housing, healthcare, employment, legal aid, and more
- Animated, user-friendly chat interface
- Built with [Expo](https://expo.dev/) and React Native

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/NextStepChatbot.git
   cd NextStepChatbot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your OpenAI API key:

   - Copy `.env.example` to `.env` and add your `OPENAI_API_KEY` value.

4. Start the development server:

   ```bash
   npx expo start
   ```

5. Open the app in your simulator, device, or web browser as prompted.

## Project Structure

- `app/` - Main app screens and navigation
- `components/` - Reusable UI components
- `constants/` - App-wide constants (e.g., colors)
- `hooks/` - Custom React hooks
- `utils/` - Resource processing and AI logic
- `assets/` - Static assets (resources, images, fonts)

## Usage

1. Complete the intro survey to provide your background and needs.
2. Chat with the AI assistant to describe what help you’re looking for.
3. Receive tailored resource recommendations and follow-up questions.

## Scripts

- `npm start` - Start the Expo development server
- `npm run reset-project` - Reset the project to a blank state

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)

## License

MIT

---

*This project is for demonstration and educational purposes. Please ensure you comply with privacy and data protection regulations when handling user