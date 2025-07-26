import prisma from '../db/prisma';

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
