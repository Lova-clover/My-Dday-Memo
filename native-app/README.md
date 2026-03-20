# 나만의 D-DAY Android App

이 폴더는 `나만의 D-DAY` 모바일 웹을 안드로이드 앱으로 빌드하기 위한 `Capacitor` 프로젝트입니다.

웹 프로젝트와 앱 프로젝트는 역할이 다릅니다.

- 웹: 브라우저에서 바로 접근
- 앱: APK로 설치해서 사용

## 현재 상태

- 모바일 원본 HTML을 앱용 자산으로 동기화
- safe area 대응 반영
- 런처 아이콘과 실행 전 스플래시를 브랜드 로고 기준으로 정리
- release APK 빌드 가능
- APK를 메인 프로젝트의 `/app` 다운로드 페이지로 복사 가능
- 백업 차단 / CSP / 외부 폰트 제거 등 기본 보안 하드닝 반영

## 요구 사항

- Android SDK: `C:\Android\Sdk`
- JDK 21: `C:\Program Files\Java\jdk-21`

현재 Gradle은 [`android/gradle.properties`](android/gradle.properties)에 JDK 21 경로가 고정되어 있습니다.

## 설치

```bash
cd native-app
npm install
```

## 주요 명령어

```bash
npm run sync:web
npm run android:add
npm run android:sync
npm run android:open
npm run android:build:debug
npm run android:build:release
npm run apk:publish
```

## 권장 빌드 순서

최종 배포용 기준:

```bash
npm run android:build:release
npm run apk:publish
```

이 순서가 끝나면 APK가 아래 경로로 복사됩니다.

```text
../public/downloads/duck-memo-android-latest.apk
```

이 파일은 메인 프로젝트의 `/app` 페이지에서 자동으로 다운로드 버튼으로 연결됩니다.

## 디버그와 릴리스 차이

- `android:build:debug`: 빠른 테스트용
- `android:build:release`: 최종 배포용

현재 `apk:publish`는 `release APK`가 있으면 그 파일을 우선 사용하고, 없을 때만 `debug APK`를 사용합니다.

## 보안 관련 메모

현재 앱 빌드에는 아래가 적용되어 있습니다.

- `allowBackup=false`
- Android 백업 / 데이터 추출 제외 규칙
- 앱 자산 빌드 시 서비스워커 제거
- 앱 자산 빌드 시 외부 Google Fonts 제거
- 앱 전용 CSP 삽입

다만 메모 데이터는 여전히 앱 내부 저장소 기반이므로, 강한 보안이 필요하면 추후 암호화 저장소로 전환하는 것이 좋습니다.

## 참고

- 메인 프로젝트 문서: [`../README.md`](../README.md)
- 라이선스 정책: [`../LICENSE`](../LICENSE)
- 다운로드 파일 위치 안내: [`../public/downloads/README.txt`](../public/downloads/README.txt)
