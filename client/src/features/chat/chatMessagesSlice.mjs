import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

const config = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  },
};

// Fetch messages for a specific chat
export const fetchMessages = createAsyncThunk(
  'chatMessages/fetchMessages',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/chat/messages/${chatId}`, config);
      return { chatId, messages: response.data };
    } catch (error) {
      console.error('Error fetching messages:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to fetch messages');
    }
  }
);

// Send a new message and update unread counts
export const sendMessage = createAsyncThunk(
  'chatMessages/sendMessage',
  async (messageData, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/chat/messages`, messageData, config);
      const message = response.data;

      const { chatMessages } = getState();
      const chatId = messageData.chatId;
      const currentMessages = chatMessages.messages[chatId] || [];
      const updatedMessages = [...currentMessages, message];

      dispatch({
        type: 'chatUsers/incrementUnreadCount',
        payload: { chatId },
      });

      return { chatId, message, messages: updatedMessages };
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to send message');
    }
  }
);

// Mark messages as read
export const markMessagesAsRead = createAsyncThunk(
  'chatMessages/markMessagesAsRead',
  async (chatId, { dispatch, rejectWithValue }) => {
    try {
      // Call API to mark messages as read
      await axios.put(`${API_URL}/chat/messages/${chatId}/read`, config);
      
      // Reset unread count
      dispatch({
        type: 'chatUsers/resetUnreadCount',
        payload: { chatId }
      });
      
      return chatId;
    } catch (error) {
      console.error('Error marking messages as read:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to mark messages as read');
    }
  }
);

const initialState = {
  messages: {},
  status: 'idle',
  error: null
};

const chatMessagesSlice = createSlice({
  name: 'chatMessages',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { chatId, messages } = action.payload;
        state.messages[chatId] = messages;
        state.status = 'succeeded';
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.status = 'sending';
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { chatId, message } = action.payload;
        
        // Initialize the chat messages array if it doesn't exist
        if (!state.messages[chatId]) {
          state.messages[chatId] = [];
        }
        
        // Add the new message to the chat
        state.messages[chatId].push(message);
        state.status = 'succeeded';
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { addMessage } = chatMessagesSlice.actions;
export default chatMessagesSlice.reducer;
