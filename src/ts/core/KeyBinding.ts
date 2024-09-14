export class KeyBinding
{
	public eventCodes: string[];
	public isPressed: boolean = false;
	public justPressed: boolean = false;
	public justReleased: boolean = false;
	public static CreateKeyBinding(code: string)
	{		
		return new KeyBinding(code);
	}
	public static CreateMouseBinding(code: number)
	{
		return new KeyBinding("mouse" + code);
	}

	constructor(...code: string[])
	{
		this.eventCodes = code.map(a => a.replace("MouseRight", "mouse2").replace("MouseLeft", "mouse0").replace("Mouse", "mouse"));
	}
}