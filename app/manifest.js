export default function manifest() {
  return {
    name: "짱귀요미 오리 D-day",
    short_name: "오리Dday",
    description: "모바일과 데스크톱에서 함께 쓰는 D-day + 메모 보드",
    start_url: "/",
    display: "standalone",
    background_color: "#fffaf0",
    theme_color: "#f6c86e",
    icons: [
      {
        src: "/duck-hero.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/duck-hero.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
