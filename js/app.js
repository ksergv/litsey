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
  const response = await fetch(path + '?t=' + Date.now(), {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Не вдалося завантажити ${path}`);
  }

  const text = await response.text();

  if (!text.trim()) {
    throw new Error(`Пустий JSON у файлі ${path}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Невалідний JSON у файлі ${path}: ${error.message}`);
  }
}

function showError(element, message) {
  element.innerHTML = `<p class="empty">${escapeHTML(message)}</p>`;
}

async function loadNews() {
  const element = document.getElementById('news');

  try {
    const data = await loadJSON('../data/news.json');
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (!data.length) {
      showError(element, 'Новини ще не додано.');
      return;
    }

    element.innerHTML = data.map(item => `
      <article class="card" id="${slugify(item.section)}">
        <p class="section-label">${escapeHTML(item.section || 'Новини')}</p>
        <h2>${escapeHTML(item.title || '')}</h2>
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


let selectedGrade = 'all';
let selectedLetter = 'all';
let dateFrom = '';
let dateTo = '';
function updateFilter() {
  selectedGrade = document.getElementById('gradeFilter').value;
  selectedLetter = document.getElementById('letterFilter').value;
  dateFrom = document.getElementById('dateFrom').value;
  dateTo = document.getElementById('dateTo').value;
  loadSchedule();
}

async function loadSchedule() {
  const element = document.getElementById('schedule');

  try {
    const data = await loadJSON('../data/schedule.json');
   data.sort((a, b) => new Date(a.date) - new Date(b.date));

let filteredData = data.filter(item => {
  if (dateFrom && new Date(item.date) < new Date(dateFrom)) {
    return false;
  }

  if (dateTo && new Date(item.date) > new Date(dateTo)) {
    return false;
  }

  return true;
});

    if (!filteredData.length) {
      showError(element, 'Розклад ще не додано.');
      return;
    }

    element.innerHTML = filteredData.map(item => {
      let content = '';

    if (item.classes) {
  let entries = Object.entries(item.classes);

  entries = entries.filter(([cls]) => {
    const [grade, letter] = cls.split('-');

    if (selectedGrade !== 'all' && grade !== selectedGrade) return false;
    if (selectedLetter !== 'all' && letter !== selectedLetter) return false;

    return true;
  });

  if (!entries.length) return '';

  content = entries.map(([cls, text]) => `
    <p>
      <strong>${escapeHTML(cls)}</strong><br>
      ${formatText(text)}
    </p>
  `).join('');
      } else {
        content = `<p>${formatText(item.text)}</p>`;
      }

      return `
        <article class="card" id="${slugify(item.section)}">
          <p class="section-label">${escapeHTML(item.section || 'Розклад')}</p>
          <h2>${escapeHTML(item.title || '')}</h2>
          <small>${escapeHTML(item.date)}</small>
          ${content}
        </article>
      `;
    }).join('');
  } catch (error) {
    showError(element, error.message);
  }
}
