import mongoose from "mongoose";


console.log(process.env.DATABASEURL);
const publicSchema=new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    number: {
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    address:{
        type: String,
        required: true
    },
    noofaffected:{
        type: String,
        required: true
    },
    date:{
        type: String,
        required: true
    }
});
const Public=mongoose.model('Public',publicSchema);
export default Public;
