import React, { useRef, useEffect } from "react";
import p5 from "p5";
import { generateUUID } from "../utils/uuid";

export default function Board({ color, width = 4, onStrokeEnd, strokes }) {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const currentPathRef = useRef([]);
  const strokesRef = useRef(strokes);
  const dimensionsRef = useRef({
    width: window.innerWidth * 0.8654,
    height: window.innerHeight * 0.8,
  });

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p) => {
      p.setup = () => {
        const { width, height } = dimensionsRef.current;
        const canvas = p.createCanvas(width, height);
        canvas.parent(containerRef.current);
        p.background(255);
      };

      p.windowResized = () => {
        const newWidth = window.innerWidth * 0.8654;
        const newHeight = window.innerHeight * 0.8;
        dimensionsRef.current = { width: newWidth, height: newHeight };
        p.resizeCanvas(newWidth, newHeight);
      };

      p.draw = () => {
        p.background(255);

        const currentStrokes = strokesRef.current;
        if (currentStrokes && currentStrokes.length > 0) {
          currentStrokes.forEach((stroke) => {
            p.stroke(stroke.color || "#000000");
            p.strokeWeight(stroke.width || 4);
            p.noFill();
            p.beginShape();
            stroke.points.forEach((point) => {
              p.vertex(point.x, point.y);
            });
            p.endShape();
          });
        }

        if (currentPathRef.current.length > 0) {
          p.stroke(color || "#000000");
          p.strokeWeight(width || 4);
          p.noFill();
          p.beginShape();
          currentPathRef.current.forEach((point) => {
            p.vertex(point.x, point.y);
          });
          p.endShape();
        }
      };

      p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
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
          const userId = localStorage.getItem("userId");
          const stroke = {
            id: generateUUID(),
            userId: userId || "unknown",
            color: color || "#000000",
            width: width || 4,
            points: [...currentPathRef.current],
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
  }, [color, width, onStrokeEnd]);

  return (
    <div
      ref={containerRef}
      style={{
        border: "2px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
    />
  );
}
