import { World } from '../world/World';
import * as THREE from 'three';
import { IInputReceiver } from '../interfaces/IInputReceiver';
import { EntityType } from '../enums/EntityType';
import { IUpdatable } from '../interfaces/IUpdatable';

export class InputManagerBase implements IUpdatable
{
	public updateOrder: number = 3;
	
	public world: World;
	public domElement: any;
	public pointerLock: any;
	public isLocked: boolean;
	public inputReceiver: IInputReceiver;

	constructor(world: World, domElement: HTMLElement)
	{
		this.world = world;
		this.pointerLock = world.params.Pointer_Lock;
		this.domElement = document.body;
		this.isLocked = false;
		
		// Init event listeners
		// Mouse
		this.domElement.addEventListener('mousedown', (evt) => this.onMouseDown(evt), false);
		document.addEventListener('wheel', (evt) => this.onMouseWheelMove(evt), false);
		document.addEventListener('pointerlockchange', (evt) => this.onPointerlockChange(evt), false);
		document.addEventListener('pointerlockerror', (evt) => this.onPointerlockError(evt), false);
		
		// Keys
		document.addEventListener('keydown', (evt) => this.onKeyDown(evt), false);
		document.addEventListener('keyup', (evt) => this.onKeyUp(evt), false);

		world.registerUpdatable(this);				
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

	public onPointerlockChange(event: Event): void
	{
		if (document.pointerLockElement === this.domElement)
		{
			this.domElement.addEventListener('mousemove', (evt) => this.onMouseMove(evt), false);
			this.domElement.addEventListener('mouseup', (evt) => this.onMouseUp(evt), false);
			this.isLocked = true;
		}
		else
		{
			this.domElement.removeEventListener('mousemove', (evt) => this.onMouseMove(evt), false);
			this.domElement.removeEventListener('mouseup', (evt) => this.onMouseUp(evt), false);
			this.isLocked = false;
		}
	}

	public onPointerlockError(event: Event): void
	{
		//console.error('PointerLockControls: Unable to use Pointer Lock API');
	}

	public onMouseDown(event: MouseEvent): void
	{		
		if (event.button === 0) { // Check if the left mouse button is clicked
			if (this.pointerLock && (event.target instanceof HTMLCanvasElement) || (event.target as HTMLElement).id === 'floating-code') {
				this.domElement.requestPointerLock();
			} else {
				this.domElement.addEventListener('mousemove', (evt) => this.onMouseMove(evt), false);
				this.domElement.addEventListener('mouseup', (evt) => this.onMouseUp(evt), false);
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
			this.domElement.removeEventListener('mousemove', (evt) => this.onMouseMove(evt), false);
			this.domElement.removeEventListener('mouseup', (evt) => this.onMouseUp(evt), false);
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