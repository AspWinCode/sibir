# Сибирь — веб-сервис сбора и приёма дикоросов

Монорепозиторий: GraphQL backend (Node.js + Prisma + PostgreSQL), админ-панель (React) и PWA для ролей Сборщик/Заготовитель.

## Структура

```
apps/
  server/    — GraphQL API (graphql-yoga) + Prisma + PostgreSQL
  admin/     — админ-панель на React (в разработке)
  web-app/   — PWA для Сборщика и Заготовителя (в разработке)
packages/
  shared/    — общие типы и константы (в разработке)
materials/   — исходные материалы заказчика (ТЗ, макеты, иконки)
```

## Локальная разработка

Требуется PostgreSQL (локально или в Docker) и Node.js 18+.

```bash
cp apps/server/.env.example apps/server/.env
# отредактируйте DATABASE_URL под вашу локальную БД
npm install
npm run prisma:migrate --workspace=apps/server
npm run prisma:seed --workspace=apps/server
npm run dev:server
```

GraphQL playground: http://localhost:4000/graphql

## Внешние интеграции

Без ключей всё работает в dev-режиме с заглушками:

| Сервис | Переменная в `.env` | Без ключа |
|---|---|---|
| Google Maps | `GOOGLE_MAPS_API_KEY` | карта не грузится, нужен ключ |
| SMS-провайдер | `SMS_PROVIDER_API_KEY`, `SMS_PROVIDER_URL` | код авторизации пишется в консоль сервера |
| Dadata | `DADATA_API_KEY` | автоподсказки адреса выключены, обычное текстовое поле |
| Приём платежей | `PAYMENT_PROVIDER=stub` | сделка помечается оплаченной без реального списания (`src/lib/payment.ts`) |

## Деплой на VPS

Код доставляется через git push в bare-репозиторий на сервере; post-receive хук сам собирает и перезапускает сервис:

```bash
git remote add vps ssh://root@<host>/opt/sibir/repo.git
git push vps main
```

Хук (`/opt/sibir/repo.git/hooks/post-receive`) выполняет: checkout → `npm install` → сборка `apps/server` → `prisma migrate deploy` → перезапуск через `pm2`.

На сервере используется собственная копия Node.js 22 в `/opt/sibir/.nodejs` (чтобы не менять системный Node.js, используемый другими проектами на этом VPS), и изолированный docker-compose-проект `sibir` для PostgreSQL, слушающий только `127.0.0.1:5433`.
