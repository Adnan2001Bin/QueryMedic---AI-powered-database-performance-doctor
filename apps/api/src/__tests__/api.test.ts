import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { createMockPrisma } from './mockPrisma.js';

describe('QueryMedic API - Phase 1 Integration Tests', () => {
  let app: FastifyInstance;
  const mockPrisma = createMockPrisma();

  beforeAll(async () => {
    app = await buildApp({
      prisma: mockPrisma,
    });
    await app.ready();
  });

  it('GET /health - returns healthy status and uptime', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('querymedic-api');
    expect(typeof body.uptimeSec).toBe('number');
  });

  describe('Authentication & Multi-Tenant Organization Flow', () => {
    let userToken: string;
    let userId: string;
    let orgId: string;

    it('POST /api/auth/register - registers user and auto-creates default workspace', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'founder@acme.com',
          name: 'Jane Doe',
          password: 'Password123!',
          organizationName: 'Acme SaaS Corp',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.token).toBeDefined();
      expect(body.user.email).toBe('founder@acme.com');
      expect(body.user.organizations.length).toBe(1);
      expect(body.user.organizations[0].name).toBe('Acme SaaS Corp');
      expect(body.user.organizations[0].role).toBe('ADMIN');

      userToken = body.token;
      userId = body.user.id;
      orgId = body.user.organizations[0].id;
    });

    it('POST /api/auth/login - authenticates registered user and issues valid JWT', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'founder@acme.com',
          password: 'Password123!',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.token).toBeDefined();
      expect(body.user.email).toBe('founder@acme.com');
    });

    it('POST /api/auth/login - rejects invalid credentials', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'founder@acme.com',
          password: 'WrongPassword!',
        },
      });

      expect(res.statusCode).toBe(401);
    });

    it('GET /api/auth/me - returns user profile with valid JWT', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.user.id).toBe(userId);
      expect(body.user.email).toBe('founder@acme.com');
    });

    it('GET /api/auth/me - rejects unauthorized request without token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
      });

      expect(res.statusCode).toBe(401);
    });

    describe('Tenant Isolation & RBAC Checks', () => {
      let developerToken: string;
      let developerId: string;

      it('registers a second user (developer)', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/auth/register',
          payload: {
            email: 'dev@external.com',
            name: 'External Dev',
            password: 'Password123!',
          },
        });

        expect(res.statusCode).toBe(201);
        developerToken = res.json().token;
        developerId = res.json().user.id;
      });

      it('prevents external user from accessing Acme Org without membership (Tenant Isolation)', async () => {
        const res = await app.inject({
          method: 'GET',
          url: `/api/organizations/${orgId}`,
          headers: {
            authorization: `Bearer ${developerToken}`,
          },
        });

        expect(res.statusCode).toBe(404);
      });

      it('allows Admin to add developer to Acme Org with VIEWER role', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/organizations/${orgId}/members`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            email: 'dev@external.com',
            role: 'VIEWER',
          },
        });

        expect(res.statusCode).toBe(201);
        expect(res.json().member.userId).toBe(developerId);
        expect(res.json().member.role).toBe('VIEWER');
      });

      it('now allows developer to access Acme Org as VIEWER', async () => {
        const res = await app.inject({
          method: 'GET',
          url: `/api/organizations/${orgId}`,
          headers: {
            authorization: `Bearer ${developerToken}`,
          },
        });

        expect(res.statusCode).toBe(200);
        expect(res.json().organization.id).toBe(orgId);
        expect(res.json().userRole).toBe('VIEWER');
      });

      it('prevents VIEWER from adding another member (RBAC enforcement)', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/organizations/${orgId}/members`,
          headers: {
            authorization: `Bearer ${developerToken}`,
          },
          payload: {
            email: 'another@dev.com',
            role: 'ENGINEER',
          },
        });

        expect(res.statusCode).toBe(403);
      });
    });
  });
});
