function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatText(value) {
  return escapeHTML(value).replaceAll('\n', '<br>');
}

function slugify(value) {
  const map = {
    'Оголошення': 'announcements',
    'Події': 'events',
    'Досягнення': 'achievements',
    'Заходи': 'events',
    'Уроки': 'lessons',
    'Шкільне життя': 'school-life',
    'Заняття': 'classes',
    'Контрольні': 'tests'
  };

  return map[value] || String(value || '')
    .toLowerCase()
    .trim()
    .replaceAll(' ', '-');
}

async function loadJSON(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Не вдалося завантажити ${path}`);
  }

  return response.json();
}

function showError(element, message) {
  element.innerHTML = `<p class="empty">${escapeHTML(message)}</p>`;
}

async function loadNews() {
  const element = document.getElementById('news');

  try {
    const data = await loadJSON('../data/news.json');

    if (!data.length) {
      showError(element, 'Новини ще не додано.');
      return;
    }

    element.innerHTML = data.map(item => `
      <article class="card" id="${slugify(item.section)}">
        <p class="section-label">${escapeHTML(item.section || 'Новини')}</p>
        <h2>${escapeHTML(item.title)}</h2>
        <small>${escapeHTML(item.date)}</small>
        <p>${formatText(item.text)}</p>
      </article>
    `).join('');
  } catch (error) {
    showError(element, error.message);
  }
}

async function loadPhotos() {
  const element = document.getElementById('photos');

  try {
    const data = await loadJSON('../data/photos.json');

    if (!data.length) {
      showError(element, 'Фотографії ще не додано.');
      return;
    }

    element.innerHTML = data.map(section => `
      <section class="photo-section" id="${slugify(section.section || section.title)}">
        <p class="section-label">${escapeHTML(section.section || 'Фотографії')}</p>
        <h2>${escapeHTML(section.title)}</h2>
        <div class="photo-grid">
          ${(section.images || []).map((image, index) => `
            <a href="${escapeHTML(image)}" target="_blank" rel="noopener">
              <img src="${escapeHTML(image)}" alt="${escapeHTML(section.title)} ${index + 1}" loading="lazy">
            </a>
          `).join('')}
        </div>
      </section>
    `).join('');
  } catch (error) {
    showError(element, error.message);
  }
}

async function loadSchedule() {
  const element = document.getElementById('schedule');

  try {
    const data = await loadJSON('../data/schedule.json');

    if (!data.length) {
      showError(element, 'Розклад ще не додано.');
      return;
    }

    element.innerHTML = data.map(item => `
      <article class="card" id="${slugify(item.section)}">
        <p class="section-label">${escapeHTML(item.section || 'Розклад')}</p>
        <h2>${escapeHTML(item.title)}</h2>
        <small>${escapeHTML(item.date)}</small>
        <p>${formatText(item.text)}</p>
      </article>
    `).join('');
  } catch (error) {
    showError(element, error.message);
  }
}
