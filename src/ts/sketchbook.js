import '../css/main.css';
import * as THREEImport from 'three';
import * as CANNONImport from 'cannon';

import { FollowTarget } from './characters/character_ai/FollowTarget';
import { FollowPath } from './characters/character_ai/FollowPath';
import { RandomBehaviour } from './characters/character_ai/RandomBehaviour';
globalThis.CharacterAI = {
    FollowTarget,
    FollowPath,
    RandomBehaviour,
};
globalThis.FollowTarget = FollowTarget;
globalThis.FollowPath = FollowPath;
globalThis.RandomBehaviour = RandomBehaviour;

import * as Airplane from './vehicles/Airplane';
globalThis.Airplane = Airplane;

import {Car} from './vehicles/Car';
globalThis.Car = Car;
import {Helicopter} from './vehicles/Helicopter';
globalThis.Helicopter = Helicopter;
import {Wheel} from './vehicles/Wheel';
globalThis.Wheel = Wheel;
import {VehicleSeat} from './vehicles/VehicleSeat';
globalThis.VehicleSeat = VehicleSeat;
import {SeatType} from './enums/SeatType';
globalThis.SeatType = SeatType;
import {VehicleDoor} from './vehicles/VehicleDoor';
globalThis.VehicleDoor = VehicleDoor;

import * as statesLibrary from './characters/character_states/_stateLibrary';
globalThis.CharacterStates = statesLibrary;

import { Character } from './characters/Character';
globalThis.Character = Character;
import { KeyBinding } from './core/KeyBinding';
globalThis.KeyBinding = KeyBinding;
globalThis.THREE = THREEImport;
globalThis.CANNON = CANNONImport;
/*
for (const key in THREEImport) {
    if (!key.startsWith('Math') && !key.startsWith('Audio')) {
        globalThis[key] = THREEImport[key];
    }
    else
    {
        globalThis["Mathf"] = THREEImport["Math"];
    }
}
Object.assign(globalThis, CANNONImport);
*/
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
globalThis.GLTFLoader = GLTFLoader;
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
globalThis.FBXLoader = FBXLoader;
import { LoadingManager } from './core/LoadingManager';
globalThis.LoadingManager = LoadingManager;

import { World } from './world/World';
globalThis.World = World;
import { BoxCollider } from './physics/colliders/BoxCollider';
globalThis.BoxCollider = BoxCollider;
import { TrimeshCollider } from './physics/colliders/TrimeshCollider';
globalThis.TrimeshCollider = TrimeshCollider;

import * as Utils from './core/FunctionLibrary';
globalThis.Utils = Utils;

import { EntityType } from './enums/EntityType';
globalThis.EntityType = EntityType;

import { CollisionGroups } from './enums/CollisionGroups';
globalThis.CollisionGroups = CollisionGroups;

import { VectorSpringSimulator } from './physics/spring_simulation/VectorSpringSimulator';
globalThis.VectorSpringSimulator = VectorSpringSimulator;





import { CAnims } from './enums/CharacterAnimations';
globalThis.CAnims = CAnims;
globalThis.CarPrototype = Car.prototype
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
globalThis.SkeletonUtils = SkeletonUtils;