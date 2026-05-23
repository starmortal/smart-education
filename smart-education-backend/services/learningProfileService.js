const mongoose = require('mongoose');
const User = require('../models/User');
const Exam = require('../models/Exam');
const ErrorQuestion = require('../models/ErrorQuestion');
const StudyPlan = require('../models/StudyPlan');
const Topic = require('../models/Topic');
const Note = require('../models/Note');
const Question = require('../models/Question');
const { toSubjectCode, toSubjectName, getGradeLabel } = require('../utils/subjectMap');
const logger = require('../utils/logger');

const DEFAULT_DATA_SOURCES = [
  'profile',
  'exam',
  'errorBook',
  'studyPlan',
  'chat',
  'note',
  'community',
];

const SOURCE_LABELS = {
  profile: '个人资料',
  exam: '考试成绩',
  errorBook: '错题本',
  studyPlan: '现有计划',
  chat: 'AI 对话',
  note: '学习笔记',
  community: '学习社区',
};

function normalizeUserIdQuery(userId) {
  if (!userId) return null;
  if (mongoose.Types.ObjectId.isValid(userId)) {
    return new mongoose.Types.ObjectId(userId);
  }
  return userId;
}

function pickDataSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return [...DEFAULT_DATA_SOURCES];
  }
  return sources.filter((s) => DEFAULT_DATA_SOURCES.includes(s));
}

async function buildProfileSection(userId) {
  const user = await User.findById(userId).select('nickname grade school subjects subjectFullScores');
  if (!user) {
    return {
      nickname: '学习者',
      grade: '',
      gradeLabel: '未设置',
      school: '',
      subjects: [],
      subjectCodes: [],
    };
  }

  const subjects = user.subjects || [];
  return {
    nickname: user.nickname,
    grade: user.grade,
    gradeLabel: getGradeLabel(user.grade),
    school: user.school || '',
    subjects,
    subjectCodes: subjects.map(toSubjectCode),
    subjectFullScores: user.subjectFullScores ? Object.fromEntries(user.subjectFullScores) : {},
  };
}

async function buildExamSection(userId) {
  const exams = await Exam.find({ userId: String(userId) })
    .sort({ examDate: -1, createTime: -1 })
    .limit(5)
    .lean();

  const subjectStats = {};
  exams.forEach((exam) => {
    (exam.scores || []).forEach((s) => {
      const code = toSubjectCode(s.subject);
      if (!subjectStats[code]) {
        subjectStats[code] = { subject: code, subjectName: toSubjectName(code), scores: [] };
      }
      subjectStats[code].scores.push({
        score: s.score,
        fullScore: s.fullScore,
        examName: exam.examName,
        examDate: exam.examDate,
      });
    });
  });

  const trends = Object.values(subjectStats).map((item) => {
    const latest = item.scores[0];
    const previous = item.scores[1];
    let trend = 'stable';
    if (latest && previous) {
      if (latest.score < previous.score - 3) trend = 'down';
      else if (latest.score > previous.score + 3) trend = 'up';
    }
    return {
      subject: item.subject,
      subjectName: item.subjectName,
      latestScore: latest?.score,
      fullScore: latest?.fullScore,
      trend,
      examCount: item.scores.length,
    };
  });

  const weakSubjects = [...trends]
    .filter((t) => t.latestScore != null && t.fullScore)
    .sort((a, b) => a.latestScore / a.fullScore - b.latestScore / b.fullScore)
    .slice(0, 3)
    .map((t) => t.subjectName);

  return { recentExams: exams.length, trends, weakSubjects };
}

