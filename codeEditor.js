require.config({
    paths: {
        vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.51.0/min/vs',
    }
});

var codeEditor;

new Vue({
    el: '#editorApp',
    data: {
        showEditor: true,
    },
    mounted() {
        this.initializeEditor();
    },
    methods: {
        async initializeEditor() {
            await new Promise(resolve => requestAnimationFrame(resolve));
            require(['vs/editor/editor.main'], async  ()=> {
                let classNames = await (fetch('paths.txt').then(r => r.text()));
                classNames = classNames.replaceAll("\\", "/").replaceAll("\r", "");
                classNames = classNames.split('\n');
                classNames.push("src/examples/helpers.js");
                classNames.push("src/utils.js");                    
                const LoadClass = async (className) => {

                    let three = className.includes("node_modules/@types/three/");
                    if (!className.includes("build/types/") && !three &&
                     !className.startsWith("src/") &&
                     //!className.includes("tween.d.ts") && 
                     !className.includes("sweetalert2.d.ts")) return;
                    const text = await (await fetch(className)).text();
                    
                    let code = text.replace(/export |import .*?;/gs, "");
                    //code = code.replaceAll("interface","class");
                    //let code = text.match(/export (?:declare )?(class [\s\S]*)/)?.[1] || text;
                    // if(className.includes("GLTFLoader"))debugger;
                    if (three && !className.includes("examples"))
                        code = "declare namespace THREE {" + code + "} "

                    if(className.includes("FunctionLibrary"))
                        code = "declare namespace Utils {" + code + "} "

                    await monaco.languages.typescript.typescriptDefaults.addExtraLib(code, `file:///${className}`);
                };

                await Promise.all(classNames.map(LoadClass));

                codeEditor = monaco.editor.create(document.getElementById('editorElement'), {
                    language: 'typescript',
                    theme: 'vs-dark',
                    readOnly: globalThis.isMobile, // Make editor readonly if on mobile
                });
                

                monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                    target: monaco.languages.typescript.ScriptTarget.ESNext,
                    module: monaco.languages.typescript.ModuleKind.ESNext,
                    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                    allowNonTsExtensions: true,
                });

                // Add Vue component for editor controls
                this.toggleEditor();

            });
        },
        toggleEditor() {
            this.showEditor = !this.showEditor;
        },
        runCode() {
            ResetState();            
            const code = codeEditor.getValue();
            chat.variant.files[0].content = code.replaceAll("export {};","");
            setTimeout(() => Eval(code), 100);
            this.toggleEditor();            
        }
    }
});

function SetCode(code) {
    codeEditor.setValue("export {};\n" + code.replaceAll("export {};\n","").replace(/import .*?;/gs, ""));
}
