import request from 'supertest';
import app from '../app';
import prisma from '../db/prisma';

describe('API Endpoints', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /subtree', () => {
    it('should return 400 when path is missing', async () => {
      const response = await request(app).get('/subtree');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Path required');
    });

    it('should return 404 when node is not found', async () => {
      const response = await request(app).get('/subtree?path=/NonExistentNode');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Node not found');
    });

    it('should return subtree for valid path', async () => {
      const response = await request(app).get('/subtree?path=/AlphaPC');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('path', '/AlphaPC');
      expect(response.body).toHaveProperty('subtree');
      expect(response.body.subtree).toHaveProperty('name', 'AlphaPC');
      expect(response.body.subtree).toHaveProperty('properties');
      expect(response.body.subtree).toHaveProperty('children');
    });

    it('should return subtree with properties for AlphaPC', async () => {
      const response = await request(app).get('/subtree?path=/AlphaPC');

      expect(response.status).toBe(200);
      const subtree = response.body.subtree;

      // Check root properties
      expect(subtree.properties).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'Height', value: 450.0 }),
          expect.objectContaining({ key: 'Width', value: 180.0 }),
        ])
      );

      // Check children exist
      expect(subtree.children).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Processing' }),
          expect.objectContaining({ name: 'Storage' }),
        ])
      );
    });

    it('should return subtree for nested path', async () => {
      const response = await request(app).get(
        '/subtree?path=/AlphaPC/Processing'
      );

      expect(response.status).toBe(200);
      expect(response.body.path).toBe('/AlphaPC/Processing');
      expect(response.body.subtree.name).toBe('Processing');
      expect(response.body.subtree.children).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'CPU' }),
          expect.objectContaining({ name: 'Graphics' }),
        ])
      );
    });

    it('should return leaf node with properties', async () => {
      const response = await request(app).get(
        '/subtree?path=/AlphaPC/Processing/CPU'
      );

      expect(response.status).toBe(200);
      const subtree = response.body.subtree;

      expect(subtree.name).toBe('CPU');
      expect(subtree.properties).toBeInstanceOf(Array);
      expect(subtree.properties.length).toBeGreaterThan(0);

      // Check that required properties exist
      const propertyKeys = subtree.properties.map((p: any) => p.key);
      expect(propertyKeys).toContain('Power');

      expect(subtree.children).toEqual([]);
    });
  });

  describe('POST /node', () => {
    it('should return 400 when name is missing', async () => {
      const response = await request(app).post('/node').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Node name required');
    });

    it('should return 404 when parent path does not exist', async () => {
      const response = await request(app).post('/node').send({
        name: 'TestNode',
        parentPath: '/NonExistent',
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Parent not found');
    });

    it('should create a root node when no parent is specified', async () => {
      const uniqueName = `TestRootNode_${Date.now()}`;
      const response = await request(app).post('/node').send({
        name: uniqueName,
      });

      expect(response.status).toBe(201);
      expect(response.body.node).toHaveProperty('name', uniqueName);
      expect(response.body.node).toHaveProperty('parentId', null);
    });

    it('should create a child node with valid parent path', async () => {
      const uniqueName = `TestChildNode_${Date.now()}`;
      const response = await request(app).post('/node').send({
        name: uniqueName,
        parentPath: '/AlphaPC',
      });

      expect(response.status).toBe(201);
      expect(response.body.node).toHaveProperty('name', uniqueName);
      expect(response.body.node.parentId).not.toBeNull();
    });

    it('should return 409 when creating duplicate node', async () => {
      const uniqueName = `DuplicateTest_${Date.now()}`;

      // First create a node
      await request(app).post('/node').send({
        name: uniqueName,
        parentPath: '/AlphaPC',
      });

      // Try to create the same node again
      const response = await request(app).post('/node').send({
        name: uniqueName,
        parentPath: '/AlphaPC',
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Node already exists');
    });

    it('should allow nodes with same name under different parents', async () => {
      const uniqueName = `SameName_${Date.now()}`;

      const response1 = await request(app).post('/node').send({
        name: uniqueName,
        parentPath: '/AlphaPC/Processing',
      });

      const response2 = await request(app).post('/node').send({
        name: uniqueName,
        parentPath: '/AlphaPC/Storage',
      });

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
    });
  });

  describe('POST /property', () => {
    it('should return 400 when required fields are missing', async () => {
      const response = await request(app).post('/property').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        'nodePath, key, and numeric value required'
      );
    });

    it('should return 400 when value is not a number', async () => {
      const response = await request(app).post('/property').send({
        nodePath: '/AlphaPC',
        key: 'TestKey',
        value: 'not-a-number',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        'nodePath, key, and numeric value required'
      );
    });

    it('should return 404 when node path does not exist', async () => {
      const response = await request(app).post('/property').send({
        nodePath: '/NonExistent',
        key: 'TestKey',
        value: 123.45,
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Node not found');
    });

    it('should create a new property on existing node', async () => {
      const response = await request(app).post('/property').send({
        nodePath: '/AlphaPC',
        key: 'TestProperty',
        value: 99.99,
      });

      expect(response.status).toBe(200);
      expect(response.body.property).toHaveProperty('key', 'TestProperty');
      expect(response.body.property).toHaveProperty('value', 99.99);
    });

    it('should update existing property', async () => {
      // First create a property
      await request(app).post('/property').send({
        nodePath: '/AlphaPC',
        key: 'UpdateTest',
        value: 100.0,
      });

      // Update the same property
      const response = await request(app).post('/property').send({
        nodePath: '/AlphaPC',
        key: 'UpdateTest',
        value: 200.0,
      });

      expect(response.status).toBe(200);
      expect(response.body.property).toHaveProperty('key', 'UpdateTest');
      expect(response.body.property).toHaveProperty('value', 200.0);
    });

    it('should add property to nested node', async () => {
      const response = await request(app).post('/property').send({
        nodePath: '/AlphaPC/Processing/CPU',
        key: 'TestNestedProperty',
        value: 42.5,
      });

      expect(response.status).toBe(200);
      expect(response.body.property).toHaveProperty(
        'key',
        'TestNestedProperty'
      );
      expect(response.body.property).toHaveProperty('value', 42.5);
    });

    it('should handle decimal values correctly', async () => {
      const response = await request(app).post('/property').send({
        nodePath: '/AlphaPC',
        key: 'DecimalTest',
        value: 123.456789,
      });

      expect(response.status).toBe(200);
      expect(response.body.property).toHaveProperty('value', 123.456789);
    });
  });
});
