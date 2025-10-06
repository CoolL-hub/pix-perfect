import React, { useRef, useState } from 'react'
import Canvas from '../../features/Canvas/Canvas'
import DrawingCanvas from '../../features/DrawingCanvas/DrawingCanvas';

export default function Main() {
    const widhtInputRef = useRef<HTMLInputElement>(null);
    const heightInputRef = useRef<HTMLInputElement>(null);
    const pixelSizeInputRef = useRef<HTMLInputElement>(null);

    const [width, set_width] = useState<number>(900);
    const [height, set_height] = useState<number>(600);
    const [pixelSize, set_pixelSize] = useState<number>(10);

    const applySizes = () => {
        const currentWidth = widhtInputRef.current?.value;
        const currentHeight = heightInputRef.current?.value;
        const currentPixelSize = pixelSizeInputRef.current?.value;

        if( !currentWidth || !currentHeight || !currentPixelSize ) {
            return;
        }

        set_width(parseInt(currentWidth));
        set_height(parseInt(currentHeight));
        set_pixelSize(parseInt(currentPixelSize));
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>Main</div>

            <div style={{ display: "flex", flexDirection: "row", gap: 20 }}>
                <div>
                    <label htmlFor="canvas-width-input">Width: </label>
                    <input ref={widhtInputRef ?? undefined} id="canvas-width-input" type="number" defaultValue={width} />
                </div>

                <div>
                    <label htmlFor="canvas-height-input">Height: </label>
                    <input ref={heightInputRef} id="canvas-height-input" type="number" defaultValue={height} />
                </div>

                <div>
                    <label htmlFor="canvas-height-input">Pixel size: </label>
                    <input ref={pixelSizeInputRef} id="canvas-height-input" type="number" defaultValue={pixelSize} />
                </div>

                <button onClick={applySizes}>Apply</button>
            </div>


            <Canvas width={width} height={height} pixel_size={pixelSize}/>
        </div>
    )
}
