class ApiError extends Error{
    constructor(status , message , Error = []){
        super(message);
        this.status = status;
        this.message = message;
        this.errors = Error;
        this.sucess = false;
    }
}
export default ApiError;