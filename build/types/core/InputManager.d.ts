import { World } from '../world/World';
import { IUpdatable } from '../interfaces/IUpdatable';
import { InputManagerBase } from './InputManagerBase';
export declare class InputManager extends InputManagerBase implements IUpdatable {
    private joystickVector;
    private joystick;
    private joystickInner;
    private joystickRadius;
    private touchArea;
    private initialTouchPosition;
    private fButton;
    constructor(world: World, domElement: HTMLElement);
    private initJoystick;
    private handleJoystickInput;
    private resetJoystick;
    private simulateWASDKeys;
    private initTouchArea;
    private handleTouchStart;
    private handleTouchMove;
    private handleTouchEnd;
    private initFButton;
    private handleFButtonPress;
    private handleFButtonRelease;
}
