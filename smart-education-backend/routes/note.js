const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const Response = require("../utils/response");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

/**
 * 学习笔记路由模块
 * 功能：笔记的增删改查、分类管理、标签筛选、全文搜索
 * 用途：帮助学生记录学习要点，建立知识体系
 */

// 获取笔记列表（支持搜索、分类、标签筛选）
router.get("/list", asyncHandler(async (req, res) => {
  const { userId, pageNum = 1, pageSize = 50, noteCategory, noteTags, searchKey } = req.query;
  
  if (!userId) {
    throw new AppError("用户ID不能为空", 400);
  }
  
  logger.info(`获取笔记列表: userId=${userId}, pageNum=${pageNum}, pageSize=${pageSize}`);
  
  const query = { userId };
  
  // 分类筛选
  if (noteCategory && noteCategory !== "全部") {
    query.noteCategory = noteCategory;
  }
  
  // 标签筛选
  if (noteTags) {
    const tagsArray = Array.isArray(noteTags) ? noteTags : [noteTags];
    query.noteTags = { $in: tagsArray };
  }
  
  // 全文搜索（标题和内容）
  if (searchKey) {
    query.$or = [
      { noteTitle: { $regex: searchKey, $options: "i" } },
      { noteContent: { $regex: searchKey, $options: "i" } },
    ];
  }
  
  const total = await Note.countDocuments(query);
  const notes = await Note.find(query)
    .sort({ updateTime: -1 })
    .skip((pageNum - 1) * pageSize)
    .limit(Number(pageSize))
    .lean();
  
  const formattedNotes = notes.map(note => ({
    id: note._id,
    noteTitle: note.noteTitle,
    noteContent: note.noteContent,
    noteCategory: note.noteCategory,
    noteTags: note.noteTags,
    createTime: note.createTime,
    updateTime: note.updateTime,
  }));
  
  Response.success(res, {
    notes: formattedNotes,
    count: total,
  }, "获取笔记列表成功");
}));

// 新增笔记
router.post("/add", asyncHandler(async (req, res) => {
  const { userId, noteTitle, noteCategory, noteTags, noteContent } = req.body;
  
  if (!userId) {
    throw new AppError("用户ID不能为空", 400);
  }
  
  logger.info(`新增笔记: userId=${userId}, noteTitle=${noteTitle}`);
  
  const newNote = new Note({
    userId,
    noteTitle: noteTitle || "无标题笔记",
    noteCategory: noteCategory || "未分类",
    noteTags: noteTags || [],
    noteContent: noteContent || "",
  });
  
  await newNote.save();
  
  logger.info(`笔记创建成功: noteId=${newNote._id}`);
  
  Response.success(res, {
    noteId: newNote._id,
    note: {
      id: newNote._id,
      noteTitle: newNote.noteTitle,
      noteContent: newNote.noteContent,
      noteCategory: newNote.noteCategory,
      noteTags: newNote.noteTags,
      createTime: newNote.createTime,
      updateTime: newNote.updateTime,
    }
  }, "新增笔记成功");
}));

// 更新笔记
router.put("/update/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { noteTitle, noteCategory, noteTags, noteContent } = req.body;
  
  logger.info(`更新笔记: id=${id}`);
  
  const note = await Note.findByIdAndUpdate(
    id,
    {
      noteTitle,
      noteCategory,
      noteTags,
      noteContent,
      updateTime: Date.now(),
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

// 获取所有分类
router.get("/categories", asyncHandler(async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    throw new AppError("用户ID不能为空", 400);
  }
  
  const categories = await Note.distinct("noteCategory", { userId });
  
  Response.success(res, { categories }, "获取分类列表成功");
}));

// 获取所有标签
router.get("/tags", asyncHandler(async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    throw new AppError("用户ID不能为空", 400);
  }
  
  const notes = await Note.find({ userId }).select("noteTags");
  const tagsSet = new Set();
  notes.forEach(note => {
    note.noteTags.forEach(tag => tagsSet.add(tag));
  });
  
  Response.success(res, { tags: Array.from(tagsSet) }, "获取标签列表成功");
}));

module.exports = router;
