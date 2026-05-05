const ADMIN_PASSWORD = '12345';

let news = [];
let photos = [];
let schedule = [];
let dataLoaded = false;
let editingNewsIndex = null;
let editingPhotoIndex = null;
let editingScheduleIndex = null;

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
  const element = document.getElementById(id);
  return element ? element.value.trim() : '';
}

function clearFields(ids) {
  ids.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.value = '';
    }
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
  const section = getValue('schedule-section') || 'Заняття';
  const type = getValue('schedule-type') || 'text';
  const title = getValue('schedule-title');
  const date = getValue('schedule-date');
  const text = getValue('schedule-text');
  const classesInput = getValue('schedule-classes');

  let item;

  if (type === 'classes') {
    const classes = classesInput
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .reduce((acc, line) => {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) {
          return acc;
        }

        const cls = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();

        if (cls) {
          acc[cls] = value;
        }

        return acc;
      }, {});

    if (!Object.keys(classes).length || !date) {
      alert('Заповніть дату та список класів у форматі "Клас: розклад".');
      return;
    }

    item = { section, date, classes };
  } else {
    if (!title || !text || !date) {
      alert('Заповніть заголовок, дату та текст розкладу.');
      return;
    }

    item = { section, title, date, text };
  }

  schedule.push(item);
  clearFields(['schedule-title', 'schedule-date', 'schedule-text', 'schedule-classes']);
  renderPreview();
}

function addPhotoRow(url = '', caption = '') {
  const container = document.getElementById('photo-list');

  const div = document.createElement('div');
  div.className = 'photo-row';

  div.innerHTML = `
    <input placeholder="URL фото" value="${url}">
    <input placeholder="Підпис" value="${caption}">
    <button type="button" onclick="this.parentElement.remove()">Видалити</button>
  `;

  container.appendChild(div);
}

function addPhotos() {
  const title = getValue('photo-title');
  const rows = document.querySelectorAll('#photo-list .photo-row');

  if (!title || !rows.length) {
    alert('Додайте хоча б одне фото.');
    return;
  }

  const images = Array.from(rows).map(row => {
    const inputs = row.querySelectorAll('input');

    return {
      url: inputs[0].value.trim(),
      caption: inputs[1].value.trim()
    };
  }).filter(img => img.url);

  photos.push({
    section: getValue('photo-section') || 'Заходи',
    title,
    images
  });

  renderPreview();
}

function confirmDelete(message) {
  return window.confirm(message);
}

function deleteNews(index) {
  if (!confirmDelete('Видалити цю новину?')) {
    return;
  }

  news.splice(index, 1);
  renderPreview();
}

function deleteSchedule(index) {
  if (!confirmDelete('Видалити цей запис розкладу?')) {
    return;
  }

  schedule.splice(index, 1);
  renderPreview();
}

function deletePhotoSection(index) {
  if (!confirmDelete('Видалити весь блок фотографій?')) {
    return;
  }

  photos.splice(index, 1);
  renderPreview();
}

function deletePhoto(sectionIndex, imageIndex) {
  if (!confirmDelete('Видалити цю фотографію?')) {
    return;
  }

  photos[sectionIndex].images.splice(imageIndex, 1);

  if (!photos[sectionIndex].images.length) {
    photos.splice(sectionIndex, 1);
  }

  renderPreview();
}



function startEditNews(index) {
  editingNewsIndex = index;
  renderPreview();
}

function cancelEditNews() {
  editingNewsIndex = null;
  renderPreview();
}

function saveNews(index) {
  news[index].title = document.getElementById(`edit-news-title-${index}`).value;
  news[index].date = document.getElementById(`edit-news-date-${index}`).value;
  news[index].text = document.getElementById(`edit-news-text-${index}`).value;

  editingNewsIndex = null;
  renderPreview();
}

function startEditPhotos(index) {
  editingPhotoIndex = index;
  renderPreview();
}

function cancelEditPhotos() {
  editingPhotoIndex = null;
  renderPreview();
}

function savePhotos(index) {
  const section = photos[index];

  section.title = document.getElementById(`edit-photo-title-${index}`).value;

  section.images = section.images.map((img, i) => ({
    url: document.getElementById(`edit-photo-url-${index}-${i}`).value,
    caption: document.getElementById(`edit-photo-caption-${index}-${i}`).value
  }));

  editingPhotoIndex = null;
  renderPreview();
}