async function buildErrorBookSection(userId) {
  const uid = String(userId);
  const errors = await ErrorQuestion.find({ userId: uid })
    .sort({ updateTime: -1 })
    .limit(100)
    .select('subject masteryStatus wrongReason questionTitle knowledgePoints updateTime')
    .lean();

  const bySubject = {};
  const wrongReasonCount = {};
  const knowledgePointCount = {};

  errors.forEach((err) => {
    if (!bySubject[err.subject]) {
      bySubject[err.subject] = {
        subject: err.subject,
        subjectName: toSubjectName(err.subject),
        total: 0,
        unmastered: 0,
        mastering: 0,
        mastered: 0,
        recentTitles: [],
      };
    }
    const item = bySubject[err.subject];
    item.total += 1;
    if (err.masteryStatus === 'unmastered') item.unmastered += 1;
    else if (err.masteryStatus === 'mastering') item.mastering += 1;
    else item.mastered += 1;
    if (item.recentTitles.length < 3) {
      item.recentTitles.push(err.questionTitle);
    }
    if (err.wrongReason) {
      wrongReasonCount[err.wrongReason] = (wrongReasonCount[err.wrongReason] || 0) + 1;
    }
    (err.knowledgePoints || []).forEach((kp) => {
      if (kp) knowledgePointCount[kp] = (knowledgePointCount[kp] || 0) + 1;
    });
  });

  const subjectStats = Object.values(bySubject).map((s) => ({
    ...s,
    unmasteredRate: s.total ? Number((s.unmastered / s.total).toFixed(2)) : 0,
  }));

  const topWrongReasons = Object.entries(wrongReasonCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  const weakKnowledgePoints = Object.entries(knowledgePointCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([point, count]) => ({ point, count }));

  return {
    totalErrors: errors.length,
    subjectStats,
    topWrongReasons,
    weakKnowledgePoints,
  };
}

async function buildStudyPlanSection(userId) {
  const uid = String(userId);
  const plans = await StudyPlan.find({
    userId: uid,
    planStatus: { $in: ['not_started', 'in_progress'] },
  })
    .sort({ endTime: 1 })
    .limit(20)
    .select('planTitle subject startTime endTime planStatus progress description')
    .lean();

  return {
    activeCount: plans.length,
    plans: plans.map((p) => ({
      planTitle: p.planTitle,
      subject: p.subject,
      subjectName: toSubjectName(p.subject),
      startTime: p.startTime,
      endTime: p.endTime,
      planStatus: p.planStatus,
      progress: p.progress,
      description: p.description,
    })),
  };
}

async function buildChatSection(userId) {
  const objectId = normalizeUserIdQuery(userId);
  const topics = await Topic.find({ userId: objectId })
    .sort({ updatedAt: -1 })
    .limit(8)
    .select('title messages updatedAt')
    .lean();

  const userMessages = [];
  topics.forEach((topic) => {
    (topic.messages || []).forEach((msg) => {
      if (msg.role === 'user' && msg.content?.trim()) {
        userMessages.push({
          topicTitle: topic.title,
          content: msg.content.trim().slice(0, 200),
          time: msg.timestamp || topic.updatedAt,
        });
      }
    });
  });

  userMessages.sort((a, b) => new Date(b.time) - new Date(a.time));

  const recentMessages = userMessages.slice(0, 15);
  const chatNeeds = recentMessages
    .map((m) => m.content)
    .filter((c) => c.length >= 4)
    .slice(0, 8);

  return {
    topicCount: topics.length,
    recentMessages,
    chatNeeds,
  };
}

async function buildNoteSection(userId) {
  const uid = String(userId);
  const notes = await Note.find({ userId: uid, isFolder: false })
    .sort({ updateTime: -1 })
    .limit(10)
    .select('noteTitle noteTags updateTime')
    .lean();

  const tagSet = new Set();
  notes.forEach((n) => (n.noteTags || []).forEach((t) => tagSet.add(t)));

  return {
    recentCount: notes.length,
    recentTitles: notes.map((n) => n.noteTitle),
    tags: [...tagSet].slice(0, 10),
  };
}

async function buildCommunitySection(userId) {
  const uid = String(userId);
  const questions = await Question.find({ userId: uid })
    .sort({ createTime: -1 })
    .limit(15)
    .select('title tags solved createTime')
    .lean();

  const tagCount = {};
  let unsolvedCount = 0;
  questions.forEach((q) => {
    if (!q.solved) unsolvedCount += 1;
    (q.tags || []).forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });

  const interestTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  return {
    questionCount: questions.length,
    unsolvedCount,
    interestTags,
    recentTitles: questions.slice(0, 5).map((q) => q.title),
  };
}

function buildProfileSummary(profile, sections, enabledSources) {
  const parts = [];
  if (enabledSources.includes('profile') && profile.gradeLabel) {
    parts.push(`${profile.gradeLabel}${profile.school ? ` · ${profile.school}` : ''}`);
  }
  if (enabledSources.includes('exam') && sections.exam?.weakSubjects?.length) {
    parts.push(`成绩薄弱科目：${sections.exam.weakSubjects.join('、')}`);
  }
  if (enabledSources.includes('errorBook') && sections.errorBook?.totalErrors) {
    parts.push(`错题 ${sections.errorBook.totalErrors} 道`);
  }
  if (enabledSources.includes('chat') && sections.chat?.chatNeeds?.length) {
    parts.push(`AI 对话需求 ${sections.chat.chatNeeds.length} 条`);
  }
  if (enabledSources.includes('note') && sections.note?.recentCount) {
    parts.push(`近期笔记 ${sections.note.recentCount} 篇`);
  }
  if (enabledSources.includes('community') && sections.community?.questionCount) {
    parts.push(`社区提问 ${sections.community.questionCount} 条`);
  }
  return parts.join('；') || '数据较少，建议补充错题或进行一次 AI 对话后再生成';
}

/**
 * 聚合用户学习画像
 */
async function buildLearningProfile(userId, dataSources = DEFAULT_DATA_SOURCES) {
  const enabledSources = pickDataSources(dataSources);
  const profile = await buildProfileSection(userId);

  const sections = {};
  const tasks = [];

  if (enabledSources.includes('exam')) tasks.push(buildExamSection(userId).then((r) => { sections.exam = r; }));
  if (enabledSources.includes('errorBook')) tasks.push(buildErrorBookSection(userId).then((r) => { sections.errorBook = r; }));
  if (enabledSources.includes('studyPlan')) tasks.push(buildStudyPlanSection(userId).then((r) => { sections.studyPlan = r; }));
  if (enabledSources.includes('chat')) tasks.push(buildChatSection(userId).then((r) => { sections.chat = r; }));
  if (enabledSources.includes('note')) tasks.push(buildNoteSection(userId).then((r) => { sections.note = r; }));
  if (enabledSources.includes('community')) tasks.push(buildCommunitySection(userId).then((r) => { sections.community = r; }));

  await Promise.all(tasks);

  const enabledSourceLabels = enabledSources.map((s) => SOURCE_LABELS[s]);

  return {
    profile,
    sections,
    enabledSources,
    enabledSourceLabels,
    profileSummary: buildProfileSummary(profile, sections, enabledSources),
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  DEFAULT_DATA_SOURCES,
  SOURCE_LABELS,
  buildLearningProfile,
};
