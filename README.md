# Scholarly — AI-Powered Study Platform

Scholarly is a modern, all-in-one study companion designed to help university students organize their learning, track progress, and leverage AI for deeper understanding. From interactive roadmaps to adaptive quizzes, Scholarly turns study material into actionable learning paths.

![Scholarly Dashboard](https://raw.githubusercontent.com/Bhanu/Study-Comp/main/screenshot.png) *(Placeholder for your project screenshot)*

## 🚀 Key Features

- **Interactive Roadmaps**: Generate step-by-step learning paths for any topic with zoomable, interactive tree visualizations.
- **AI-Powered Quizzes**: Create adaptive multiple-choice quizzes from search topics or by scanning your own PDF study materials.
- **AI Study Assistant**: A dedicated chat companion that can research the web, find YouTube tutorials, and explain complex concepts.
- **Notes Library**: Securely store and manage your PDF study materials with integrated AI content scanning.
- **Focus Timer**: A specialized "Deep Work" timer to help you stay in the flow, with customizable focus and break intervals.
- **Advanced Analytics**: Track your study hours, mastery levels, and fatigue scores with beautiful data visualizations.
- **Personalized Profile**: Full profile management including local image uploads and dynamic name updates.

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, Flask, SQLAlchemy.
- **AI Orchestration**: OpenAI API / OpenRouter (supporting GPT-4o, Gemini, and Llama).
- **Frontend**: Modern HTML5, CSS3, Vanilla JavaScript, and Tailwind CSS.
- **Storage**: Local SQLite database for rapid development and persistent file storage for PDFs and avatars.

## 🏁 Getting Started

### 1. Prerequisites
- Python 3.10 or higher.
- An API key from [OpenAI](https://platform.openai.com/) or [OpenRouter](https://openrouter.ai/).

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/scholarly.git
cd scholarly

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Setup
Create a `.env` file in the root directory (refer to `.env.example`):
```env
SECRET_KEY=your-random-secret-key
OPENAI_API_KEY=your-api-key-here
FLASK_DEBUG=1
```

### 4. Running Locally
```bash
python app.py
```
Visit `http://127.0.0.1:5000` in your browser.

## ☁️ Deployment

Scholarly is pre-configured for deployment on platforms like **Render**, **Heroku**, or **Google Cloud Run**.

- **Procfile**: Included for Gunicorn production server support.
- **Storage**: Ensure your deployment environment supports persistent disks if you wish to keep uploaded PDFs across restarts (e.g., Render Disk or AWS S3).
- **Environment Variables**: Make sure to set `OPENAI_API_KEY` and `SECRET_KEY` in your production dashboard.

## 📂 Project Structure

- `app.py`: Main Flask entry point and API routing.
- `study_backend/services/`: Core logic for AI research, Quiz generation, and Note management.
- `js/` & `css/`: Frontend logic and styling.
- `storage/`: Local folder for user-uploaded media (PDFs and Avatars).
- `dashboard.html`, `visual.html`, etc.: Modular page templates.

## 📄 License
This project is for educational purposes. Feel free to use and modify it for your own learning journey.
