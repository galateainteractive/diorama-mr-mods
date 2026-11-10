const reveals = document.querySelectorAll('.reveal');
const isPtBr = document.documentElement.lang.toLowerCase() === 'pt-br';
const uiCopy = isPtBr
  ? {
      invalidEmail: 'Digite um endereço de e-mail válido.',
      joining: 'Cadastrando…',
      signupSuccess: 'Obrigado — seu e-mail foi cadastrado para receber novidades da Galatea Interactive.',
      signupError: 'Não foi possível salvar o cadastro. Tente novamente em instantes.',
      joinList: 'Entrar na lista ↗',
      requiredFields: 'Preencha os campos obrigatórios.',
      feedbackUnavailable: 'A caixa de feedback ainda está sendo conectada. Sua mensagem não foi enviada.',
      sending: 'Enviando…',
      feedbackSuccess: 'Obrigado — sua mensagem foi enviada.',
      feedbackAndSignupSuccess: 'Obrigado — sua mensagem foi enviada e seu cadastro para novidades foi salvo.',
      feedbackSentSignupError: 'Sua mensagem foi enviada, mas não foi possível salvar o cadastro para novidades. Tente pelo formulário abaixo.',
      feedbackError: 'Não foi possível enviar a mensagem. Tente novamente em instantes.',
      sendMessage: 'Enviar mensagem',
      saving: 'Salvando…',
      onList: '<p><strong>Você está na lista.</strong>Enviarei apenas novidades ocasionais da Galatea Interactive e avisos de lançamentos.</p>',
      tryAgain: 'Tentar novamente',
      postSignupError: 'Sua mensagem foi enviada, mas o cadastro para novidades não funcionou. Tente novamente.',
    }
  : {
      invalidEmail: 'Enter a valid email address.',
      joining: 'Joining…',
      signupSuccess: 'Thanks — your email has been saved for Galatea Interactive updates.',
      signupError: 'The signup could not be saved. Please try again in a moment.',
      joinList: 'Join the list ↗',
      requiredFields: 'Please complete the required fields.',
      feedbackUnavailable: 'The feedback inbox is being connected. Your message has not been sent yet.',
      sending: 'Sending…',
      feedbackSuccess: 'Thanks — your message was sent.',
      feedbackAndSignupSuccess: 'Thanks — your message was sent and your update signup was saved.',
      feedbackSentSignupError: 'Your message was sent, but the update signup could not be saved. Please try the updates form below.',
      feedbackError: 'The message could not be sent. Please try again in a moment.',
      sendMessage: 'Send message',
      saving: 'Saving…',
      onList: '<p><strong>You’re on the list.</strong>I’ll only send occasional Galatea Interactive updates and release news.</p>',
      tryAgain: 'Try again',
      postSignupError: 'Your message was sent, but the update signup did not work. Please try again.',
    };

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
    formStatus.textContent = uiCopy.invalidEmail;
    return;
  }

  const submitButton = updatesForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = uiCopy.joining;
  formStatus.textContent = '';

  try {
    await submitUpdateSignup(String(email), 'Diorama MR Mods updates form');
    updatesForm.reset();
    formStatus.textContent = uiCopy.signupSuccess;
  } catch {
    formStatus.textContent = uiCopy.signupError;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = uiCopy.joinList;
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
    feedbackStatus.textContent = uiCopy.requiredFields;
    return;
  }

  const endpoint = feedbackForm.dataset.endpoint;
  if (!endpoint) {
    feedbackStatus.textContent = uiCopy.feedbackUnavailable;
    return;
  }

  const submitButton = feedbackForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = uiCopy.sending;

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
    feedbackStatus.textContent = uiCopy.feedbackSuccess;

    if (requestedUpdates) {
      try {
        await submitUpdateSignup(lastSubmittedEmail, 'Diorama MR Mods feedback opt-in');
        feedbackStatus.textContent = uiCopy.feedbackAndSignupSuccess;
        postSendUpdates.hidden = true;
      } catch {
        feedbackStatus.textContent = uiCopy.feedbackSentSignupError;
        postSendUpdates.hidden = true;
      }
    } else {
      postSendUpdates.hidden = false;
    }
  } catch {
    feedbackStatus.textContent = uiCopy.feedbackError;
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = `${uiCopy.sendMessage} <span>↗</span>`;
  }
});

postSendYes?.addEventListener('click', async () => {
  if (!lastSubmittedEmail) return;

  postSendYes.disabled = true;
  postSendNo.disabled = true;
  postSendYes.textContent = uiCopy.saving;

  try {
    await submitUpdateSignup(lastSubmittedEmail, 'Galatea Interactive post-feedback signup');
    postSendUpdates.innerHTML = uiCopy.onList;
  } catch {
    postSendYes.disabled = false;
    postSendNo.disabled = false;
    postSendYes.textContent = uiCopy.tryAgain;
    feedbackStatus.textContent = uiCopy.postSignupError;
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
