import { useState, useEffect, useRef } from 'react';
import './MessagingModal.css';

type Message = {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  isFromMe: boolean;
};

type MessagingModalProps = {
  rideId: number;
  driverAddress: string;
  passengerAddress: string;
  onClose: () => void;
};

export const MessagingModal = ({ 
  rideId, 
  driverAddress, 
  passengerAddress,
  onClose 
}: MessagingModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch message history on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // For now, simulate message history
        // In a real app, you would fetch from your backend or messaging service
        const mockMessages: Message[] = [
          {
            id: '1',
            sender: driverAddress,
            content: "Hello! I'll be your driver for the trip. Looking forward to meeting you!",
            timestamp: Date.now() - 60000 * 15,
            isFromMe: false
          }
        ];
        
        setMessages(mockMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [driverAddress, passengerAddress, rideId]);
  
  // Scroll to bottom of messages when new ones arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    // Create a new message
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: passengerAddress,
      content: messageInput,
      timestamp: Date.now(),
      isFromMe: true
    };
    
    // In a real app, send to backend/messaging service
    // For now, just update local state
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setMessageInput('');
    
    // Simulate driver response after a delay
    setTimeout(() => {
      const driverResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: driverAddress,
        content: 'Got it! See you at the pickup point.',
        timestamp: Date.now(),
        isFromMe: false
      };
      setMessages(prevMessages => [...prevMessages, driverResponse]);
    }, 3000);
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="messaging-modal-overlay">
      <div className="messaging-modal">
        <div className="messaging-header">
          <h3>Chat with Driver</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <div className="messages-container">
          {loading ? (
            <div className="loading-messages">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            <>
              {messages.map(message => (
                <div 
                  key={message.id} 
                  className={`message ${message.isFromMe ? 'outgoing' : 'incoming'}`}
                >
                  <div className="message-bubble">
                    {message.content}
                  </div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <div className="messaging-input-area">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            className="send-button"
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};