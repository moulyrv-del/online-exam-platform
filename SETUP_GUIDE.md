# Setup, Testing and Presentation Guide

Written for someone who has never built a React + Node + PostgreSQL project.

---

## Step 1: Install requirements

| Software | Where to get it | Check it worked |
|----------|-----------------|-----------------|
| Node.js (LTS, 18 or newer) | https://nodejs.org | `node -v` and `npm -v` |
| PostgreSQL 14+ | https://www.postgresql.org/download/ | `psql --version` |
| VS Code (editor) | https://code.visualstudio.com | open it |
| Git (for GitHub later) | https://git-scm.com | `git --version` |
| Chrome, Edge or Firefox | any | needs a webcam |

During PostgreSQL install you choose a password for the `postgres` user. **Remember it.** You will put it in `.env`.
Keep the default port `5432`.

## Step 2: Get the project

You downloaded `online-exam-platform.zip`. Unzip it and open the folder in VS Code (File > Open Folder).
You should see `client`, `server`, `database`, `README.md`.

Open a terminal in VS Code (Terminal > New Terminal). You will need two terminals later.

## Step 3: Install dependencies

```bash
cd server
npm install
cd ../client
npm install
cd ..
```

## Step 4: Configure PostgreSQL

Create the empty database. Open a terminal and run:

```bash
psql -U postgres
```

(Enter your postgres password.) Then type:

```sql
CREATE DATABASE exam_platform;
\q
```

- Database name: `exam_platform`
- Username: `postgres` (or your own)
- Password: the one you chose during installation

The tables are created in Step 5 by `npm run db:setup`. It runs `database/schema.sql` and creates your admin account from `.env`. It adds no other users.

Optional starter content: `npm run db:seed` adds two exams (10 questions) from `database/seed.sql`. Skip it if you want to enter your own exams from the admin panel.

## Step 5: Configure environment variables

```bash
cd server
cp .env.example .env        # Windows Command Prompt: copy .env.example .env
```

Open `server/.env` and set:

```
PORT=5000
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
DB_NAME=exam_platform

JWT_SECRET=replace_with_a_long_random_string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=choose_an_admin_password
```

Replace the three placeholders with your own values. Never share or upload `.env` (it is already in `.gitignore`).
Generate a random secret with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Now create the tables and the admin account:

```bash
npm run db:setup
```

You should see "Admin account created". `ADMIN_PASSWORD` must be at least 8 characters.

Optional starter exams: `npm run db:seed` (run it once).

## Step 6: Start the backend

In the `server` folder:

```bash
npm run dev
```

You should see `Server running at http://localhost:5000`.
Open http://localhost:5000/api/health in a browser. It should show `{"status":"ok"}`.
Leave this terminal running.

## Step 7: Start the frontend

Open a **second** terminal:

```bash
cd client
npm run dev
```

Open **http://localhost:5173**. You should see the login page.

## Step 8: Testing checklist

Student side:
1. Click **Register**, enter name, email, password (6+ characters). You land on the dashboard.
2. Log out, then log in again with the same details.
3. Dashboard shows the exams with duration and question count (create one first as admin if you skipped the seed). The results table is empty.
4. Click **Start exam** on "JavaScript Basics".
5. Click **Allow** when the browser asks for the camera. Your video appears at the top right.
6. Answer some questions. Question buttons on the right turn green when answered. Use Previous / Next and the number buttons.
7. Switch to another browser tab and come back. A warning box appears and the warning counter goes up.
8. Click **Submit exam**. A confirmation box appears. Confirm.
9. The camera light turns off and you see the result page: percentage, correct / incorrect counts, chart, answer review.
10. Go back to the dashboard. The result appears in "Your previous results".
11. Timer test: as admin create an exam with a 1-minute duration and a question, then start it as a student and wait. At 00:00 it submits by itself.
12. Camera-denied test: block camera for the site (padlock icon in the address bar), start an exam. You see "Camera is required".
13. Refresh test: refresh during an exam. The timer continues from the remaining time and your answers come back (they are saved on the server as you click).

Admin side:
14. Log out. Log in with `ADMIN_EMAIL` and your `ADMIN_PASSWORD`. You land on the admin dashboard.
15. Create an exam (title, duration) with the form.
16. Click **Questions** on it. Add two or three questions. Edit one. Delete one.
17. Log in as a student and take your new exam.
18. As admin, open **Student results**. You see the student, marks, percentage and warning count. Click **Details** for the answer review.
19. Edit an exam's duration, and delete a test exam.

## Step 9: Common errors and fixes

**"password authentication failed for user postgres"**
The `DB_PASSWORD` in `server/.env` is wrong. Fix it, then run the command again.

**"client password must be a string" / "SASL: SCRAM-SERVER-FIRST-MESSAGE"**
`DB_PASSWORD` is missing or `.env` is not in the `server` folder. Make sure the file is named exactly `.env` (not `.env.txt`).

