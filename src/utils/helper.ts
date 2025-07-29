import prisma from '../db/prisma';
import { Node } from '@prisma/client';

export interface NodeWithSubtree {
  id: number;
  name: string;
  parentId: number | null;
  properties: Array<{
    id: number;
    key: string;
    value: number;
  }>;
  children: NodeWithSubtree[];
}

// Find node by path (e.g., "/AlphaPC/Processing/CPU")
export const findNodeByPath = async (path: string): Promise<Node | null> => {
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
      return null;
    }

    current = found;
  }

  return current;
};

// Recursive function to build complete subtree
export const buildSubtree = async (
  nodeId: number
): Promise<NodeWithSubtree | null> => {
  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    include: {
      properties: true,
      children: true,
    },
  });

  if (!node) return null;

  const children = await Promise.all(
    node.children.map(async (child) => {
      const subtree = await buildSubtree(child.id);
      return subtree;
    })
  );

  return {
    id: node.id,
    name: node.name,
    parentId: node.parentId,
    properties: node.properties,
    children: children.filter(
      (child): child is NodeWithSubtree => child !== null
    ),
  };
};
