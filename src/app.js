import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

app.use(cookieParser())
app.use(express.static("Public"))
app.use(express.json({ limit: '20kb' }));
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
export default app;