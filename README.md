# Південноукраїнський ліцей №3

Простий статичний сайт із розділами:

- Новини
- Фотографії
- Розклад

Дані зберігаються в папці `data`:

- `data/news.json`
- `data/photos.json`
- `data/schedule.json`

## Фотографії Cloudinary

Фотографії додаються в `data/photos.json` як прямі посилання Cloudinary:

```json
[
  {
    "section": "Заходи",
    "title": "День знань",
    "images": [
      "https://res.cloudinary.com/cloud-name/image/upload/file-1.jpg",
      "https://res.cloudinary.com/cloud-name/image/upload/file-2.jpg"
    ]
  }
]
```

Детальна інструкція: [CLOUDINARY.md](CLOUDINARY.md).

## Адмінка

Адмінка знаходиться за адресою `admin/index.html`.

Вона готує матеріали та завантажує окремі файли:

- `news.json`
- `photos.json`
- `schedule.json`

Після завантаження потрібно замінити відповідний файл у папці `data` та опублікувати зміни на GitHub.

Інструкція для передачі JSON-файлів на GitHub: [GITHUB_JSON.md](GITHUB_JSON.md).

Поточний пароль у `js/admin.js`:

```js
const ADMIN_PASSWORD = '12345';
```

Це не справжній захист, а лише простий вхід для статичного сайту. Для справжнього захисту потрібна серверна частина або авторизація через GitHub/API.

## Публікація на GitHub Pages

1. Створити репозиторій на своєму GitHub.
2. Завантажити в нього всі файли проєкту.
3. Відкрити `Settings` -> `Pages`.
4. Увімкнути публікацію з гілки `main`, папка `/root`.
5. Перевірити посилання GitHub Pages.
6. Після перевірки передати репозиторій користувачу через `Settings` -> `General` -> `Transfer ownership`.
