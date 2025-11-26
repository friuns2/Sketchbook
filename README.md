# Sketchbook

3D playground built on three.js and cannon.js with AI-powered content generation.

**Transform your game ideas into reality with our revolutionary AI game creator. No coding required - just describe your vision and watch it come to life.**

## Demo Videos

### Featured YouTube Demo
**Creating forest with talking ogre using AI**

Watch how AI brings a fantasy forest scene to life with an interactive talking ogre character:

<iframe width="560" height="315" src="https://www.youtube.com/embed/JmRra54vYGU" title="Creating forest with talking ogre using AI" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### Additional Demo Videos

- **2player.mp4** - Two-player gameplay demo
  <video width="560" height="315" controls>
    <source src="./videos/2player.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>

- **carbazoka.mp4** - Car bazooka action demo
  <video width="560" height="315" controls>
    <source src="./videos/carbazoka.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>

- **football.mp4** - Football game demo
  <video width="560" height="315" controls>
    <source src="./videos/football.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>

- **halloween.mp4** - Halloween themed game
  <video width="560" height="315" controls>
    <source src="./videos/halloween.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>

- **mikey.mp4** - Character demo
  <video width="560" height="315" controls>
    <source src="./videos/mikey.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>

- **minecraft.mp4** - Minecraft-style gameplay
  <video width="560" height="315" controls>
    <source src="./videos/minecraft.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>

- **particles.mp4** - Particle effects showcase
  <video width="560" height="315" controls>
    <source src="./videos/particles.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>

- **racing.mp4** - Racing game demo
  <video width="560" height="315" controls>
    <source src="./videos/racing.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>

- **zombies.mp4** - Zombie game demo
  <video width="560" height="315" controls>
    <source src="./videos/zombies.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>

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

