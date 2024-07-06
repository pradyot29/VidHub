const asyncHandler = (requestHandler)=>{
(req,res,next)=>{
    Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
}
}

export { asyncHandler}


//concept of middle ware, same can be done without promises using try catch