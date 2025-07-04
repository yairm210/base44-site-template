import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';

export default function CodeEditor({ code, onChangeContent, onChangeCursorPosition: onChangeCursorOffset }) {
    const containerRef = useRef(null);
    const [editor, setEditor] = useState(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Define Kotlin language
        if (!monaco.languages.getLanguages().some(({ id }) => id === 'kotlin')) {
            monaco.languages.register({ id: 'kotlin' });

            monaco.languages.setMonarchTokensProvider('kotlin', {
                tokenizer: {
                    root: [
                        [/\b(package|import|class|interface|object|fun|val|var|when|if|else|for|while|return|constructor|companion|data|sealed|enum|override|open|private|protected|public|internal|final|abstract|suspend|lateinit|inline|get|set|this|super)\b/, 'keyword'],
                        [/\b(Int|String|Boolean|Float|Double|Long|Short|Byte|Any|Unit|Nothing)\b/, 'type'],
                        [/\/\/.*$/, 'comment'],
                        [/\/\*/, 'comment', '@comment'],
                        [/"/, 'string', '@string_double'],
                        [/'[^']*'/, 'string'],
                        [/\d+/, 'number'],
                        [/@\w+/, 'annotation'],
                    ],
                    comment: [
                        [/[^/*]+/, 'comment'],
                        [/\/\*/, 'comment', '@push'],
                        [/\*\//, 'comment', '@pop'],
                        [/[/*]/, 'comment']
                    ],
                    string_double: [
                        [/[^\\"]+/, 'string'],
                        [/\\./, 'string.escape'],
                        [/"/, 'string', '@pop']
                    ]
                }
            });
        }

        // Define a dark dracula-inspired theme
        monaco.editor.defineTheme('kotlinDarkDracula', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6272a4' },
                { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
                { token: 'string', foreground: 'f1fa8c' },
                { token: 'number', foreground: 'bd93f9' },
                { token: 'type', foreground: '8be9fd' },
                { token: 'annotation', foreground: '50fa7b' },
            ],
            colors: {
                'editor.background': '#1a1c25',
                'editor.foreground': '#f8f8f2',
                'editor.lineHighlightBackground': '#2d303e',
                'editor.selectionBackground': '#44475a',
                'editorCursor.foreground': '#f8f8f2',
                'editorWhitespace.foreground': '#3B3A32',
                'editorIndentGuide.activeBackground': '#9D550FB0',
                'editor.selectionHighlightBorder': '#222218'
            }
        });

        // Initialize Monaco editor
        const editorInstance = monaco.editor.create(containerRef.current, {
            value: code,
            language: 'kotlin',
            theme: 'kotlinDarkDracula',
            automaticLayout: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            scrollbar: {
                useShadows: true,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
            },
            padding: { top: 16 },
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always'
        });

        // Add event listener for content changes
        const disposable = editorInstance.onDidChangeModelContent(() => {
            onChangeContent(editorInstance.getValue());
        });
        
        editorInstance.onDidChangeCursorPosition((e) => {
            // The editor speaks in position (line/column), the IR element speaks in offset (absolute int)
            // The callback is in "IrSpeak" so we need to convert it
            const offset = editorInstance.getModel().getOffsetAt(e.position)
            onChangeCursorOffset(offset)
        })

        setEditor(editorInstance);

        // Clean up
        return () => {
            disposable.dispose();
            editorInstance.dispose();
        };
    }, [containerRef]);

    // Update editor value when code prop changes
    useEffect(() => {
        if (editor && code !== editor.getValue()) {
            editor.setValue(code);
        }
    }, [code, editor]);

    return (
        <div
            ref={containerRef}
            className="h-full w-full overflow-hidden flex-grow"
            style={{
                backgroundColor: '#1a1c25',
                border: 'none',
                outline: 'none'
            }}
        />
    );
}