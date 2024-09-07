import { World } from '../world/World';
import * as THREE from 'three';
import { IInputReceiver } from '../interfaces/IInputReceiver';
import { EntityType } from '../enums/EntityType';
import { IUpdatable } from '../interfaces/IUpdatable';

export class InputManager implements IUpdatable
{
	public updateOrder: number = 3;
	
	public world: World;
	public domElement: any;
	public pointerLock: any;
	public isLocked: boolean;
	public inputReceiver: IInputReceiver;

	public boundOnMouseDown: (evt: any) => void;
	public boundOnMouseMove: (evt: any) => void;
	public boundOnMouseUp: (evt: any) => void;
	public boundOnMouseWheelMove: (evt: any) => void;
	public boundOnPointerlockChange: (evt: any) => void;
	public boundOnPointerlockError: (evt: any) => void;
	public boundOnKeyDown: (evt: any) => void;
	public boundOnKeyUp: (evt: any) => void;
	
	private joystickVector: THREE.Vector2;
	private joystick: HTMLDivElement;
	private joystickInner: HTMLDivElement;
	private joystickRadius: number;

	private touchArea: HTMLDivElement;
	private initialTouchPosition: Touch;

	private fButton: HTMLDivElement;

	constructor(world: World, domElement: HTMLElement)
	{
		this.world = world;
		this.pointerLock = world.params.Pointer_Lock;
		this.domElement = domElement || document.body;
		this.isLocked = false;
		
		// Bindings for later event use
		// Mouse
		this.boundOnMouseDown = (evt) => this.onMouseDown(evt);
		this.boundOnMouseMove = (evt) => this.onMouseMove(evt);
		this.boundOnMouseUp = (evt) => this.onMouseUp(evt);
		this.boundOnMouseWheelMove = (evt) => this.onMouseWheelMove(evt);

		// Pointer lock
		this.boundOnPointerlockChange = (evt) => this.onPointerlockChange(evt);
		this.boundOnPointerlockError = (evt) => this.onPointerlockError(evt);

		// Keys
		this.boundOnKeyDown = (evt) => this.onKeyDown(evt);
		this.boundOnKeyUp = (evt) => this.onKeyUp(evt);

		// Init event listeners
		// Mouse
		this.domElement.addEventListener('mousedown', this.boundOnMouseDown, false);
		document.addEventListener('wheel', this.boundOnMouseWheelMove, false);
		document.addEventListener('pointerlockchange', this.boundOnPointerlockChange, false);
		document.addEventListener('pointerlockerror', this.boundOnPointerlockError, false);
		
		// Keys
		document.addEventListener('keydown', this.boundOnKeyDown, false);
		document.addEventListener('keyup', this.boundOnKeyUp, false);

		world.registerUpdatable(this);
		if (globalThis.isMobile) {
			this.initJoystick();
			this.initTouchArea();
			this.initFButton();
		}
		
	}
	
	

	// Call the new function when the script is loaded

	private initJoystick(): void {
		this.joystickVector = new THREE.Vector2(0, 0);
		this.joystickRadius = 50;

		this.joystick = document.createElement('div');
		this.joystick.style.cssText = "position: absolute; bottom: 20px; left: 20px; width: 200px; height: 200px; background-color: rgba(0, 0, 0, 0.5); border-radius: 50%; display: flex; justify-content: center; align-items: center;";
		document.body.appendChild(this.joystick);

		this.joystickInner = document.createElement('div');
		this.joystickInner.style.cssText = "width: 100px; height: 100px; background-color: rgba(255, 255, 255, 0.5); border-radius: 50%;";
		this.joystick.appendChild(this.joystickInner);

		this.joystick.addEventListener('touchstart', (evt) => this.handleJoystickInput(evt));
		this.joystick.addEventListener('touchmove', (evt) => this.handleJoystickInput(evt));
		this.joystick.addEventListener('touchend', (evt) => this.resetJoystick(evt));
	}

	private handleJoystickInput(event: TouchEvent): void {
		event.preventDefault();
		const rect = this.joystick.getBoundingClientRect();
		const touch = event.touches[0];
		let x = touch.clientX - rect.left;
		let y = touch.clientY - rect.top;
		
		const dx = x - 100;
		const dy = y - 100;
		const distance = Math.sqrt(dx * dx + dy * dy);
		if (distance > this.joystickRadius) {
			x = (dx / distance) * this.joystickRadius + 100;
			y = (dy / distance) * this.joystickRadius + 100;
		}
		
		this.joystickVector.set((x - 100) / this.joystickRadius, (y - 100) / this.joystickRadius);
		this.joystickInner.style.transform = `translate(${x - 100}px, ${y - 100}px)`;

		// Simulate WASD key presses based on joystick position
		this.simulateWASDKeys();
	}

	private resetJoystick(event: TouchEvent): void {
		event.preventDefault();
		this.joystickVector.set(0, 0);
		this.joystickInner.style.transform = 'translate(0px, 0px)';
		
		// Reset all WASD key states
		this.simulateWASDKeys();
	}

	private simulateWASDKeys(): void {
		const threshold = 0.3;
		const keys = {
			'KeyW': this.joystickVector.y < -threshold,
			'KeyS': this.joystickVector.y > threshold,
			'KeyA': this.joystickVector.x < -threshold,
			'KeyD': this.joystickVector.x > threshold
		};

		for (const [code, pressed] of Object.entries(keys)) {
			if (this.inputReceiver) {
				this.inputReceiver.handleKeyboardEvent(
					new KeyboardEvent(pressed ? 'keydown' : 'keyup', { code }),
					code,
					pressed
				);
			}
		}
	}

