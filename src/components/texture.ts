import { Component } from "../types/component";

export class Texture extends Component {
    url: string;
    image: ImageBitmap | null = null;
    texture: GPUTexture | null = null;
    view: GPUTextureView | null = null;
    sampler: GPUSampler | null = null;
    bindGroup: GPUBindGroup | null = null;

    constructor(url: string) {
        super();
        this.url = url;
    }

    async load(device: GPUDevice) {
        const response = await fetch(this.url);
        const blob = await response.blob();
        this.image = await createImageBitmap(blob);

        this.texture = device.createTexture({
            size: [this.image.width, this.image.height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });

        device.queue.copyExternalImageToTexture(
            { source: this.image },
            { texture: this.texture },
            [this.image.width, this.image.height]
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