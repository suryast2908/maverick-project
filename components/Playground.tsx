
import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import TerminalIcon from './icons/TerminalIcon';
import { executeCode } from '../services/geminiService';

const programmingLanguages = [
    "JavaScript", "Python", "Java", "C#", "TypeScript", "C++", "PHP", "Go",
    "Ruby", "Swift", "Kotlin", "Rust", "SQL", "HTML"
];

const Playground: React.FC = () => {
    const [language, setLanguage] = useState('Python');
    const [code, setCode] = useState('# Write your code here\nprint("Hello, Mavericks!")');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRun = async () => {
        setIsLoading(true);
        setOutput('');
        const result = await executeCode(code, language, input);
        if (result.error) {
            setOutput(`Error:\n${result.error}`);
        } else {
            setOutput(result.output || '');
        }
        setIsLoading(false);
    };

    return (
        <Card title="My Playground" icon={<TerminalIcon />}>
            <div className="space-y-4">
                 <div>
                  <label htmlFor="playground-language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                  <select
                    id="playground-language"
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {programmingLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="code-editor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code Editor</label>
                        <textarea
                            id="code-editor"
                            className="w-full h-96 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md p-3 font-mono text-sm text-gray-800 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter your code here..."
                        />
                    </div>
                    <div>
                        <div>
                           <label htmlFor="stdin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Standard Input (optional)</label>
                           <textarea
                                id="stdin"
                                className="w-full h-24 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md p-3 font-mono text-sm text-gray-800 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Enter input for your program..."
                            />
                        </div>
                        <div className="mt-4">
                           <label htmlFor="stdout" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output</label>
                           <pre className="w-full h-64 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md p-3 font-mono text-sm text-gray-800 dark:text-gray-200 overflow-auto whitespace-pre-wrap">
                             {isLoading ? <span className="text-yellow-500 dark:text-yellow-400">Executing...</span> : output}
                           </pre>
                        </div>
                    </div>
                </div>

                 <div className="flex justify-end pt-2">
                    <Button onClick={handleRun} disabled={isLoading}>
                        {isLoading ? 'Running...' : 'Run Code'}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default Playground;