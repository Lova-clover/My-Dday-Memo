import fs from "node:fs/promises";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import s from "./page.module.css";

const APK_FILE_NAME = "duck-memo-android-latest.apk";
const APK_PUBLIC_PATH = `/downloads/${APK_FILE_NAME}`;

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
                <Image alt="짱귀요미오리 로고" className={s.brandImg} height={88} src="/duck-hero.png" width={88} />
              </div>

              <div className={s.heroText}>
                <div className={s.eyebrow}>App download</div>
                <h1 className={s.title}>짱귀요미오리 APP 다운로드</h1>
                <p className={s.lead}>
                  웹 버전은 그대로 두고, 설치형 앱은 이 페이지에서 따로 받도록 분리한 창구예요. 앱 파일이 준비되면
                  여기서 바로 내려받을 수 있게 해뒀어요.
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
                Android 앱 다운로드
              </a>
            ) : (
              <button className={`${s.primaryBtn} ${s.disabledBtn}`} disabled type="button">
                Android 앱 파일 준비 중
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
          <h2 className={s.cardTitle}>이 페이지는 다운로드 창구예요</h2>
          <p className={s.cardText}>
            웹과 앱을 분리해서 유지하려는 목적에 맞춰, 현재 프로젝트 안에 앱 다운로드 전용 페이지를 만들어뒀어요.
            나중에 APK만 연결하면 같은 Vercel 주소에서 바로 받는 흐름으로 갈 수 있어요.
          </p>
          <ul className={s.list}>
            <li>웹은 계속 `/dday-v3.html`과 `/web`에서 확인</li>
            <li>앱은 별도 APK 파일로 내려받기</li>
            <li>향후 앱 파일 교체 시 이 페이지 버튼만 그대로 사용</li>
          </ul>
        </article>

        <article className={s.card}>
          <div className={s.cardEyebrow}>Android</div>
          <h2 className={s.cardTitle}>설치 흐름</h2>
          <ol className={s.list}>
            <li>이 페이지에서 APK를 다운로드합니다.</li>
            <li>휴대폰에서 다운로드한 APK를 열어 설치합니다.</li>
            <li>처음 설치 시 알 수 없는 앱 설치 허용이 필요할 수 있습니다.</li>
            <li>설치 후에는 홈 화면 아이콘으로 바로 실행할 수 있습니다.</li>
          </ol>
          <p className={s.note}>안드로이드는 이 페이지에서 직접 내려받는 구조로 만들 수 있어요.</p>
        </article>

        <article className={s.card}>
          <div className={s.cardEyebrow}>Status</div>
          <h2 className={s.cardTitle}>지금 바로 되는 것</h2>
          <ul className={s.list}>
            <li>앱 다운로드 페이지 `/app` 진입</li>
            <li>모바일 웹과 PC 웹으로 각각 이동</li>
            <li>APK가 올라오면 자동으로 다운로드 버튼 활성화</li>
          </ul>
          {!apk.exists ? (
            <p className={s.note}>
              아직 실제 앱 파일은 없어서 다운로드 버튼은 대기 상태예요. 앱 제작 후
              <code className={s.inlineCode}> public/downloads/{APK_FILE_NAME}</code> 에 넣으면 바로 연결됩니다.
            </p>
          ) : (
            <p className={s.note}>이제 이 페이지에서 바로 APK를 받아 설치하면 됩니다.</p>
          )}
        </article>
      </section>
    </main>
  );
}
