"use client";

import { useEffect, useRef, useState } from "react";

// Simplex noise function (a type of Perlin noise)
function noise(x: number, y: number) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x);
  const v = fade(y);
  const A = p[X] + Y,
    B = p[X + 1] + Y;
  return lerp(
    v,
    lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
    lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1))
  );
}

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(t: number, a: number, b: number) {
  return a + t * (b - a);
}
function grad(hash: number, x: number, y: number) {
  const h = hash & 15;
  const u = h < 8 ? x : y,
    v = h < 4 ? y : h == 12 || h == 14 ? x : 0;
  return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
}

const p = new Array(512);
const permutation = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
  36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234,
  75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237,
  149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48,
  27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105,
  92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73,
  209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86,
  164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38,
  147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189,
  28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101,
  155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
  178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12,
  191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31,
  181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
  138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215,
  61, 156, 180,
];
for (let i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i];

export default function LightThreadsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // State to control when animation starts (initial false for better performance)
  const [isAnimationReady, setIsAnimationReady] = useState(false);

  useEffect(() => {
    // Start with a static background
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Set canvas dimensions once
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Draw initial black background
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    setCanvasDimensions();

    // Mark animation as ready after a small delay to prioritize content rendering
    const animationTimer = setTimeout(() => {
      setIsAnimationReady(true);
    }, 200);

    const handleResize = () => {
      setCanvasDimensions();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(animationTimer);
    };
  }, []);

  // Only start animation after initial content render
  useEffect(() => {
    if (!isAnimationReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Reduce particle count for better performance
    const particles: Particle[] = [];
    const particleCount = Math.min(100, Math.floor(window.innerWidth / 15)); // Responsive particle count

    class Particle {
      x: number;
      y: number;
      radius: number;
      color: string;
      speed: number;
      lastMouse: { x: number; y: number };

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.radius = Math.random() * 1.5 + 0.5; // Slightly smaller for better performance
        this.color = `rgba(0, ${Math.floor(Math.random() * 100) + 155}, ${
          Math.floor(Math.random() * 55) + 200
        }, ${Math.random() * 0.5 + 0.5})`;
        this.speed = Math.random() * 0.15 + 0.05;
        this.lastMouse = { x: 0, y: 0 };
      }

      update(time: number, mouse: { x: number; y: number }) {
        if (!canvas) return;

        this.y -= this.speed;
        if (this.y < 0) {
          this.y = canvas.height;
          this.x = Math.random() * canvas.width;
        }

        const n = noise(this.x * 0.005, this.y * 0.005 - time * 0.00008) * 100;
        this.x += Math.cos(n) * 0.5;

        // Optimize mouse interaction by reducing calculations
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < 10000) {
          // 100^2 = 10000 (avoid Math.sqrt for performance)
          const factor =
            1 / (distanceSquared > 0 ? Math.sqrt(distanceSquared) : 1);
          this.x += dx * factor;
          this.y += dy * factor;
        }
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx!.fillStyle = this.color;
        ctx!.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let time = 0;
    let mouse = { x: 0, y: 0 };
    let animationFrameId: number;
    let isMouseMoving = false;
    let mouseTimer: ReturnType<typeof setTimeout>;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      isMouseMoving = true;

      // Reset the mouse move timer
      clearTimeout(mouseTimer);
      mouseTimer = setTimeout(() => {
        isMouseMoving = false;
      }, 100);
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    function animate() {
      time += 0.5;

      // Clear with fillRect is faster than clearRect
      ctx!.fillStyle = "rgb(0, 0, 0)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      // Batch particle drawing for better performance
      particles.forEach((particle) => {
        particle.update(time, mouse);
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(mouseTimer);
    };
  }, [isAnimationReady]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full opacity-75"
      aria-hidden="true"
    />
  );
}
