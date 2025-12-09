export class InputHandler {
    private keysPressed: Set<string> = new Set();

    constructor() {
        window.addEventListener('keydown', (event) => {
            this.keysPressed.add(event.key);
        });

        window.addEventListener('keyup', (event) => {
            this.keysPressed.delete(event.key);
        });
    }

    isKeyPressed(key: string): boolean {
        return this.keysPressed.has(key);
    }
}