import React, { MouseEventHandler, useEffect, useRef, useState, WheelEventHandler } from 'react'
import styles from "./Canvas.module.scss";
import { clsx, isHexColor } from '../../shared/lib/utils';
import { useCanvas } from './lib/useCanvas.hook';
import { HexColor } from '../../shared/lib/types';
import ToolBar from './ui/ToolBar/ToolBar';


interface Props {
    width: number;
    height: number;
    pixel_size: number;
}
export default function Canvas({ width, height, pixel_size }: Props) {
    // hooks
    const CanvasHelper = useCanvas({ width, height, pixel_size });

    useEffect(() => {
        CanvasHelper.reset();
    }, [width, height, pixel_size]);

    const handleExport = () => {
        const pngDataUrl = CanvasHelper.exportAsPNG();
        if (!pngDataUrl) return;
        
        // Download the PNG
        const a = document.createElement("a");
        a.href = pngDataUrl;
        a.download = "canvas_export.png";
        a.click();
    };

    return (
        <React.Fragment>
            <ToolBar/>
            <input type="color" onChange={(e) => {
                if( isHexColor(e.target.value as HexColor) ) {
                    CanvasHelper.colorRef.current = e.target.value as HexColor;
                }
            }} />
            <center>
                <div
                    ref={CanvasHelper.containerRef}
                    style={{
                        width: '80vw',
                        height: '80vh',
                        border: '2px solid #444',
                        position: 'relative',
                        overflow: "hidden"
                    }}
                >
                    <canvas
                        ref={CanvasHelper.canvasRef}
                        className={clsx([
                            "main-canvas",
                            styles.canvas,
                            CanvasHelper.isDragging ? styles.isDragging : "",
                            CanvasHelper.canGrab ? styles.canGrab : ""
                        ])}
                        onMouseDown={CanvasHelper.handleMouseDown}
                        // onMouseMove={CanvasHelper.handleMouseMove}
                        // onMouseUp={CanvasHelper.handleMouseUp}
                        // onMouseLeave={CanvasHelper.handleMouseUp}
                    />
                </div>
            </center>
            <button onClick={handleExport}>Export PNG</button>
        </React.Fragment>
    )
}
