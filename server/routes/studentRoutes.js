const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { requireLogin } = require('../middleware/auth');
const student = require('../controllers/studentController');

const router = express.Router();

router.get('/exams', requireLogin, asyncHandler(student.listExams));
router.post('/exams/:id/start', requireLogin, asyncHandler(student.startExam));
router.post('/attempts/:id/warning', requireLogin, asyncHandler(student.addWarning));
router.put('/attempts/:id/answer', requireLogin, asyncHandler(student.saveAnswer));
router.post('/attempts/:id/submit', requireLogin, asyncHandler(student.submitAttempt));
router.get('/results', requireLogin, asyncHandler(student.myResults));
router.get('/results/:attemptId', requireLogin, asyncHandler(student.resultDetail));

module.exports = router;
