export function initializeUI() {
  const events = new AbortController();
  const { signal } = events;
  document.documentElement.classList.add('has-js');
  const menu = document.querySelector<HTMLButtonElement>('.menu-toggle');
  const nav = document.querySelector<HTMLElement>('.site-nav');
  const closeMenu = () => {
    menu?.setAttribute('aria-expanded', 'false');
    nav?.removeAttribute('data-open');
  };
  menu?.addEventListener(
    'click',
    () => {
      const expanded = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(expanded));
      nav?.toggleAttribute('data-open', expanded);
    },
    { signal },
  );
  nav?.addEventListener(
    'click',
    (event) => {
      if ((event.target as HTMLElement).closest('a')) closeMenu();
    },
    { signal },
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key === 'Escape' &&
        menu?.getAttribute('aria-expanded') === 'true'
      ) {
        closeMenu();
        menu.focus();
      }
    },
    { signal },
  );
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const chapter = entry.target as HTMLElement;
        document
          .querySelector('.site-header')
          ?.toggleAttribute('data-scrolled', chapter.id !== 'home');
        const label = document.querySelector('.reading-current');
        if (label) label.textContent = chapter.dataset.chapter ?? '';
        nav?.querySelectorAll('a').forEach((link) => {
          if (link.hash === `#${chapter.id}`)
            link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    },
    { rootMargin: '-15% 0px -55% 0px', threshold: 0 },
  );
  document
    .querySelectorAll('[data-chapter]')
    .forEach((chapter) => observer.observe(chapter));
  const dialog = document.querySelector<HTMLDialogElement>('#project-dialog');
  const content = dialog?.querySelector('.dialog-content');
  let origin: HTMLElement | null = null;
  if (dialog && content && typeof dialog.showModal === 'function') {
    document
      .querySelectorAll<HTMLDetailsElement>('[data-project]')
      .forEach((project) => {
        const summary = project.querySelector('summary');
        summary?.addEventListener(
          'click',
          (event) => {
            const story = project.querySelector('.project-story');
            if (!story) return;
            event.preventDefault();
            origin = summary;
            const clone = story.cloneNode(true) as HTMLElement;
            clone
              .querySelectorAll('[id]')
              .forEach((element) => element.removeAttribute('id'));
            content.replaceChildren(clone);
            const label = dialog.querySelector('#dialog-label');
            if (label)
              label.textContent = `${project.querySelector('h3')?.textContent ?? ''} / 作品详情`;
            dialog.showModal();
            document.body.setAttribute('data-dialog-open', '');
          },
          { signal },
        );
      });
    dialog
      .querySelector('.dialog-close')
      ?.addEventListener('click', () => dialog.close(), { signal });
    dialog.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Tab') return;
        const focusable = [
          ...dialog.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ].filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !dialog.contains(document.activeElement))
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      },
      { signal },
    );
    dialog.addEventListener(
      'click',
      (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dialog.close();
      },
      { signal },
    );
    dialog.addEventListener(
      'close',
      () => {
        document.body.removeAttribute('data-dialog-open');
        content.replaceChildren();
        origin?.focus({ preventScroll: true });
      },
      { signal },
    );
  }
  const status = document.querySelector('#copy-status');
  document.querySelector<HTMLButtonElement>('.copy-email')?.addEventListener(
    'click',
    async () => {
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
    if (dialog?.open) dialog.close();
    events.abort();
    observer.disconnect();
    closeMenu();
    document.documentElement.classList.remove('has-js');
    document.body.removeAttribute('data-dialog-open');
  };
}
