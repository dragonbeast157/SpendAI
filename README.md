# SpendAI

SpendAI is a comprehensive personal and business finance management application leveraging artificial intelligence to provide real-time spending analysis and insights. Users can connect their bank accounts or upload statements to receive detailed reports, anomaly detection, policy compliance monitoring, and personalized financial coaching through an intelligent chat interface.

## Overview

SpendAI is built with a modular architecture to ensure scalability, reliability, and ease of development. The project utilizes modern web technologies including ReactJS for the frontend and ExpressJS for the backend, with MongoDB as the database. The project structure separates the frontend and backend code, allowing for independent development and deployment.

### Architecture and Technologies

- **Frontend**: 
  - **ReactJS** with Vite for fast development and build processes.
  - **shadcn-ui** component library integrated with Tailwind CSS for a modern, responsive UI.
  - **React Router** for client-side routing.
  - **Axios** for making API requests.

- **Backend**: 
  - **ExpressJS** framework for REST API services.
  - **MongoDB** with Mongoose for data modeling.
  - **JWT Authentication** for secure access.
  - **Third-Party Integrations** include services like OpenAI for AI coaching and Google Cloud Vision for OCR processing.

### Project Structure

```
.
├── client/
│   ├── public/                 # Static files (index.html, favicon, etc.)
│   ├── src/
│   │   ├── api/                # API service functions
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # Contexts for state management
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Page components for routing
│   │   ├── App.tsx             # Main app component
│   │   ├── main.tsx            # Entry point for React
│   │   └── ...
│   ├── package.json            # Frontend dependencies and scripts
│   ├── vite.config.ts          # Vite configuration
│   └── ...
├── server/
│   ├── config/                 # Configuration files (database, etc.)
│   ├── middleware/             # Middleware functions
│   ├── models/                 # Mongoose models
│   ├── routes/                 # API routes
│   ├── services/               # Business logic and services
│   ├── utils/                  # Utility functions
│   ├── server.js               # Main server file
│   ├── package.json            # Backend dependencies and scripts
│   └── ...
├── .gitignore                  # Git configuration to exclude files/directories
└── README.md                   # Project documentation (this file)
```

## Features

- **AI-Powered Spending Analysis**: Connect bank accounts or upload statements to receive instant insights on spending patterns.
- **Anomaly Detection**: Automatically flag unusual transactions for review.
- **Company Policy Compliance**: For business accounts, monitor transactions against company spending policies.
- **Personalized Financial Coaching**: Interactive chat interface provides advice tailored to user spending habits.
- **Transaction Management**: Detailed management system for reviewing, categorizing, and annotating transactions.
- **Interactive Dashboards**: Visual and interactive charts, graphs, and summaries of financial data.

## Getting Started

### Requirements

Ensure your system has the following technologies installed:
- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB

### Quickstart

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/spendai.git
   cd spendai
   ```

2. **Install dependencies**
   ```bash
   # In the root directory
   npm install
   ```

3. **Environment Configuration**
   - Create an `.env` file in the `server` directory and configure the necessary environment variables (e.g., database URL, JWT secrets, API keys).

4. **Start the Project**
   ```bash
   npm run start
   ```
   The frontend will be served on `http://localhost:5173` and the backend on `http://localhost:3000`.

### License

© 2024 SpendAI. All rights reserved.