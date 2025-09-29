const request = require('supertest');

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

function loadApp() {

  jest.resetModules();
  return require('./server');
}

describe('Testes extras para aumentar cobertura', () => {
  afterEach(() => {

    if (typeof global.fetchRestore === 'function') {
      global.fetchRestore();
      global.fetchRestore = undefined;
    }
  });

  test('certificado disponível retorna arquivo (Buffer) 200/201', async () => {
    const app = loadApp();

    await request(app).post('/api/reset');

    await request(app)
      .post('/api/progress/update')
      .send({ challenge: 'testes-automatizados', stats: { commits: 5, testsRun: 10 } })
      .set('Content-Type', 'application/json')
      .expect(200);

    const res = await request(app).get('/api/certificate/fabio');
    expect([200, 201]).toContain(res.statusCode);
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('check-github-status (OK): deve retornar 200 com repository/webhook', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        full_name: 'Manoel/LINUXtips-github-actions',
        hooks_url: 'https://api.github.com/repos/Manoel/LINUXtips-github-actions/hooks',
      }),
    }));
    global.fetchRestore = () => { global.fetch = originalFetch; };

    const app = loadApp();

    await request(app).post('/api/reset');

    const res = await request(app)
      .post('/api/check-github-status')
      .send({ repository: 'LINUXtips-github-actions', username: 'Manoel' })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('repository');
    expect(res.body).toHaveProperty('webhook');
  });

  test('check-github-status (exceção): deve retornar 500/502', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('boom'));
    global.fetchRestore = () => { global.fetch = originalFetch; };

    const app = loadApp();

    await request(app).post('/api/reset');

    const res = await request(app)
      .post('/api/check-github-status')
      .send({ repository: 'LINUXtips-github-actions', username: 'Manoel' })
      .set('Content-Type', 'application/json');

    expect([500, 502]).toContain(res.statusCode);
  });

  test('método não permitido em /api/progress/update deve retornar 404/405', async () => {
    const app = loadApp();

    await request(app).post('/api/reset');

    const res = await request(app).put('/api/progress/update');
    expect([404, 405]).toContain(res.statusCode);
  });
});
