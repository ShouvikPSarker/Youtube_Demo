import mongoose , {Schema} from "mongoose";

const SubscribtionSchema = new Schema({
    subscription : {
        type: Schema.Types.ObjectId,
        ref : "User"
    },
    channel:{
        type: Schema.Types.ObjectId,
        ref : "User"
    }
} , {timestamps : true})

export const Subscriber = mongoose.model("Subscriber" , SubscribtionSchema)