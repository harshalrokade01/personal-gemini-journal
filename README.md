# ReflectAI — Private Journal & Multi-Turn Reflection Assistant

ReflectAI is a full-stack, user-authenticated reflection and journaling application built with **React**, **TypeScript**, **Express**, **Firebase Authentication (Google Sign-In)**, **Cloud Firestore**, and **Gemini 3.6 Flash**.

---

## 🔒 Security Architecture & Threat Mitigations

| Security Zone | Architecture Pattern | Countermeasure |
| :--- | :--- | :--- |
| **API Secret Protection** | Backend Proxy (`/api/gemini/reflect`) | `GEMINI_API_KEY` is loaded in Node.js runtime and never exposed in frontend client bundles. |
| **User Data Isolation** | Firestore Security Rules | Subcollections under `/users/{userId}/reflections` strictly enforce `request.auth.uid == userId`. |
| **Authentication** | Google OAuth Federated Sign-In | No plain passwords stored or processed in application code. |
| **Resilient AI Pipeline** | Automated Model Fallback Ladder | Tiered failover: `gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`. |
| **Payload Sanitization** | Undefined Stripping & Schema Guards | All database writes stripped of `undefined` fields to prevent driver rejections. |

---

## 🚀 Cloud Run Deployment & Configuration Guide

### 1. Prerequisites & GCP API Enablement

Ensure you have the Google Cloud SDK (`gcloud`) installed and configured:

```bash
# Set active project
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="asia-east1"
gcloud config set project $PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

### 2. Secret Manager Configuration

Store your `GEMINI_API_KEY` in Google Cloud Secret Manager and grant access to the Cloud Run runtime service account:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Obtain project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Grant the default Cloud Run Compute Service Account access to the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### 3. Cloud Firestore Security Rules

Deploy the isolated Firestore security rules using Firebase CLI:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // User's private reflections and journal entries
      match /reflections/{reflectionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // User's private interactions
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy with:
```bash
firebase deploy --only firestore:rules
```

---

### 4. Build and Deploy to Cloud Run

Deploy the container to Cloud Run with Secret Manager binding and required challenge resource labeling:

```bash
# Deploy to Google Cloud Run
gcloud run deploy reflect-ai \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production"

# Apply mandatory campaign verification label
gcloud run services update reflect-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION
```

---

## 🧪 Interactive Functional Walkthrough & Test Suite

Follow these steps to verify full functionality:

1. **Authentication**:
   - Navigate to the landing page.
   - Click **"Sign In with Google"**. Complete authentication.
   - Verify redirect to the private dashboard with your name and avatar displayed.

2. **Compose & Multi-Turn AI Reflection**:
   - Enter a title (or leave blank for auto-titling).
   - Select a category (e.g. *Strategic Ideation*) and lens (e.g. *Reflect & Guide*).
   - Click a starter prompt or type custom text (e.g. *"Should I migrate our database to Firestore?"*).
   - Press **Ctrl+Enter** or click **Reflect with Gemini**.
   - Verify Gemini responds using `gemini-3.6-flash`.
   - Send a follow-up message (e.g. *"What are 3 trade-offs to look out for?"*).
   - Verify multi-turn conversational context is maintained.

3. **Firestore Cloud Persistence**:
   - Check the top navbar and composer to confirm the entry is saved to Firestore.
   - Click **"New Entry"** to start another reflection.
   - Check the **Journal History** sidebar to see the previous entry listed with timestamp, category chip, and message count.

4. **Search, Filter & Modal View**:
   - In Journal History, search for a keyword or click a category filter pill.
   - Click the expand icon on an entry card to open the **Full Reader Modal**.
   - Test **"Copy Session"** and **"Download Markdown"**.

5. **User Isolation Verification**:
   - Click **Sign Out** in the top navbar.
   - Sign in with a second Google account.
   - Verify the second account's history is empty and does not reveal the first account's reflections.
   - Sign back into the first account and confirm all previous entries are intact.
