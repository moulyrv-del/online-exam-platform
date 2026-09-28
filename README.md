# Online Examination & Proctoring Platform

A full-stack web app where students take timed multiple-choice exams with webcam monitoring, and get automatically marked results. Admins manage exams, questions and see every student's score and proctoring warnings.

> **Important:** This is a simple browser-based proctoring system built for learning and demonstration. It is **not** professional-grade or AI-based proctoring. It shows the webcam feed and counts tab/window switches. It does not record video, detect faces, or prevent cheating.

## Features

**Students**
- Register and log in (name, email, password)
- Dashboard with available exams (title, duration, number of questions) and previous results
- Timed exam with countdown, auto-submit at zero, question navigator, answered/unanswered markers
- Confirmation before manual submission
- Live webcam preview during the exam (camera stops after submitting)
- Warning shown and counted each time the student leaves the exam tab/window
- Instant automatic marking and a results page with a chart and answer review

**Admins**
- Create, edit and delete exams (set duration)
- Add, edit and delete questions (four options, correct answer, marks)
- View all student results and proctoring warning counts

## Tech stack

| Part | Technology |
|------|------------|
| Frontend | React 18 (Vite), React Router, plain CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL (`pg`) |
| Auth | bcryptjs (password hashing) + JSON Web Tokens |
| Proctoring | Browser `getUserMedia` (WebRTC media API), Page Visibility API |

## Screenshots

Add your own screenshots to a `screenshots/` folder and link them here:

| Page | Screenshot |
|------|-----------|
| Login | `screenshots/login.png` |
| Dashboard | `screenshots/dashboard.png` |
| Exam page | `screenshots/exam.png` |
| Result page | `screenshots/result.png` |
| Admin dashboard | `screenshots/admin.png` |

## Installation

Requirements: Node.js 18+, PostgreSQL 14+, a browser with a webcam (Chrome, Edge or Firefox).

```bash
# 1. Create the database (in psql)
CREATE DATABASE exam_platform;

# 2. Backend
cd server
npm install
cp .env.example .env        # Windows: copy .env.example .env
# open .env and fill in DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD
npm run db:setup            # creates the tables and your admin account
npm run db:seed             # optional: adds two starter exams
npm run dev                 # http://localhost:5000

# 3. Frontend (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

The full beginner guide with troubleshooting is in [SETUP_GUIDE.md](SETUP_GUIDE.md).

## How to use

1. Log in as admin (email and password from your `.env`) and create an exam with questions. Or run `npm run db:seed` for two starter exams.
2. Open http://localhost:5173 in a private window, register as a student, pick an exam and click **Start exam**. Allow the camera when asked.
3. Answer questions, move with Previous/Next or the number buttons, then **Submit exam**.
4. Read your result and the answer review.
5. Log back in as admin to see all results and warning counts.

Tip: create an exam with a 1-minute duration to test auto-submit.

## Project structure

```
online-exam-platform/
├── client/          React frontend (pages, components, styles)
├── server/          Express API (routes, controllers, middleware, db)
├── database/        schema.sql (tables) and seed.sql (sample exams)
├── SETUP_GUIDE.md
└── README.md
```

## Future improvements

- Face detection (e.g. a browser ML model) to check a face is present
- Periodic webcam snapshots stored for admin review
- Randomised question and option order
- Limits on attempts and scheduling windows
- CSV export of results and charts per exam
- Password reset by email
- Full-screen enforcement and copy/paste blocking

## License

Free to use for learning and academic projects.
