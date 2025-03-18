// src/services/messageService.ts
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs
} from 'firebase/firestore';

// Your Firebase config (get this from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyCR-7lM9BVYpsshLYf4vEcgLf64dWOGBsc",
  authDomain: "blockchain-carpooling-msg.firebaseapp.com",
  projectId: "blockchain-carpooling-msg",
  storageBucket: "blockchain-carpooling-msg.firebasestorage.app",
  messagingSenderId: "203020817703",
  appId: "1:203020817703:web:bb39b1a24c8c8cafc34502",
  measurementId: "G-8SJ27MZ9MM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export type Message = {
  id: string;
  rideId: number;
  sender: string;
  receiver: string;
  content: string;
  timestamp: Date;
  read: boolean;
};

// Create a conversation ID that's consistent regardless of who initiates
export const getConversationId = (rideId: number, address1: string, address2: string): string => {
  // Ensure rideId is a number
  const rideIdNum = Number(rideId);
  
  // Sort addresses to ensure same ID regardless of order
  const sortedAddresses = [address1.toLowerCase(), address2.toLowerCase()].sort();
  return `ride_${rideIdNum}_${sortedAddresses[0]}_${sortedAddresses[1]}`;
};

// Send a message
export const sendMessage = async (
  rideId: number | string | { toString: () => string },
  senderAddress: string,
  receiverAddress: string,
  content: string
): Promise<string> => {
  try {
    const conversationId = getConversationId(
      typeof rideId === 'object' ? Number(rideId.toString()) : Number(rideId), 
      senderAddress, 
      receiverAddress
    );
    
    // Convert rideId to a string if it's a BigNumber or other object
    const rideIdValue = typeof rideId === 'object' ? rideId.toString() : String(rideId);
    
    const messageRef = await addDoc(collection(db, 'messages'), {
      conversationId,
      rideId: rideIdValue, // Store as string
      sender: senderAddress.toLowerCase(),
      receiver: receiverAddress.toLowerCase(),
      content,
      timestamp: serverTimestamp(),
      read: false
    });
    
    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get message history
export const getMessageHistory = async (
  rideId: number | string | { toString: () => string },
  userAddress: string,
  otherAddress: string
): Promise<Message[]> => {
  try {
    const conversationId = getConversationId(
      typeof rideId === 'object' ? Number(rideId.toString()) : Number(rideId), 
      userAddress, 
      otherAddress
    );
    
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        rideId: data.rideId,
        sender: data.sender,
        receiver: data.receiver,
        content: data.content,
        timestamp: (data.timestamp as Timestamp).toDate(),
        read: data.read
      });
    });
    
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

// Subscribe to new messages in real-time
export const subscribeToMessages = (
  rideId: number | string | { toString: () => string },
  userAddress: string,
  otherAddress: string,
  callback: (messages: Message[]) => void
) => {
  const conversationId = getConversationId(
    typeof rideId === 'object' ? Number(rideId.toString()) : Number(rideId), 
    userAddress, 
    otherAddress
  );
  
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const messages: Message[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        rideId: data.rideId,
        sender: data.sender,
        receiver: data.receiver,
        content: data.content,
        timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date(),
        read: data.read
      });
    });
    
    callback(messages);
  });
};

// Mark messages as read
export const markMessagesAsRead = async (
  rideId: number,
  userAddress: string,
  otherAddress: string
) => {
  // Implementation for marking messages as read
  // This would update read status in Firestore
};