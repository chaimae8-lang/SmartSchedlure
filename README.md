# School Scheduling Platform for Moroccan High Schools

Production-oriented scheduling platform for lycées qualifiants, built for the Al-Farabi scenario. It includes async FastAPI APIs, SQLAlchemy models, Alembic migrations, OR-Tools CP-SAT generation, Claude/Ollama AI assistance, and a React timetable UI.

## Backend

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn main:app --reload --port 8000
```

Default admin:

```text
username: admin
password: alfarabi2025
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and calls the API at `http://localhost:8000`.

## Ollama Optional Local AI

```bash
ollama pull mistral
ollama serve
```

Ollama runs on `http://localhost:11434` automatically. Leave `ANTHROPIC_API_KEY` blank or set `USE_CLAUDE=false` to force local AI fallback.

## Notes

The seed data follows the requested Al-Farabi teacher list exactly. The specified filière hours include EPS, but no EPS teacher is listed in the exact eight-teacher seed, so schedule generation may correctly report infeasible until an EPS teacher assignment is added by an admin.
