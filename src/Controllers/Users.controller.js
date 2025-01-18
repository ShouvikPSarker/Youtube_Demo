import Async1Handler from "../Utils/Async1handler.js";


const registerUser = Async1Handler(async (req , res) =>{
    res.status(200).json({message: "User Registered"});
})

export default registerUser;