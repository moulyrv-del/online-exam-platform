const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const admin = require('../controllers/adminController');

const router = express.Router();

// Every route below needs a logged-in admin
router.use(requireLogin, requireAdmin);

router.get('/exams', asyncHandler(admin.listExams));
router.post('/exams', asyncHandler(admin.createExam));
router.get('/exams/:id', asyncHandler(admin.getExam));
router.put('/exams/:id', asyncHandler(admin.updateExam));
router.delete('/exams/:id', asyncHandler(admin.deleteExam));

router.post('/questions', asyncHandler(admin.createQuestion));
router.put('/questions/:id', asyncHandler(admin.updateQuestion));
router.delete('/questions/:id', asyncHandler(admin.deleteQuestion));

router.get('/results', asyncHandler(admin.allResults));

module.exports = router;
