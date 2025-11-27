# Sketchbook

<div align="center">

![Sketchbook Banner](https://github.com/user-attachments/assets/c269e842-af3a-4074-90cd-7d830c08ddbf)

**A Next-Generation 3D Sandbox Engine combining Three.js, Cannon.js, and "Text-to-World" Generative AI.**

[Features](#features) • [Text-to-World AI](#text-to-world-ai) • [Showcase](#ai-generated-showcase) • [Comparison](#comparison-vs-other-platforms) • [Getting Started](#getting-started) • [Controls](#controls)

</div>

---

## Overview

Sketchbook is not just a game engine—it is a **Generative 3D Playground**. It bridges the gap between natural language and interactive 3D worlds. Users can describe complex game mechanics, characters, vehicles, or scenarios, and the engine's integrated AI agent generates the necessary TypeScript code in real-time, compiles it, and injects it into the running world without a reload.

Built on the robust foundation of **Three.js** for rendering and **Cannon.js** for physics, Sketchbook offers a physically accurate, visually stunning, and infinitely extensible environment.

---

## AI Generated Showcase

**Every demo below was created solely by prompting the AI.**
No manual coding was performed for these specific scenarios. The user simply described the desired logic, physics interactions, or game rules, and Sketchbook generated the implementation.

### 🌲 Fantasy Scene Generation
> *"Create a fantasy forest scene with an interactive talking ogre."*

https://github.com/user-attachments/assets/c269e842-af3a-4074-90cd-7d830c08ddbf

### 💥 Physics-Based Combat
> *"Create a car with a rocket launcher that shoots explosive projectiles."*

<details>
<summary><b>📺 Watch Demo</b></summary>

https://github.com/user-attachments/assets/174439e5-7e38-48a9-a5db-a696a44b346a
</details>

### ⚽ Sports Logic
> *"Add a football game mechanic with a ball and goals."*

<details>
<summary><b>📺 Watch Demo</b></summary>

https://github.com/user-attachments/assets/89767c20-cb88-4522-b68a-086ebf6cbf20
</details>

### 🤝 Multiplayer Interaction
> *"Enable two-player split-screen gameplay."*

<details>
<summary><b>📺 Watch Demo</b></summary>

https://github.com/user-attachments/assets/2820a003-fe04-4991-8da4-d586fba6340b
</details>

### 🏎️ Racing Mechanics
> *"Create a racing circuit with lap timing."*

<details>
<summary><b>📺 Watch Demo</b></summary>

https://github.com/user-attachments/assets/ac41d7ad-f710-4d06-b6a7-be7ceda86619
</details>

### 🧟 AI Behavior
> *"Spawn zombies that chase the player."*

<details>
<summary><b>📺 Watch Demo</b></summary>

https://github.com/user-attachments/assets/624d1793-f9e5-4734-ad86-9dfec28250da
</details>

---

## Comparison vs Other Platforms

Sketchbook occupies a unique niche in the "Generative Game Engine" landscape by focusing on **code generation** over asset assembly, offering lower-level control and transparency than its SaaS competitors.

| Feature | **Sketchbook** | **BitMagic** | **Rosebud AI** | **Buildbox 4** | **Hiber3D** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Output** | **TypeScript Code** | Game Levels | Assets & Scripts | Drag & Drop + AI | 3D Worlds |
| **Model** | **Open Source** (Self-Hosted) | SaaS / Closed | SaaS / Web-Based | Commercial | SaaS / Web-Based |
| **Mechanism** | **Code Generation** (Logic) | Asset Assembly | "Vibe Coding" | No-Code Assistant | Asset Assembly |
| **Tech Stack** | Three.js + Cannon.js | Proprietary | WebGL / Phaser | Proprietary | Custom Engine |
| **Customization** | Unlimited (Full Code Access) | Platform Constraints | Web Editor | Engine Constraints | Platform Constraints |
| **Cost** | Free (Your API Key) | Freemium | Freemium | Paid License | Freemium |

*   **BitMagic** excels at quickly assembling playable levels using a vast library of pre-made assets and multiplayer "co-prompting," but the underlying logic is often hidden.
*   **Rosebud AI** focuses on web-based games (often 2D or simple 3D) with a "Vibe Coding" interface that assists in asset generation.
*   **Buildbox 4** uses AI to assist its existing No-Code drag-and-drop workflow, making it great for non-coders but less flexible for custom logic.
*   **Sketchbook** generates raw, editable TypeScript. It teaches you *how* the game works rather than just showing you the result, making it ideal for developers and prototyping.

---

## Features

### 🏎️ Advanced Vehicle Physics
Sketchbook implements a high-fidelity vehicle simulation model.
*   **Raycast Vehicle System:** Uses raycasting for wheel detection, ensuring smooth movement over uneven terrain.
*   **Dynamic Suspension:** Configurable stiffness, rest length, and travel for realistic chassis interaction.
*   **Drivetrain Simulation:** Supports AWD, RWD, and FWD configurations with realistic engine force and gear shifting curves.
*   **Air Control:** Arcade-style air control mechanics allow for stunts and mid-air reorientation.

### 🏃 3rd Person Character Controller
A versatile character system designed for exploration and interaction.
*   **State Machine Architecture:** Robust state handling (Idle, Walk, Run, Sprint, Jump, Falling, Driving, Entering/Exiting vehicles).
*   **Capsule Physics:** Physics-based movement using a capsule collider preventing tunneling and ensuring proper collision response.

### 🤖 Generative AI (Text-to-World)
The core innovation of Sketchbook.
*   **Context-Aware Generation:** The AI is fed the current state of the codebase, type definitions, and helper libraries, allowing it to write code that *actually works* within the engine's specific architecture.
*   **Real-time Code Injection:** Generated code is executed immediately. No build steps required.
*   **Multi-Model Support:** Plug-and-play support for Anthropic (Claude), OpenAI (GPT-4), Google (Gemini), and local models via HuggingFace.

---

## Technical Architecture

### Tech Stack
*   **Language:** TypeScript
*   **Renderer:** Three.js
*   **Physics:** Cannon-es (Fork of cannon.js)
*   **Build Tool:** Webpack
*   **UI:** Vue.js (for the overlay), Dat.GUI (for debugging)
*   **Editor:** Monaco Editor

### Core Concepts
*   **World (`src/ts/world/World.ts`):** The central hub. Manages the physics world, graphics scene, update loops, and entity registry.
*   **Entities (`src/ts/core/IUpdatable.ts`):** Almost everything is an `IUpdatable`. The `World` iterates through these every frame.
*   **Characters (`src/ts/characters/Character.ts`):** Complex composite objects containing:
    *   `CharacterCapsule`: The physical representation.
    *   `CharacterState`: The logic representation (StateMachine).
    *   `Model`: The visual representation.

---

## Getting Started

### Prerequisites
*   **Node.js** (v16.0.0 or higher)
*   **npm** (v7.0.0 or higher)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/swift502/Sketchbook.git
    cd Sketchbook
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```
    *Note: If you encounter peer dependency warnings, they can usually be ignored.*

3.  **Start Development Server**
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:8080`.

4.  **Build for Production**
    ```bash
    npm run build
    ```
    Output is generated in the `build/` directory.

---

## Configuration

To unlock the AI features, you must configure your API keys. Sketchbook looks for a `localSettings.js` file in the root directory.

1.  Create `localSettings.js` in the project root.
2.  Paste the following configuration (adjusting for your preferred provider):

```javascript
// localSettings.js

// === OPTION 1: OpenRouter (Recommended for best performance) ===
// Access Claude 3.5 Sonnet, GPT-4o, etc.
settings.model.selected = "anthropic/claude-3-haiku";
settings.apiUrl = "https://openrouter.ai/api/v1";
settings.apiKey = "sk-or-v1-YOUR-OPENROUTER-KEY";

// === OPTION 2: Google Gemini ===
// settings.model.selected = "gemini-1.5-flash-latest";
// settings.apiKey = "AIzaSy-YOUR-GEMINI-KEY";

// === OPTION 3: Hugging Face ===
// settings.apiKey = "hf_YOUR-HUGGINGFACE-TOKEN";
```

*Note: `localSettings.js` is git-ignored to prevent accidental key leakage.*

---

## Controls

The control scheme mimics standard PC action games.

### Character Mode
| Key | Action |
| :--- | :--- |
| **W, A, S, D** | Move Character |
| **Shift** | Sprint |
| **Space** | Jump |
| **F** | Enter Vehicle (Driver) |
| **G** | Enter Vehicle (Passenger) |
| **E** | Interact / Use Item |
| **V** | Toggle First/Third Person |
| **Shift + C** | Toggle Free Camera |
| **Alt + ←/→** | Undo / Redo AI Generation |

### Vehicle Mode
| Key | Action |
| :--- | :--- |
| **W** | Throttle |
| **S** | Brake / Reverse |
| **A, D** | Steer Left / Right |
| **Space** | Handbrake |
| **F** | Exit Vehicle |
| **X** | Switch Seat |
| **V** | Camera View |

### Editor & AI
| Key | Action |
| :--- | :--- |
| **`** (Backtick) | Open AI Prompt Bar |
| **Ctrl + Enter** | Run Code (in Editor) |

---

## Credits

**Core Engineering:** [Ján Bláha (Swift502)](http://jblaha.art/)
**Original Concept:** A 3D portfolio project evolving into an AI sandbox.
**Libraries:** Three.js, Cannon-es, PeerJS, Vue.js, Monaco Editor.

---

## License

*Copyright (c) 2024. All rights reserved.*
(License TBD - Check repository root for updates)
