const express = require('express');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');
const { upload,deleteImage } = require('../config/cloudinary');
const router = express();


router.post('/',authMiddleware,upload.single('image'),async (req,res) => {
    try {
        
        const { title, description, date, status } = req.body;
        const imageUrl = req.file ? req.file.path : "default-task.jpg";

        const task = new Task({
            user: req.user.id,
            title,
            description,
            date,
            status,
            image: imageUrl
        });
        
        await task.save();
        res.status(201).json({ message: "Task created successfully", task });
        
    } catch (error) {
        return res.status(500).json({message : "server issues",error: error.message})
    }
})
router.get("/",authMiddleware,async (req,res) => {
    try {
        const task = await Task.find(req.params.id);
        res.json(task);
    } catch (error) {
        return res.status(500).json({message : "server issues",error : error.message});
    }
})

router.get('/:id',authMiddleware,async (req,res) => {
    try {
        // console.log(req.user.id);
        const task = await Task.findOne({_id : req.params.id,user : req.user.id})
        if(!task) return res.status(400).json("task not found")
        res.json(task)
    } catch (error) {
        res.json({msg :"server issues",error : error.message})
    }
})
router.put('/:id',authMiddleware,async (req,res) => {
    try{
        // console.log(req.body)
        const task = await Task.findOneAndUpdate({_id :req.params.id , user : req.user.id},req.body,{new:true})
        
        if(!task) return res.status(400).json("Task Not found")

        return res.json("task updated")

    } catch(error){
        return res.status(500).json({message : "server issues",error : error.message})
    }
})
router.delete('/:id',authMiddleware,async (req,res) => {
    try{
        const task = await Task.findOneAndDelete({_id :req.params.id , user : req.user.id})

        if(!task) return res.status(400).json("Task Not found")

        if (task.image && !task.image.includes('default-task.jpg')) {
            await deleteImage(task.image);
        }

        return res.json("task deleted successfully")

    } catch(error){
        return res.status(500).json({message : "server issues",error:error.message})
    }
})

router.put('/:id/image',authMiddleware,upload.single('image'),async (req,res) => {
    try{
        const task = await Task.findOne({_id : req.params.id , user: req.user.id});
        if(!task) return res.status(400).json("Task Not found");

        if (task.image && !task.image.includes('default-task.jpg')) {
            await deleteImage(task.image);
        }

        task.image = req.file.path;
        await task.save();

        return res.status(200).json("image is updated")
    } catch(error){
        return res.status(500).json({message : "server issues",error : error.message})
    }
})


module.exports = router;
