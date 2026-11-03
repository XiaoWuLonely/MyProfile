export const storyScenes = [
  { id: 'home', label: '开场原野', start: 0, read: 0, leave: 3, end: 8 },
  {
    id: 'project-myblog',
    label: 'MyBlog',
    start: 8,
    read: 11,
    leave: 17,
    end: 20,
  },
  {
    id: 'project-knowflow',
    label: 'KnowFlow AI',
    start: 20,
    read: 23,
    leave: 29,
    end: 32,
  },
  {
    id: 'project-heyue',
    label: '禾跃通',
    start: 32,
    read: 35,
    leave: 41,
    end: 44,
  },
  {
    id: 'project-zhifu',
    label: '智服 e 航',
    start: 44,
    read: 47,
    leave: 53,
    end: 56,
  },
  {
    id: 'project-mcdonalds',
    label: '在线点餐',
    start: 56,
    read: 59,
    leave: 65,
    end: 68,
  },
  { id: 'about', label: '关于', start: 68, read: 71, leave: 77, end: 79 },
  { id: 'journey', label: '经历', start: 79, read: 89, leave: 91, end: 93 },
  { id: 'contact', label: '联系', start: 93, read: 96, leave: 100, end: 100 },
] as const;

export const storyAnchors: Record<string, number> = Object.fromEntries(
  storyScenes.map((scene) => [scene.id, (scene.read + scene.leave) / 2]),
);
storyAnchors.home = 0;
storyAnchors.main = 0;
storyAnchors.works = 14;
export const projectRoles: Record<string, string> = {
  myblog: '独立开发与上线',
  knowflow: '独立构建知识库与流式问答体验',
  heyue: '四人团队 · 前端开发',
  zhifu: '团队前端 · 数据可视化',
  mcdonalds: 'Vue 课程实践',
};

export function cameraPosition(progress: number) {
  // Pauses cover every reading interval; travel is shared across adjacent scenes.
  const stops = [
    0, 3, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71, 77, 81, 89, 91, 96, 100,
  ];
  const positions = [
    0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7.4, 7.4, 8, 8,
  ];
  const p = Math.max(0, Math.min(100, progress));
  const index = stops.findIndex(
    (stop, i) => i < stops.length - 1 && p >= stop && p <= stops[i + 1],
  );
  if (index < 0) return 8;
  const t = (p - stops[index]) / (stops[index + 1] - stops[index]);
  const eased = t * t * (3 - 2 * t);
  return positions[index] + (positions[index + 1] - positions[index]) * eased;
}
