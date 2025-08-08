import React from 'react';

interface CodeBlockProps {
    language: string;
    code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 my-4">
        <div className="bg-gray-100 dark:bg-gray-700/50 px-4 py-2 text-xs text-gray-700 dark:text-gray-300 font-semibold flex justify-between items-center">
            <span>{language}</span>
            <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-xs"
                aria-label="Copy code"
            >
                Copy
            </button>
        </div>
        <pre className="p-4 text-sm text-gray-800 dark:text-gray-200 overflow-x-auto custom-scrollbar">
            <code className={`language-${language}`}>{code}</code>
        </pre>
    </div>
);

export default CodeBlock;
