const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const DemoSeedMeta = require('../models/DemoSeedMeta');
const User = require('../models/User');
const Exam = require('../models/Exam');
const StudyPlan = require('../models/StudyPlan');
const ErrorQuestion = require('../models/ErrorQuestion');
const Note = require('../models/Note');
const Knowledge = require('../models/Knowledge');
const KnowledgeFile = require('../models/KnowledgeFile');
const Assistant = require('../models/Assistant');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const NotificationSettings = require('../models/NotificationSettings');
const { resolveDemoUserAvatar } = require('../utils/demoAvatar');

const SEED_FILE = path.join(__dirname, '../../database/demo/demo-seed.json');

async function loadPack() {
  try {
    const raw = await fs.readFile(SEED_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AppError('演示数据文件不存在', 500);
    }
    throw new AppError('演示数据文件格式错误', 500);
  }
}

function emptyIds() {
  return {
    users: [],
    exams: [],
    studyPlans: [],
    errorQuestions: [],
    notes: [],
    knowledgeBases: [],
    knowledgeFiles: [],
    assistants: [],
    topics: [],
    questions: [],
    answers: [],
    feedbacks: [],
    notifications: [],
    notificationSettings: [],
  };
}

async function getDemoSeedStatus() {
  const pack = await loadPack();
  const meta = await DemoSeedMeta.findOne({ packId: pack.meta.packId }).lean();

  return {
    packInfo: pack.meta,
    seedFile: 'database/demo/demo-seed.json',
    imported: Boolean(meta),
    importedAt: meta?.importedAt || null,
    counts: meta?.counts || null,
  };
}

async function importDemoSeed() {
  const pack = await loadPack();
  const { packId } = pack.meta;

  const existing = await DemoSeedMeta.findOne({ packId });
  if (existing) {
    throw new AppError('演示数据已导入，请先在管理后台清除后再重新导入', 400);
  }

  for (const u of pack.users) {
    const conflict = await User.findOne({ email: u.email });
    if (conflict) {
      throw new AppError(`邮箱 ${u.email} 已被占用，请先清除演示数据或更换邮箱`, 400);
    }
  }

  for (const p of pack.studyPlans || []) {
    const conflict = await StudyPlan.findOne({ planId: p.planId });
    if (conflict) {
      throw new AppError(`计划编号 ${p.planId} 已存在，请先清除演示数据`, 400);
    }
  }

  const ids = emptyIds();
  const userMap = new Map();
  const noteMap = new Map();
  const kbMap = new Map();
  const asstMap = new Map();
  const questionMap = new Map();

  for (const u of pack.users) {
    const { key, avatarChar, avatarColor, ...data } = u;
    const avatar = resolveDemoUserAvatar({ ...u, avatarChar, avatarColor });
    const doc = await User.create({ ...data, avatar });
    userMap.set(key, {
      oid: doc._id,
      idStr: doc._id.toString(),
      nickname: doc.nickname,
      avatar: doc.avatar,
    });
    ids.users.push(doc._id);
  }

  for (const u of pack.users) {
    const user = userMap.get(u.key);
    const settings = await NotificationSettings.create({ userId: user.idStr });
    ids.notificationSettings.push(settings._id);
  }

  for (const item of pack.exams || []) {
    const user = userMap.get(item.userKey);
    const doc = await Exam.create({ ...item, userKey: undefined, userId: user.idStr });
    ids.exams.push(doc._id);
  }

  for (const item of pack.studyPlans || []) {
    const user = userMap.get(item.userKey);
    const doc = await StudyPlan.create({
      ...item,
      userKey: undefined,
      userId: user.idStr,
      createTime: item.createTime || new Date(),
      updateTime: item.updateTime || new Date(),
    });
    ids.studyPlans.push(doc._id);
  }

  for (const item of pack.errorQuestions || []) {
    const user = userMap.get(item.userKey);
    const doc = await ErrorQuestion.create({
      ...item,
      userKey: undefined,
      userId: user.idStr,
    });
    ids.errorQuestions.push(doc._id);
  }

  for (const item of pack.notes || []) {
    const user = userMap.get(item.userKey);
    const parentId = item.parentKey ? noteMap.get(item.parentKey)?.idStr || null : (item.parentId || null);
    const { key, userKey, parentKey, ...data } = item;
    const doc = await Note.create({
      ...data,
      userId: user.idStr,
      parentId,
    });
    if (key) {
      noteMap.set(key, { idStr: doc._id.toString(), oid: doc._id });
    }
    ids.notes.push(doc._id);
  }

  for (const kb of pack.knowledgeBases || []) {
    const user = userMap.get(kb.userKey);
    const { key, userKey, files, ...data } = kb;
    const doc = await Knowledge.create({
      ...data,
      userId: user.oid,
      fileCount: files?.length || 0,
      vectorCount: 0,
    });
    kbMap.set(key, doc._id);

    for (const f of files || []) {
      const fileDoc = await KnowledgeFile.create({
        ...f,
        knowledgeId: doc._id,
      });
      ids.knowledgeFiles.push(fileDoc._id);
    }
    ids.knowledgeBases.push(doc._id);
  }

  for (const item of pack.assistants || []) {
    const user = userMap.get(item.userKey);
    const kbIds = item.knowledgeBaseKey ? [kbMap.get(item.knowledgeBaseKey)].filter(Boolean) : [];
    const { key, userKey, knowledgeBaseKey, ...data } = item;
    const doc = await Assistant.create({
      ...data,
      userId: user.oid,
      knowledgeBases: kbIds,
    });
    asstMap.set(key, doc._id);
    ids.assistants.push(doc._id);
  }

  for (const item of pack.topics || []) {
    const user = userMap.get(item.userKey);
    const assistantId = asstMap.get(item.assistantKey);
    const { key, userKey, assistantKey, ...data } = item;
    const doc = await Topic.create({
      ...data,
      userId: user.oid,
      assistantId,
    });
    ids.topics.push(doc._id);
  }

  for (const item of pack.questions || []) {
    const user = userMap.get(item.userKey);
    const { key, userKey, ...data } = item;
    const doc = await Question.create({
      ...data,
      userId: user.idStr,
      userName: user.nickname,
      userAvatar: user.avatar,
    });
    questionMap.set(key, doc._id);
    ids.questions.push(doc._id);
  }

  for (const item of pack.answers || []) {
    const user = userMap.get(item.userKey);
    const questionId = questionMap.get(item.questionKey);
    const doc = await Answer.create({
      ...item,
      questionKey: undefined,
      userKey: undefined,
      questionId,
      userId: user.idStr,
      userName: user.nickname,
      userAvatar: user.avatar,
    });
    ids.answers.push(doc._id);
  }

  for (const item of pack.feedbacks || []) {
    const user = userMap.get(item.userKey);
    const doc = await Feedback.create({
      ...item,
      userKey: undefined,
      userId: user.idStr,
      nickname: user.nickname,
      replyTime: item.status === 'replied' ? new Date() : undefined,
    });
    ids.feedbacks.push(doc._id);
  }

  for (const item of pack.notifications || []) {
    const user = userMap.get(item.userKey);
    const relatedId = item.questionKey ? questionMap.get(item.questionKey) : undefined;
    const { userKey, questionKey, ...data } = item;
    const doc = await Notification.create({
      ...data,
      userId: user.idStr,
      relatedId: relatedId || null,
    });
    ids.notifications.push(doc._id);
  }

  const counts = Object.fromEntries(
    Object.entries(ids).map(([k, v]) => [k, v.length])
  );

  await DemoSeedMeta.create({
    packId,
    packName: pack.meta.name,
    version: pack.meta.version,
    counts,
    ids,
  });

  logger.info(`演示数据包 ${packId} 导入成功`, counts);

  return {
    packId,
    counts,
    accounts: pack.meta.accounts,
  };
}

