# How I Forked Sketchbook and Added "Text-to-World" AI Features

In this article, I will explain how I transformed a traditional 3D game engine into a Generative AI Playground. The goal was to allow users to build 3D worlds simply by typing what they want.

## Overview

I started by forking [Sketchbook](https://github.com/swift502/Sketchbook), an excellent open-source 3D playground built with **Three.js** and **Cannon.js** by swift502. The original project provided a robust physics engine, a character controller, and a vehicle system—a perfect foundation.

My additions focused on integrating a Large Language Model (LLM) to generate TypeScript code on the fly, which the engine then compiles and executes in real-time.

## 1. The Core AI Integration

The heart of the new functionality lies in `src/gptapi.js`. This module handles communication with various AI providers (OpenAI, Anthropic, Gemini, or local models via Hugging Face).

I added a `getChatGPTResponse` function that supports streaming responses. This allows the user to see the code being generated in real-time, which is crucial for the "magic" feeling of the application.

```javascript
// src/gptapi.js

globalThis.getChatGPTResponse = async function* ({messages, functions, model="grok-code", signal, apiUrl=siteUrl, apiKey=settings.apiKey}) {
    // Prepare messages for the API
    messages = messages.map(message => ({
        role: message.role,
        content: message.content,
        name: message.name,
        function_call: message.function_call
    }));

    let body = {
        model: model,
        messages: messages,
        functions: functions,
        stream: true,
        max_tokens: 100000 // Allow for long code generation
    };

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
    };

    const response = await fetch(apiUrl + "/chat/completions", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
        signal: signal
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let combined = { message: {} };

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value);
        const parts = buffer.split("\n");
        buffer = parts.pop();

        for (const part of parts) {
            if (part.startsWith("data: ")) {
                if (part.substring(6) === "[DONE]") return combined;

                let json = JSON.parse(part.substring(6));
                let responseObj = json.choices?.[0];

                if (responseObj) {
                    // Merge partial JSON chunks
                    combined.message = combineJSON(combined.message, responseObj.delta);
                    combined = { ...combined, ...responseObj };
                    yield combined;
                }
            }
        }
    }
}
```

## 2. Context Injection: Teaching the AI the Engine

The biggest challenge was ensuring the AI writes valid code that works with the specific classes and methods of Sketchbook (e.g., `World`, `Character`, `Vehicle`).

To solve this, I injected the TypeScript definition files (`.d.ts`) and key example files directly into the system prompt. This gives the LLM the "context" it needs to be a competent developer for this specific engine.

Here is how the prompt is constructed in `src/index.js`:

```javascript
// src/index.js

// 1. Gather relevant type definitions and examples
const srcFiles = [
    'build/types/world/World.d.ts',
    'build/types/characters/Character.d.ts',
    'build/types/vehicles/Car.d.ts',
    'src/ts/characters/character_ai/FollowTarget.ts',
    // ... other key files
];

// 2. Helper function to read file content and format it
async function fetchAndProcessFilesCombined(fileNames) {
    let files = await fetchAndProcessFiles(fileNames);
    return files.map(file => `<file name="${file.name}">\n${file.content}\n</file>`).join('\n\n');
}

// 3. The actual call to the AI
let SendMessage = async (model, i) => {
    // ...
    const response = await getChatGPTResponse({
        model,
        apiKey: settings.apiKey,
        messages: [
            // System prompt: Here is how the engine works
            {
                role: "system",
                content: "Note: examples are not included in source code\n" + await fetchAndProcessFilesCombined(examples)
            },
            {
                role: "system",
                content: await fetchAndProcessFilesCombined(srcFiles)
            },
            // User Prompt: Here is what I want (plus the current code state)
            {
                role: "user",
                content: `${previousUserMessages}\n\nCurrent code:\n\`\`\`typescript\n${code}\n\`\`\`\n\nRewrite current code to accomplish user complain: ${this.params.lastText}`
            }
        ],
        // ...
    });
    // ...
};
```

## 3. Real-Time Code Execution

Once the AI generates the code, it needs to run immediately. I implemented a dynamic evaluation system in `src/errorHandling.js`. It takes the generated TypeScript, compiles it to JavaScript in the browser (using a TypeScript compiler script), and injects it.

```javascript
// src/errorHandling.js

async function Eval(content) {
    if(!content?.trim()) throw "empty code";

    // 1. Compile TypeScript to JavaScript in the browser
    // "compileTypeScript" is a custom helper using the 'typescript' library
    let compiledCode = compileTypeScript(content);

    // 2. Pre-process code for the environment
    // We expose global variables so the script can access the game world
    var code = compiledCode
        .replace(/\b(let|const)\s+(\w+)\s*=/g, 'let $2 = globalThis.$2 =');

    // 3. Execute the code
    try {
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = code;
        document.body.appendChild(script);
    } catch(e) {
        console.error(e);
        // If execution fails, we feed the error back to the AI in the next turn!
    }
}
```

## 4. Error Handling and Iteration

A key insight was treating compilation and runtime errors as feedback for the AI. When generated code fails, the error message becomes part of the next prompt, allowing the AI to iteratively improve the code.

## 5. User Experience Considerations

- **Streaming Responses**: Users see code being generated in real-time
- **Progressive Enhancement**: The system builds upon existing code rather than replacing it
- **Safety Boundaries**: Generated code runs in a sandboxed environment
- **Fallback Mechanisms**: If AI generation fails, users can still edit code manually

## Conclusion

By forking Sketchbook and adding these components—**Streaming API**, **Context Injection**, **Dynamic Evaluation**, and **Error Feedback**—I created a "Text-to-World" engine. The AI acts as an intermediate developer, translating natural language intent into the precise TypeScript calls required by the underlying 3D engine.

This approach demonstrates how Large Language Models can augment creative coding workflows, making 3D development more accessible while maintaining the power and flexibility of traditional programming.

## Future Enhancements

- Multi-modal input (voice, images, sketches)
- Collaborative editing with multiple AI assistants
- Integration with version control for generated code
- Performance optimizations for real-time execution
- Extended support for additional 3D libraries and frameworks
