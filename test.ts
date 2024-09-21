

let key = "AIzaSyB0NhgGXtuTXHjuim3WrjCamcRucvVMOQk";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAICacheManager } from '@google/generative-ai/server';

(async () => {
// Sample text content (inline instead of uploading)





let sampleText = `
This is a sample text document.
It contains multiple lines of text.
The content can be analyzed by the AI model.
Key points and themes can be extracted from this text.
`;
for (let i = 0; i < 10; i++) {
    sampleText+=sampleText;
}
// Construct a GoogleAICacheManager using your API key.
const cacheManager = new GoogleAICacheManager(key);

// Create a cache with a 5 minute TTL.
const displayName = 'sample text document';
const model = 'models/gemini-1.5-flash-001';
const systemInstruction =
  'You are an expert text analyzer, and your job is to answer ' +
  "the user's query based on the text content you have access to.";
let ttlSeconds = 300;
const fs = require('fs');
const path = require('path');

// Function to fetch only .ts and .js files from the src and build/types directories, including subfolders
const fetchFilesFromBuildTypes = () => {
  const directories = ['build/types', 'src/examples'].map(dir => path.join(__dirname, dir));
  
  const getFilesRecursively = (dir) => {
    return fs.readdirSync(dir).flatMap(file => {


      const filePath = path.join(dir, file);
      return fs.statSync(filePath).isDirectory() 
        ? getFilesRecursively(filePath) // Recurse into subdirectory
        : (file.endsWith('.ts') || file.endsWith('.js')) 
          ? [filePath] // Include .ts or .js file
          : [];
    });
  };

  return directories.flatMap(directory => getFilesRecursively(directory)).map(file => {
    return {
      text: fs.readFileSync(file, 'utf-8'),
    };
  });
};

const parts = fetchFilesFromBuildTypes();


//parts.push({ text: sampleText }); // Add sampleText to parts

const cache = await cacheManager.create({
  model,
  displayName,
  //systemInstruction,
  contents: [
    {
      role: 'user',
      parts: parts,
    },
  ],
  ttlSeconds,
});

// Get your API key from https://aistudio.google.com/app/apikey
// Access your API key as an environment variable.
const genAI = new GoogleGenerativeAI(key);

// Construct a `GenerativeModel` which uses the cache object.
const genModel = genAI.getGenerativeModelFromCachedContent(cache);
let code = fs.readFileSync(path.join(__dirname, 'src/code.js'), 'utf-8');
let lastText ="add pistol model to hand";
// Query the model.
const result = await genModel.generateContent({
  contents: [
    { role: "user", parts: 
      [{ text: `Current code:\n\`\`\`javascript\n${code}\n\`\`\`\n\nRewrite current code to address user complaint: ${lastText}` }
      ]
    }
  ],
});



console.log(result.response.usageMetadata);

// The output should look something like this:
//
// {
//   promptTokenCount: 234,
//   candidatesTokenCount: 167,
//   totalTokenCount: 401,
//   cachedContentTokenCount: 200
// }

console.log(result.response.text());

})();