const todoForm = document.querySelector('[data-testid="todo-form"]');
const signInForm = document.querySelector('[data-testid="sign-in-form"]');
const loadProfileButton = document.querySelector('[data-testid="load-profile"]');
const authStorageKey = 'pom-practice-auth';

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(authStorageKey));
  } catch {
    localStorage.removeItem(authStorageKey);
    return null;
  }
}

function setAuth(auth) {
  localStorage.setItem(authStorageKey, JSON.stringify(auth));
}

function clearFieldError(input, error) {
  input.removeAttribute('aria-invalid');
  error.textContent = '';
}

function setFieldError(input, error, message) {
  input.setAttribute('aria-invalid', 'true');
  error.textContent = message;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message ?? 'Something went wrong.');
  }

  return body;
}

if (todoForm) {
  const taskInput = todoForm.querySelector('[name="task"]');
  const taskList = document.querySelector('[data-testid="task-list"]');

  todoForm.addEventListener('submit', event => {
    event.preventDefault();

    const text = taskInput.value.trim();
    if (!text) return;

    const item = document.createElement('li');
    const label = document.createElement('label');
    const checkbox = document.createElement('input');

    checkbox.type = 'checkbox';
    label.append(checkbox, ` ${text}`);
    item.append(label);
    taskList.append(item);
    taskInput.value = '';
  });
}

if (signInForm) {
  const status = document.querySelector('[role="status"]');
  const emailInput = signInForm.querySelector('[name="email"]');
  const passwordInput = signInForm.querySelector('[name="password"]');
  const emailError = document.querySelector('[data-testid="email-error"]');
  const passwordError = document.querySelector('[data-testid="password-error"]');
  const sampleUsers = document.querySelector('[data-testid="sample-users"]');

  fetchJson('/api/users')
    .then(users => {
      sampleUsers.replaceChildren(
        ...users.map(user => {
          const item = document.createElement('li');
          item.textContent = `${user.name} (${user.email})`;
          return item;
        }),
      );
    })
    .catch(() => {
      sampleUsers.textContent = 'Sample users are temporarily unavailable.';
    });

  signInForm.addEventListener('submit', async event => {
    event.preventDefault();

    clearFieldError(emailInput, emailError);
    clearFieldError(passwordInput, passwordError);
    status.textContent = '';

    if (!emailInput.validity.valid) {
      setFieldError(emailInput, emailError, 'Enter a valid email address.');
    }

    if (!passwordInput.validity.valid) {
      setFieldError(passwordInput, passwordError, 'Password must be at least 8 characters.');
    }

    if (!signInForm.checkValidity()) {
      status.textContent = 'Please fix the highlighted fields.';
      return;
    }

    const button = signInForm.querySelector('button');
    button.disabled = true;
    status.textContent = 'Signing in...';

    try {
      const auth = await fetchJson('/api/login', {
        method: 'POST',
        body: JSON.stringify({
          email: emailInput.value,
          password: passwordInput.value,
        }),
      });

      setAuth(auth);
      status.textContent = `Signed in as ${auth.user.name}.`;
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}

if (loadProfileButton) {
  const status = document.querySelector('[role="status"]');
  const session = document.querySelector('[data-testid="profile-session"]');
  const auth = getAuth();

  if (auth?.user?.name) {
    session.textContent = `Signed in as ${auth.user.name}.`;
  }

  loadProfileButton.addEventListener('click', async () => {
    const currentAuth = getAuth();

    if (!currentAuth?.token) {
      status.textContent = 'Please sign in to load your profile.';
      return;
    }

    loadProfileButton.disabled = true;
    status.textContent = 'Loading profile...';

    try {
      const profile = await fetchJson('/api/profile', {
        headers: { authorization: `Bearer ${currentAuth.token}` },
      });

      document.querySelector('[data-testid="profile-name"]').textContent = profile.name;
      document.querySelector('[data-testid="profile-email"]').textContent = profile.email;
      document.querySelector('[data-testid="profile-role"]').textContent = profile.role;
      document.querySelector('[data-testid="profile-team"]').textContent = profile.team;
      status.textContent = 'Profile loaded.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      loadProfileButton.disabled = false;
    }
  });
}
