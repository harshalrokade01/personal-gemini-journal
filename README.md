# ReflectAI — Private Journal & Location-Aware Reflection Assistant

ReflectAI is a full-stack, user-authenticated reflection and journaling application built with **React**, **TypeScript**, **Express**, **Firebase Authentication (Google Sign-In)**, **Cloud Firestore**, **Google Maps / Reverse Geocoding API**, and **Gemini 3.6 Flash**.

---

## 📍 Location-Aware Journal Entries

ReflectAI allows users to optionally attach verified geographic context to journal entries:
- **Explicit User Interaction**: Geolocation requests are executed client-side only when the user explicitly clicks **"Add Location"** and grants browser permissions.
- **Zero Client-Side Secret Exposure**: Reverse geocoding runs securely server-side (`/api/location/reverse-geocode`). `GOOGLE_MAPS_API_KEY` is never exposed in frontend bundles and falls back gracefully to open geocoding or coordinate pairs.
- **Editable & Removable Context**: Users can remove an attached location at any point before or after saving.
- **Location-Enhanced Reflections**: When attached, Gemini AI reflects on thoughts with mindful awareness of the user's setting and environment.
- **Strict User Data Isolation**: Location data is saved strictly inside the authenticated user's private Firestore subcollection (`/users/{userId}/reflections/{reflectionId}`) guarded by security rules.

---

## 🔒 Security Architecture & Threat Mitigations

| Security Zone | Architecture Pattern | Countermeasure |
| :--- | :--- | :--- |
| **API Secret Protection** | Backend Proxy (`/api/gemini/reflect`, `/api/location/reverse-geocode`) | `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY` are loaded in Node.js runtime and never exposed to client browsers. |
| **Location Privacy** | Explicit Opt-In & Minimization | Geolocation triggers only on explicit click. Precise coordinates are isolated to the owner's Firestore documents. |
| **User Data Isolation** | Firestore Security Rules | Subcollections under `/users/{userId}/reflections` strictly enforce `request.auth.uid == userId`. |
| **Authentication** | Google OAuth Federated Sign-In | No plain passwords stored or processed in application code. |
| **Resilient AI Pipeline** | Automated Model Fallback Ladder | Tiered failover: `gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`. |
| **Payload Sanitization** | Undefined Stripping & Schema Guards | All database writes sanitized and stripped of `undefined` fields to prevent driver rejections. |

---

## 🚀 Cloud Run Deployment & Configuration Guide

### 1. Prerequisites & GCP API Enablement

Ensure you have the Google Cloud SDK (`gcloud`) installed and configured:

```bash
# Set active project
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="asia-southeast1"
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

Store your `GEMINI_API_KEY` (and optional `GOOGLE_MAPS_API_KEY`) in Google Cloud Secret Manager and grant access to the Cloud Run runtime service account:

```bash
# Create and populate Gemini API Key secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# (Optional) Create Google Maps API Key secret for high-accuracy geocoding
gcloud secrets create GOOGLE_MAPS_API_KEY --replication-policy="automatic"
echo -n "YOUR_MAPS_API_KEY" | gcloud secrets versions add GOOGLE_MAPS_API_KEY --data-file=-

# Obtain project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Grant Cloud Run Compute Service Account access to the secrets
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GOOGLE_MAPS_API_KEY \
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

### 4. Cloud Run Deployment

The application was deployed to Google Cloud Run through Google AI Studio.

Cloud Run region:
`asia-southeast1`

Cloud Run service:
`reflectai-journal-reflection-assistant`

After deployment, the application can be accessed through the public Cloud Run URL generated by Google AI Studio.

---

## 🧪 Interactive Functional Walkthrough & Test Suite

Follow these steps to verify all features:

1. **Authentication**:
   - Navigate to the application home screen.
   - Click **"Sign In with Google"**. Complete authentication.
   - Verify redirect to the private dashboard with your name and avatar displayed.

2. **Location-Aware Journal Entries**:
   - In the composer header, click the **"Add Location"** button.
   - When prompted by the browser, grant Geolocation permission.
   - Verify the location badge appears with detected place name/city and coordinates.
   - Click the **"X"** on the location pill to test removing the location.
   - Click **"Add Location"** again to re-attach your current setting.

3. **Compose & Multi-Turn AI Reflection**:
   - Enter a title (or leave blank for auto-titling).
   - Select a category (e.g. *Daily Reflection*) and lens (e.g. *Reflect & Guide*).
   - Type custom thoughts (e.g. *"Taking a breather during my morning walk. Feeling refreshed and ready for the day."*).
   - Press **Ctrl+Enter** or click **Reflect with Gemini**.
   - Verify Gemini acknowledges your reflection and environment using `gemini-3.6-flash`.
   - Send a follow-up message to verify conversational context.

4. **Firestore Cloud Persistence & History**:
   - Check that the entry auto-saves to Firestore with the attached location.
   - Check the **Journal History** sidebar to see the entry listed with its green location indicator badge.
   - Use the search bar to search for the location name or city; confirm the entry is filtered correctly.

5. **Reader Modal & Export**:
   - Click the reader icon on the entry card to open the **Full Reader Modal**.
   - Verify the attached location badge and metadata are displayed cleanly.
   - Click **"Download Markdown"** and verify the exported file contains the `**Location**` metadata.

6. **User Isolation Verification**:
   - Click **Sign Out** in the top navbar.
   - Sign in with a different Google account.
   - Verify the second account cannot see the first account's reflections or location records.
   - Sign back into the original account and confirm all data remains securely accessible.

