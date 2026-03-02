🎵 SyncWave — Smart Music Player with Synced Lyrics

Real-time music streaming with timestamp-synced lyrics, modern Tailwind UI, and intelligent playback controls — built using Django.

SyncWave combines clean backend architecture with a polished frontend experience, delivering audio playback, pagination, lyric synchronization, and responsive design in one full-stack project.

🚀 Key Features
🎧 Music Playback

Play / Pause / Seek functionality

Real-time progress tracking

Dynamic duration handling

Volume & fullscreen controls

📝 Synced Lyrics Engine

LRC → JSON timestamp conversion

Line-by-line auto highlighting

Real-time lyric scroll sync

Multi-language support (English, Hindi, Punjabi, Marathi)

🎨 Modern UI

Tailwind CSS glassmorphism design

Smooth animations

Responsive layout

Pagination for songs

Clean Django template architecture

⚙️ Backend Engineering

Django 6 architecture

ORM-based database modeling

Paginator implementation

Dynamic template rendering

Secure static file management

🏗️ Tech Stack
Layer	Technology
Backend	Django 6
Frontend	HTML5, Tailwind CSS
JavaScript	Vanilla JS (Audio API)
Database	SQLite (Dev)
Lyrics Processing	SyncedLyrics
API Integration	Requests
Image Processing	Pillow
📂 Project Structure
musicplayer/
│
├── app/
│   ├── models.py
│   ├── views.py
│   ├── templates/app/
│   ├── static/js/
│
├── theme/              # Tailwind integration
├── requirements.txt
├── .gitignore
└── manage.py
🔬 How It Works

User selects a song.

Django view fetches song metadata.

Lyrics are converted from LRC to structured JSON with timestamps.

JavaScript listens to audio.currentTime.

Matching lyric line is highlighted dynamically.

Tailwind UI updates in real time.

🧠 Engineering Concepts Used

Django MVT architecture

Pagination with ordered QuerySets

Static file configuration debugging

Line-ending (LF/CRLF) Git handling

JSON-based lyric synchronization

DOM event listeners

Metadata loading (loadedmetadata)

Audio time tracking

Clean separation of templates

📦 Installation
1️⃣ Clone Repository
git clone https://github.com/yourusername/syncwave.git
cd syncwave
2️⃣ Create Virtual Environment
python -m venv myenv
myenv\Scripts\activate   # Windows
3️⃣ Install Dependencies
pip install -r requirements.txt
4️⃣ Run Server
python manage.py runserver

Visit:

http://127.0.0.1:8000
📡 Example Features in Action

🎵 Auto-play next song

📜 Smooth lyric scrolling

🎚 Real-time seekbar update

📱 Fully responsive layout

🧪 Problems Solved During Development

Static CSS not loading (fixed via correct static paths)

Pagination unordered warning (added ordered QuerySet)

Audio metadata timing issues

CRLF Git warnings on Windows

Tailwind build + Node integration errors

🎯 Why This Project Matters

This project demonstrates:

Full-stack Django development

Frontend + Backend integration

Real-time UI synchronization

Clean Git workflow

Production-ready project structuring

📈 Future Improvements

User authentication

Playlist management

Upload songs via admin dashboard

API-based music streaming

Cloud storage (AWS S3)

Docker containerization

👨‍💻 Author

Viraj Thakur
Computer Engineering Graduate
Python Developer | Django | Backend Engineer
