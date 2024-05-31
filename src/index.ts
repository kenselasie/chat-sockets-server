import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import logger from "./logger";

interface IChatData {
  chat_id: string;
  content: string;
  created_at: string;
  read_by: string;
  sender_id: string;
}
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("API is running..");
});

const PORT = process.env.PORT || 7500;

const io = new Server(server, {
  pingTimeout: 60000,

  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allow specific HTTP methods
  },
});

io.on("connection", (socket: any) => {
  logger.info("Connected to socket.io");
  socket.on("setup", (userData: { id: any }) => {
    socket.join(userData.id);
    socket.emit("connected");
  });

  socket.on("join chat", (room: string) => {
    socket.join(room);
    logger.info(`User Joined Room: ${room}`);
  });
  socket.on("typing", (room: any) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room: any) => socket.in(room).emit("stop typing"));
  socket.on(
    "new message",
    (newMessageRecieved: { recepient_id: string; data: any }) => {
      socket
        .in(newMessageRecieved.recepient_id)
        .emit("message recieved", newMessageRecieved);
    }
  );
  socket.off("setup", () => {
    logger.info("USER DISCONNECTED");
  });
});

server.listen(PORT, () => {
  logger.info(`Server running on PORT ${PORT}...`);
});

process.on("SIGINT", () => {
  console.log("\n");
  logger.info("Gracefully shutting down");
});
