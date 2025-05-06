# UGFP

A secure, decentralized, real-time collaborative document editing platform.

## Features

- End-to-End AES Encryption
- Decentralized Storage (via Pinata + IPFS)
- Real-time Collaboration (Socket.IO + Quill.js)
- Version Control with Restore & History
- Role-Based Access Control (read/write/admin)

##  Demo Flow

1. Register or Log In
2. Access Dashboard (create or open documents)
3. Edit Documents with Rich Text
4. Save Encrypted Versions to IPFS
5. Restore Past Versions
6. Add Collaborators via User ID

---

##  Tech Stack

| Layer      | Tech Used                             |
|------------|----------------------------------------|
| Frontend   | React, React-Quill, Socket.IO Client   |
| Backend    | Express, Socket.IO, JWT, bcrypt        |
| Encryption | Crypto-JS (AES)                        |
| Storage    | Pinata (IPFS)                          |

---

## ⚙️ Setup in GitHub Codespaces / Local Machine

### 1. Clone & Start Backend

```bash
cd server
npm install
cp .env.example .env
# Fill in your JWT_SECRET
node server.js

### 1. Clone & Start Frontend
cd client
npm install --legacy-peer-deps
cp .env.example .env
# Paste your Pinata API Key or JWT Token
npm start
