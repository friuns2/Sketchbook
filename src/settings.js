globalThis.isLocal = window.location.hostname === "localhost";
//import(globalThis.isLocal ? './code2.ts' : './codeTemplate.js');


let settings = {

    apiKey: "sk-XyMEqVpNCa0YtYDE3u9MLlNvO5R28tbHaM2J629rzDE5LZnjhweCR4M20dbMKbcX",
    apiUrl: "https://opencode-cors-proxy.brutal.workers.dev",
    provider: "custom",
    enableBreakpoints:false,
    showAPIRequestXML:false,
    localSrc: "C:/Users/friuns/Documents/Sketchbook/src/main/examples",
    codeFile:  "./main/examples/module.ts" ,
    batchRequests:[
        "grok-code",
        "big-pickle",
        "grok-code"
    ],
    availableModels: [],
    selectedModel: "grok-code"
/*
    rules: `You will help write javascript code for a 3D game. 
App description: GTA style 3D game
Technologies: friuns2/Sketchbook 3D playground built on three.js and cannon.js.

You should always rewrite the whole code WITHOUT COMMENTS`,
    importantRules: '',
    a:`to add/parrent object prefer .attach() methods, remember to set object position to 0,0,0 after attaching
to get object .position prefer .getWorldPosition() method
You should always rewrite the whole code WITHOUT COMMENTS
`
*/
}


function getRandomKey(){
    return `
69f786545dba3753063c27ae30f6b69a174a2893082e51a489c693260a1fc903
d8ec5f9d925d78019c78ef3fc999550d7d80aefe1e052671f94ba28ec34f8633
e38110cdd5432dc1cef926f0638c8378897fe37a9da5091491423e0b17b566a7
1a67c77e59465b1e79c6119bd3655f26caac666c547588be3be1c60dc510f2ab
ea05f84529fade65518378e6b0198444fb4cc1c46650570052a2abbf88db9a00
0099f36468e69befc6711d16d050b7154d3c6bbec36406a5d76ba7b7920c9f88
965d5ff7519ee580a4236c01bf23209fd4df745fd906d6dcf86396de4b8c0a17
faa62dd0d3d68628d73c72953cad0d0c41b5e53450c4060cfa90e14319822b07
f9e84a0bdb2bdbf0659d21c6c5c39a7b32bccfc35365b0554c5a1fa0127f64f5
391555d2a0d42af10bde89723fcdb1e49d01e1f22fbcd897daab1cc7809b91f9
29203a9e9ffbc4035d5d6024cde54b625e8c0c008b48446f8086a0a9af08eb70
a23eeb179c1206c6690db54eff21af04072ba22f8f3afe6d942e9eaa77086e74
8aa241cc4cc5d3c5d5cd743089f9a020f1e15f4118d8406e3630fd030681a94b
779f60f5f59b9997e5043f9247cd568e7ea4520b0992a2904dcc010fb1d74027
c3f8f2f52e973a098b515a1a72e1f4bc965c5944fc47f623f8b065dbc521206f
f14bb06013d865faa1c1a8a2598af82358274f6985a342efb00ec43960610c79
1b7263e809096e9da13699e9e5ef27b0328b8b6315c129bdd8b63a51ee977722
97e8bbaa9e94b5cb007a7e967d7ff8cce0ec19dafbf4f492311b1ca1b1f36060
e5ee4fd2a4707f28ed699d8a8b257d5a1c7bd8ffc9c28ae5afa5801ced7c5701
92d9f5fdf74d6ed8aeb1f5550f8e35c875a3ee70439f051cd5886c2662ae9b78
741e2dd2391ddc0756a30ab0e77ecc361796c42d148fa353285b043b29949ebe
bbcca60b62e897d176e1ced811af00e1acfff7f64885154803490204036cc43d
b7afd56c618a9c54e2ef09298bbae6b8182922a46b48680cea3babad55be060b
cb669c654310ba8204584593e1cfe616cf03a5e49ad82b5a0656211fd3e0290d
813988c0d52ad4db1ba36113d2caba2e5697b297d052c3836ac0da15b6915e9a
e3565c2bd1d2f25f24b9d01c96a5cd93404cac683d2ffe7113eaa24f032f1b62
cfdf83cd5790ef92de512b1c88714c7843d94433ddca85294db0cc5633d6738c
7fd2fcdff6e541cf4004b96cd86fb0f075d880e8b9bf1aed5279ad894a77ce55
c1c589de6166866a7e09f0ad0dc005099a2f01eb858b210b6e17f28ae1517568
959cec709624c8fb8902c2455545e42d16aa5a6f0c9b562272c5a312ba31fdf5
40c23d4c97d935c09876579bef8a132b5c7faa7019e9592eb95325e7da58fca0
1084f8f71189b3949a603eac952aaa238cddfffbb8b1792dd981421ed394a609
57c316e4f4cd74a3802a2da0a4304969607ecae41b52e5d9d612a3c9834c3a1f
d7ffecc21eeb117ee9b12f37540577d42e7443b9fdebe5539a8345fd334431bf
bc53572f00acf1bafcaa292bdb4bee7c06885e4a7c9e2815717552b09c544502
0c86fe40a4b0f72adebe50e7bc62a992be236d9d26f4eb11a6eb940eda7eb836
45d26aa33e6f666d3f4b97f9e5d650a14f0ab3ea2082f2c14662c61e65dd7ec6
378964780d69cfc3b0116dc83c526e395ae3c6ebb17091f71e080ea796253889
593b9a723a75f1f66013639193261131233cf900698332a549fafacd71e0ed89
cca08f24abe29ab4a15d903ab700a2ca2d1eb6c23aaef2732f742580267a8a28
`.trim().split("\n").random();
}
Array.prototype=Array.prototype
Array.prototype.random = function() {
    return this[Math.floor(Math.random() * this.length)];
}