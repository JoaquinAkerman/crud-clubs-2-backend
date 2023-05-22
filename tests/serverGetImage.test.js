const request = require('supertest');
const http = require('http');
const app = require('../server');

let server;

beforeAll((done) => {
  server = http.createServer(app);
  // eslint-disable-next-line consistent-return
  server.listen(4000, (err) => {
    if (err) return done(err);
    done();
  });
});

afterAll((done) => {
  server.close(done);
});
jest.setTimeout(10000);

describe('GET clubs/public/static/images/57.png', () => {
  it('should return the file with the given filename', async () => {
    const filename = '57.png';
    const response = await request(app).get(
      `/clubs/public/static/images/${filename}`,
    );

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.body).toBeDefined();
  });

  it('should return an error if the file does not exist', async () => {
    const filename = 'nonexistent.png';
    const response = await request(app).get(
      `/clubs/public/static/images/${filename}`,
    );
    expect(response.status).toBe(404);
  });
});
