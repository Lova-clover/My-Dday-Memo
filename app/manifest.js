export default function manifest() {
  return {
    name: "나만의 D-DAY",
    short_name: "나만의 D-DAY",
    description: "모바일과 데스크톱에서 함께 쓰는 나만의 D-DAY 메모 보드",
    start_url: "/",
    display: "standalone",
    background_color: "#fffaf0",
    theme_color: "#f6c86e",
    icons: [
      {
        src: "/my-dday-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/my-dday-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
