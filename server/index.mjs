import dotenv from 'dotenv';
import connection from "./config/db.mjs";
import express from 'express';
import societyRoutes from './routes/societyRoutes.mjs';
import eventRoutes from './routes/eventRoutes.mjs';
import reportRoutes from './routes/reportRoutes.mjs';
import chatMessagesRoutes from './routes/chatMessagesRoutes.mjs';
import chatUsersRoutes from './routes/chatUsersRoutes.mjs';
import cors from 'cors';
import loginRoutes from './routes/loginRoutes.mjs';
import { authenticateUser } from './middleware/authMiddleware.mjs'; 

dotenv.config();
connection();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/login', loginRoutes);

app.use('/api', societyRoutes); 
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat/messages', chatMessagesRoutes);
app.use('/api/chat/users', chatUsersRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
