const reveals = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('is-visible'));
}

const updatesForm = document.querySelector('#updates-form');
const formStatus = document.querySelector('#form-status');
const feedbackForm = document.querySelector('#feedback-form');
const feedbackStatus = document.querySelector('#feedback-status');
const feedbackProject = document.querySelector('#feedback-project');
const feedbackTriggers = document.querySelectorAll('.feedback-trigger');
const feedbackUpdates = document.querySelector('#feedback-updates');
const postSendUpdates = document.querySelector('#post-send-updates');
const postSendYes = document.querySelector('#post-send-yes');
const postSendNo = document.querySelector('#post-send-no');
let lastSubmittedEmail = '';

const submitUpdateSignup = async (email, source) => {
  const endpoint = updatesForm?.dataset.endpoint;
  if (!endpoint) throw new Error('Updates endpoint is not configured');

  const signup = new FormData();
  signup.append('email', email);
  signup.append('source', source);
  signup.append('message_type', 'Galatea Interactive updates signup');
  signup.append('release_updates', 'yes');

  const response = await fetch(endpoint, {
    method: 'POST',
    body: signup,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error('Signup failed');
};

updatesForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = new FormData(updatesForm).get('email');

  if (!email || !updatesForm.checkValidity()) {
    formStatus.textContent = 'Enter a valid email address.';
    return;
  }

  const submitButton = updatesForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Joining…';
  formStatus.textContent = '';

  try {
    await submitUpdateSignup(String(email), 'Diorama MR Mods updates form');
    updatesForm.reset();
    formStatus.textContent = 'Thanks — your email has been saved for Galatea Interactive updates.';
  } catch {
    formStatus.textContent = 'The signup could not be saved. Please try again in a moment.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Join the list ↗';
  }
});

feedbackTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    if (!feedbackProject) return;
    feedbackProject.value = trigger.dataset.project || '';
    feedbackStatus.textContent = '';
  });
});

feedbackForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  feedbackStatus.textContent = '';
  postSendUpdates.hidden = true;

  if (!feedbackForm.checkValidity()) {
    feedbackForm.reportValidity();
    feedbackStatus.textContent = 'Please complete the required fields.';
    return;
  }

  const endpoint = feedbackForm.dataset.endpoint;
  if (!endpoint) {
    feedbackStatus.textContent = 'The feedback inbox is being connected. Your message has not been sent yet.';
    return;
  }

  const submitButton = feedbackForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Sending…';

  try {
    const submission = new FormData(feedbackForm);
    const requestedUpdates = feedbackUpdates.checked;
    lastSubmittedEmail = String(submission.get('email') || '');
    const response = await fetch(endpoint, {
      method: 'POST',
      body: submission,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) throw new Error('Submission failed');

    const selectedProject = feedbackProject.value;
    feedbackForm.reset();
    feedbackProject.value = selectedProject;
    feedbackStatus.textContent = 'Thanks — your message was sent.';

    if (requestedUpdates) {
      try {
        await submitUpdateSignup(lastSubmittedEmail, 'Diorama MR Mods feedback opt-in');
        feedbackStatus.textContent = 'Thanks — your message was sent and your update signup was saved.';
        postSendUpdates.hidden = true;
      } catch {
        feedbackStatus.textContent = 'Your message was sent, but the update signup could not be saved. Please try the updates form below.';
        postSendUpdates.hidden = true;
      }
    } else {
      postSendUpdates.hidden = false;
    }
  } catch {
    feedbackStatus.textContent = 'The message could not be sent. Please try again in a moment.';
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Send message <span>↗</span>';
  }
});

postSendYes?.addEventListener('click', async () => {
  if (!lastSubmittedEmail) return;

  postSendYes.disabled = true;
  postSendNo.disabled = true;
  postSendYes.textContent = 'Saving…';

  try {
    await submitUpdateSignup(lastSubmittedEmail, 'Galatea Interactive post-feedback signup');
    postSendUpdates.innerHTML = '<p><strong>You’re on the list.</strong>I’ll only send occasional Galatea Interactive updates and release news.</p>';
  } catch {
    postSendYes.disabled = false;
    postSendNo.disabled = false;
    postSendYes.textContent = 'Try again';
    feedbackStatus.textContent = 'Your message was sent, but the update signup did not work. Please try again.';
  }
});

postSendNo?.addEventListener('click', () => {
  postSendUpdates.hidden = true;
});

const modEntries = document.querySelectorAll('.project-card');

const releasesApi = 'https://api.github.com/repos/galateainteractive/Diorama-MR-Mods-Releases/releases';
const releaseAssetMatchers = {
  installer: (name) => /installer.*\.exe$/i.test(name),
  apk: (name) => /\.apk$/i.test(name),
  checksum: (name) => /^sha256.*\.txt$/i.test(name),
  source: (name) => /source.*\.zip$/i.test(name),
};

async function loadReleases() {
  const response = await fetch(`${releasesApi}?per_page=100&release_sync=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error('GitHub release lookup failed');
  return response.json();
}

function releaseVersion(card, release) {
  const productName = card.dataset.releaseName || '';
  const releaseName = (release.name || '').trim();
  if (productName && releaseName.toLowerCase().startsWith(productName.toLowerCase())) {
    return releaseName.slice(productName.length).trim();
  }

  return release.tag_name
    .slice((card.dataset.releasePrefix || '').length)
    .replace(/-/g, ' ')
    .replace(/\.(?=\d+$)/, ' ')
    .trim();
}

function applyRelease(card, release) {
  const version = releaseVersion(card, release);
  const status = card.querySelector('.project-status');
  const metaVersion = card.querySelector('.release-meta span');
  const downloadVersion = card.querySelector('[data-release-version]');

  if (status && version) status.textContent = version;
  if (metaVersion && version) metaVersion.textContent = version;
  if (downloadVersion && version) downloadVersion.textContent = `${version} ↗`;

  card.querySelectorAll('[data-release-asset]').forEach((link) => {
    const matcher = releaseAssetMatchers[link.dataset.releaseAsset];
    const asset = matcher ? release.assets.find((item) => matcher(item.name)) : null;
    if (asset) {
      link.href = asset.browser_download_url;
      link.hidden = false;
    } else {
      link.hidden = true;
    }
  });

  const releasePage = card.querySelector('[data-release-page]');
  if (releasePage) releasePage.href = release.html_url;
  card.dataset.releaseSync = 'live';
}

async function syncGitHubReleases() {
  const releaseCards = [...modEntries].filter((card) => card.dataset.releasePrefix);
  if (!releaseCards.length) return;

  try {
    const releases = await loadReleases();
    releaseCards.forEach((card) => {
      const prefix = card.dataset.releasePrefix;
      const release = releases.find((item) => !item.draft && item.tag_name.startsWith(prefix));
      if (release) applyRelease(card, release);
    });
    document.querySelector('#mods')?.setAttribute('data-release-sync', 'live');
  } catch {
    document.querySelector('#mods')?.setAttribute('data-release-sync', 'fallback');
  }
}

syncGitHubReleases();

let entryRequestedByUser = null;

modEntries.forEach((entry) => {
  const summary = entry.querySelector(':scope > summary');

  summary?.addEventListener('click', () => {
    entryRequestedByUser = entry.open ? null : entry;
  });

  entry.addEventListener('toggle', () => {
    if (!entry.open) return;

    modEntries.forEach((otherEntry) => {
      if (otherEntry !== entry) otherEntry.removeAttribute('open');
    });

    if (entryRequestedByUser !== entry) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        entry.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        });
        entryRequestedByUser = null;
      });
    });
  });
});
