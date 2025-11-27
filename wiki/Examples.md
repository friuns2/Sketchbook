# Examples

This page contains examples of what you can create with Sketchbook AI using natural language prompts.

## Basic Examples

### Creating a Simple Character
**Prompt:** "Create a character that walks around randomly"

**Generated Code Concept:**
```typescript
// AI generates code similar to:
let character = new Character(world);
character.setPosition(0, 0, 0);
character.addAIBehaviour(new RandomWalkBehaviour());
world.add(character);
```

### Adding a Vehicle
**Prompt:** "Spawn a red sports car"

**Generated Code Concept:**
```typescript
let car = new Car(world);
car.setColor(0xff0000); // Red color
car.setPosition(10, 0, 0);
world.add(car);
```

## Advanced Examples

### AI-Powered Scenarios
**Prompt:** "Create a racing track with 3 AI cars competing"

**What the AI generates:**
- Racing track terrain
- Multiple AI-controlled vehicles
- Race logic and waypoints
- Leaderboards and timing

### Interactive Environments
**Prompt:** "Make a village with NPCs that greet the player"

**Generated features:**
- Multiple buildings and structures
- NPC characters with dialogue
- Interaction triggers
- Pathfinding between locations

### Dynamic Weather Systems
**Prompt:** "Add a day/night cycle with rain effects"

**Implementation:**
- Sky shader modifications
- Lighting changes over time
- Particle effects for rain
- Audio ambience changes

## Prompt Engineering Tips

### Be Specific
- Instead of "add a car", try "add a blue Formula 1 racing car at position (5, 0, 10)"
- Include coordinates, colors, and specific behaviors

### Build Incrementally
- Start with basic elements: "create a cube"
- Then enhance: "make the cube bounce when clicked"
- Finally polish: "add particle effects when the cube bounces"

### Use Context
- Reference existing objects: "make the character from before drive the new car"
- Build relationships: "connect these two buildings with a path"

### Specify Behaviors
- "The character should patrol between these points"
- "The vehicle should follow the player but keep distance"
- "This object should react to physics collisions"

## Troubleshooting

### Code Generation Issues
- If the AI generates invalid code, try rephrasing your prompt
- Be more specific about what classes/methods to use
- Check the browser console for error messages

### Performance Problems
- Large scenes may cause slowdown - try "optimize the scene for performance"
- Too many AI agents can impact framerate - reduce count or simplify behaviors

### Unexpected Behavior
- Use "debug the [specific behavior]" to get the AI to analyze and fix issues
- Try "simplify the code" if things get too complex
