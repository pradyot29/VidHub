import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const commentScehma = new  Schema(
    {
    content:{
        type:String,
        required:true
    },
    video: {
    type: Schema.Types.ObjectId,
    ref: "Video"
    },
    owmer: {
        type: Schema.Types.ObjectId,
        ref: "User"

    }

    },
    {timestamps:true}
)

commentScehma.plugin(mongooseAggregatePaginate) // mongodb aggreagtion pipleline
export const Comment = mongoose.model("Comment", commentScehma)