export const APP_INFO = {
  name: "TYPOFOLD", // 웹사이트의 이름
  title: "TYPOFOLD", // 웹사이트의 기본 제목
  titleTemplate: "%s | TYPOFOLD", // 페이지별로 제목이 필요한 경우 사용 예: 'About | TYPOFOLD'
  description: "",
  keywords: [],
  authors: [
    {
      name: "happyphysicsclub", // 작성자 이름
      url: "https://happyphysics.club", // 작성자 웹사이트 URL
    },
  ],
  url: "https://typofoldplatz.vercel.app", // 웹사이트의 실제 URL로 변경
  social_links: [
    {
      name: "Instagram",
      url: "https://www.instagram.com/typofold",
    },
  ], // 관련된 소셜 미디어 링크 추가
  google_site_verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION, // 구글 사이트 소유권 확인을 위한 메타 태그 값
};
