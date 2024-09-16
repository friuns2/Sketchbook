export declare class KeyBinding {
    eventCodes: string[];
    isPressed: boolean;
    justPressed: boolean;
    justReleased: boolean;
    description: string;
    static CreateKeyBinding(code: string, description?: string): KeyBinding;
    static CreateMouseBinding(code: number, description?: string): KeyBinding;
    constructor(code: string, description?: string);
}
