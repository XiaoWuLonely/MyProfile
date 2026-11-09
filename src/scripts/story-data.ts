export const storyScenes = [
  { id: 'home', label: '开场原野', start: 0, read: 0, leave: 3, end: 7 },
  {
    id: 'project-myblog',
    label: 'MyBlog',
    start: 7,
    read: 11,
    leave: 17,
    end: 20,
  },
  {
    id: 'project-knowflow',
    label: 'KnowFlow AI',
    start: 20,
    read: 32,
    leave: 35,
    end: 38,
  },
  {
    id: 'project-heyue',
    label: '禾跃通',
    start: 38,
    read: 46,
    leave: 50,
    end: 52,
  },
  {
    id: 'project-zhifu',
    label: '智服 e 航',
    start: 52,
    read: 64,
    leave: 68,
    end: 70,
  },
  {
    id: 'project-mcdonalds',
    label: '在线点餐',
    start: 70,
    read: 77,
    leave: 81,
    end: 83,
  },
  { id: 'about', label: '关于', start: 83, read: 85, leave: 87, end: 89 },
  { id: 'journey', label: '经历', start: 89, read: 92, leave: 93, end: 94 },
  { id: 'contact', label: '联系', start: 94, read: 97, leave: 100, end: 100 },
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

const stops = storyScenes.flatMap((scene) => [scene.read, scene.leave]);
const positions = storyScenes.flatMap((_, index) => [index, index]);
export function cameraPosition(progress: number) {
  // Pauses cover every reading interval; travel is shared across adjacent scenes.
  const p = Math.max(0, Math.min(100, progress));
  const index = stops.findIndex(
    (stop, i) => i < stops.length - 1 && p >= stop && p <= stops[i + 1],
  );
  if (index < 0) return 8;
  const t = (p - stops[index]) / (stops[index + 1] - stops[index]);
  const eased = t * t * (3 - 2 * t);
  return positions[index] + (positions[index + 1] - positions[index]) * eased;
}
