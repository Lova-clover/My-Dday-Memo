# Duck Memo Native App

This folder contains the installable Android app wrapper for the mobile Duck Memo experience.

## Flow

1. `npm install`
2. `npm run android:add`
3. `npm run android:build:debug`
4. `npm run apk:publish`

## Local requirements

- Android SDK installed at `C:\Android\Sdk`
- JDK 21 installed at `C:\Program Files\Java\jdk-21`

The Android project is configured to use JDK 21 through `android/gradle.properties`,
so the debug APK build should work without manually changing `JAVA_HOME` each time.

The publish step copies the generated debug APK into:

`../public/downloads/duck-memo-android-latest.apk`

That file is automatically exposed by the `/app` download page in the main web project.
