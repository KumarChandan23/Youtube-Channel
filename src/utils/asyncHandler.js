
const asyncHandler = (requestHandler)=>{
   return (req, res, next)=>{
        Promise.resolve(requestHandler(req,res, next))
        .catch((error)=> next(error))
    }
}
export {asyncHandler}




















// const asyncHandler = (fun)=> async (req, res, next)=> {
//     try{
//         await fun(req, res, next)
//     }catch(error){
//             res.send(error.code || 500).json({
//                 success: true, 
//                 message: error.message
//             })
//     }
// }