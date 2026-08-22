SULTAN POCKET — PLAY STORE LAUNCH CHECKLIST
=============================================

Everything in this folder is ready to use. Two steps in this whole process
need YOUR click, because they require your live deployed domain and your
Google account — no AI, including me, can do those from outside:

STEP A — Deploy the updated manifest.json (included here)
  Replace public/manifest.json in your project with this one, then deploy.

STEP B — Generate your Android package (needs your live site)
  1. Go to https://pwabuilder.com/
  2. Enter https://sultanpocket.online again → it will re-scan the updated
     manifest (score should improve — lang/dir are now fixed).
  3. Click "Package For Stores" → choose Android.
  4. Download the package. Inside it (or on the confirmation screen) you'll
     find your Android package name (e.g. online.sultanpocket.twa) and a
     SHA-256 signing certificate fingerprint.

STEP C — Update assetlinks.json with the values from Step B
  Open public/.well-known/assetlinks.json (included here as a template) and
  replace:
    - REPLACE_WITH_YOUR_ANDROID_PACKAGE_NAME  →  your package name from B
    - REPLACE_WITH_SHA256_FINGERPRINT...      →  your fingerprint from B
  Deploy this file again. This step is what makes the Android app open full
  screen (no browser address bar) instead of looking like a webview.

STEP D — (Optional) add related_applications back to manifest.json once
  you have the package name from Step B:
    "related_applications": [
      { "platform": "play", "id": "your.package.name.here" }
    ]
  Keep "prefer_related_applications": false so the site is still installable
  as a PWA directly from the browser too.

STEP E — Google Play Console (needs your Google account)
  1. Create a Developer account if you don't have one (one-time $25 fee).
  2. Create a new app → upload the .aab file from Step B.
  3. Paste in play-store-listing.txt (included here) — title, short
     description, full description are ready to copy-paste as-is.
  4. Upload feature-graphic-1024x500.png (included here) as your Feature
     Graphic.
  5. Upload phone screenshots — you already have good ones in
     public/screenshots/. Play Store needs at least 2, up to 8, so pick your
     best 4-5 from that folder (they meet the minimum resolution already).
  6. Complete the Content Rating (IARC) questionnaire — answer honestly per
     the notes in play-store-listing.txt.
  7. Fill the Data Safety form using the notes in play-store-listing.txt.
  8. Add your Privacy Policy URL (already in play-store-listing.txt).
  9. Submit for review.

That's the entire path. Steps A, C, and D are just file edits — copy them in
whenever you're ready. Steps B and E are the two moments you'll personally
click through PWABuilder and Play Console, both explained above.
