const supertest = require('supertest');
const app = require('../app');

const api = supertest(app);

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/);
});

test('the unique identifier property of the blog posts is name id', async () => {
  const response = await api.get('/api/blogs');
  const id = response.body.map((blog) => blog.id);
  np;
  expect(id).toBeDefined();
});
