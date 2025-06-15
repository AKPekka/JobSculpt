# JobSculpt

JobSculpt is a full-stack web application that evaluates how well a given resume matches a specific job description and provides tailored improvement suggestions using a GPT-4.1 model.

## Project Overview

The app allows a user to:

- Upload their resume (PDF format).
- Upload or paste a job description (PDF or text).
- Receive:
  - A match score (percentage or qualitative score).
  - Tailored resume suggestions to improve alignment with the job description.
  - Suggested rewrite snippets of resume bullet points or sections.
  - A summary of gaps or opportunities in the resume compared to the job.

## Technology Stack

- **Frontend**: React, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, `pdf-parse`, `@azure-rest/ai-inference`

## Getting Started

### Prerequisites

- Node.js
- npm
- A GitHub account with access to the GPT-4.1 model on GitHub's Azure-based inference endpoint.

### Installation and Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd JobSculpt
    ```

2.  **Backend Setup:**

    - Navigate to the `backend` directory:
      ```bash
      cd backend
      ```
    - Install dependencies:
      ```bash
      npm install
      ```
    - Create a `.env` file in the `backend` directory and add your GitHub token:
      ```
      GITHUB_TOKEN="your_github_token_here"
      ```
    - Start the backend server:
      ```bash
      npm start
      ```
      The backend will be running on `http://localhost:3001`.

3.  **Frontend Setup:**

    - Navigate to the `frontend` directory:
      ```bash
      cd ../frontend
      ```
    - Install dependencies:
      ```bash
      npm install
      ```
    - Start the frontend development server:
      ```bash
      npm start
      ```
      The frontend will be running on `http://localhost:3000`.

### Usage

1.  Open your browser and navigate to `http://localhost:3000`.
2.  Upload your resume in PDF format.
3.  Upload the job description as a PDF or paste the text into the text area.
4.  Click the "Analyze Resume" button to get your results. 