import mongoose , {Schema}from "mongoose"

const PlaylistSchema = new Schema ( {
    name : {
        type : String,
        required : true
    },
    description : {
        type : String,
        rquired  : true
    },
    videos : {
        type :  Schema.Types.ObjectId,
        ref : "Video"
    },
    creator : {
        type :  Schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps : true})

export const Playlist = mongoose.model("Playlist",PlaylistSchema )