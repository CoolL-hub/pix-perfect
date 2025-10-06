import React, { useRef, useEffect, useState } from 'react';

const DrawingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // 🧠 Resize canvas to match container
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (context) {
      context.lineCap = 'round';
      context.strokeStyle = 'black';
      context.lineWidth = 2;
      ctxRef.current = context;
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent) => {
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current?.beginPath();
    ctxRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current?.lineTo(offsetX, offsetY);
    ctxRef.current?.stroke();
  };

  const stopDrawing = () => {
    ctxRef.current?.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas && ctxRef.current) {
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          width: '80vw',
          height: '400px',
          border: '2px solid #444',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'block',
            width: '100%',
            height: '100%',
            cursor: 'crosshair',
          }}
        />
      </div>
      <br />
      <button onClick={clearCanvas}>Clear</button>
    </div>
  );
};

export default DrawingCanvas;
