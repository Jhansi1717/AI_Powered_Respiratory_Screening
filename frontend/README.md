# Respiratory AI Frontend

React single-page application for the Respiratory AI screening workflow.

## Run locally

```bash
npm install
npm start
```

The local development server runs on:

```text
http://localhost:3000
```

The frontend's production API host is currently selected in `src/services/api.js`.

## Main functionality

- Login and account creation
- Protected dashboard route at `/dashboard`
- Audio file upload
- Browser microphone recording
- Web Audio API waveform visualization
- AI prediction display
- Mel-spectrogram visualization
- Confidence/probability display
- Per-user prediction history
- Filtering, search, and sorting of history
- SVG-based analytics views
- English, Spanish, Hindi, and Telugu localization
- Dark/light theme
- Client-side PDF report generation

## Authentication

The frontend stores the JWT returned by `/api/login` in local storage and sends it as:

```text
Authorization: Bearer <token>
```

`ProtectedRoute` rejects missing, malformed, or expired tokens.

## Routing

The app uses React Router with:

- `/` — login
- `/signup` — signup
- `/dashboard` — protected dashboard

The Render static site has a catch-all `/* → /index.html` rewrite so direct navigation to `/dashboard` works.

## API integration

`src/services/api.js` uses Axios for:

- signup
- login
- prediction upload
- history retrieval
- admin user retrieval
- backend readiness checks

The prediction request sends `FormData` and leaves the multipart content type boundary to the browser/Axios rather than manually setting it.

## Important scope note

The frontend presents model predictions and screening-oriented interpretations. Those UI interpretations are application logic around the model output; they should not be described as independently validated medical diagnoses.
