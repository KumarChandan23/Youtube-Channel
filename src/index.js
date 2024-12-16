
import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import {app} from './app.js'
dotenv.config({
    path:'./env'
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 3000, ()=>{
        console.log(`server is running ap port: ${process.env.PORT}`)
    })
})
.catch(error=>{
    console.log("MongoDb Connection failed !!! ", error)
})







//  Normal Approach to connect with Database 
/*
import {mongoose} from "mongoose";
import { DB_NAME } from "../constants.js";
import express  from "express";
const app = express();
;(async ()=>{
    try{
       await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error",(error)=>{
        console.log("ERROR: ", error);
        throw error;
       })
       app.listen(process.env.PORT, ()=>{
        console.log(`App is listing on port ${process.env.PORT}`)
       })
    } catch(error){
        console.log("ERROR: " , error);
        throw error;
    }
})()
    */