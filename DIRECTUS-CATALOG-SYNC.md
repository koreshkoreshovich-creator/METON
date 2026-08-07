# Синхронізація каталогу METON з Directus

Скрипт `tools/directus/sync-catalog.mjs` порівнює `catalog-data.json` з колекцією
`products` у Directus. Він оновлює наявні записи та створює тільки відсутні.

## Безпечна перевірка без запису

У терміналі VPS:

```bash
cd /opt/meton-directus
export DIRECTUS_URL="https://cms.metongroup.com"
export DIRECTUS_ADMIN_EMAIL="ваша-пошта"
read -s -p "Directus password: " DIRECTUS_ADMIN_PASSWORD
export DIRECTUS_ADMIN_PASSWORD
node /шлях/до/METON/tools/directus/sync-catalog.mjs
```

Скрипт покаже кількість наявних, відсутніх і майбутніх оновлень, але нічого не
змінить.

## Застосування

Після перевірки запустіть ту саму команду з `--apply`:

```bash
node /шлях/до/METON/tools/directus/sync-catalog.mjs --apply
```

Пароль не записується у файл або Git. Після завершення можна очистити змінні:

```bash
unset DIRECTUS_ADMIN_EMAIL DIRECTUS_ADMIN_PASSWORD
```
