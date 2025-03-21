const mongoose = require('mongoose');


const TaskSchema  = new mongoose.Schema({
    user:{type : mongoose.Schema.Types.ObjectId, ref:'User',required : true},
    title: { type: String , required : true},
    description: { type: String, required: true },
    date:{type: Date ,required:true},
    image: { type: String, default: 'default-task.jpg' },
    status: { type: String, enum: ['pending', 'inprogress', 'done'],required : true },
},{ timestamps: true });

module.exports = mongoose.model('Task',TaskSchema)