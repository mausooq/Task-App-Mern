const express = require('express');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');
const { upload,deleteImage } = require('../config/cloudinary');
const router = express();


router.post('/',authMiddleware,upload.single('image'),async (req,res) => {
    try {
        
        const { title, description, date, status } = req.body;
        const imageUrl = req.file ? req.file.path : "taskImage.png";

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
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        // console.log(req.body);
        
        const task = await Task.findOne({_id: req.params.id, user: req.user.id});
        if (!task) return res.status(400).json({ message: "Task Not Found" });

        
        if (req.file) {
            if (task.image && task.image !== 'taskImage.png') {
                await deleteImage(task.image);
            }
            task.image = req.file.path; 
        }

   
        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.date = req.body.date || task.date;
        task.status = req.body.status || task.status;

        await task.save();
        return res.json({ message: "Task updated successfully", task });

    } catch (error) {
        return res.status(500).json({ message: "Server issues", error: error.message });
    }
});

router.delete('/:id',authMiddleware,async (req,res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, user: req.user.id});

        if (!task) return res.status(400).json("Task Not found");

        // Only delete image if it's not the default image
        if (task.image && task.image !== 'taskImage.png') {
            await deleteImage(task.image);
        }

        return res.json("task deleted successfully");
    } catch (error) {
        return res.status(500).json({message: "server issues", error: error.message});
    }
})

router.put('/:id/image',authMiddleware,upload.single('image'),async (req,res) => {
    try {
        const task = await Task.findOne({_id: req.params.id, user: req.user.id});
        if (!task) return res.status(400).json("Task Not found");

        // Only delete old image if it's not the default image
        if (task.image && task.image !== 'taskImage.png') {
            await deleteImage(task.image);
        }

        task.image = req.file.path;
        await task.save();

        return res.status(200).json("image is updated");
    } catch (error) {
        return res.status(500).json({message: "server issues", error: error.message});
    }
})


module.exports = router;
