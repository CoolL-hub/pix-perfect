import { useEffect, useRef, useState } from "react";
import { HexColor } from "../../../shared/lib/types";

export type Point = { x: number; y: number };

interface Props {
    width: number;
    height: number;
    pixel_size: number;
}

export const useCanvas = ({ width, height, pixel_size = 1 }: Props) => {
    const colorRef = useRef<HexColor>("#da1");

    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    const [isMouseDown, set_isMouseDown] = useState(false);
    const [canGrab, set_canGrab] = useState(false);
    const [isDragging, set_isDragging] = useState(false);
    const [start, set_start] = useState<Point>({ x: 0, y: 0 });

    const [view, setView] = useState({ scale: 1, pan: { x: 0, y: 0 } });

    const buffer = useRef<Map<string, string>>(new Map());

    const CELL_SIZE = pixel_size;
    const scaleFactor = 0.1;

    // === Resize Canvas ===
    const resizeCanvas = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctxRef.current = ctx;

            const newScale = Math.min(
                canvas.width / width,
                canvas.height / height,
                1
            );

            const contentCenterX = (width / 2) * newScale;
            const contentCenterY = (height / 2) * newScale;
            const screenCenterX = canvas.width / 2;
            const screenCenterY = canvas.height / 2;

            setView({
                scale: newScale,
                pan: {
                    x: screenCenterX - contentCenterX,
                    y: screenCenterY - contentCenterY,
                }
            });
        }
    };

    useEffect(() => {
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    useEffect(() => {
        draw();
    }, [view.scale, view.pan]);

    // === Keyboard Events ===
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                set_canGrab(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                set_canGrab(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // === Zoom ===
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            setView(({ scale: prevScale, pan }) => {
                const worldX = (mouseX - pan.x) / prevScale;
                const worldY = (mouseY - pan.y) / prevScale;

                const newScale = event.deltaY < 0
                    ? Math.min(prevScale + scaleFactor, 5)
                    : Math.max(prevScale - scaleFactor, 0.001);

                return {
                    scale: newScale,
                    pan: {
                        x: mouseX - worldX * newScale,
                        y: mouseY - worldY * newScale,
                    }
                };
            });
        };

        canvas.addEventListener("wheel", handleWheel, { passive: false });
        return () => canvas.removeEventListener("wheel", handleWheel);
    }, []);

    // === Mouse Events ===

    // Mouse down still handled on canvas:
    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
        event.preventDefault();

        if (event.button === 1) {
            fitContentToView();
        }

        set_isMouseDown(true);

        if (event.button === 0) {
            const { x, y } = screenToCanvasCoords(event);
            writeToBuffer({ x: Math.floor(x / CELL_SIZE), y: Math.floor(y / CELL_SIZE) }, colorRef.current);
        }

        if (canGrab) {
            set_isDragging(true);
            set_start({ x: event.clientX - view.pan.x, y: event.clientY - view.pan.y });
        }
    };

    // Remove handleMouseMove and handleMouseUp from canvas and use window listeners instead:

    // Global mousemove and mouseup handlers to keep drag state even outside canvas
    useEffect(() => {
        if (!isMouseDown) return;

        const handleWindowMouseMove = (event: MouseEvent) => {
            if (!canvasRef.current) return;

            if (isMouseDown && !canGrab) {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const canvasCoords = {
                    x: (x - view.pan.x) / view.scale,
                    y: (y - view.pan.y) / view.scale,
                };

                writeToBuffer(
                    { x: Math.floor(canvasCoords.x / CELL_SIZE), y: Math.floor(canvasCoords.y / CELL_SIZE) },
                    colorRef.current
                );
            }

            if (canGrab && isDragging) {
                setView(view => ({
                    ...view,
                    pan: {
                        x: event.clientX - start.x,
                        y: event.clientY - start.y,
                    }
                }));
            }
        };

        const handleWindowMouseUp = (event: MouseEvent) => {
            set_isMouseDown(false);
            set_isDragging(false);
        };

        window.addEventListener("mousemove", handleWindowMouseMove);
        window.addEventListener("mouseup", handleWindowMouseUp);

        // Cleanup when drag ends or component unmounts
        return () => {
            window.removeEventListener("mousemove", handleWindowMouseMove);
            window.removeEventListener("mouseup", handleWindowMouseUp);
        };
    }, [isMouseDown, isDragging, canGrab, start, view.pan, view.scale]);

    const fitContentToView = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scaleX = canvas.width / width;
        const scaleY = canvas.height / height;
        const newScale = Math.min(scaleX, scaleY, 10);

        const contentCenterX = (width / 2) * newScale;
        const contentCenterY = (height / 2) * newScale;
        const screenCenterX = canvas.width / 2;
        const screenCenterY = canvas.height / 2;

        setView({
            scale: newScale,
            pan: {
                x: screenCenterX - contentCenterX,
                y: screenCenterY - contentCenterY,
            },
        });
    };

    // Remove handleMouseMove and handleMouseUp from here (they were on canvas element before)
    // so don't export them anymore for JSX use.

    const screenToCanvasCoords = (event: MouseEvent | React.MouseEvent): Point => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return {
            x: (x - view.pan.x) / view.scale,
            y: (y - view.pan.y) / view.scale,
        };
    };

    const getPointKey = (p: Point) => `${p.x}_${p.y}`;
    const getPointFromKey = (key: string): Point => {
        const [x, y] = key.split("_").map(Number);
        return { x, y };
    };

    const writeToBuffer = (point: Point, color: string) => {
        const maxX = width / CELL_SIZE - 1;
        const maxY = height / CELL_SIZE - 1;
        if (point.x < 0 || point.x > maxX || point.y < 0 || point.y > maxY) return;

        buffer.current.set(getPointKey(point), color);
        draw();
    };

    const draw = () => {
        const ctx = ctxRef.current;
        if (!ctx) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(view.pan.x, view.pan.y);
        ctx.scale(view.scale, view.scale);

        drawBG(ctx);

        for (const [key, color] of buffer.current.entries()) {
            const { x, y } = getPointFromKey(key);
            drawDebugCellAt(ctx, color, x, y, CELL_SIZE);
        }

        ctx.restore();
    };

    const drawBG = (ctx: CanvasRenderingContext2D) => {
        const patternCanvas = document.createElement("canvas");
        patternCanvas.width = CELL_SIZE * 2;
        patternCanvas.height = CELL_SIZE * 2;
        const pctx = patternCanvas.getContext("2d")!;

        for (let y = 0; y < 2; y++) {
            for (let x = 0; x < 2; x++) {
                pctx.fillStyle = (x + y) % 2 === 0 ? "#fff" : "#ccc";
                pctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }

        const pattern = ctx.createPattern(patternCanvas, "repeat")!;
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
    };

    const drawDebugCellAt = (
        ctx: CanvasRenderingContext2D,
        color: string,
        i: number,
        j: number,
        size: number
    ) => {
        ctx.fillStyle = color;
        ctx.fillRect(
            i * CELL_SIZE + (CELL_SIZE - size) / 2,
            j * CELL_SIZE + (CELL_SIZE - size) / 2,
            size,
            size
        );
    };

    // Initialize manually if needed
    const reset = () => {
        buffer.current.clear(); // optional: clear your drawing buffer if you want a fresh start

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctxRef.current = ctx;

            const newScale = Math.min(
                canvas.width / width,
                canvas.height / height,
                1
            );

            const contentCenterX = (width / 2) * newScale;
            const contentCenterY = (height / 2) * newScale;
            const screenCenterX = canvas.width / 2;
            const screenCenterY = canvas.height / 2;

            setView({
                scale: newScale,
                pan: {
                    x: screenCenterX - contentCenterX,
                    y: screenCenterY - contentCenterY,
                }
            });

            draw();
        }
    };

    const exportAsPNG = (): string | null => {
        // Create offscreen canvas matching the logical width and height in pixels
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = width;
        exportCanvas.height = height;

        const exportCtx = exportCanvas.getContext("2d");
        if (!exportCtx) return null;

        // Draw background grid (scaled to pixel size)
        const CELL = CELL_SIZE;

        // Draw all buffered cells
        for (const [key, color] of buffer.current.entries()) {
            const { x, y } = getPointFromKey(key);
            // Use same drawing logic as drawDebugCellAt, no transform needed here
            exportCtx.fillStyle = color;
            exportCtx.fillRect(
                x * CELL + (CELL - CELL) / 2, // simplified, (CELL - CELL) = 0
                y * CELL + (CELL - CELL) / 2,
                CELL,
                CELL
            );
        }

        // Convert to PNG data URL
        return exportCanvas.toDataURL("image/png");
    };

    return {
        colorRef,

        containerRef,
        canvasRef,

        canGrab,
        isDragging,

        handleMouseDown,

        reset,
        getCtx: () => ctxRef.current,
        setCtxRef: (canvas: HTMLCanvasElement) => {
            ctxRef.current = canvas.getContext("2d");
            draw();
        },
        draw,
        screenToCanvasCoords,
        exportAsPNG
    };
};
