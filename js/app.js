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

function showError(target, message) {
  const html = `<p class="empty">${escapeHTML(message)}</p>`;

  if (Array.isArray(target)) {
    target.forEach(el => {
      if (el) el.innerHTML = html;
    });
  } else {
    if (target) target.innerHTML = html;
  }
}
let selectedNewsSection = 'all';
function showNewsSection(section, event) {
  event.preventDefault();

  selectedNewsSection = section;

  document.querySelectorAll('.subnav a').forEach(a => {
    a.classList.remove('active');
  });

  event.target.classList.add('active');

  loadNews();
}
async function loadNews() {
  const element = document.getElementById('news');
  element.innerHTML = '';

  try {
    const data = await loadJSON('../data/news.json');

    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!data.length) {
      showError(element, 'Новини ще не додано.');
      return;
    }

    let filteredData = data;

  if (selectedNewsSection !== 'all') {
    filteredData = data.filter(item => item.section === selectedNewsSection);
  }
   const grouped = {};

    filteredData.forEach(item => {
      if (!grouped[item.section]) {
        grouped[item.section] = [];
      }
      grouped[item.section].push(item);
    });

    Object.entries(grouped).forEach(([section, items]) => {
      element.innerHTML += `
        <h2 class="section-title">${escapeHTML(section)}</h2>
      `;

      element.innerHTML += items.map(item => `
        <article class="card">
          <p class="section-label">${escapeHTML(item.section || 'Новини')}</p>
          <h3>${escapeHTML(item.title)}</h3>
          <small>${escapeHTML(item.date)}</small>
          <p>${formatText(item.text)}</p>
        </article>
      `).join('');
    });

  } catch (error) {
    showError(element, error.message);
  }
  if (!document.querySelector('.subnav a.active')) {
  const first = document.querySelector('.subnav a');
  if (first) first.classList.add('active');
}
}

function openLightbox(url, caption) {
  scrollPosition = window.scrollY;

  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.position = 'fixed';

  document.getElementById('lightbox-img').src = url;
  document.getElementById('lightbox-caption').textContent = caption || '';
  document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');

  document.body.style.position = '';
  document.body.style.top = '';

  window.scrollTo(0, scrollPosition);
}

function showPhotoSection(sectionId, event) {
  event.preventDefault();

  const sections = document.querySelectorAll('.photo-section');

  sections.forEach(el => {
    el.style.display = (el.id === sectionId) ? 'block' : 'none';
  });

  // активная вкладка
  document.querySelectorAll('.subnav a').forEach(a => {
    a.classList.remove('active');
  });

  event.target.classList.add('active');
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
          ${(section.images || []).map((image, index) => {
  const url = typeof image === 'string' ? image : image.url;
  const caption = typeof image === 'string' ? '' : image.caption;

  return `
    <div class="photo-item">
      <img 
  src="${escapeHTML(url)}"
  onclick="openLightbox('${escapeHTML(url)}', '${escapeHTML(caption || '')}')"
  style="cursor:pointer"
>
    </div>
  `;
}).join('')}
        </div>
      </section>
    `).join('');
  } catch (error) {
    showError(element, error.message);
  }
  setTimeout(() => {
  const first = document.querySelector('.subnav a');
  if (first) {
    first.click();
  }
}, 0);
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

function renderScheduleList(data) {
  return data.map(item => {
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
        <p class="section-label">${escapeHTML(item.section)}</p>
        <h2>${escapeHTML(item.title || 'Розклад')}</h2>
        <small>${escapeHTML(item.date)}</small>
        ${content}
      </article>
    `;
  }).join('');
}

function showSection(sectionId, event) {
  event.preventDefault();

  const sections = ['classes', 'events', 'tests'];

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = (id === sectionId) ? 'grid' : 'none';
    }
  });

  // активная кнопка
  document.querySelectorAll('.subnav a').forEach(a => {
    a.classList.remove('active');
  });

  event.target.classList.add('active');
}
async function loadSchedule() {
  const classesEl = document.getElementById('classes');
  const eventsEl = document.getElementById('events');
  const testsEl = document.getElementById('tests');

  try {
    const data = await loadJSON('../data/schedule.json');

    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    let filteredData = data.filter(item => {
      if (dateFrom && new Date(item.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(item.date) > new Date(dateTo)) return false;
      return true;
    });

    
    const eventsData = filteredData.filter(i => i.section === 'Заходи');
    const testsData = filteredData.filter(i => i.section === 'Контрольні');

    // Заняття
    loadWeeklySchedule()

    // Заходи
    if (!eventsData.length) {
      eventsEl.innerHTML = '<p class="empty">Немає заходів</p>';
    } else {
      eventsEl.innerHTML = renderScheduleList(eventsData);
    }

    // Контрольні
    if (!testsData.length) {
      testsEl.innerHTML = '<p class="empty">Немає контрольних</p>';
    } else {
      testsEl.innerHTML = renderScheduleList(testsData);
    }

  } catch (error) {
    showError(classesEl, error.message);
    showError(eventsEl, error.message);
    showError(testsEl, error.message);
  }
  showSection('classes', { preventDefault: () => {}, target: document.querySelector('.subnav a') });
}
async function loadWeeklySchedule() {

  const element = document.getElementById('classes');

  try {

    const data = await loadJSON('/data/weekly-schedule.json');

    const grade = document.getElementById('gradeFilter').value;
    const letter = document.getElementById('letterFilter').value;

    let filtered = data;

    if (grade !== 'all') {

      filtered = filtered.filter(item =>
        item.class.startsWith(grade)
      );

    }

    if (letter !== 'all') {

      filtered = filtered.filter(item =>
        item.class.includes(`-${letter}`)
      );

    }

    if (!filtered.length) {

      element.innerHTML =
        '<p class="empty">Розклад не знайдено.</p>';

      return;

    }

    element.innerHTML = filtered.map(item => {

      const daysHTML = Object.entries(item.week)

        .map(([day, lessons]) => {

          const validLessons = lessons.filter(
            lesson => lesson.subject.trim()
          );

          if (!validLessons.length) {
            return '';
          }

          return `

            <div class="schedule-day">

              <h3>${escapeHTML(day)}</h3>

              <table class="schedule-table">

                <thead>
                  <tr>
                    <th>№</th>
                    <th>Предмет</th>
                    <th>Час</th>
                    <th>Кабінет</th>
                    <th>Примітка</th>
                  </tr>
                </thead>

                <tbody>

                  ${validLessons.map(lesson => `

                    <tr>

                      <td>${lesson.lesson}</td>

                      <td>${escapeHTML(lesson.subject)}</td>

                      <td>${escapeHTML(lesson.time)}</td>

                      <td>${escapeHTML(lesson.room)}</td>

                      <td>${escapeHTML(lesson.note || '')}</td>

                    </tr>

                  `).join('')}

                </tbody>

              </table>

            </div>

          `;

        }).join('');

      return `

        <article class="card">

          <h2>${escapeHTML(item.class)}</h2>

          ${daysHTML}

          ${item.general_note
            ? `
              <p class="schedule-note">
                ${escapeHTML(item.general_note)}
              </p>
            `
            : ''
          }

        </article>

      `;

    }).join('');

  } catch (error) {

    showError(element, error.message);

  }
}