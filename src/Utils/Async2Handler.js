const Async2Handler = (request2Handler) => {
    return (req , res , next) =>{
        Promise.resolve(request2Handler(req , res , next)).catch((error) =>next(error))
    }
} 

export default Async2Handler;