**"database exam_platform does not exist"**
Do Step 4 (`CREATE DATABASE exam_platform;`).

**"relation users does not exist" / "table not found"**
Tables were not created. Run `npm run db:setup` in the `server` folder.

**"connect ECONNREFUSED 127.0.0.1:5432"**
PostgreSQL is not running. Windows: open Services and start `postgresql-x64-...`. macOS: `brew services start postgresql`. Linux: `sudo service postgresql start`.

**"psql is not recognized"**
Add PostgreSQL's `bin` folder (e.g. `C:\Program Files\PostgreSQL\16\bin`) to your PATH, or use the SQL Shell (psql) app installed with PostgreSQL.

**"Missing JWT_SECRET"**
Fill `JWT_SECRET` in `server/.env` and restart the server.

**"Port 5000 is already in use" (EADDRINUSE)**
Change `PORT=5001` in `server/.env`, and change the proxy in `client/vite.config.js` to `http://localhost:5001`. Restart both. (On macOS, port 5000 is often used by AirPlay, so this is common.)

**"Port 5173 already in use"**
Close the other Vite terminal, or Vite will offer the next port. If it uses 5174, set `CLIENT_URL=http://localhost:5174` in `.env` and restart the server.

**Login page shows "Something went wrong. Is the server running?"**
The backend is not running or is on a different port. Check Step 6.

**CORS error in the browser console**
Make sure `CLIENT_URL` in `server/.env` exactly matches the address in your browser (including the port), then restart the server. Open the app via `localhost`, not `127.0.0.1` or a network IP.

**npm install errors**
Check `node -v` is 18+. Delete the `node_modules` folder and `package-lock.json`, then run `npm install` again. On slow networks retry with `npm install --no-audit --no-fund`.

**Camera does not start / "Camera is required"**
- Click the padlock (or camera icon) in the address bar and set Camera to Allow, then click **Try again**.
- Close other apps using the camera (Zoom, Teams).
- Camera only works on `http://localhost` or `https://`. Not on a plain `http://192.168...` address.
- Check the operating system's camera privacy settings allow your browser.

**No warning when switching tabs**
The exam must be in the running state (camera allowed and questions visible). Warnings are counted once per 2 seconds.

**"This email is already registered"**
Use a different email or log in instead.

**Want to reset everything**
Run `npm run db:setup` again. It deletes all data and re-creates empty tables with your admin account.

## Step 10: Upload to GitHub

1. Create an account at https://github.com.
2. Click **New repository**. Name it `online-exam-platform`. Leave "Add README" **unticked**. Click **Create repository**.
3. In the VS Code terminal, in the project root (the folder containing `client` and `server`):

```bash
git init
git add .
git status
```

Check that `.env` is **not** listed (only `.env.example` should appear). The included `.gitignore` already contains:

```
node_modules/
.env
dist/
```

4. Commit and push (replace YOUR-USERNAME):

```bash
git commit -m "Initial commit: online exam platform"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/online-exam-platform.git
git push -u origin main
```

5. If asked to sign in, follow the browser prompt, or use a Personal Access Token as the password (GitHub > Settings > Developer settings > Personal access tokens).
6. Your repository link is `https://github.com/YOUR-USERNAME/online-exam-platform`. Copy it from the address bar.

Later changes: `git add .` then `git commit -m "your message"` then `git push`.

## Step 11: How to present the project

Suggested 8-minute flow for a college evaluation:

1. **Introduce** (30 s): "A web platform for online exams with basic webcam proctoring." Say clearly it is a simple browser-based system, not professional AI proctoring.
2. **Architecture** (1 min): React frontend talks to an Express REST API, which stores data in PostgreSQL. Show the folder structure and the six tables.
3. **Student registration and dashboard** (1 min).
4. **Start an exam** (2 min): allow camera, show timer, navigation, answered markers. Switch tabs to trigger the warning and point out the counter.
5. **Submit** (1 min): show the confirmation, then the result page and chart.
6. **Admin** (2 min): create an exam and questions, then open student results and show the warning count.
7. **Auto-submit** (30 s): run the 1-minute exam and let the timer expire.

Points to explain if asked:
- **Passwords** are hashed with bcrypt, never stored as plain text.
- **Login** uses a JWT token sent in the `Authorization` header. Admin routes check the role on the server.
- **Correct answers** are never sent to the student's browser during the exam. Marking happens on the server.
- **Timer** is decided by the server using the start time, so refreshing cannot reset it.
- **Answers** are saved on the server as the student clicks, so a refresh or crash does not lose them.
- **Webcam** uses `navigator.mediaDevices.getUserMedia` (WebRTC media API). The video stays in the browser and is not recorded or uploaded.
- **Tab detection** uses the Page Visibility API and the window `blur` event. Each event calls the API to increase `warning_count` on the attempt.
- **Limitations:** a student can use a second device, and the app can't tell who is in front of the camera. These are listed under Future improvements in the README.
