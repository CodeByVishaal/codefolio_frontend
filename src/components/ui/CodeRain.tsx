import { useEffect, useRef } from "react";

const CODE_CHARS = "{}[]()<>=;:./\\|&!?+-*%#@$^~`01";

export function CodeRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        let animId: number;

        const resize = () => {
            canvas.width = canvas.offsetWidth * devicePixelRatio;
            canvas.height = canvas.offsetHeight * devicePixelRatio;
            ctx.scale(devicePixelRatio, devicePixelRatio);
        };
        resize();
        window.addEventListener("resize", resize);

        const fontSize = 14;
        const cols = Math.floor(canvas.offsetWidth / fontSize);
        const drops = Array.from({ length: cols }, () => Math.random() * -50);

        const draw = () => {
            ctx.fillStyle = "hsla(223, 30%, 5%, 0.06)";
            ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

            ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

            for (let i = 0; i < drops.length; i++) {
                const char = CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
                const brightness = Math.random();
                if (brightness > 0.92) {
                    ctx.fillStyle = "hsla(172, 66%, 50%, 0.90)";
                } else {
                    ctx.fillStyle = `rgba(45, 212, 191, ${0.08 + brightness * 0.15})`;
                }
                ctx.fillText(char, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.offsetHeight && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i] += 0.4 + Math.random() * 0.3;
            }

            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.7 }}
        />
    );
}
