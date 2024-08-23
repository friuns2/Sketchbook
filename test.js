var zombie5 = globalThis.zombie5 = await loadGLB({ glbUrl: "zombie (5).glb"});
zombie5.mixer = new THREE.AnimationMixer(zombie5.scene);
zombie5.clips = {};
["Idle", "Walk1_InPlace", "Walk_InPlace", "Run_InPlace", "Attack", "FallingBack", "FallingForward", "Walk", "Run", "Walk1"].forEach(name => {
    const action = zombie5.animations.find(a => a.name === name);
    if (action) {
        zombie5.clips[name] = zombie5.mixer.clipAction(action);
    }
});
zombie5.scene.position.set(-2.24, 14.8, -1.28);