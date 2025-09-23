import React, { useEffect, useRef, useState, useCallback } from "react";
import type { GeneratedResult, Response } from "../types/types";
import axios from "axios";
import colors from "../constants/colors";
import DraggableLatex from "../editor/Dragabble";

const TabEditor = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#FFFFFF");
    const [result, setResult] = useState<GeneratedResult>();
    const [dictOfVars, setDictofVars] = useState({});
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
    const [mathJaxLoaded, setMathJaxLoaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                // Set canvas size to match container
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.lineWidth = 4;
                ctx.fillStyle = "#000000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, []);

    const loadMathJax = useCallback(() => {
        // Check if MathJax is already loaded
        if ((window as any).MathJax) {
            setMathJaxLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML";
        script.async = true;
        
        script.onload = () => {
            if ((window as any).MathJax) {
                (window as any).MathJax.Hub.Config({
                    tex2jax: { 
                        inlineMath: [["$", "$"], ["\\(", "\\)"]] 
                    },
                });
                setMathJaxLoaded(true);
            }
        };

        script.onerror = () => {
            console.error("Failed to load MathJax");
            setMathJaxLoaded(false);
        };

        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        initCanvas();
        const cleanup = loadMathJax();

        const handleResize = () => {
            initCanvas();
        };

        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            if (cleanup) cleanup();
        };
    }, [initCanvas, loadMathJax]);

    const renderLatexToCanvas = useCallback((expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression(prev => [...prev, latex]);

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.fillStyle = "#000000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, []);

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expr, result.answer);
        }
    }, [result, renderLatexToCanvas]);

    useEffect(() => {
        if (latexExpression.length > 0 && mathJaxLoaded && (window as any).MathJax) {
            setTimeout(() => {
                (window as any).MathJax.Hub.Queue([
                    "Typeset",
                    (window as any).MathJax.Hub,
                ]);
            }, 100);
        }
    }, [latexExpression, mathJaxLoaded]);

    const getEventPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        
        if ('touches' in e) {
            // Touch event
            const touch = e.touches[0] || e.changedTouches[0];
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        } else {
            // Mouse event
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                const pos = getEventPosition(e);
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                setIsDrawing(true);
            }
        }
    };

    const stopDrawing = useCallback(() => {
        setIsDrawing(false);
    }, []);

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        e.preventDefault();

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                const pos = getEventPosition(e);
                ctx.strokeStyle = color;
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }
        }
    };

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.fillStyle = "#000000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
        setLatexExpression([]);
        setResult(undefined);
        setDictofVars({});
    };

    const sendData = async () => {
        if (isSubmitting) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsSubmitting(true);
        
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/calculate`,
                {
                    image: canvas.toDataURL("image/png"),
                    dictOfVars: dictOfVars,
                }
            );
            
            const resp = response.data;
            
            // Update variables
            resp.data.forEach((data: Response) => {
                if (data.assign === true) {
                    setDictofVars(prev => ({
                        ...prev,
                        [data.expr]: data.result,
                    }));
                }
            });

            // Calculate position for latex expression
            const ctx = canvas.getContext("2d");
            if (ctx) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const i = y * canvas.width * 4 + x * 4;
                        if (imageData.data[i + 3] > 0) {
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }
                }

                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                setLatexPosition({ x: centerX, y: centerY });
            }

            // Set results
            resp.data.forEach((data: Response) => {
                setTimeout(() => {
                    setResult({
                        expr: data.expr,
                        answer: data.result,
                    });
                }, 200);
            });
        } catch (error) {
            console.error("Error calculating:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-gray-900">
            {/* Mobile Control Panel */}
            <div className="absolute top-2 left-2 right-2 z-10 bg-gray-800 bg-opacity-95 backdrop-blur-sm p-3 rounded-xl shadow-2xl md:top-6 md:left-6 md:right-auto md:max-w-xs md:p-6">
                {/* Color Palette */}
                <div className="mb-4 md:mb-6">
                    <h3 className="text-white text-xs md:text-sm font-semibold mb-2 md:mb-3 tracking-wide">
                        COLORS
                    </h3>
                    <div className="grid grid-cols-8 md:grid-cols-5 gap-2 md:gap-3">
                        {colors.map((c, index) => (
                            <button
                                key={index}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 ${
                                    color === c
                                        ? "border-white shadow-lg scale-110 ring-2 ring-white ring-offset-2 ring-offset-gray-800"
                                        : "border-gray-500 hover:border-gray-300"
                                }`}
                                style={{ backgroundColor: c }}
                                aria-label={`Select color ${c}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Current Color Preview - Hidden on mobile to save space */}
                <div className="hidden md:block mb-6">
                    <h3 className="text-white text-sm font-semibold mb-3 tracking-wide">
                        CURRENT
                    </h3>
                    <div className="flex items-center gap-3 bg-gray-700 bg-opacity-50 p-3 rounded-lg">
                        <div
                            className="w-12 h-12 rounded-lg border-2 border-gray-500 shadow-inner"
                            style={{ backgroundColor: color }}
                        />
                        <div>
                            <div className="text-gray-300 text-xs uppercase tracking-wider">
                                Color
                            </div>
                            <div className="text-white text-sm font-mono">{color}</div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 md:flex-col md:gap-0 md:space-y-3">
                    <button
                        onClick={resetCanvas}
                        className="flex-1 md:w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 md:py-3 px-3 md:px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-sm md:text-base"
                    >
                        Clear
                    </button>
                    
                    <button
                        onClick={sendData}
                        disabled={isSubmitting}
                        className="flex-1 md:w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-2 md:py-3 px-3 md:px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed text-sm md:text-base"
                    >
                        {isSubmitting ? "Processing..." : "Calculate"}
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <canvas
                className="absolute inset-0 cursor-crosshair touch-none"
                ref={canvasRef}
                style={{ 
                    width: '100%', 
                    height: '100%',
                    backgroundColor: '#000000'
                }}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
            />

            {/* Instructions - Responsive positioning */}
            <div className="absolute bottom-2 left-2 right-2 md:bottom-6 md:right-6 md:left-auto bg-gray-800 bg-opacity-90 text-white px-3 py-2 md:px-4 rounded-lg text-xs md:text-sm backdrop-blur-sm border border-gray-700 text-center md:text-left">
                <span className="md:hidden">Tap and drag to draw</span>
                <span className="hidden md:inline">Click and drag to draw</span>
            </div>

            {/* Latex expressions */}
            {latexExpression.map((latex, index) => (
                <DraggableLatex
                    key={index}
                    latex={latex}
                    defaultPosition={latexPosition}
                    onStop={(pos) => setLatexPosition(pos)}
                />
            ))}
        </div>
    );
};

export default TabEditor;