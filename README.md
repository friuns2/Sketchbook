# Sketchbook

3D playground built on three.js and cannon.js with AI-powered content generation.

**Transform your game ideas into reality with our revolutionary AI game creator. No coding required - just describe your vision and watch it come to life.**

## Watch how AI brings a fantasy forest scene to life with an interactive talking ogre character:

https://github.com/user-attachments/assets/c269e842-af3a-4074-90cd-7d830c08ddbf


### Additional Demo Videos

- **[2player.mp4](https://github.com/user-attachments/assets/2820a003-fe04-4991-8da4-d586fba6340b)** - Two-player gameplay demo
- **[carbazoka.mp4](https://github.com/user-attachments/assets/174439e5-7e38-48a9-a5db-a696a44b346a)** - Car bazooka action demo
- **[football.mp4](https://github.com/user-attachments/assets/89767c20-cb88-4522-b68a-086ebf6cbf20)** - Football game demo
- **[halloween.mp4](https://github.com/user-attachments/assets/83c98a8b-0db7-4fbc-9368-9ca356c39fb8)** - Halloween themed game
- **[mikey.mp4](https://github.com/user-attachments/assets/bafb82d3-600d-4f7d-a40c-3bee0c757c88)** - Character demo
- **[minecraft.mp4](https://github.com/user-attachments/assets/5c4e0de8-1b8f-4416-a452-536ad3279790)** - Minecraft-style gameplay
- **[particles.mp4](https://github.com/user-attachments/assets/e6587e2c-3bcc-4abb-8a21-f19a770c1bf4)** - Particle effects showcase
- **[racing.mp4](https://github.com/user-attachments/assets/ac41d7ad-f710-4d06-b6a7-be7ceda86619)** - Racing game demo
- **[zombies.mp4](https://github.com/user-attachments/assets/624d1793-f9e5-4734-ad86-9dfec28250da)** - Zombie game demo

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:8080 in your browser.

## Running Tests

To test the application:

1. Start the development server: `npm run dev`
2. Open http://localhost:8080 in your browser
3. Use the controls to interact with the 3D world:
   - **WASD** - Movement
   - **Shift** - Run
   - **Space** - Jump
   - **F** - Enter vehicle
   - **G** - Enter as passenger
   - **X** - Switch seat
   - **E** - Interact
   - **Alt + ←** - Undo
   - **Alt + →** - Redo
   - **Shift + C** - Free camera

## LLM API Keys Configuration

LLM keys are configured in `localSettings.js`. Create this file in the project root if it doesn't exist:

```javascript
// localSettings.js
settings.model.selected = "anthropic/claude-3-haiku";  // or your preferred model
settings.apiUrl = "https://openrouter.ai/api/v1/chat/completions";  // API endpoint
settings.apiKey = "your-api-key-here";  // Your API key
```

### Supported API Providers

- **OpenRouter**: Use OpenRouter API keys with their endpoint
- **Gemini**: Built-in support for Gemini models (gemini-1.5-flash-latest, gemini-1.5-pro-latest)
- **Hugging Face**: Use keys starting with `hf_` for Hugging Face Inference endpoints

Default models available in `src/settings.js`:
- `gemini-1.5-pro-exp-0801`
- `gemini-1.5-pro-latest`
- `gemini-1.5-flash-latest`
- `gpt-4o-mini`

## Build

```bash
# Production build
npm run build
```

## License

License: TBD

No license is granted yet. I will choose an open-source license later.

