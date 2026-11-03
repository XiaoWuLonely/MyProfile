export function initializeStoryUI() {
  const events = new AbortController();
  const { signal } = events;
  document.documentElement.classList.add('has-js');
  const readingLink =
    document.querySelector<HTMLAnchorElement>('.reading-mode');
  if (readingLink && new URLSearchParams(location.search).has('reading'))
    readingLink.href = location.pathname + location.hash;
  const menu = document.querySelector<HTMLButtonElement>('.menu-toggle');
  const nav = document.querySelector<HTMLElement>('.site-nav');
  const close = () => {
    menu?.setAttribute('aria-expanded', 'false');
    nav?.removeAttribute('data-open');
  };
  menu?.addEventListener(
    'click',
    () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav?.toggleAttribute('data-open', open);
    },
    { signal },
  );
  nav?.addEventListener(
    'click',
    (event) => {
      if ((event.target as HTMLElement).closest('a')) close();
    },
    { signal },
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        close();
      }
    },
    { signal },
  );
  document.querySelector('.copy-email')?.addEventListener(
    'click',
    async () => {
      const status = document.querySelector('#copy-status');
      if (!status) return;
      try {
        await navigator.clipboard.writeText('oolongheist@gmail.com');
        status.textContent = '邮箱已复制，期待收到你的来信。';
      } catch {
        status.textContent = '暂时无法自动复制，可以直接选择上方邮箱。';
      }
    },
    { signal },
  );
  return () => {
    events.abort();
    close();
    document.documentElement.classList.remove('has-js');
  };
}
