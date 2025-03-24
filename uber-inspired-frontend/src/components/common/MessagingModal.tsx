// src/components/common/MessagingModal.tsx
import { useState, useEffect, useRef } from 'react';
import './MessagingModal.css';
import { 
  sendMessage, 
  getMessageHistory, 
  subscribeToMessages,
  Message as MessageType
} from '../../services/messageService';

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
  isDriver: boolean; // Add this to identify if current user is driver or passenger
  onClose: () => void;
};

export const MessagingModal = ({ 
  rideId, 
  driverAddress, 
  passengerAddress,
  isDriver,
  onClose 
}: MessagingModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Current user is either driver or passenger
  const currentUserAddress = isDriver ? driverAddress : passengerAddress;
  // The other party in the conversation
  const otherUserAddress = isDriver ? passengerAddress : driverAddress;
  
  // Fetch message history on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const history = await getMessageHistory(rideId, currentUserAddress, otherUserAddress);
        
        // Transform to UI format
        const formattedMessages = history.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp.getTime(),
          isFromMe: msg.sender.toLowerCase() === currentUserAddress.toLowerCase()
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const unsubscribe = subscribeToMessages(
      rideId,
      currentUserAddress,
      otherUserAddress,
      (updatedMessages) => {
        const formattedMessages = updatedMessages.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp.getTime(),
          isFromMe: msg.sender.toLowerCase() === currentUserAddress.toLowerCase()
        }));
        
        setMessages(formattedMessages);
      }
    );
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, [rideId, currentUserAddress, otherUserAddress]);
  
  // Scroll to bottom of messages when new ones arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    try {
      // Send message to Firebase
      await sendMessage(
        rideId,
        currentUserAddress,
        otherUserAddress,
        messageInput
      );
      
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="messaging-modal-overlay">
      <div className="messaging-modal">
        <div className="messaging-header">
          <h3>Chat with {isDriver ? 'Passenger' : 'Driver'}</h3>
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