function editPhotoCaption(sectionIndex, imageIndex) {
  const img = photos[sectionIndex].images[imageIndex];

  const newCaption = prompt('Підпис', img.caption);
  if (newCaption === null) return;

  img.caption = newCaption;

  renderPreview();
}
function startEditSchedule(index) {
  editingScheduleIndex = index;
  renderPreview();
}

function cancelEditSchedule() {
  editingScheduleIndex = null;
  renderPreview();
}

function saveSchedule(index) {
  const item = schedule[index];

  item.section = document.getElementById(`edit-schedule-section-${index}`).value;
  item.date = document.getElementById(`edit-schedule-date-${index}`).value;

  if (item.title !== undefined) {
    item.title = document.getElementById(`edit-schedule-title-${index}`).value;
  }

  if (item.text !== undefined) {
    item.text = document.getElementById(`edit-schedule-text-${index}`).value;
  }

  if (item.classes) {
    const raw = document.getElementById(`edit-schedule-classes-${index}`).value;

    const classes = {};

    raw.split('\n').forEach(line => {
      const [k, v] = line.split(':');
      if (k && v) {
        classes[k.trim()] = v.trim();
      }
    });

    item.classes = classes;
  }

  editingScheduleIndex = null;
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

  const grouped = {};

 news.forEach((item, index) => {
  if (editingNewsIndex === index) {
    element.innerHTML += `
      <div class="card admin-item">
        <div class="admin-item-content">
          <input id="edit-news-title-${index}" value="${escapeHTML(item.title)}">
          <input type="date" id="edit-news-date-${index}" value="${escapeHTML(item.date)}">
          <textarea id="edit-news-text-${index}">${escapeHTML(item.text)}</textarea>
        </div>

        <div class="button-row">
          <button onclick="saveNews(${index})">Зберегти</button>
          <button onclick="cancelEditNews()">Скасувати</button>
        </div>
      </div>
    `;
  } else {
    element.innerHTML += `
      <div class="card admin-item">
        <div class="admin-item-content">
          <p class="section-label">${escapeHTML(item.section)}</p>
          <h3>${escapeHTML(item.title)}</h3>
          <small>${escapeHTML(item.date)}</small>
          <p>${formatText(item.text)}</p>
        </div>

        <div class="button-row">
          <button onclick="startEditNews(${index})">Редагувати</button>
          <button class="danger-button" onclick="deleteNews(${index})">Видалити</button>
        </div>
      </div>
    `;
  }
});
}

  if (photos.length) {
  element.innerHTML += '<h3>Фотографії</h3>';
}
photos.forEach((item, sectionIndex) => {

  if (editingPhotoIndex === sectionIndex) {

    // режим редактирования
    element.innerHTML += `
      <div class="card admin-item">

        <input id="edit-photo-title-${sectionIndex}" value="${escapeHTML(item.title)}">

        ${item.images.map((img, i) => `
          <div class="photo-row">
            <input id="edit-photo-url-${sectionIndex}-${i}" value="${escapeHTML(img.url)}">
            <input id="edit-photo-caption-${sectionIndex}-${i}" value="${escapeHTML(img.caption || '')}">
          </div>
        `).join('')}

        <div class="button-row">
          <button onclick="savePhotos(${sectionIndex})">Зберегти</button>
          <button onclick="cancelEditPhotos()">Скасувати</button>
        </div>

      </div>
    `;

  } else {

    // обычный режим
    element.innerHTML += `
      <div class="card admin-item">
        <div class="admin-item-content">
          <p class="section-label">${escapeHTML(item.section)}</p>
          <h3>${escapeHTML(item.title)}</h3>

          <div class="photo-grid">
            ${item.images.map((img, i) => `
              <div class="photo-item">
                <img src="${escapeHTML(img.url)}">
                <p>${escapeHTML(img.caption || '')}</p>

                <div class="button-row">
                  <button onclick="editPhotoCaption(${sectionIndex}, ${i})">Редагувати</button>
                  <button class="danger-button" onclick="deletePhoto(${sectionIndex}, ${i})">
                    Видалити
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="button-row">
          <button onclick="startEditPhotos(${sectionIndex})">Редагувати блок</button>
          <button class="danger-button" onclick="deletePhotoSection(${sectionIndex})">
            Видалити блок
          </button>
        </div>
      </div>
    `;
  }
});
 

  if (schedule.length) {
    element.innerHTML += '<h3>Розклад</h3>';
  }

  schedule.forEach((item, index) => {

  if (editingScheduleIndex === index) {

    // режим редактирования
    element.innerHTML += `
      <div class="card admin-item">

        <select id="edit-schedule-section-${index}">
          <option ${item.section === 'Заняття' ? 'selected' : ''}>Заняття</option>
          <option ${item.section === 'Заходи' ? 'selected' : ''}>Заходи</option>
          <option ${item.section === 'Контрольні' ? 'selected' : ''}>Контрольні</option>
        </select>

        <input type="date" id="edit-schedule-date-${index}" value="${escapeHTML(item.date)}">

        ${item.title !== undefined ? `
          <input id="edit-schedule-title-${index}" value="${escapeHTML(item.title || '')}">
        ` : ''}

        ${item.text !== undefined ? `
          <textarea id="edit-schedule-text-${index}">${escapeHTML(item.text)}</textarea>
        ` : ''}

        ${item.classes ? `
         <textarea id="edit-schedule-classes-${index}">${escapeHTML(
        Object.entries(item.classes)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
      )}</textarea>
        ` : ''}

        <div class="button-row">
          <button onclick="saveSchedule(${index})">Зберегти</button>
          <button onclick="cancelEditSchedule()">Скасувати</button>
        </div>

      </div>
    `;

  } else {

    // обычный режим
    let content = '';

    if (item.classes) {
      content = Object.entries(item.classes).map(([cls, text]) => `
        <div class="class-block">
          <strong>${escapeHTML(cls)}</strong>
          <p>${formatText(text)}</p>
        </div>
      `).join('');
    } else {
      content = `<p>${formatText(item.text)}</p>`;
    }

    element.innerHTML += `
      <div class="card admin-item">
        <div class="admin-item-content">
          <p class="section-label">${escapeHTML(item.section)}</p>
          <h3>${escapeHTML(item.title || '')}</h3>
          <small>${escapeHTML(item.date)}</small>
          ${content}
        </div>

        <div class="button-row">
          <button onclick="startEditSchedule(${index})">Редагувати</button>
          <button class="danger-button" onclick="deleteSchedule(${index})">Видалити</button>
        </div>
      </div>
    `;
  }
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

function setApiStatus(message, isError = false) {
  const element = document.getElementById('api-status');

  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = isError ? 'status-text error-text' : 'status-text success-text';
}

function getApiEndpoint() {
  const value = getValue('api-url');

  if (!value) {
    return '/api/update-json';
  }

  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/+/g, '/');
    return url.toString();
  } catch (error) {
    return value.replace(/([^:])\/{2,}/g, '$1/');
  }
}

function getAdminApiKey() {
  return getValue('admin-api-key');
}

async function publishJSON(filename, content) {
  const adminKey = getAdminApiKey();

  if (!adminKey) {
    alert('Введіть ключ адміністратора Vercel API.');
    return false;
  }

  setApiStatus(`Відправляємо ${filename}...`);

  try {
    const response = await fetch(getApiEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey
      },
      body: JSON.stringify({
        filename,
        content,
        message: `update ${filename}`
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Не вдалося оновити файл на GitHub.');
    }

    setApiStatus(`${filename} відправлено на GitHub.`);
    return true;
  } catch (error) {
    setApiStatus(error.message, true);
    return false;
  }
}

function publishNewsJSON() {
  publishJSON('news.json', news);
}

function publishPhotosJSON() {
  publishJSON('photos.json', photos);
}

function publishScheduleJSON() {
  publishJSON('schedule.json', schedule);
}

async function publishAllJSON() {
  if (!getAdminApiKey()) {
    alert('Введіть ключ адміністратора Vercel API.');
    return;
  }

  const files = [
    ['news.json', news],
    ['photos.json', photos],
    ['schedule.json', schedule]
  ];

  for (const [filename, content] of files) {
    const ok = await publishJSON(filename, content);

    if (!ok) {
      return;
    }
  }

  setApiStatus('Усі JSON-файли відправлено на GitHub.');
}
