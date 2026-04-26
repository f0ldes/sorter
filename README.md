# Personal Sorting Library

Photograph items, tag them, sort into storage containers (boxes, shelves, drawers). Browser-based, mobile-friendly, hosted on Vercel with Firebase as the backend.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind 4
- Firebase: Auth (Google), Firestore, Storage
- Deployed on Vercel

## Local setup

### 1. Firebase project

In the [Firebase console](https://console.firebase.google.com):

1. **Create project** (Analytics off is fine).
2. **Authentication** → Sign-in method → enable **Google**.
3. **Firestore Database** → Create (production mode), pick a region.
4. **Storage** → Get started (production mode), same region.
5. **Project settings → Your apps → Web (`</>`)** → register app, copy the config values into `.env.local` (see template below).
6. **Authentication → Settings → Authorized domains** → confirm `localhost`; add your Vercel domain after deploy.

### 2. Deploy security rules

Paste the contents of `firestore.rules` into Firestore → Rules tab, and `storage.rules` into Storage → Rules tab. Both lock data to `users/{uid}/...` owned by the authenticated user.

### 3. Env vars

Copy `.env.local.example` to `.env.local` and fill in the values from the Firebase web app config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 4. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with Google.

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add the same `NEXT_PUBLIC_FIREBASE_*` env vars in the Vercel project settings.
4. Deploy.
5. Add your `*.vercel.app` domain to Firebase → Authentication → Settings → Authorized domains.

## Structure

```
src/
  app/
    page.tsx            # /          library grid + search + storage filter
    new/page.tsx        # /new       capture & save item
    item/[id]/page.tsx  # /item/:id  view, edit, delete
    storage/page.tsx    # /storage   manage storage
    layout.tsx          # auth gate + nav
  components/
    AuthGate.tsx        # gates the app behind Google sign-in
    Nav.tsx             # top navigation
    TagsInput.tsx       # chips with autocomplete from existing tags
    StorageSelect.tsx   # storage dropdown (live)
    CameraCapture.tsx   # in-browser webcam capture overlay
  lib/
    firebase.ts         # client init
    paths.ts            # typed Firestore refs
    types.ts            # Item & Storage types
    resizeImage.ts      # client-side downscale before upload
    useExistingTags.ts  # hook collecting all tags for autocomplete
firestore.rules
storage.rules
```

## Data model

```
users/{uid}/items/{itemId}
  name, location, tags[], notes
  photoUrl, photoPath
  storageId (nullable, "" = Unsorted)
  createdAt, updatedAt

users/{uid}/storages/{storageId}
  name, parentId (always null in MVP — reserved for future nesting), createdAt
```

`parentId` is stored on every storage so nested storage can be added later without a migration.

## MVP limitations (deliberate)

- Storage is flat. Schema supports nesting (`parentId`); UI does not.
- Deleting a storage entry leaves orphan `storageId` references on items — they appear under "Unsorted" in the library filter. A cleanup pass can be added later.
- No offline support, no batch import, no shared libraries.
