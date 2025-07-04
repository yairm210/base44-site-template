import React, { useState, useEffect, useRef } from "react";
import CodeEditor from "./CodeEditor";
import GraphViewer from "./GraphViewer";
import { Loader2 } from "lucide-react";
import KotlinLogo from './KotlinLogo.svg';
import axios from "axios";
import {editor} from "monaco-editor";


export default function CodeVisualizerPage() {
    // Initial example Kotlin code
    const [code, setCode] = useState(`// Example Kotlin code
fun main() {
    var x = 5
    if (x > 1 + 2) { 
        x += 1
        listOf(1, 2)
    }
}
`);

    const [mermaidGraphText, setMermaidGraphText] = useState("");
    
    const [cursorPositionOffset, setCursorPositionOffset] = useState(0)
    const [mermaidGraphTextColored, setMermaidGraphTextColored] = useState("");
    
    const [compilerMessages, setCompilerMessages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);

    const processCode = async (codeToProcess) => {
        setIsProcessing(true);
        setError(null);

        try {
            // In a real implementation, you'd send `codeToProcess` to your backend
            // which would return the Mermaid graph *text representation*.
            // TODO: How can I auto-recognize when this is run via npm run start, so I can know to use the localhost? :think:
            const response = await axios.post("/api/kotlinToMermaid?withOffsetComment=true", codeToProcess)
            // const response = await axios.post("http://localhost:8080/api/kotlinToMermaid?withOffsetComment=true", codeToProcess)
            const graphText = response.data.mermaidGraph
            const messages = response.data.messages 
            setMermaidGraphText(graphText)
            setCompilerMessages(messages)
        } catch (err) {
            console.error("Error processing code:", err)
            setError("Failed to generate graph. Please ensure your backend is running or check the placeholder logic.")
        } finally {
            setIsProcessing(false)
        }
    };
    
    // Debounce of 250ms, to render the graph after the user stops typing
    useEffect(() => {
        if (code.trim() === '') {
            setMermaidGraphText('classDiagram\n  Empty["Type some Kotlin code to see the diagram"]\n  classDef default fill:#2a2a3f,stroke:#6272a4,stroke-width:1px,color:#f8f8f2');
            return
        }

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            processCode(code);
        }, 250);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [code]);

    const handleCodeChange = (newCode) => {
        setCode(newCode);
    };

    const handleCursorOffsetChange = (offset) => {
        setCursorPositionOffset(offset)
    };
    
    // The actual displayed graph is the graph we got plus coloring on all elements which contain the cursor position
    useEffect(() => {
            if (!mermaidGraphText){  // null or empty
                setMermaidGraphTextColored(null)
                return
            }
            const newMermaidGraphTextLines = mermaidGraphText.split("\n")
                .map(line => {
                    // Offset comment looks like: " # Offset: ${element.startOffset}-${element.endOffset}"
                    const offsetSplit = line.split(" %% Offset: ")
                    if (offsetSplit.length < 2) return line // No comment
    
                    const positions = offsetSplit[1].split("-").map(num => parseInt(num))
                    if (cursorPositionOffset > positions[1] || cursorPositionOffset < positions[0]) return offsetSplit[0]
    
                    return offsetSplit[0] + ":::selected" // Coloring classdef
                })
    
            const newMermaidGraphText = newMermaidGraphTextLines.join("\n") + "\n\n classDef selected stroke:#f00"
            
            setMermaidGraphTextColored(newMermaidGraphText)
        },
        [cursorPositionOffset, mermaidGraphText]
    )
    
    const onWarningLocationClick = (location) => {
        if (!location) return;

        // Use Monaco editor's API to reveal the line
        const lineNumber = location.line
        const columnNumber = location.column

        const editorInstance = editor.getEditors()[0]; // Assuming there's only one editor instance
        if (editorInstance) {
            editorInstance.revealLineInCenter(lineNumber);
            editorInstance.setPosition({ lineNumber, column: columnNumber });
            editorInstance.focus();
        }
    }

    return (
        <div className="flex flex-col h-screen bg-[#0f1117] text-slate-100">
            <header className="sticky top-0 z-10 bg-[#1a1c25] border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center">
                    <div className="h-6 w-6 mr-2">
                        <img src={KotlinLogo}/>
                    </div>

                    <h1 className="text-xl font-semibold text-slate-100 mr-4">Kotlin IR Explorer</h1>
                    {isProcessing && (
                        <div className="flex items-center text-sky-400">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm">Processing...</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 border-r border-slate-800 bg-[#1a1c25]">
                    <CodeEditor code={code} onChangeContent={handleCodeChange} onChangeCursorPosition={handleCursorOffsetChange} />
                </div>
                <div className="w-1/2 bg-[#1a1c25] p-4 overflow-auto">
                    <GraphViewer
                        mermaidGraphText={mermaidGraphTextColored}
                        compilerMessages={compilerMessages}
                        isProcessing={isProcessing}
                        error={error}
                        onWarningLocationClick={onWarningLocationClick}
                    />
                </div>
            </div>
        </div>
    );
}