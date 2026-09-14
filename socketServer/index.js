import express from "express";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import axios from "axios";

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_BASE_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("identity", async (userId) => {
    try {
      await axios.post(
        `${process.env.NEXT_BASE_URL}/api/socket/connect`,
        {
          userId,
          socketId: socket.id,
        }
      );
      console.log("Socket ID stored successfully");
    } catch (error) {
      console.error("Error storing socket ID:", error.message);
    }
  });

  socket.on("update-location", async ({ userId, latitude, longitude }) => {
    try {
      const location = {
        type: "Point",
        coordinates: [longitude, latitude]
      };
      await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/update-location`, { userId, location });
      // Broadcast updated location to all connected clients (e.g. user's tracking page)
      io.emit("update-deliveryBoy-location", { userId, location });
    } catch (error) {
      console.error("Error updating location:", error.message);
    }
  });

  socket.on("join-room",(roomId)=>{
    console.log("join room with ",roomId)
    socket.join(roomId)
  })

  socket.on("send-message", async (message) => {
    try {
      await axios.post(`${process.env.NEXT_BASE_URL}/api/chat/save`, message);
      io.to(message.roomId).emit("send-message", message);
    } catch (error) {
      console.error("Error saving/sending message:", error.message);
    }
  })

  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.post("/notify", (req, res) => {
  const { event, data, socketId } = req.body
  if (socketId) {
    io.to(socketId).emit(event, data)
  } else {
    io.emit(event, data)
  }
  return res.status(200).json({ "success": true })
})

// Start Server
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});