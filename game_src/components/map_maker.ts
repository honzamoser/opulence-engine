import { Component } from "../../src/types/component";
import { Line } from "../../src/render/line";
import { Vector2 } from "../../src/types/vector2";

export class MapMaker extends Component {
    corners: { x: number, y: number }[] = [];

    wetWallIds: number[] = [];

    dryWalls: { x: number, y: number }[][] = [];

    tempWallid: number | null = null;

    mousePosition: { x: number, y: number } = { x: 0, y: 0 };
    ghostId: number | null = null;

    update(delta: number): void {
        window.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX + this.parent.world.cameraPosition.x
            this.mousePosition.y = e.clientY + this.parent.world.cameraPosition.y
            console.log(this.mousePosition);
        });



        if (this.corners.length > 0) {
            if (this.ghostId !== null) {
                this.parent.world.renderer.lines.splice(this.ghostId, 1);
            }

        }
    }

    start(): void {

        this.ghostId = this.parent.world.renderer.lines.push(
            {
                start: new Vector2(this.corners[this.corners.length - 1].x, this.corners[this.corners.length - 1].y),
                end: new Vector2(this.mousePosition.x, this.mousePosition.y),
                color: { r: 1, g: 1, b: 0, a: 1 }
            }
        );

        this.parent.world.input.events.addEventListener('contextmenu', async (e) => {
            const targetX = (e as CustomEvent).detail.clientX + this.parent.world.cameraPosition.x
            const targetY = (e as CustomEvent).detail.clientY + this.parent.world.cameraPosition.y



            this.corners.push({ x: targetX, y: targetY });

            if (this.corners.length > 1) {
                this.wetWallIds.push(this.parent.world.renderer.lines.push(
                    {
                        start: new Vector2(targetX, targetY),
                        end: new Vector2(this.corners[this.corners.length - 2].x, this.corners[this.corners.length - 2].y),
                        color: { r: 1, g: 0, b: 0, a: 1 }
                    }
                ));
            }

            if (this.corners.length > 2) {

                this.tempWallid = this.parent.world.renderer.lines.push(
                    {
                        start: new Vector2(this.corners[0].x, this.corners[0].y),
                        end: new Vector2(targetX, targetY),
                        color: { r: 0, g: 0, b: 1, a: 1 }
                    }
                );
            }

            console.log(targetX, targetY);
            console.log(this.parent.world.renderer.lines);
        });

        window.onkeydown = (e) => {
            if (e.key === 'z' && this.corners.length > 0) {
                const i = this.dryWalls.push(structuredClone(this.corners));

                this.wetWallIds.forEach(id => {
                    this.parent.world.renderer.lines.splice(id, 1);
                });

                for (let j = 0; j < this.corners.length - 1; j++) {

                    console.log({
                        start: new Vector2(this.corners[j].x, this.corners[j].y),
                        end: new Vector2(this.corners[j + 1].x, this.corners[j + 1].y),
                        color: { r: 0, g: 1, b: 0, a: 1 }
                    });


                    this.parent.world.renderer.lines.push(
                        {
                            start: new Vector2(this.corners[j].x, this.corners[j].y),
                            end: new Vector2(this.corners[j + 1].x, this.corners[j + 1].y),
                            color: { r: 0, g: 1, b: 0, a: 1 }
                        }
                    );
                }

                this.parent.world.renderer.lines.push(
                    {
                        start: new Vector2(this.corners[this.corners.length - 1].x, this.corners[this.corners.length - 1].y),
                        end: new Vector2(this.corners[0].x, this.corners[0].y),
                        color: { r: 0, g: 1, b: 0, a: 1 }
                    }
                );





                console.log(this.parent.world.renderer.lines);
                this.corners = [];
                this.wetWallIds = [];

            }


        }
    }

}