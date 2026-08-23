# SIH25083 - Digital Health Record Management System for Migrant Workers in Kerala

## Project Overview
This project is a beginner-to-intermediate full-stack application built for **Smart India Hackathon 2025 (Problem Statement SIH25083)**. 

### Problem Statement
**Title:** Digital Health Record Management System for Migrant Workers in Kerala  
**Context:** Migrant workers (often referred to as *Guest Workers* in Kerala) face challenges in maintaining continuous health records due to frequent mobility, language barriers, and fragmented healthcare encounters. This project aims to build a clean, scalable digital health record system tailored to their unique needs.

---

## Current Technology Stack

### Frontend (`/frontend`)
- **Library:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Package Manager:** npm

### Backend (`/backend`)
- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **Execution Tool:** `tsx` (Development runner with hot-reloading)
- **Package Manager:** npm

---

## Directory Structure

```text
sih25083-health-record/
├── frontend/             # React + Vite + TypeScript + Tailwind CSS application
│   ├── src/              # React components and styles
│   │   ├── App.tsx       # Root React component
│   │   ├── index.css     # Main Tailwind CSS import file
│   │   └── main.tsx      # React entry point
│   ├── package.json      # Frontend npm dependencies and scripts
│   ├── tsconfig.json     # Frontend TypeScript configuration
│   └── vite.config.ts    # Vite configuration with Tailwind CSS plugin
├── backend/              # Node.js + Express + TypeScript backend service
│   ├── src/              # Backend TypeScript source code
│   │   └── index.ts      # Express server entry point
│   ├── package.json      # Backend npm dependencies and scripts
│   └── tsconfig.json     # Backend TypeScript configuration
├── .gitignore            # Git ignore rules for node_modules and build artifacts
└── README.md             # Project documentation and getting started guide
```

---

## How to Run the Application

### 1. Frontend Setup & Startup
Navigate into the `frontend` folder and start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```

- **Dev URL:** `http://localhost:5173` (or port shown in console output)

### 2. Backend Setup & Startup
Navigate into the `backend` folder and start the Express development server:

```bash
cd backend
npm install
npm run dev
```

- **Server URL:** `http://localhost:5000`
- **Health Check Endpoint:** `http://localhost:5000/`

---

## Major Folders Overview
- `frontend/`: Contains all user interface components, client-side rendering logic, and visual styling. Runs independently on Vite's dev server.
- `backend/`: Contains server routes, middleware, and business logic using Express and TypeScript. Runs independently on Node.js using `tsx`.
