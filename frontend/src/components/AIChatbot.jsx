import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hi there! I am your AI assistant for Smart Ration app. Ask me anything about registration, face scanning, or checking ration.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const endOfMessagesRef = useRef(null);

    useEffect(() => {
        if (endOfMessagesRef.current && isOpen) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post('https://ration-authontication-1.onrender.com/api/chat', { message: userText });
            setMessages(prev => [...prev, { role: 'assistant', text: response.data.response }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', text: 'I am having trouble connecting to the server. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chatbot Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center"
                >
                    <MessageSquare size={24} />
                </button>
            )}

            {/* Chatbot Window */}
            {isOpen && (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-zinc-200/60 w-[350px] sm:w-[400px] h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-white shadow-md">
                        <div className="flex items-center space-x-2">
                            <Bot size={22} className="text-white/90" />
                            <h3 className="font-semibold text-lg tracking-wide">Ration AI Helper</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-50/50">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600 ml-2' : 'bg-indigo-100 text-indigo-600 mr-2'
                                        }`}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-sm'
                                            : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex max-w-[85%] flex-row">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 bg-indigo-100 text-indigo-600 mr-2">
                                        <Bot size={16} />
                                    </div>
                                    <div className="p-3 bg-white border border-zinc-200 text-zinc-500 rounded-2xl rounded-tl-sm text-sm shadow-sm flex items-center space-x-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={endOfMessagesRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-zinc-100">
                        <form onSubmit={handleSend} className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full bg-zinc-100 border-none rounded-full py-3 pl-4 pr-12 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1.5 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:bg-zinc-400 transition-colors"
                            >
                                <Send size={16} className="ml-0.5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
