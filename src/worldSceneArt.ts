import civilianWorkshopArt from './assets/world-scenes/civilian-workshop.webp';
import publicHealthArt from './assets/world-scenes/public-health.webp';

/** Editorial still lifes only: these assets never encode a simulated condition. */
export const worldSceneArt = {
  industry: {
    src: civilianWorkshopArt,
    title: '민수 작업장의 도구',
    alt: '공구와 작업대가 놓인 민수 작업장 정물 삽화',
    width: 2048,
    height: 1360,
  },
  health: {
    src: publicHealthArt,
    title: '보건 준비의 물품',
    alt: '붕대와 청진기, 린넨으로 구성한 보건 물품 정물 삽화',
    width: 2048,
    height: 1360,
  },
} as const;

export const symbolicAchievementArtCaption = '성과를 상징한 삽화 · 실제 현장 사진 아님';
export const symbolicAchievementGoalCaption = '목표를 상징한 삽화 · 현재 상태나 실제 현장 사진 아님';
