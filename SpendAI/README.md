# SpendAI

SpendAI is an AI-powered personal and business finance management application. The app provides users with intelligent spending analysis by connecting to their bank accounts or allowing them to upload financial statements. SpendAI delivers instant insights, anomaly detection, company policy compliance monitoring, and personalized financial coaching through an intuitive chat interface.

## Overview

### Architecture and Technologies

The SpendAI project is divided into two main parts: the frontend and the backend. 

**Frontend**:
- Built with ReactJS and Vite in the `client/` folder.
- Uses `shadcn-ui` component library and `Tailwind CSS` for styling.
- Client-side routing is managed by `react-router-dom`, with pages defined in `client/src/pages/` and components in `client/src/components/`.
- Listens on port `5173`.

**Backend**:
- An Express-based server located in the `server/` folder.
- Implements REST API endpoints.
- Uses MongoDB for database operations, managed via Mongoose.
- Handles user authentication using bearer access and refresh tokens.
- Listens on port `3000`.

Both parts are coordinated using `concurrently`, allowing them to run together with a single command.

### Project Structure

#### Frontend
- `client/src/pages/`: Contains different page components.
- `client/src/components/`: Contains reusable UI components.
- `client/src/api/`: Contains API request functionalities.
- `client/vite.config.ts`: Configures server proxy settings.

#### Backend
- `server/routes/`: Defines various API routes.
- `server/models/`: Contains Mongoose models.
- `server/services/`: Provides core business logic and interacts with models.
- `server/server.js`: Initializes and configures the Express server.

## Features

- **AI-Powered Spending Insights**: Connect your bank or upload financial statements to get immediate spending insights.
- **Anomaly Detection**: Automatically detect unusual spending patterns.
- **Policy Compliance**: Monitor compliance with company spending policies.
- **Personalized Financial Coaching**: Receive customized financial advice through an interactive chat interface.
- **Bank Account Integration**: Securely connect multiple bank accounts for real-time transaction tracking.
- **Interactive Dashboards**: Visualize spending trends, category breakdowns, and more via detailed charts and summaries.
- **Voice Notes and AI Suggestions**: Add voice notes to transactions and receive AI-driven recommendations.
- **OCR Processing**: Extract data from bank statements and receipts using Optical Character Recognition.

## Getting Started

### Requirements

Ensure the following technologies are installed on your computer:
- Node.js (version 14 or higher)
- npm (version 6 or higher)
- MongoDB (locally installed or accessible MongoDB URI)

### Quickstart

1. Clone the repository to your local machine.
   ```sh
   git clone https://github.com/your-repo/spendai.git
   cd spendai
   ```

2. Install project dependencies.
   ```sh
   npm install
   ```

3. Start MongoDB (if running locally).
   ```sh
   mongod --dbpath /path_to_your_db
   ```

4. Create a `.env` file in the `server/` directory with the following keys:
   ```
   PORT=3000
   DATABASE_URL=<Your MongoDB URI>
   JWT_SECRET=<Your JWT Secret>
   ```

5. Start both client and server.
   ```sh
   npm run start
   ```

The application will launch with the frontend on `http://localhost:5173` and the backend on `http://localhost:3000`.

### License

SpendAI is proprietary software. All rights reserved.

```
© 2024 SpendAI. All rights reserved.
```