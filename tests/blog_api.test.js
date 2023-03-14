const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')
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

      await api
        .post('/api/blogs')
        .send(noTitleBlog)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      const noUrlBlog = {
        title: 'I want to die',
        author: 'Seviche',
        likes: 3,
      }

      await api
        .post('/api/blogs')
        .send(noUrlBlog)
        .expect(400)
        .expect('Content-Type', /application\/json/)

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

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('secert', 10)
    const user = new User({
      username: 'root',
      passwordHash,
    })
    await user.save()
  })

  test('users are returned as json', async () => {
    await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('creation succeeds with a fresh username', async () => {
    const userAtStart = await helper.usersInDb()

    const newUser = {
      username: 'Seviche',
      name: 'Seviche CC',
      password: 'okbyby',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const userAtEnd = await helper.usersInDb()
    expect(userAtEnd).toHaveLength(userAtStart.length + 1)

    const username = userAtEnd.map((u) => u.username)
    expect(username).toContain(newUser.username)
  })

  test('creation fails with proper status code and message if username already taken', async () => {
    const userAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'okeyyyy',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('expected `username` to be unique')

    const userAtEnd = await helper.usersInDb()
    expect(userAtEnd).toHaveLength(userAtStart.length)
  })

  test('password and username must be at least 3 characters long', async () => {
    const usersAtStart = await helper.usersInDb()

    const invalidPasswordUser = {
      username: 'just',
      name: 'Superuser',
      password: 'oo',
    }

    const result1 = await api
      .post('/api/users')
      .send(invalidPasswordUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result1.body.error).toContain(
      'password must be at least 3 characters long'
    )

    const invalidUserNameUser = {
      username: 'ju',
      name: 'Superuser',
      password: 'oorrrr',
    }

    const result2 = await api
      .post('/api/users')
      .send(invalidUserNameUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result2.body.error).toContain(
      'username must be at least 3 characters long'
    )

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

afterAll(async () => await mongoose.connection.close())
