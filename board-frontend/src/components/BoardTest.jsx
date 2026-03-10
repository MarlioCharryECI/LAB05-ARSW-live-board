import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

export default function BoardSimple({ color, width = 4, onStrokeEnd, strokes }) {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const currentPathRef = useRef([]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const sketch = (p) => {
      p.setup = () => {
        const canvas = p.createCanvas(800, 600);
        canvas.parent(containerRef.current);
        p.background(255);
        console.log('Canvas initialized with size:', p.width, 'x', p.height);
      };
      
      p.draw = () => {
        p.background(255);
        
        // Draw existing strokes
        if (strokes && strokes.length > 0) {
          strokes.forEach(stroke => {
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
        
        // Draw current path
        if (currentPathRef.current.length > 0) {
          p.stroke(color || '#000000');
          p.strokeWeight(width || 4);
          p.noFill();
          p.beginShape();
          currentPathRef.current.forEach(point => {
            p.vertex(point.x, point.y);
          });
          p.endShape();
        }
      };
      
      p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          console.log('Mouse pressed at:', p.mouseX, p.mouseY);
          currentPathRef.current = [{ x: p.mouseX, y: p.mouseY, t: Date.now() }];
        }
      };
      
      p.mouseDragged = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          if (currentPathRef.current.length > 0) {
            currentPathRef.current.push({ x: p.mouseX, y: p.mouseY, t: Date.now() });
          }
        }
      };
      
      p.mouseReleased = () => {
        if (currentPathRef.current.length > 0) {
          console.log('Mouse released, creating stroke with', currentPathRef.current.length, 'points');
          const userId = localStorage.getItem('userId');
          const stroke = {
            id: crypto.randomUUID(),
            userId: userId || 'unknown',
            color: color || '#000000',
            width: width || 4,
            points: [...currentPathRef.current]
          };
          onStrokeEnd(stroke);
          currentPathRef.current = [];
        }
      };
    };
    
    p5InstanceRef.current = new p5(sketch);
    
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  }, []); // Solo montar una vez
  
  // Monitorear cambios en los trazos
  useEffect(() => {
    console.log('BoardTest - Strokes prop changed:', strokes?.length || 0, 'strokes');
    if (strokes && strokes.length > 0) {
      strokes.forEach((stroke, index) => {
        console.log(`Stroke ${index}:`, stroke.id, stroke.color, stroke.points.length, 'points');
      });
    }
  }, [strokes]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        border: '3px solid red', 
        borderRadius: '8px',
        width: '800px',
        height: '600px',
        backgroundColor: 'yellow'
      }} 
    />
  );
}
