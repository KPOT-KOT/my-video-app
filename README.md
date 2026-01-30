# Movie Archive Browser & Streaming Server

This project is a simple Node.js + Express application that lets you browse local movie archive folders and stream `.mp4` files through a web interface.

## 🚀 Features
- Browse multiple root archive directories
- Stream MP4 videos (iPhone/Safari compatible)
- Simple EJS-based UI
- Automatic logging of video starts

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

Install dependencies:

bash
npm install
⚙️ Configuration
Before running the server, create a config.json file in the project root:

json
{
  "ROOT_PATHS": [
    "C:\\path\\to\\archive1",
    "D:\\path\\to\\archive2"
  ]
}
This file is not included in Git for privacy and security reasons.

▶️ Running the Server
bash
node server.js
Then open:

Code
http://localhost:3000
📝 Notes
Only .mp4 files are shown in the browser.

The server logs the start of each video stream.

config.json must be created manually before first run.