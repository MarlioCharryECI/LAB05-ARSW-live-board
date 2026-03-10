import React, { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

export default function Board({ color, width = 4, onStrokeEnd, strokes }) {
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const sketch = (p) => {
      let currentPath = [];
      
      p.setup = () => {
        const canvas = p.createCanvas(800, 600);
        canvas.parent(containerRef.current);
        p.background(255);
        console.log('Canvas initialized');
      };
      
      p.draw = () => {
        p.background(255);
        
        // Draw existing strokes
        if (strokes && strokes.length > 0) {
          strokes.forEach((stroke, index) => {
            p.stroke(stroke.color || '#000000');
            p.strokeWeight(stroke.width || 4);
            p.noFill();
            p.beginShape();
            stroke.points.forEach(point => {
              p.vertex(point.x, point.y);
            });
            p.endShape();
          });
        }
        
        // Draw current stroke
        if (currentPath.length > 0) {
          p.stroke(color || '#000000');
          p.strokeWeight(width || 4);
          p.noFill();
          p.beginShape();
          currentPath.forEach(point => {
            p.vertex(point.x, point.y);
          });
          p.endShape();
        }
      };
      
      p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          console.log('Mouse pressed at:', p.mouseX, p.mouseY);
          currentPath = [{ x: p.mouseX, y: p.mouseY, t: Date.now() }];
          setIsDrawing(true);
        }
      };
      
      p.mouseDragged = () => {
        if (isDrawing && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          currentPath.push({ x: p.mouseX, y: p.mouseY, t: Date.now() });
        }
      };
      
      p.mouseReleased = () => {
        if (isDrawing && currentPath.length > 0) {
          console.log('Mouse released, creating stroke with', currentPath.length, 'points');
          const userId = localStorage.getItem('userId');
          const stroke = {
            id: crypto.randomUUID(),
            userId: userId || 'unknown',
            color: color || '#000000',
            width: width || 4,
            points: [...currentPath]
          };
          onStrokeEnd(stroke);
          currentPath = [];
          setIsDrawing(false);
        }
      };
    };
    
    const p5Instance = new p5(sketch);
    return () => p5Instance.remove();
  }, [color, width]); // Solo recrear si cambia el color o ancho, no por trazos
  
  // Efecto separado para actualizar los trazos sin recrear el canvas
  useEffect(() => {
    // Los trazos se actualizan automáticamente en el draw loop
    console.log('Strokes updated:', strokes?.length || 0);
  }, [strokes]);
  
  return <div ref={containerRef} style={{ border: '2px solid #ddd', borderRadius: '8px' }} />;
}
