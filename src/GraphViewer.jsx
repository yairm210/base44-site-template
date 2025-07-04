import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import { Loader2, AlertTriangle, ImageOff } from 'lucide-react';
import mermaid from 'mermaid';
import svgPanZoom from 'svg-pan-zoom';

mermaid.initialize(
    {
        startOnLoad: false, // We will render manually
        theme: 'dark',      // Apply dark theme globally
        // Dark theme configuration similar to Dracula
        themeVariables: {
            background: '#0f1117',
            primaryColor: '#1a1c25', // Node background
            primaryTextColor: '#f8f8f2',
            primaryBorderColor: '#6272a4',
            // lineColor: '#44475a',
            secondaryColor: '#2d303e',
            tertiaryColor: '#2d303e',
            fontSize: '14px',
            fontFamily: 'JetBrains Mono, Fira Code, Menlo, Monaco, Courier New, monospace',

            // Specific for class diagrams
            classText: '#f8f8f2',
        },
        securityLevel: 'loose', // Allow clicks etc
    }
)

export default function GraphViewer({ mermaidGraphText, compilerMessages, isProcessing,
                                        error, onWarningLocationClick }) {
    const svgContainerRef = useRef(null);
    const [renderError, setRenderError] = useState(null);
    
    const [svg, setSvg] = useState(null);

    const graphId = `mermaid-graph-${Date.now()}`;
    
    // Render graph when text or library readiness changes
    useEffect(() => {
        if (!mermaidGraphText || isProcessing) return

        setRenderError(null);

        try {
            // mermaid.render() returns a promise with the SVG
            mermaid.render(graphId, mermaidGraphText)
                .then(({ svg, bindFunctions }) => {
                    if (svgContainerRef.current) {
                        svgContainerRef.current.innerHTML = svg;
                        if (bindFunctions) {
                            bindFunctions(svgContainerRef.current); // For interactivity if any
                        }
                    }
                    setSvg(svg);
                })
                .catch(err => {
                    console.error("Mermaid rendering error:", err);
                    setRenderError(`Diagram error: ${err.message || 'Could not render graph.'}`);
                    if (svgContainerRef.current) {
                        svgContainerRef.current.innerHTML = `<div class="text-red-400 p-4">Error rendering diagram. Check console.</div>`;
                    }
                });
        } catch (err) {
            console.error("Synchronous Mermaid error:", err);
            setRenderError(`Diagram error: ${err.message || 'Critical error.'}`);
            if (svgContainerRef.current) {
                svgContainerRef.current.innerHTML = `<div class="text-red-400 p-4">Critical diagram rendering error.</div>`;
            }
        }

    }, [mermaidGraphText, isProcessing]);

    useLayoutEffect(() => {
        if (!svgContainerRef.current || !svg) return;
        const svgElement = svgContainerRef.current.children[0];
        // make svg size to its current size - required so it's not a tiny thing
        svgElement.style.width = '100%';
        svgElement.style.height = '100%';
        svgElement.style.visibility = 'hidden'; // Hide until pan-zoom is applied
        svgPanZoom(svgElement, {
            controlIconsEnabled: true
        })
        svgElement.style.visibility = 'visible'; // Show the SVG after pan-zoom is applied
    })

    let content;

    if (isProcessing) {
        content = (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="h-12 w-12 animate-spin mb-4 text-sky-400" />
                <p>{isProcessing ? "Processing Code..." : "Rendering Diagram..."}</p>
            </div>
        );
    } else if (error || renderError) {
        content = (
            <div className="h-full flex flex-col items-center justify-center text-red-400">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p className="font-semibold">Error</p>
                <p className="text-sm text-red-500 mt-1">{error || renderError}</p>
            </div>
        );
    } else if (!mermaidGraphText || mermaidGraphText.trim() === '') {
        // This condition checks for specific placeholder texts in the mermaid string
        content = (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                <ImageOff className="h-16 w-16 mb-4 text-slate-500" />
                {compilerMessages.map(message => 
                    <div className="mt-4 text-sm bg-[#2d303e] p-3 rounded-md text-left max-w w-full"
                         style={{cursor: 'pointer'}} // as 
                         onClick={() => onWarningLocationClick(message.location)}>
                        {/*<p className="font-medium text-slate-300">Try a simple class:</p>*/}
                        <pre className="mt-2 overflow-x-auto text-xs bg-[#0f1117] p-2 rounded-md text-sky-300">
                            {
                                message.severity
                                    + (message.location ? ` (${message.location.line}:${message.location.column})` : '')
                                    +": "+message.message
                            }
                        </pre>
                    </div>
                )}
            </div>
        );
    } else {
        // The div will be populated by the useEffect hook
        content = (
            <div ref={svgContainerRef}
                 dangerouslySetInnerHTML={{__html: svg}}
                 className="w-full h-full flex justify-center items-center overflow-auto p-2 mermaid-live-container">
            </div>
        );
    }

    return (
        <div
            className="h-full w-full bg-[#0f1117] rounded-lg border border-slate-800 flex justify-center items-center overflow-hidden">
            {content}
        </div>
    );
}