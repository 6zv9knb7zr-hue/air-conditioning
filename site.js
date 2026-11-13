const header = document.querySelector('.header');
const navigation = document.querySelector('#navigation');
const menu = document.querySelector('.menu-button');
const mobile = matchMedia('(max-width: 730px)');

function setMenu(open, returnFocus = false) {
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
  if (returnFocus) menu.focus();
}

header.classList.add('enhanced');
menu.hidden = false;
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') === 'false'));
navigation.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || !mobile.matches) return;
  setMenu(false);
  const target = document.querySelector(link.hash);
  if (!target) return;
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
});
mobile.addEventListener('change', () => setMenu(false));
document.addEventListener('click', event => {
  if (!header.contains(event.target)) setMenu(false);
});
document.addEventListener('focusin', event => {
  if (!header.contains(event.target)) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setMenu(false, true);
});

const backTop = document.querySelector('.back-top');
function updateBackTop() {
  if (document.activeElement !== backTop) backTop.hidden = window.scrollY < 460;
}
window.addEventListener('scroll', updateBackTop, { passive: true });
backTop.addEventListener('blur', updateBackTop);
backTop.addEventListener('click', () => header.querySelector('.brand').focus({ preventScroll: true }));
window.addEventListener('pageshow', updateBackTop);

const motion = matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !motion.matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('seen');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.11 });
  document.querySelectorAll('.reveal').forEach(item => observer.observe(item));
}

const form = document.querySelector('#quote-form');
const service = form.elements.namedItem('service');
const modalSupported = typeof window.HTMLDialogElement?.prototype.showModal === 'function';
const triggers = new WeakMap();

function openDialog(dialog, trigger) {
  triggers.set(dialog, trigger);
  dialog.showModal();
}

if (modalSupported) {
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog || dialog.classList.contains('lightbox')) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      const trigger = triggers.get(dialog);
      if (trigger) trigger.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll('[data-dialog]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      openDialog(document.getElementById(trigger.dataset.dialog), trigger);
    });
  });
} else {
  // Links keep their inline fallback if dialog support is unavailable.
  document.querySelector('button[data-dialog="demo"]')?.setAttribute('hidden', '');
}

document.querySelectorAll('[data-quote]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    service.value = link.dataset.quote;
    const dialog = link.closest('dialog');
    if (dialog) {
      triggers.delete(dialog);
      dialog.close();
    }
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    document.querySelector(link.hash).scrollIntoView();
    form.elements.namedItem('name').focus({ preventScroll: true });
  });
});

const gallery = [...document.querySelectorAll('[data-gallery]')];
const lightbox = document.querySelector('#lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxCaption = lightbox.querySelector('figcaption strong');
let currentPhoto = 0;

function showPhoto(index) {
  currentPhoto = (index + gallery.length) % gallery.length;
  const photo = gallery[currentPhoto];
  lightboxImage.alt = photo.querySelector('img').alt;
  lightboxImage.src = photo.href;
  lightboxCaption.textContent = photo.querySelector('.project-caption > span').textContent;
}

if (modalSupported) {
  gallery.forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      showPhoto(Number(link.dataset.gallery));
      openDialog(lightbox, link);
    });
  });
  lightbox.querySelector('#previous-photo').addEventListener('click', () => showPhoto(currentPhoto - 1));
  lightbox.querySelector('#next-photo').addEventListener('click', () => showPhoto(currentPhoto + 1));
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(currentPhoto + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
}

const formText = JSON.parse(document.querySelector('#form-text').textContent);
const status = document.querySelector('#form-status');
const fallback = document.querySelector('#draft-fallback');
const draftText = document.querySelector('#draft-text');

form.addEventListener('submit', event => {
  event.preventDefault();
  const fields = new FormData(form);
  const subject = formText.subject + ' · ' + service.selectedOptions[0].textContent;
  const body = [
    formText.name + ': ' + fields.get('name').trim(),
    formText.phone + ': ' + fields.get('phone').trim(),
    formText.email + ': ' + fields.get('email').trim(),
    formText.service + ': ' + service.selectedOptions[0].textContent,
    '',
    formText.message + ':',
    fields.get('message').trim(),
  ].join('\r\n');
  draftText.value = subject + '\n\n' + body;
  fallback.hidden = false;
  status.textContent = formText.draft;
  window.location.href = 'mailto:' + form.dataset.email +
    '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
});

document.querySelector('#copy-draft').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(draftText.value);
    status.textContent = formText.copied;
  } catch {
    draftText.focus();
    draftText.select();
    status.textContent = formText.selectDraft;
  }
});

document.querySelector('#form-fields').disabled = false;
