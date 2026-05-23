const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const knowledgeController = require('../controllers/knowledgeController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/knowledge/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // 使用 Buffer 处理中文文件名，避免乱码
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, uniqueSuffix + path.extname(originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // 修复中文文件名乱码
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

router.get('/user/:userId', knowledgeController.getKnowledgeBases);
router.post('/', knowledgeController.createKnowledgeBase);
router.put('/:id', knowledgeController.updateKnowledgeBase);
router.delete('/:id', knowledgeController.deleteKnowledgeBase);

router.get('/:knowledgeId/files', knowledgeController.getKnowledgeFiles);
router.post('/:knowledgeId/files', upload.single('file'), knowledgeController.addFile);
router.post('/:knowledgeId/text', knowledgeController.addText);
router.post('/:knowledgeId/url', knowledgeController.addURL);
router.delete('/files/:fileId', knowledgeController.deleteFile);

router.post('/:knowledgeId/search', knowledgeController.searchKnowledge);

module.exports = router;
