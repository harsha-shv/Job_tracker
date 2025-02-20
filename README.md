# Job Tracker Chrome Extension

## 🚀 Overview
The **Job Tracker Chrome Extension** helps users track their job applications, categorize them (Applied, Interviewing, Offer Received, Rejected), and find jobs with low applicants on LinkedIn. It provides an intuitive interface for managing job applications and allows resume uploads for each application.

## 📌 Features
- **Track Applied Jobs**: Saves job applications automatically.
- **Categorize Applications**: Move jobs between different stages - Applied, Interviewing, Offer Received, Rejected.
- **Search & Filter**: Find jobs by title or company name.
- **Resume Upload & Retrieval**: Store resumes locally using IndexedDB.
- **Low-Applied Jobs Finder**: Identifies LinkedIn job postings with fewer applicants.(inprogress)
- **Popup Interface**: Quickly access job stats and manage applications.

## 🛠️ Installation
1. **Download or Clone** this repository.
2. **Go to** `chrome://extensions/` in your browser.
3. **Enable Developer Mode** (toggle in the top-right corner).
4. **Click "Load Unpacked"** and select the extension folder.

## 🏗️ How It Works
1. When you apply for a job on **LinkedIn or JobRight**, the extension detects it and prompts you to save it.
2. You can upload a resume for each job application.
3. Access your applied jobs via the popup or a dedicated webpage.
4. View and move jobs between different categories.
5. Search for jobs by **title or company**.
6. Find jobs with **low applicants** on LinkedIn.

## 📂 File Structure

## 🔗 Permissions Used
- `"activeTab"`: Access current tab's content.
- `"storage"`: Store job applications and resumes.
- `"scripting"`: Modify webpage content to detect job applications.
- `"identity"`: Authenticate Google Drive for resume uploads.

## 🏗️ Future Improvements
- Support for more job platforms.
- Enhanced filtering and sorting options.
- Cloud-based job tracking for multi-device access.

## 📜 License(inprogress)
MIT License - Feel free to modify and enhance this project.


