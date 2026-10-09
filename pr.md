# Pull Request: Refactor for Government Exam Categorization & Local Dev Stability

## 📝 Description
This PR introduces critical updates to transition the application into a specialized **Government Exam Prep Platform** (focusing on Quants, Reasoning, English, and General Awareness). It also resolves several critical local development blockers, including deprecated AI models and CORS strictness.

## 🚀 Changes Made & Reasoning

### 1. AI Parser Upgrades & Contextual Tuning (`server/utils/parseWithAI.js`)
*   **Upgraded Gemini Model**: Changed the model from `gemini-2.0-flash` to `gemini-3.8-flash`.
    *   *Why*: The previous `2.0` model was deprecated by Google and actively returning `404 Not Found` errors during document extraction testing. The upgrade restores the automated upload functionality.
*   **Prompt Engineering for Govt Exams**: Updated the System Prompt and JSON schema descriptions to instruct the AI to categorize questions strictly into Govt Exam subjects (Quants, Reasoning, English, General Awareness) and extract specific topics (e.g., Profit & Loss).
    *   *Why*: To eliminate the need for manual tagging by Admins. Uploaded `.docx`/`.pdf` files are now automatically sorted into the correct categories required by the platform.

### 2. Admin Question Bank UI Refactor (`client/src/pages/admin/QuestionBank.jsx`)
*   **Nested Topic Grouping**: Refactored the render logic to group questions by `topic` *inside* their respective `subject` accordions.
    *   *Why*: Previously, questions were displayed as a flat list under a Subject. Nesting them by Topic correctly reflects the database structure and makes managing large question banks easier for admins.
*   **Topic Editing Field**: Added a dedicated `Topic` input field to the "Edit Question" modal form.
    *   *Why*: Admins previously had no way to manually correct or assign a specific topic to a question from the UI if the AI left it blank or got it wrong.
*   **Contextual Placeholders**: Changed UI placeholder hints from generic terms (e.g. `Math`, `Algebra`) to context-accurate terms (`Quants`, `Profit & Loss`).

### 3. Local Development Stability (`server/index.js`, `.env` files)
*   **Dynamic CORS Policy**: Modified the backend CORS configuration in `server/index.js` to automatically allow all local origins when `NODE_ENV === 'development'`.
    *   *Why*: To completely eliminate local CORS blocking errors, regardless of what port the Vite server happens to spawn on.
*   **Environment Standardization**: Created explicit `.env` files for both the `client` and `server` tailored for local testing (pointing to local MongoDB on `27017` and backend on `5000`).
    *   *Why*: Ensures that any developer can pull the repository and run `npm run dev` with immediate success without hunting for missing configurations.

### 4. Edge Cases & Robustness Fixes
*   **AI Chunking & Rate Limiting (`server/utils/parseWithAI.js`)**:
    *   Replaced the arbitrary 30,000-character "hard slice" with a dynamic chunking algorithm that splits at natural paragraph breaks (`\n\n`) to prevent cutting questions in half.
    *   Implemented a 2-second throttle between Gemini API calls to prevent `429 Too Many Requests` crashes on massive document uploads.
*   **Topic Normalization (`server/controllers/docxUpload.controller.js`)**:
    *   Added a strict `normalizeTopic` helper to sanitize string variances (e.g., standardizing "Profit and Loss" and "profit & loss" to exactly "profit & loss") to prevent duplicate database categories.
*   **Cascading Deletes (`server/controllers/subject.controller.js`)**:
    *   When an Admin deletes a Subject, all linked questions are now bulk updated to "Uncategorized" instead of becoming permanently orphaned/broken in the database.

### 5. Architectural Alignment: True Mock Test Environment
*   **Eradication of "Difficulty" Segregation**: Completely removed the concept of filtering practice tests by difficulty (Pre, Mains, Advance) across the entire stack (AI Prompts, Backend Generators, and Frontend UI).
    *   *Why*: To simulate an authentic government mock test structure. When a student generates a test for a topic, MongoDB's `$sample` aggregation now seamlessly shuffles *all* questions for that topic regardless of complexity, forcing the candidate to adapt to a realistic mixed-bag exam environment.

### 6. Authentication UX Fixes
*   **Solid Input Fields & Browser Autofill**: Replaced transparent custom inputs with the global `.input` class in `LoginPage.jsx`, `AdminLoginPage.jsx`, and `RegisterPage.jsx`.
    *   *Why*: Fixed a critical bug where Chrome's autofill engine would inject a stark white background underneath white text, making the fields invisible. 
*   **Password Visibility Toggles**: Added and fixed dark-gray eye icons to toggle password visibility across all auth screens (including the missing Registration form inputs).

## 🧪 How to Test
1. Ensure a local MongoDB instance is running.
2. Run `npm run dev` in both `/client` and `/server`.
3. Verify that no CORS errors appear in the browser console on `http://localhost:5173`.
4. Upload a sample Mock Test `.docx` file in the Admin panel and verify the questions are grouped under Quants/Reasoning/English and specific topics.
