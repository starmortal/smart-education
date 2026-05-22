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

// 获取笔记列表（支持搜索、标签筛选、树形结构）
router.get("/list", asyncHandler(async (req, res) => {
  const { userId, noteTags, searchKey } = req.query;
  
  if (!userId) {
    throw new AppError("用户ID不能为空", 400);
  }
  
  logger.info(`获取笔记列表: userId=${userId}`);
  
  const query = { userId };
  
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
  
  const notes = await Note.find(query)
    .sort({ updateTime: -1 })
    .lean();
  
  const formattedNotes = notes.map(note => ({
    id: note._id,
    noteTitle: note.noteTitle,
    noteContent: note.noteContent,
    noteTags: note.noteTags,
    isFolder: note.isFolder || false,
    parentId: note.parentId || null,
    createTime: note.createTime,
    updateTime: note.updateTime,
  }));
  
  Response.success(res, {
    notes: formattedNotes,
    count: formattedNotes.length,
  }, "获取笔记列表成功");
}));

// 新增笔记或文件夹
router.post("/add", asyncHandler(async (req, res) => {
  const { userId, noteTitle, noteTags, noteContent, isFolder, parentId } = req.body;
  
  if (!userId) {
    throw new AppError("用户ID不能为空", 400);
  }
  
  logger.info(`新增${isFolder ? '文件夹' : '笔记'}: userId=${userId}, noteTitle=${noteTitle}`);
  
  const newNote = new Note({
    userId,
    noteTitle: noteTitle || (isFolder ? "新建文件夹" : "无标题笔记"),
    noteTags: noteTags || [],
    noteContent: noteContent || "",
    isFolder: isFolder || false,
    parentId: parentId || null,
  });
  
  await newNote.save();
  
  logger.info(`${isFolder ? '文件夹' : '笔记'}创建成功: noteId=${newNote._id}`);
  
  Response.success(res, {
    noteId: newNote._id,
    note: {
      id: newNote._id,
      noteTitle: newNote.noteTitle,
      noteContent: newNote.noteContent,
      noteTags: newNote.noteTags,
      isFolder: newNote.isFolder,
      parentId: newNote.parentId,
      createTime: newNote.createTime,
      updateTime: newNote.updateTime,
    }
  }, `新增${isFolder ? '文件夹' : '笔记'}成功`);
}));

// 更新笔记
router.put("/update/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { noteTitle, noteTags, noteContent, parentId } = req.body;
  
  logger.info(`更新笔记: id=${id}`);
  
  const note = await Note.findByIdAndUpdate(
    id,
    {
      noteTitle,
      noteTags,
      noteContent,
      parentId,
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

// 删除笔记或文件夹（递归删除子项）
router.delete("/delete/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info(`删除笔记/文件夹: id=${id}`);
  
  const note = await Note.findById(id);
  
  if (!note) {
    throw new AppError("笔记不存在", 404);
  }
  
  // 如果是文件夹，递归删除所有子项
  if (note.isFolder) {
    const deleteChildren = async (parentId) => {
      const children = await Note.find({ parentId });
      for (const child of children) {
        if (child.isFolder) {
          await deleteChildren(child._id.toString());
        }
        await Note.findByIdAndDelete(child._id);
      }
    };
    
    await deleteChildren(id);
  }
  
  await Note.findByIdAndDelete(id);
  
  logger.info(`笔记/文件夹删除成功: id=${id}`);
  
  Response.success(res, null, "删除成功");
}));

// 获取所有标签
router.get("/tags", asyncHandler(async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    throw new AppError("用户ID不能为空", 400);
  }
  
  const notes = await Note.find({ userId, isFolder: false }).select("noteTags");
  const tagsSet = new Set();
  notes.forEach(note => {
    note.noteTags.forEach(tag => tagsSet.add(tag));
  });
  
  Response.success(res, { tags: Array.from(tagsSet) }, "获取标签列表成功");
}));

module.exports = router;
