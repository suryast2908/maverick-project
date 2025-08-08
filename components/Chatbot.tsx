
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import XIcon from './icons/XIcon';
import CodeIcon from './icons/CodeIcon';

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // For draggability
    const [position, setPosition] = useState({ x: window.innerWidth - 416, y: window.innerHeight - 590 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const chatbotRef = useRef<HTMLDivElement>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);
    
    // Gemini Chat state
    const chatRef = useRef<Chat | null>(null);

    useEffect(() => {
        // Initialize Gemini Chat only when the chatbot is opened for the first time
        if (!isOpen || chatRef.current) return;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: "You are 'Maverick Helper', a friendly and helpful AI assistant for the Mavericks Coding Platform. Your goal is to answer user questions about the platform's features, how to navigate the site, or general coding questions. Be concise, friendly, and encouraging. If you don't know the answer, say that you don't have that information. Keep your answers brief unless asked for details.",
                },
            });
            
            setMessages([{
                sender: 'bot',
                text: 'Hello! How can I help you navigate the Mavericks platform today?'
            }]);

        } catch(error) {
            console.error("Error initializing chatbot:", error);
            setMessages([{
                sender: 'bot',
                text: "I'm having trouble getting started. Please check the console for errors."
            }]);
        }
    }, [isOpen]);
    
    useEffect(() => {
        // Scroll to the bottom of the messages list
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isLoading) return;
        
        const newMessages: Message[] = [...messages, { sender: 'user', text: trimmedInput }];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);
        
        try {
            if (!chatRef.current) {
                 throw new Error("Chat not initialized. The API key might be missing or invalid.");
            }
            const response = await chatRef.current.sendMessage({ message: trimmedInput });
            const botResponse = response.text;
            setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
        } catch (error) {
            console.error('Gemini chat error:', error);
            setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!chatbotRef.current) return;
        setIsDragging(true);
        const rect = chatbotRef.current.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !chatbotRef.current) return;
        
        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;
        
        // Constrain to viewport
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const elWidth = chatbotRef.current.offsetWidth;
        const elHeight = chatbotRef.current.offsetHeight;
        
        newX = Math.max(16, Math.min(newX, vw - elWidth - 16));
        newY = Math.max(16, Math.min(newY, vh - elHeight - 16));
        
        setPosition({ x: newX, y: newY });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);
    
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 z-50 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg h-16 w-16 hover:bg-blue-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 animate-fade-in"
                aria-label="Open help chat"
            >
                <QuestionMarkCircleIcon className="h-8 w-8" />
            </button>
        );
    }
    
    return (
        <div 
            ref={chatbotRef}
            className="fixed z-[100] flex flex-col w-96 h-[32rem] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in-up"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            <div 
                className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-t-xl border-b border-gray-200 dark:border-gray-700 cursor-move"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <CodeIcon className="h-6 w-6 text-blue-500"/>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Need Help?</h3>
                </div>
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                    aria-label="Close chat"
                >
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                       {msg.sender === 'bot' && <CodeIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />}
                       <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                           <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                       </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-end gap-2 justify-start">
                        <CodeIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />
                        <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messageEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask anything..."
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        disabled={isLoading || !chatRef.current}
                    />
                    <button type="submit" disabled={isLoading || !chatRef.current || !inputValue.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-500 transition">
                        <PaperAirplaneIcon className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chatbot;
