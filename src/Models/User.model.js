import mongoose , {Schema} from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const UserSchema  = new Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        index : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true,
    },
    fullname : {
        type : String,
        required : true,
        trim : true,
    },
    avatar : {
        type : String,
        required : true,
    },
    coverimage : {
        type : String,//Cloudinary Image
    },
    watchhistory:[
        {
            type : Schema.Types.ObjectId,
            ref : 'Video'
        }
    ],
    refreshtoken : {
        type: String,
    },
    password:{
        type : String,
        required : [true, 'Password is required'],
    }

},{timestamps : true}
)

UserSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})


UserSchema.methods.comparePassword = async function (password){
    return await bcrypt.compare(password , this.password)
}

UserSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            username : this.username,
            fullname : this.fullname,
            email : this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn : process.env.ACCESS_TOKEN_EXPIRY}
    )
}

UserSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN,
        {expiresIn : process.env.REFRESH_TOKEN_EXPIRY}
    )
}


export const User = mongoose.model('User', UserSchema);