import express from 'express';
import { buildSubtree, findNodeByPath } from './utils/helper';
import prisma from './db/prisma';

const app = express();
app.use(express.json());

app.get('/', (_, res) => {
  res.send('Backend Challenge API');
});

// GET /subtree?path=/AlphaPC - Get node tree
app.get('/subtree', async (req, res) => {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Path required' });
    }

    const node = await findNodeByPath(path as string);
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const subtree = await buildSubtree(node.id);
    res.json({ path, subtree });
  } catch (error) {
    console.error('Error in /subtree:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /node - Create a node with specified parent
app.post('/node', async (req, res) => {
  try {
    const { name, parentPath } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Node name required' });
    }

    let parentId = null;
    if (parentPath) {
      const parent = await findNodeByPath(parentPath);
      if (!parent) {
        return res.status(404).json({ error: 'Parent not found' });
      }
      parentId = parent.id;
    }

    // Check for duplicate
    const existing = await prisma.node.findFirst({
      where: { name, parentId },
    });

    if (existing) {
      return res.status(409).json({ error: 'Node already exists' });
    }

    const node = await prisma.node.create({
      data: { name, parentId },
    });

    res.status(201).json({ node });
  } catch (error) {
    console.error('Error in POST /node:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /property - Add a property to an existing node
app.post('/property', async (req, res) => {
  try {
    const { nodePath, key, value } = req.body;

    if (!nodePath || !key || typeof value !== 'number') {
      return res
        .status(400)
        .json({ error: 'nodePath, key, and numeric value required' });
    }

    const node = await findNodeByPath(nodePath);
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Find existing property or create new one
    const existing = await prisma.property.findFirst({
      where: { nodeId: node.id, key },
    });

    const property = existing
      ? await prisma.property.update({
          where: { id: existing.id },
          data: { value },
        })
      : await prisma.property.create({ data: { key, value, nodeId: node.id } });

    res.json({ property });
  } catch (error) {
    console.error('Error in POST /property:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default app;
