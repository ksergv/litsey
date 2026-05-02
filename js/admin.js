const ADMIN_PASSWORD = '12345';

let news = [];
let photos = [];
let schedule = [];
let dataLoaded = false;

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

async function loadJSON(path, fallback) {
  try {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`Не вдалося завантажити ${path}`);
    }

    return response.json();
  } catch (error) {
    console.warn(error.message);
    return fallback;
  }
}

async function loadExistingData() {
  if (dataLoaded) {
    return;
  }

  const [loadedNews, loadedPhotos, loadedSchedule] = await Promise.all([
    loadJSON('../data/news.json', []),
    loadJSON('../data/photos.json', []),
    loadJSON('../data/schedule.json', [])
  ]);

  news = Array.isArray(loadedNews) ? loadedNews : [];
  photos = Array.isArray(loadedPhotos) ? loadedPhotos : [];
  schedule = Array.isArray(loadedSchedule) ? loadedSchedule : [];
  dataLoaded = true;
  renderPreview();
}

function checkPassword() {
  const input = document.getElementById('password').value;

  if (input === ADMIN_PASSWORD) {
    showAdmin();
    localStorage.setItem('adminAuth', 'true');
  } else {
    alert('Неправильний пароль');
  }
}

function showAdmin() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('admin').style.display = 'block';
  loadExistingData();
}

window.addEventListener('load', () => {
  if (localStorage.getItem('adminAuth') === 'true') {
    showAdmin();
  }
});

function logout() {
  localStorage.removeItem('adminAuth');
  location.reload();
}

function getValue(id) {
  return document.getElementById(id).value.trim();
}

function clearFields(ids) {
  ids.forEach(id => {
    document.getElementById(id).value = '';
  });
}

function addNews() {
  const item = {
    section: getValue('news-section') || 'Оголошення',
    title: getValue('news-title'),
    date: getValue('news-date'),
    text: getValue('news-text')
  };

  if (!item.title || !item.text) {
    alert('Заповніть заголовок і текст новини.');
    return;
  }

  news.push(item);
  clearFields(['news-title', 'news-date', 'news-text']);
  renderPreview();
}

function addSchedule() {
  const item = {
    section: getValue('schedule-section') || 'Заняття',
    title: getValue('schedule-title'),
    date: getValue('schedule-date'),
    text: getValue('schedule-text')
  };

  if (!item.title || !item.text) {
    alert('Заповніть заголовок і текст розкладу.');
    return;
  }

  schedule.push(item);
  clearFields(['schedule-title', 'schedule-date', 'schedule-text']);
  renderPreview();
}

function addPhotos() {
  const title = getValue('photo-title');
  const urls = getValue('photo-urls')
    .split('\n')
    .map(url => url.trim())
    .filter(Boolean);

  if (!title || !urls.length) {
    alert('Заповніть назву блоку та додайте хоча б одне посилання Cloudinary.');
    return;
  }

  photos.push({
    section: getValue('photo-section') || 'Заходи',
    title,
    images: urls
  });

  clearFields(['photo-title', 'photo-urls']);
  renderPreview();
}

function renderPreview() {
  const element = document.getElementById('preview');
  element.innerHTML = '';

  if (!news.length && !photos.length && !schedule.length) {
    element.innerHTML = '<p class="empty">Матеріали ще не додано.</p>';
    return;
  }

  if (news.length) {
    element.innerHTML += '<h3>Новини</h3>';
  }

  news.forEach(item => {
    element.innerHTML += `
      <div class="card">
        <p class="section-label">${escapeHTML(item.section)}</p>
        <h3>${escapeHTML(item.title)}</h3>
        <small>${escapeHTML(item.date)}</small>
        <p>${formatText(item.text)}</p>
      </div>
    `;
  });

  if (photos.length) {
    element.innerHTML += '<h3>Фотографії</h3>';
  }

  photos.forEach(item => {
    element.innerHTML += `
      <div class="card">
        <p class="section-label">${escapeHTML(item.section)}</p>
        <h3>${escapeHTML(item.title)}</h3>
        <div class="preview-images">
          ${(item.images || []).map(image => `<img src="${escapeHTML(image)}" alt="${escapeHTML(item.title)}" loading="lazy">`).join('')}
        </div>
      </div>
    `;
  });

  if (schedule.length) {
    element.innerHTML += '<h3>Розклад</h3>';
  }

  schedule.forEach(item => {
    element.innerHTML += `
      <div class="card">
        <p class="section-label">${escapeHTML(item.section)}</p>
        <h3>${escapeHTML(item.title)}</h3>
        <small>${escapeHTML(item.date)}</small>
        <p>${formatText(item.text)}</p>
      </div>
    `;
  });
}

function downloadFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadNewsJSON() {
  downloadFile('news.json', news);
}

function downloadPhotosJSON() {
  downloadFile('photos.json', photos);
}

function downloadScheduleJSON() {
  downloadFile('schedule.json', schedule);
}
