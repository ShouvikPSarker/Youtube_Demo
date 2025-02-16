import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

const connectDB = async ()=>{
    try {
        const connectioninstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
        console.log(`MongoDB Connected: ${connectioninstance.connection.host}`);
    } catch (error) {
        console.log(`MONGODB connection FAILED!!! ${error}`);
        process.exit(1);
    }
}

export default connectDB;