import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';


const videoSchema = new Schema({
    videofile:{
        type:String, // cloudnary url
        required: true,
    },
    thumbnail:{
        type:String, // cloudnary url
        required: true,
    },
    title:{
        type:String, 
        required: true,
    },
    description:{
        type:String, // cloudnary url
        required: true,
    },
    duration:{
        type: Number,
        requred:true
    },
    view: {
        type: Number,
        default:0
    },
    ispublished:{
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref:"User"
    }





}, {timestaps:true});

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema)
