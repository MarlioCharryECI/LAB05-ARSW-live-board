import { useEffect, useRef, useState } from 'react';
import p5 from 'p5';

export default function Board({ color, width = 4, onStrokeEnd, strokes }) {
    const containerRef = useRef(null);
    const p5Ref = useRef(null);
    const [currentPoints, setCurrentPoints] = useState([]);

    useEffect(() => {
        const sketch = (p) => {
            let drawing = false;

            p.setup = () => {
                const cnv = p.createCanvas(800, 600);
                cnv.parent(containerRef.current);
                p.background(255);
                p.strokeCap(p.ROUND);
            };

            p.draw = () => {
                p.background(255);

                p.noFill();
                const ss = strokes || [];
                for (const s of ss) {
                    p.stroke(s.color);
                    p.strokeWeight(s.width);
                    p.beginShape();
                    for (const pt of s.points) {
                        p.vertex(pt.x, pt.y);
                    }
                    p.endShape();
                }

                p.stroke(color);
                p.strokeWeight(width);
                p.beginShape();
                for (const pt of currentPoints) {
                    p.vertex(pt.x, pt.y);
                }
                p.endShape();
            };

            const inside = () =>
                p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height;

            p.mousePressed = () => {
                if (!inside()) return;
                drawing = true;
                setCurrentPoints([{ x: p.mouseX, y: p.mouseY, t: Date.now(), dragging: false }]);
            };

            p.mouseDragged = () => {
                if (!drawing || !inside()) return;
                setCurrentPoints((prev) => [...prev, { x: p.mouseX, y: p.mouseY, t: Date.now(), dragging: true }]);
            };

            p.mouseReleased = () => {
                if (!drawing) return;
                drawing = false;
                const userId = localStorage.getItem('userId');
                const finalStroke = {
                    id: crypto.randomUUID(),
                    userId,
                    color,
                    width,
                    points: [...currentPoints],
                };
                if (currentPoints.length >= 1) {
                    onStrokeEnd(finalStroke);
                }
                setCurrentPoints([]);
            };
        };

        p5Ref.current = new p5(sketch);
        return () => {
            p5Ref.current?.remove(); // cleanup
        };
    }, [color, width, onStrokeEnd, strokes]);

    return <div ref={containerRef} style={{ border: '1px solid #ddd', borderRadius: 8 }} />;
}