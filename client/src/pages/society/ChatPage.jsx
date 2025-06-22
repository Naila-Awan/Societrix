import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChats, setActiveChat } from '../../features/chat/chatUsersSlice.mjs';
import { fetchMessages, sendMessage } from '../../features/chat/chatMessagesSlice.mjs';
import '../../styles/pages/admin/Chat.css'; // Reusing the admin chat styles

const ChatPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { chats = [], activeChat = 'announcements', unreadCounts = {}, status: chatsStatus = 'idle' } = useSelector((state) => state.chatUsers || {});
  const { messages = {}, status: messagesStatus = 'idle' } = useSelector((state) => state.chatMessages || {});
  const { darkMode } = useSelector((state) => state.theme || {});
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [error, setError] = useState(null);

  // Fetch existing chats
  useEffect(() => {
    setError(null);
    dispatch(fetchChats())
      .unwrap()
      .catch(error => {
        console.error('Failed to fetch chats:', error);
        setIsInitializing(false);
        setError('Failed to connect to chat server. Please try again later.');
      });
  }, [dispatch]);

  // Fetch messages for active chat whenever it changes
  useEffect(() => {
    if (activeChat) {
      setError(null);
      dispatch(fetchMessages(activeChat))
        .catch(error => {
          console.error('Failed to fetch messages:', error);
          setError('Failed to load messages. Please try again later.');
        });
    }
  }, [dispatch, activeChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle sending messages
  const handleSend = () => {
    if (!newMessage.trim()) return;
    setError(null);
    
    const messageData = {
      sender: user?.name || 'Society User',
      content: newMessage,
      isAdmin: false, // Society messages are not admin messages
      chatId: activeChat
    };
    
    dispatch(sendMessage(messageData))
      .unwrap()
      .then(() => {
        setNewMessage('');
      })
      .catch(error => {
        console.error('Error sending message:', error);
        setError('Failed to send message. Please try again.');
      });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error("Error formatting timestamp:", e);
      return '';
    }
  };

  const handleChatSelect = (chatId) => {
    dispatch(setActiveChat(chatId));
  };

  // Get society ID or email for current user
  const societyId = user?.societyId;
  const societyEmail = user?.email;
  const societyName = user?.name;

  // Find all relevant chats - announcements, admin chat and chats with other societies
  const relevantChats = Array.isArray(chats) 
    ? chats.filter(chat => {
        // Include all chats - don't filter anything out
        return true;
      })
    : [];

  const getMessagePreview = (messageList) => {
    if (!messageList || messageList.length === 0) {
      return 'No messages yet';
    }
    
    const latestMessage = messageList[messageList.length - 1];
    if (!latestMessage || !latestMessage.content) {
      return 'No message content';
    }
    
    try {
      return typeof latestMessage.content === 'string' 
        ? latestMessage.content.substring(0, 30) + (latestMessage.content.length > 30 ? '...' : '')
        : 'Invalid message content';
    } catch (error) {
      console.error('Error getting message preview:', error);
      return 'Error displaying message';
    }
  };

  const getUniqueMessageKey = (message) => {
    if (message._id) return message._id;
    if (message.chatId && message.messageId) return `${message.chatId}-${message.messageId}`;
    return Math.random().toString(36).substr(2, 9);
  };

  // Get the current chat name and avatar
  const getCurrentChatInfo = () => {
    if (activeChat === 'announcements') {
      return { 
        name: 'Announcements', 
        avatar: '📢',
        description: 'University-wide announcements and discussions'
      };
    }

    const currentChat = chats.find(chat => chat?.chatId === activeChat);
    
    if (currentChat) {
      // Check if this is the society's chat with admin
      const isSocietyOwnChat = 
        (societyId && currentChat.chatId === `society-${societyId}`) ||
        (societyEmail && currentChat.members?.some(m => m.userId === societyEmail)) ||
        (societyName && currentChat.chatName === societyName);
        
      return {
        name: isSocietyOwnChat ? 'Admin Chat' : currentChat.chatName,
        avatar: currentChat.avatar || (isSocietyOwnChat ? '👨‍💼' : '🏛️'),
        description: isSocietyOwnChat 
          ? 'Direct messages with administrators' 
          : `Chat with ${currentChat.chatName}`
      };
    }
    
    return { name: 'Chat', avatar: '💬', description: 'Messages' };
  };

  const currentChatInfo = getCurrentChatInfo();
  const currentMessages = Array.isArray(messages[activeChat]) ? messages[activeChat] : [];

  return (
    <div className="chat-page">
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h3>Chats</h3>
          </div>
          
          <div className="chat-list">
            {/* Display all available chats with better organization */}
            {relevantChats.length > 0 ? (
              <>
                {/* Announcements at the top */}
                {relevantChats.filter(chat => chat?.chatId === 'announcements').map(chat => (
                  <div 
                    key={chat.chatId}
                    className={`chat-list-item ${activeChat === chat.chatId ? 'active' : ''}`}
                    onClick={() => handleChatSelect(chat.chatId)}
                  >
                    <div className="chat-item-avatar announcement-avatar">
                      {chat.avatar || '📢'}
                    </div>
                    <div className="chat-item-info">
                      <div className="chat-item-name">Announcements</div>
                      <div className="chat-item-preview">
                        {getMessagePreview(messages[chat.chatId])}
                      </div>
                    </div>
                    {unreadCounts[chat.chatId] > 0 && (
                      <div className="unread-badge">{unreadCounts[chat.chatId]}</div>
                    )}
                  </div>
                ))}

                {/* Separator for Admin Chat */}
                <div className="chat-list-separator">
                  <span>Admin Chat</span>
                </div>

                {/* Society's own chat with admin */}
                {relevantChats
                  .filter(chat => 
                    chat?.chatType === 'society' && 
                    ((societyId && chat.chatId === `society-${societyId}`) ||
                     (societyEmail && chat.members?.some(m => m.userId === societyEmail)) ||
                     (societyName && chat.chatName === societyName))
                  )
                  .map(chat => (
                    <div 
                      key={chat.chatId}
                      className={`chat-list-item ${activeChat === chat.chatId ? 'active' : ''}`}
                      onClick={() => handleChatSelect(chat.chatId)}
                    >
                      <div className="chat-item-avatar">
                        {chat.avatar || '👨‍💼'}
                      </div>
                      <div className="chat-item-info">
                        <div className="chat-item-name">Admin Chat</div>
                        <div className="chat-item-preview">
                          {getMessagePreview(messages[chat.chatId])}
                        </div>
                      </div>
                      {unreadCounts[chat.chatId] > 0 && (
                        <div className="unread-badge">{unreadCounts[chat.chatId]}</div>
                      )}
                    </div>
                  ))
                }

                {/* Separator for Other Societies */}
                <div className="chat-list-separator">
                  <span>Other Societies</span>
                </div>

                {/* All other society chats */}
                {relevantChats
                  .filter(chat => 
                    chat?.chatType === 'society' && 
                    !(societyId && chat.chatId === `society-${societyId}`) &&
                    !(societyEmail && chat.members?.some(m => m.userId === societyEmail)) &&
                    !(societyName && chat.chatName === societyName) &&
                    chat?.chatId !== 'announcements'
                  )
                  .sort((a, b) => a.chatName?.localeCompare(b.chatName || ''))
                  .map(chat => (
                    <div 
                      key={chat.chatId}
                      className={`chat-list-item ${activeChat === chat.chatId ? 'active' : ''}`}
                      onClick={() => handleChatSelect(chat.chatId)}
                    >
                      <div className="chat-item-avatar">
                        {chat.avatar || '🏛️'}
                      </div>
                      <div className="chat-item-info">
                        <div className="chat-item-name">{chat.chatName || 'Unknown Society'}</div>
                        <div className="chat-item-preview">
                          {getMessagePreview(messages[chat.chatId])}
                        </div>
                      </div>
                      {unreadCounts[chat.chatId] > 0 && (
                        <div className="unread-badge">{unreadCounts[chat.chatId]}</div>
                      )}
                    </div>
                  ))
                }
              </>
            ) : (
              <div className="no-societies-message">
                No chats available. Please contact an administrator.
              </div>
            )}
          </div>
        </div>
        
        <div className="chat-main">
          <div className="chat-header">
            <div className="chat-avatar">{currentChatInfo.avatar}</div>
            <div className="chat-info">
              <h2>{currentChatInfo.name}</h2>
              <p>{currentChatInfo.description}</p>
            </div>
          </div>
          
          <div className="messages-container">
            {messagesStatus === 'loading' ? (
              <div className="loading">Loading messages...</div>
            ) : currentMessages.length > 0 ? (
              <div className="messages-list">
                {currentMessages.map(message => message && (
                  <div 
                    key={getUniqueMessageKey(message)}
                    className={`message ${message.isAdmin ? 'society-message' : 'admin-message'}`}
                  >
                    <div className="message-content">
                      {message.isAdmin && (
                        <div className="message-sender">{message.sender || 'Admin'}</div>
                      )}
                      <div className="message-text">{message.content || 'No content'}</div>
                      <div className="message-time">{formatTime(message.timestamp)}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="empty-chat-message">
                <div className="empty-chat-icon">💬</div>
                <h3>No messages yet</h3>
                <p>Start the conversation by sending a message below</p>
              </div>
            )}
          </div>
          
          <div className="chat-input-container">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder={
                activeChat === 'announcements' 
                  ? 'Type a message to all societies and admin...' 
                  : 'Type a message to administrators...'
              }
              className="chat-input"
              style={{
                color: darkMode ? 'white' : 'black',
                backgroundColor: darkMode ? '#333' : '#fff'
              }}
            ></textarea>
            <button 
              className="send-button"
              onClick={handleSend}
              disabled={!newMessage.trim() || messagesStatus === 'sending'}
            >
              <span className="send-icon">📨</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
