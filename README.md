MedaQueue — Frontend + Backend (Local Development)

Overview
- Frontend: Next.js app in `frontend/` (React + Tailwind).
- Backend: Django REST API in `backend/` (Django + DRF).

Quick start
1. Backend (Windows PowerShell)

```powershell
cd backend
# activate virtualenv (if not already)
.\venv\Scripts\activate
pip install -r requirements.txt  # if you need to install
.
# create demo users
.\venv\Scripts\python.exe manage.py create_role_users
# run server
.\venv\Scripts\python.exe manage.py runserver
```

2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Auth / demo accounts
- Receptionist: `reception1` / `reception@123`
- Doctors: `doctor1`..`doctor5` / `doctor@123`

Notes
- The frontend attempts server-side booking when signed in; if the backend returns permission errors, the UI falls back to a local-only booking saved in `localStorage`.
- Live queue tracking uses the `/api/queue/` endpoint to poll for queue items.

Next work
- Improve Find Doctors filters and search experience
- Add AI-backed recommendation service
- Polish styles and accessibility