	private initTouchArea(): void {
		this.touchArea = document.createElement('div');
		this.touchArea.style.cssText = "position: absolute; top: 0; right: 0; width: 50%; height: 100%;";
		document.body.appendChild(this.touchArea);

		this.touchArea.addEventListener('touchstart', (evt) => this.handleTouchStart(evt));
		this.touchArea.addEventListener('touchmove', (evt) => this.handleTouchMove(evt));
		this.touchArea.addEventListener('touchend', (evt) => this.handleTouchEnd(evt));
	}

	private handleTouchStart(event: TouchEvent): void {
		event.preventDefault();
		// Store initial touch position
		this.initialTouchPosition = event.touches[0];
	}

	private handleTouchMove(event: TouchEvent): void {
		event.preventDefault();
		const currentTouchPosition = event.touches[0];
		const deltaX = currentTouchPosition.clientX - this.initialTouchPosition.clientX;
		const deltaY = currentTouchPosition.clientY - this.initialTouchPosition.clientY;

		// Simulate mouse movement
		this.onMouseMove(new MouseEvent('mousemove', { movementX: deltaX, movementY: deltaY }));

		// Update initial touch position
		this.initialTouchPosition = currentTouchPosition;
	}

	private handleTouchEnd(event: TouchEvent): void {
		event.preventDefault();
		// Handle touch end if necessary
	}

	private initFButton(): void {
		this.fButton = document.createElement('div');
		this.fButton.style.cssText = "position: absolute; bottom: 20px; right: 20px; width: 50px; height: 50px; background-color: rgba(0, 0, 0, 0.7); color: white; display: flex; justify-content: center; align-items: center; border-radius: 5px; cursor: pointer;";
		this.fButton.innerText = 'F';
		document.body.appendChild(this.fButton);

		this.fButton.addEventListener('touchstart', (evt) => this.handleFButtonPress(evt));
		this.fButton.addEventListener('touchend', (evt) => this.handleFButtonRelease(evt));
	}

	private handleFButtonPress(event: TouchEvent): void {
		event.preventDefault();
		if (this.inputReceiver) {
			this.inputReceiver.handleKeyboardEvent(new KeyboardEvent('keydown', { code: 'KeyF' }), 'KeyF', true);
		}
	}

	private handleFButtonRelease(event: TouchEvent): void {
		event.preventDefault();
		if (this.inputReceiver) {
			this.inputReceiver.handleKeyboardEvent(new KeyboardEvent('keyup', { code: 'KeyF' }), 'KeyF', false);
		}
	}

	public update(timestep: number, unscaledTimeStep: number): void
	{
		if (this.inputReceiver === undefined && this.world !== undefined && this.world.cameraOperator !== undefined)
		{
			this.setInputReceiver(this.world.cameraOperator);
		}

		this.inputReceiver?.inputReceiverUpdate(unscaledTimeStep);
	}

	public setInputReceiver(receiver: IInputReceiver): void
	{
		this.inputReceiver = receiver;
		this.inputReceiver.inputReceiverInit();
	}

	public setPointerLock(enabled: boolean): void
	{
		this.pointerLock = enabled;
	}

	public onPointerlockChange(event: MouseEvent): void
	{
		if (document.pointerLockElement === this.domElement)
		{
			this.domElement.addEventListener('mousemove', this.boundOnMouseMove, false);
			this.domElement.addEventListener('mouseup', this.boundOnMouseUp, false);
			this.isLocked = true;
		}
		else
		{
			this.domElement.removeEventListener('mousemove', this.boundOnMouseMove, false);
			this.domElement.removeEventListener('mouseup', this.boundOnMouseUp, false);
			this.isLocked = false;
		}
	}

	public onPointerlockError(event: MouseEvent): void
	{
		//console.error('PointerLockControls: Unable to use Pointer Lock API');
	}

	public onMouseDown(event: MouseEvent): void
	{
		if (event.button === 0) { // Check if the left mouse button is clicked
			if (this.pointerLock) {
				this.domElement.requestPointerLock();
			} else {
				this.domElement.addEventListener('mousemove', this.boundOnMouseMove, false);
				this.domElement.addEventListener('mouseup', this.boundOnMouseUp, false);
			}
		}

		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleMouseButton(event, 'mouse' + event.button, true);
		}
	}

	public onMouseMove(event: MouseEvent): void
	{
		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleMouseMove(event, event.movementX, event.movementY);
		}
	}

	public onMouseUp(event: MouseEvent): void
	{
		if (!this.pointerLock) {
			this.domElement.removeEventListener('mousemove', this.boundOnMouseMove, false);
			this.domElement.removeEventListener('mouseup', this.boundOnMouseUp, false);
		}

		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleMouseButton(event, 'mouse' + event.button, false);
		}
	}

	public onKeyDown(event: KeyboardEvent): void
	{
		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleKeyboardEvent(event, event.code, true);
		}
	}

	public onKeyUp(event: KeyboardEvent): void
	{
		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleKeyboardEvent(event, event.code, false);
		}
	}

	public onMouseWheelMove(event: WheelEvent): void
	{
		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleMouseWheel(event, event.deltaY);
		}
	}
}