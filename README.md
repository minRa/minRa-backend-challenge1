# PC Tree API

A REST API for managing PC components in a tree structure. Create nodes, add properties, and query hierarchical data.

## Tech Stack

- Node.js + Express
- Prisma ORM + SQLite
- TypeScript
- Jest for testing

## Quick Start

```bash
npm install
```

Create `.env` file:

```
DATABASE_URL="file:./dev.db"
```

Setup and run:

```bash
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Server runs on `http://localhost:4000`

## API Endpoints

### GET `/subtree?path=/AlphaPC`

Get a node and all its children with properties.

### POST `/node`

Create a new node.

```json
{ "name": "CPU", "parentPath": "/AlphaPC" }
```

### POST `/property`

Add or update a property on a node.

```json
{ "nodePath": "/AlphaPC/CPU", "key": "Temperature", "value": 65.5 }
```

## Testing

```bash
npm test
```

19 tests covering all endpoints and validation.
