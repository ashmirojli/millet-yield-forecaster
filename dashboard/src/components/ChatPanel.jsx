import { useState, useRef, useEffect } from 'react'
import { X, Maximize2, Minimize2, Send, MessageCircle } from 'lucide-react'
import './ChatPanel.css'

export default function ChatPanel() {
  const [isOpen,     setIsOpen]     = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages,   setMessages]   = useState([
    { role: 'assistant', text: 'Hi! Ask me anything about millet agronomy or district yield data.' }
  ])
  const [input,     setInput]     = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const endOfMessagesRef = useRef(null)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })  // this scrolls to the bottom so as to keep the latest message in view after every new addition
  }, [messages, isLoading])

  useEffect(() => {
    const width = isExpanded ? '100vw' : '350px'
    if (isOpen) {
      document.body.style.marginRight = isExpanded ? '0' : '350px'  // the body is pushed left so as to prevent the chat panel from overlapping the main content
      document.body.style.overflow    = isExpanded ? 'hidden' : ''  // overflow is locked so as to prevent the page from scrolling behind the fullscreen chat panel
      document.documentElement.style.setProperty('--chat-width', width)
      document.body.classList.add('chat-open')
    } else {
      document.body.style.marginRight = '0'
      document.body.style.overflow    = ''
      document.body.classList.remove('chat-open')
    }

    return () => {  // cleanup so as to restore the body to its original state if the component unmounts while the chat is open
      document.body.style.marginRight = '0'
      document.body.style.overflow    = ''
      document.body.classList.remove('chat-open')
    }
  }, [isOpen, isExpanded])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')

    const newHistory = [...messages, { role: 'user', text: userMessage }]
    setMessages(newHistory)
    setIsLoading(true)

    try {
      const historyPayload = newHistory.slice(1, -1)  // the initial greeting is excluded so as to save token space — the model doesn't need it for context

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: historyPayload })
      })

      const data = await response.json()

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${data.error}` }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: data.response }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Network error: Make sure the backend server is running.' }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button className="chat-fab" onClick={() => setIsOpen(true)} aria-label="Open AI Chat">
        <MessageCircle size={24} />
      </button>
    )
  }

  return (
    <div className={`chat-panel ${isExpanded ? 'chat-panel--expanded' : ''}`}>
      <div className="chat-panel__header">
        <div className="chat-panel__title">
          <MessageCircle size={18} />
          <span>Millet AI</span>
        </div>
        <div className="chat-panel__actions">
          <button onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Collapse" : "Expand"}>
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button onClick={() => setIsOpen(false)} title="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="chat-panel__messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message chat-message--${msg.role}`}>
            {/* text is split on **bold** patterns so as to render markdown-style emphasis without importing a full markdown library */}
            {msg.text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>
              }
              return <span key={index}>{part}</span>
            })}
          </div>
        ))}

        {isLoading && (
          <div className="chat-message chat-message--assistant chat-message--loading">
            <span className="loading-text">Loading data</span>
            <span className="dot"></span><span className="dot"></span><span className="dot"></span>
          </div>
        )}
        <div ref={endOfMessagesRef} />  {/* invisible anchor element so as to give scrollIntoView a target at the bottom of the message list */}
      </div>

      <form className="chat-panel__input-area" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about district yield..."
          disabled={isLoading}
        />
        <button type="submit" disabled={!input.trim() || isLoading}>
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
