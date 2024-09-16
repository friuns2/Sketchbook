export{}
//Example of fixing animation offset by resetting the root bone's position to its initial position before animations are applied.
class Goblin extends Character {
    private rootBone: THREE.Bone | null = null;
    private initialRootPosition: THREE.Vector3 = new THREE.Vector3();
  
    constructor(model: GLTF) {
      
      super(model);
      this.arcadeVelocityInfluence.set(0.2, 0, 0.2); // Adjust movement speed
      this.setBehaviour(new RandomBehaviour());
  
      this.animationMapping.idle = "Idle";
      this.animationMapping.walk = "Walk";
  
      // Find the root bone
      model.scene.traverse((object: THREE.Bone) => {
        if (object.isBone) {
          
          if (object.name.toLowerCase().includes('root') || object.name.toLowerCase().includes('hips')) {
            this.rootBone = object;
          }
        }
      });
  
      if (this.rootBone) {
        this.initialRootPosition.copy(this.rootBone.position);
      }
    }
  
    update(timeStep: number): void {
      super.update(timeStep);
  
      // Store the initial position of the root bone
      if (this.rootBone && !this.rootBone.userData.initialPosition) {
        this.rootBone.userData.initialPosition = this.rootBone.position.clone();
      }
  
      // Reset the root bone position to its initial position
      if (this.rootBone && this.rootBone.userData.initialPosition) {
        this.rootBone.position.copy(this.rootBone.userData.initialPosition);
      }
     
    }
  }