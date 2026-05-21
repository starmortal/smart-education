const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const Response = require("../utils/response");
const logger = require("../utils/logger");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

/**
 * 学习笔记路由模块
 * 功能：笔记的增删改查、分类管理、标签筛选、搜索
 * 用途：帮助学生记录学习要点，建立知识体系
 */

// 获取笔记列表
router.get("/list", asyncHandler(async (req, res) => {
  const { userId, pageNum = 1, pageSize = 12, noteCategory, noteTag, searchKey } = req.query;
  
  logger.info(`获取笔记列表: userId=${userId}, pageNum=${pageNum}, pageSize=${pageSize}`);
  
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
  
  Response.success(res, {
    notes: formattedNotes,
    count: total,
  }, "获取笔记列表成功");
}));

// 新增笔记
router.post("/add", asyncHandler(async (req, res) => {
  const { userId, noteTitle, noteCategory, noteTag, noteContent } = req.body;
  
  if (!userId || !noteTitle || !noteCategory || !noteContent) {
    throw new AppError("必填字段不能为空", 400);
  }
  
  logger.info(`新增笔记: userId=${userId}, noteTitle=${noteTitle}`);
  
  const newNote = new Note({
    userId,
    noteTitle,
    noteCategory,
    noteTag: noteTag || [],
    noteContent,
  });
  
  await newNote.save();
  
  logger.info(`笔记创建成功: noteId=${newNote._id}`);
  
  Response.success(res, {
    noteId: newNote._id,
  }, "新增笔记成功", 201);
}));

// 更新笔记
router.put("/update/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { noteTitle, noteCategory, noteTag, noteContent } = req.body;
  
  logger.info(`更新笔记: id=${id}`);
  
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
    throw new AppError("笔记不存在", 404);
  }
  
  logger.info(`笔记更新成功: id=${id}`);
  
  Response.success(res, null, "更新笔记成功");
}));

// 删除笔记
router.delete("/delete/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info(`删除笔记: id=${id}`);
  
  const note = await Note.findByIdAndDelete(id);
  
  if (!note) {
    throw new AppError("笔记不存在", 404);
  }
  
  logger.info(`笔记删除成功: id=${id}`);
  
  Response.success(res, null, "删除笔记成功");
}));

module.exports = router;
