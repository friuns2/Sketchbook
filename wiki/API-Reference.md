# API Reference

This page documents the key APIs and functions used in Sketchbook AI.

## AI Integration APIs

### `getChatGPTResponse(options)`

Streams AI responses for code generation.

**Parameters:**
- `messages`: Array of chat messages with role, content, etc.
- `functions`: Optional function definitions for the AI
- `model`: AI model to use (default: "grok-code")
- `signal`: AbortSignal for cancelling requests
- `apiUrl`: Base URL for the API endpoint
- `apiKey`: Authentication key for the AI service

**Returns:** Async generator yielding response chunks

### `Eval(content)`

Compiles and executes generated TypeScript code in the browser environment.

**Parameters:**
- `content`: TypeScript code string to execute

**Throws:** Error if code is empty or compilation/execution fails

## Core Engine Classes

### World
The main 3D world container and physics simulation manager.

**Key Methods:**
- `add(entity)`: Add an entity to the world
- `remove(entity)`: Remove an entity from the world
- `update()`: Update world physics and entities

### Character
Represents controllable characters in the 3D world.

**Key Methods:**
- `setPosition(x, y, z)`: Set character position
- `setRotation(x, y, z)`: Set character rotation
- `playAnimation(name)`: Play a character animation

### Vehicle
Base class for vehicles like cars, airplanes, helicopters.

**Key Methods:**
- `addDriver(character)`: Add a character as driver
- `startEngine()`: Start the vehicle engine
- `accelerate(power)`: Apply acceleration

## Utility Functions

### `compileTypeScript(code)`
Compiles TypeScript code to JavaScript in the browser.

### `combineJSON(target, source)`
Merges partial JSON objects from streaming responses.

### `fetchAndProcessFiles(fileNames)`
Loads and processes multiple files for context injection.
