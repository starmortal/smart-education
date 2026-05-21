const express = require("express");
const router = express.Router();
const Note = require("../models/Note");

/**
 * 学习笔记路由模块
 * 功能：笔记的增删改查、分类管理、标签筛选、搜索
 * 用途：帮助学生记录学习要点，建立知识体系
 */

// 获取笔记列表
router.get("/list", async (req, res) => {
  try {
    const { userId, pageNum = 1, pageSize = 12, noteCategory, noteTag, searchKey } = req.query;
    
    const query = { userId };
    if (noteCategory) query.noteCategory = noteCategory;
    if (noteTag) {
      const tags = noteTag.split(",").filter(t => t);
      if (tags.length > 0) {
        query.noteTag = { $in: tags };
      }
    }
    if (searchKey) {
      query.$or = [
        { noteTitle: { $regex: searchKey, $options: "i" } },
        { noteContent: { $regex: searchKey, $options: "i" } },
      ];
    }
    
    const total = await Note.countDocuments(query);
    
    const notes = await Note.find(query)
      .sort({ createTime: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(parseInt(pageSize));
    
    const formattedNotes = notes.map(note => ({
      id: note._id.toString(),
      _id: note._id,
      userId: note.userId,
      noteTitle: note.noteTitle,
      noteCategory: note.noteCategory,
      noteTag: note.noteTag,
      noteContent: note.noteContent,
      createTime: note.createTime,
      updateTime: note.updateTime
    }));
    
    res.json({
      notes: formattedNotes,
      count: total,
      message: "获取笔记列表成功",
    });
  } catch (error) {
    console.error("获取笔记列表失败：", error);
    res.status(500).json({ message: "获取笔记列表失败" });
  }
});

// 新增笔记
router.post("/add", async (req, res) => {
  try {
    const { userId, noteTitle, noteCategory, noteTag, noteContent } = req.body;
    
    if (!userId || !noteTitle || !noteCategory || !noteContent) {
      return res.status(400).json({ message: "必填字段不能为空" });
    }
    
    const newNote = new Note({
      userId,
      noteTitle,
      noteCategory,
      noteTag: noteTag || [],
      noteContent,
    });
    
    await newNote.save();
    
    res.status(201).json({
      message: "新增笔记成功",
      noteId: newNote._id,
    });
  } catch (error) {
    console.error("新增笔记失败：", error);
    res.status(500).json({ message: "新增笔记失败" });
  }
});

// 更新笔记
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { noteTitle, noteCategory, noteTag, noteContent } = req.body;
    
    const note = await Note.findByIdAndUpdate(
      id,
      {
        noteTitle,
        noteCategory,
        noteTag,
        noteContent,
        updateTime: new Date(),
      },
      { new: true }
    );
    
    if (!note) {
      return res.status(404).json({ message: "笔记不存在" });
    }
    
    res.json({ message: "更新笔记成功" });
  } catch (error) {
    console.error("更新笔记失败：", error);
    res.status(500).json({ message: "更新笔记失败" });
  }
});

// 删除笔记
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const note = await Note.findByIdAndDelete(id);
    
    if (!note) {
      return res.status(404).json({ message: "笔记不存在" });
    }
    
    res.json({ message: "删除笔记成功" });
  } catch (error) {
    console.error("删除笔记失败：", error);
    res.status(500).json({ message: "删除笔记失败" });
  }
});

module.exports = router;
