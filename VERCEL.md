# Налаштування Vercel API для запису JSON на GitHub

Ця інструкція пояснює, як зробити так, щоб адмінка сайту могла відправляти `news.json`, `photos.json` і `schedule.json` прямо на GitHub.

## 1. Що вже додано в проєкт

У проєкті є serverless function:

```text
api/update-json.js
```

Вона працює на Vercel за адресою:

```text
https://your-site.vercel.app/api/update-json
```

Адмінка надсилає туди JSON, а Vercel API записує файл у GitHub-репозиторій.

## 2. Створіть GitHub token

1. Відкрийте GitHub.
2. Перейдіть у `Settings` -> `Developer settings` -> `Personal access tokens` -> `Fine-grained tokens`.
3. Натисніть `Generate new token`.
4. Виберіть тільки репозиторій:

```text
ksergv/litsey
```

5. У правах дайте:

```text
Contents: Read and write
```

6. Створіть token і скопіюйте його.

Не вставляйте цей token у файли сайту або в `admin.js`.

## 3. Підключіть репозиторій до Vercel

1. Відкрийте `https://vercel.com`.
2. Увійдіть через GitHub.
3. Натисніть `Add New` -> `Project`.
4. Виберіть репозиторій:

```text
ksergv/litsey
```

5. Натисніть `Deploy`.

Для цього сайту не потрібні build-команди. Vercel сам опублікує статичні файли і папку `api`.

## 4. Додайте Environment Variables у Vercel

У Vercel відкрийте проєкт:

```text
Settings -> Environment Variables
```

Додайте змінні:

```text
GITHUB_TOKEN=ваш_github_token
GITHUB_OWNER=ksergv
GITHUB_REPO=litsey
GITHUB_BRANCH=main
ADMIN_API_KEY=придумайте_довгий_секретний_ключ
```

Приклад `ADMIN_API_KEY`:

```text
litsey-admin-2026-long-secret-key
```

Після додавання змінних зробіть redeploy проєкту у Vercel.

## 5. Як користуватися в адмінці

1. Відкрийте адмінку на Vercel:

```text
https://your-site.vercel.app/admin/index.html
```

2. Увійдіть у адмінку.
3. Додайте або видаліть записи.
4. Унизу сторінки знайдіть блок `Збереження`.
5. У поле `Ключ адміністратора Vercel API` введіть значення `ADMIN_API_KEY`.
6. Натисніть:
   - `Відправити news.json`;
   - `Відправити photos.json`;
   - `Відправити schedule.json`;
   - або `Відправити все`.

Після цього Vercel API зробить commit у GitHub.

## 6. Якщо адмінка відкрита локально

Якщо адмінка відкрита з локального сервера:

```text
http://127.0.0.1:8000/admin/index.html
```

у поле `Адреса API, якщо адмінка відкрита локально` вставте повну адресу Vercel API:

```text
https://your-site.vercel.app/api/update-json
```

Потім введіть `ADMIN_API_KEY` і натисніть потрібну кнопку відправки.

## 7. Важливо

- GitHub token зберігається тільки у Vercel Environment Variables.
- У браузер вводиться лише `ADMIN_API_KEY`, а не GitHub token.
- Після відправки JSON GitHub Pages або Vercel можуть оновлювати сайт кілька хвилин.
- Якщо GitHub token змінено або видалено, потрібно оновити `GITHUB_TOKEN` у Vercel і зробити redeploy.
- Якщо API повертає помилку `Неправильний ключ адміністратора`, перевірте `ADMIN_API_KEY`.
