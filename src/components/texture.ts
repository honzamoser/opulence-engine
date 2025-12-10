import { Entity } from "../entity";
import { Component } from "../types/component";

export class Texture extends Component {
    url: string;
    image: ImageBitmap | null = null;
    texture: GPUTexture | null = null;
    view: GPUTextureView | null = null;
    sampler: GPUSampler | null = null;
    bindGroup: GPUBindGroup | null = null;

    public flip_x = false;

    constructor(parent: Entity, url: string) {
        super(parent);
        this.url = url;
    }

    async load(device: GPUDevice, widthOverride?: number, heightOverride?: number) {
        const response = await fetch(this.url);
        const blob = await response.blob();
        this.image = await createImageBitmap(blob);

        

        this.texture = device.createTexture({
            size: [widthOverride || this.image.width , heightOverride || this.image.height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });

        device.queue.copyExternalImageToTexture(
            { source: this.image },
            { texture: this.texture },
            [widthOverride || this.image.width, this.image.height]
        );

        this.view = this.texture.createView();
        this.sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });
    }

    update(delta: number): void {
        
    }
}