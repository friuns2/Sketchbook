/// <reference types="three" />
/// <reference types="cannon-es" />
/// <reference types="three/examples/jsm/loaders/GLTFLoader" />

import { GLTF as GLTFLoaderType } from 'three/examples/jsm/loaders/GLTFLoader';

import { Tween } from '@tweenjs/tween.js';
// Declare globals if needed
declare global {
  interface GLTF extends GLTFLoaderType {}
  
  class Character extends Character {}
  class RandomBehaviour extends RandomBehaviour {}
  class World extends World {}
  const TWEEN = Tween.prototype;
}