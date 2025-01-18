import registerUser from "../Controllers/Users.controller.js";
import { Router } from "express";

const Userrouter = Router();

Userrouter.post("/register", registerUser);

export default Userrouter