import('./code.js');
let codeFile = "./code.js";

let settings = {
    apiUrl: "",
    apiKey: "",
    enableBreakpoints:false,
    model: { selected: "gemini-1.5-flash-latest", options: ["gemini-1.5-pro-exp-0801", "gemini-1.5-pro-latest", "gemini-1.5-flash-latest", "gpt-4o-mini"] },
/*
    rules: `You will help write javascript code for a 3D game. 
App description: GTA style 3D game
Technologies: swift502/Sketchbook 3D playground built on three.js and cannon.js.

You should always rewrite the whole code WITHOUT COMMENTS`,
*/
    importantRules: '',
    a:`to add/parrent object prefer .attach() methods, remember to set object position to 0,0,0 after attaching
to get object .position prefer .getWorldPosition() method
You should always rewrite the whole code WITHOUT COMMENTS
`
}

