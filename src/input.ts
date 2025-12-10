export class InputHandler {
    private keysPressed: Set<string> = new Set();

    public events: EventTarget = new EventTarget();

    constructor(canvas: HTMLCanvasElement) {
        window.addEventListener('keydown', (event) => {
            this.keysPressed.add(event.key);
        });

        window.addEventListener('keyup', (event) => {
            this.keysPressed.delete(event.key);
        });

        window.onmousedown = (e) => {
            e.preventDefault();
            this.events.dispatchEvent(new CustomEvent('contextmenu', { detail: e }));
        };
    }



    isKeyPressed(key: string): boolean {
        return this.keysPressed.has(key);
    }
}