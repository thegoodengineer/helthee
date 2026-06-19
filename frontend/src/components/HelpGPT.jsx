import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';

export default function HelpGPT() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! I am HelpGPT, your AI Health Coach. Ask me anything about fitness goals, nutrition, BMI, steps, or streak trees!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const samplePrompts = [
    "How do I grow my streak tree?",
    "What is a healthy BMI range?",
    "Give me diet tips for walking 10k steps",
    "How do fitness competitions work?"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (text) => {
    const messageToSend = text || input;
    if (!messageToSend.trim() || loading) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      });
      const data = await response.json();
      
      // Add assistant response
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error("Error communicating with HelpGPT:", err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I had trouble connecting to the brain server. Please make sure the Python server is running!" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card help-gpt-card" style={{ gridColumn: 'span 12' }}>
      <div className="gpt-header">
        <div className="gpt-logo-section">
          <div className="gpt-icon-glow">
            <Bot size={22} className="gpt-bot-icon" />
          </div>
          <div>
            <h2 className="card-title">HelpGPT</h2>
            <p className="card-subtitle">AI health assistant powered by deep wellness coaching insights.</p>
          </div>
        </div>
        <div className="online-indicator">
          <span className="dot" />
          <span>Active</span>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-history">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble-wrapper ${msg.role}`}>
              <div className="avatar">
                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="chat-bubble">
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble-wrapper assistant">
              <div className="avatar">
                <Bot size={16} />
              </div>
              <div className="chat-bubble thinking">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="sample-prompts-container">
            <span className="prompt-header">
              <Sparkles size={14} color="#00f5d4" />
              Suggested Questions
            </span>
            <div className="prompts-grid">
              {samplePrompts.map((prompt, i) => (
                <button 
                  key={i} 
                  className="prompt-btn" 
                  onClick={() => handleSendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input-bar">
          <input 
            type="text" 
            placeholder="Type your health or fitness question..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            className="send-btn" 
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .help-gpt-card {
          display: flex;
          flex-direction: column;
          height: 480px;
        }
        .gpt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }
        .gpt-logo-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .gpt-icon-glow {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(0, 245, 212, 0.1);
          border: 1px solid rgba(0, 245, 212, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(0, 245, 212, 0.15);
        }
        .gpt-bot-icon {
          color: var(--accent-cyan);
        }
        .online-indicator {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--accent-emerald);
          font-weight: 700;
        }
        .online-indicator .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent-emerald);
          box-shadow: 0 0 10px var(--accent-emerald-glow);
          animation: pulseGlow 2s infinite;
        }
        
        .chat-container {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          height: calc(100% - 60px);
          justify-content: space-between;
        }
        .chat-history {
          flex-grow: 1;
          overflow-y: auto;
          padding-right: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .chat-bubble-wrapper {
          display: flex;
          gap: 0.75rem;
          max-width: 80%;
        }
        .chat-bubble-wrapper.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .assistant .avatar {
          background: rgba(0, 245, 212, 0.15);
          border: 1px solid rgba(0, 245, 212, 0.3);
          color: var(--accent-cyan);
        }
        .user .avatar {
          background: rgba(157, 78, 221, 0.15);
          border: 1px solid rgba(157, 78, 221, 0.3);
          color: var(--accent-purple);
        }
        
        .chat-bubble {
          padding: 0.75rem 1rem;
          border-radius: 14px;
          font-size: 0.85rem;
          line-height: 1.4;
        }
        .assistant .chat-bubble {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-top-left-radius: 2px;
          color: var(--text-primary);
        }
        .user .chat-bubble {
          background: rgba(157, 78, 221, 0.1);
          border: 1px solid rgba(157, 78, 221, 0.2);
          border-top-right-radius: 2px;
          color: var(--text-primary);
        }
        
        .chat-input-bar {
          display: flex;
          gap: 0.5rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-card);
          padding: 0.5rem 0.75rem;
          border-radius: 12px;
        }
        .chat-input-bar input {
          flex-grow: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: 0.85rem;
          outline: none;
        }
        .chat-input-bar input::placeholder {
          color: var(--text-muted);
        }
        .send-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--accent-cyan);
          color: #070b19;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 10px var(--accent-cyan-glow);
        }
        .send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        /* Thinking animation */
        .thinking {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0.85rem 1rem;
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-cyan);
          animation: typing 1.4s infinite both;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        .sample-prompts-container {
          margin-bottom: 1rem;
        }
        .prompt-header {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .prompts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        .prompt-btn {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-family: var(--font-primary);
          font-size: 0.75rem;
          text-align: left;
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .prompt-btn:hover {
          background: rgba(0, 245, 212, 0.05);
          border-color: rgba(0, 245, 212, 0.2);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
