

//specially for middlewares
const Async1Handler =  (requesthandler) => async (req , res , next ) => {
    try {
        await requesthandler(req , res , next );
    } catch (error) {
        console.log(`Error in Connection: ${error}`);
        res.status(error.code || 500).json({message: "Server Error"});
    }
}



// 



export default Async1Handler;