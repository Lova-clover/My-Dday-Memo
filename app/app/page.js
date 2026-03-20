import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import s from "./page.module.css";

const APK_FILE_NAME = "duck-memo-android-latest.apk";
const APK_PUBLIC_PATH = `/downloads/${APK_FILE_NAME}`;
const BRAND_NAME = "나만의 D-DAY";
const BRAND_LOGO = "/my-dday-logo.png";

export const metadata = {
  title: "APP 다운로드",
};

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return null;

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded = value >= 10 || unitIndex === 0 ? Math.round(value) : value.toFixed(1);
  return `${rounded}${units[unitIndex]}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

async function getAndroidApkInfo() {
  try {
    const filePath = path.join(process.cwd(), "public", "downloads", APK_FILE_NAME);
    const stats = await fs.stat(filePath);

    return {
      exists: true,
      href: APK_PUBLIC_PATH,
      sizeLabel: formatBytes(stats.size),
      updatedAtLabel: formatDate(stats.mtime),
    };
  } catch {
    return {
      exists: false,
      href: null,
      sizeLabel: null,
      updatedAtLabel: null,
    };
  }
}

export default async function AppDownloadPage() {
  const apk = await getAndroidApkInfo();

  return (
    <main className={s.page}>
      <section className={s.hero}>
        <div className={s.heroCard}>
          <div className={s.heroTop}>
            <div className={s.brand}>
              <div className={s.brandMark}>
                <img
                  alt={`${BRAND_NAME} 로고`}
                  className={s.brandImg}
                  height="88"
                  loading="eager"
                  src={BRAND_LOGO}
                  width="88"
                />
              </div>

              <div className={s.heroText}>
                <div className={s.eyebrow}>App download</div>
                <h1 className={s.title}>{BRAND_NAME} APP 다운로드</h1>
                <p className={s.lead}>
                  웹은 그대로 두고, 안드로이드 앱은 이 페이지에서 따로 내려받을 수 있게 분리해뒀습니다.
                  APK 파일이 준비되면 여기서 바로 받아 설치할 수 있습니다.
                </p>
              </div>
            </div>

            <div className={`${s.statusPill} ${apk.exists ? s.statusReady : s.statusPending}`}>
              {apk.exists ? "Android APK 준비 완료" : "Android APK 준비 중"}
            </div>
          </div>

          <div className={s.actionRow}>
            {apk.exists ? (
              <a className={s.primaryBtn} download href={apk.href}>
                Android APK 다운로드
              </a>
            ) : (
              <button className={`${s.primaryBtn} ${s.disabledBtn}`} disabled type="button">
                Android APK 준비 중
              </button>
            )}

            <Link className={s.secondaryBtn} href="/dday-v3.html">
              모바일 웹 보기
            </Link>

            <Link className={s.ghostBtn} href="/web">
              PC 웹 보기
            </Link>
          </div>

          <div className={s.metaRow}>
            <div className={s.metaCard}>
              <span>현재 상태</span>
              <strong>{apk.exists ? "다운로드 가능" : "APK 업로드 대기"}</strong>
            </div>
            <div className={s.metaCard}>
              <span>파일명</span>
              <strong>{APK_FILE_NAME}</strong>
            </div>
            <div className={s.metaCard}>
              <span>파일 크기</span>
              <strong>{apk.sizeLabel || "아직 없음"}</strong>
            </div>
            <div className={s.metaCard}>
              <span>업데이트</span>
              <strong>{apk.updatedAtLabel || "아직 없음"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={s.grid}>
        <article className={s.card}>
          <div className={s.cardEyebrow}>How it works</div>
          <h2 className={s.cardTitle}>웹과 앱을 분리한 다운로드 창구</h2>
          <p className={s.cardText}>
            모바일 웹은 그대로 유지하고, 안드로이드 앱은 별도 APK 파일로 내려받는 구조입니다.
            그래서 웹은 계속 브라우저에서 볼 수 있고, 앱은 설치형으로 따로 사용할 수 있습니다.
          </p>
          <ul className={s.list}>
            <li>웹은 계속 `/dday-v3.html`과 `/web`에서 확인</li>
            <li>앱은 별도 APK 파일로 설치</li>
            <li>나중에 새 APK로 교체해도 같은 다운로드 페이지 사용</li>
          </ul>
        </article>

        <article className={s.card}>
          <div className={s.cardEyebrow}>Android</div>
          <h2 className={s.cardTitle}>설치 순서</h2>
          <ol className={s.list}>
            <li>이 페이지에서 APK를 다운로드합니다.</li>
            <li>휴대폰 다운로드 목록에서 APK 파일을 엽니다.</li>
            <li>처음 설치라면 알 수 없는 앱 설치 허용이 필요할 수 있습니다.</li>
            <li>설치가 끝나면 홈 화면 아이콘으로 바로 실행할 수 있습니다.</li>
          </ol>
          <p className={s.note}>안드로이드는 웹과 별도로 APK를 직접 내려받아 설치하는 구조입니다.</p>
        </article>

        <article className={s.card}>
          <div className={s.cardEyebrow}>Status</div>
          <h2 className={s.cardTitle}>지금 바로 확인할 것</h2>
          <ul className={s.list}>
            <li>다운로드 페이지 `/app` 접속</li>
            <li>모바일 웹과 PC 웹이 각각 잘 열리는지 확인</li>
            <li>APK가 올라오면 다운로드 버튼 활성화 확인</li>
          </ul>
          {!apk.exists ? (
            <p className={s.note}>
              아직 실제 APK 파일이 없으면 다운로드 버튼은 대기 상태로 보입니다. 파일을
              <code className={s.inlineCode}> public/downloads/{APK_FILE_NAME}</code> 에 두면 바로 연결됩니다.
            </p>
          ) : (
            <p className={s.note}>이제 이 페이지에서 바로 APK를 받아 설치하면 됩니다.</p>
          )}
        </article>
      </section>
    </main>
  );
}
