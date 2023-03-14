const { default: mongoose } = require('mongoose')
const supertest = require('supertest')

const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')
const helper = require('./test_helper')

describe('when there is initially some blogs saved', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
  })

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('the unique identifier property of the blog posts is name id', async () => {
    const response = await api.get('/api/blogs')
    const id = response.body.map((blog) => blog.id)
    expect(id).toBeDefined()
  })

  describe('addition of a new blog', () => {
    test('succeeds with a valid id', async () => {
      const newBlog = {
        title: 'I want to die',
        author: 'Seviche',
        url: 'http://seviche.cc',
        likes: 3,
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

      const title = blogsAtEnd.map((blog) => blog.title)
      expect(title).toContain('I want to die')
    })

    test('blog missing likes will set to default value as 0', async () => {
      const newBlog = {
        title: 'I want to die',
        author: 'Seviche',
        url: 'http://seviche.cc',
      }

      const response = await api.post('/api/blogs').send(newBlog).expect(201)

      expect(response.body.likes).toBe(0)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
    })

    test('blog without title or url is not be added', async () => {
      const noTitleBlog = {
        author: 'Seviche',
        url: 'http://seviche.cc',
        likes: 3,
      }

      await api.post('/api/blogs').send(noTitleBlog).expect(400)

      const noUrlBlog = {
        title: 'I want to die',
        author: 'Seviche',
        likes: 3,
      }

      await api.post('/api/blogs').send(noUrlBlog).expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })
  })

  describe('deletion of a blog', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const blogAtStart = await helper.blogsInDb()
      const blogToDelete = blogAtStart[0]

      await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

      const blogAtEnd = await helper.blogsInDb()
      expect(blogAtEnd).toHaveLength(helper.initialBlogs.length - 1)

      const title = blogAtEnd.map((blog) => blog.title)
      expect(title).not.toContain(blogToDelete.title)
    })
  })

  test('updating the information of an individual blog post', async () => {
    const blogAtStart = await helper.blogsInDb()
    const blogToUpdate = { ...blogAtStart[0], likes: 999 }

    const updatedBlog = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogToUpdate)
      .expect(200)

    expect(updatedBlog.body.likes).toBe(999)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
