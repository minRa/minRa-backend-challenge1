import express from 'express';
import { Node } from '@prisma/client';
import { buildSubtree } from './utils/helper';
import prisma from './db/prisma';

const app = express();
app.use(express.json());

app.get('/', (_, res) => {
  res.send('Backend Challenge API');
});

// GET /subtree?path=/AlphaPC - Get node tree
app.get('/subtree', async (req, res) => {
  try {
    const path = req.query.path as string;

    if (!path) {
      return res.status(400).json({ error: 'Path required' });
    }

    const segments = path.split('/').filter(Boolean);
    let current: Node | null = null;

    for (const segment of segments) {
      const found: Node | null = await prisma.node.findFirst({
        where: {
          name: segment,
          parentId: current ? current.id : null,
        },
      });

      if (!found) {
        return res.status(404).json({ error: 'Node not found' });
      }

      current = found;
    }

    if (!current) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const subtree = await buildSubtree(current.id);

    res.json({ path, subtree });
  } catch (error) {
    console.error('Error in /subtree:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default app;