async function deleteByIds(Model, idList) {
  if (!idList?.length) return 0;
  const result = await Model.deleteMany({ _id: { $in: idList } });
  return result.deletedCount || 0;
}

async function removeDemoSeed() {
  const pack = await loadPack();
  const meta = await DemoSeedMeta.findOne({ packId: pack.meta.packId });
  if (!meta) {
    throw new AppError('尚未导入演示数据', 400);
  }

  const { ids } = meta;
  const deleted = {};

  deleted.answers = await deleteByIds(Answer, ids.answers);
  deleted.questions = await deleteByIds(Question, ids.questions);
  deleted.notifications = await deleteByIds(Notification, ids.notifications);
  deleted.notificationSettings = await deleteByIds(NotificationSettings, ids.notificationSettings);
  deleted.feedbacks = await deleteByIds(Feedback, ids.feedbacks);
  deleted.topics = await deleteByIds(Topic, ids.topics);
  deleted.assistants = await deleteByIds(Assistant, ids.assistants);
  deleted.knowledgeFiles = await deleteByIds(KnowledgeFile, ids.knowledgeFiles);
  deleted.knowledgeBases = await deleteByIds(Knowledge, ids.knowledgeBases);
  deleted.notes = await deleteByIds(Note, ids.notes);
  deleted.errorQuestions = await deleteByIds(ErrorQuestion, ids.errorQuestions);
  deleted.studyPlans = await deleteByIds(StudyPlan, ids.studyPlans);
  deleted.exams = await deleteByIds(Exam, ids.exams);
  deleted.users = await deleteByIds(User, ids.users);

  await DemoSeedMeta.deleteOne({ _id: meta._id });

  logger.info(`演示数据包 ${pack.meta.packId} 已清除`, deleted);

  return { deleted, packId: pack.meta.packId };
}

module.exports = {
  getDemoSeedStatus,
  importDemoSeed,
  removeDemoSeed,
};
