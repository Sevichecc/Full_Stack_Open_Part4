const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

const {
  initialUsers,
  initialBlogs,
  blogsInDb,
  usersInDb,
} = require('./test_helper')

let headers

describe('blogs api', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const user = initialUsers[0]
    await api.post('/api/users').send(user)

    const loginUser = await api.post('/api/login').send(user)
    headers = { Authorization: `Bearer ${loginUser.body.token}` }
  })

  describe('when there is initially some blogs saved', () => {
    beforeEach(async () => {
      await Blog.deleteMany({})
      await Blog.insertMany(initialBlogs)
    })

    test('blogs are returned as json', async () => {
      const response = await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)

      expect(response.body).toHaveLength(initialBlogs.length)
    })

    test('a blogs has field id', async () => {
      const response = await api.get('/api/blogs')
      const id = response.body.map((blog) => blog.id)
      expect(id).toBeDefined()
    })

    test('a blog can be edited', async () => {
      const [blogBefore] = await blogsInDb()
      const modifiedBlog = { ...blogBefore, title: 'Goto considered useful' }

      await api
        .put(`/api/blogs/${blogBefore.id}`)
        .send(modifiedBlog)
        .expect(200)

      const blogs = await blogsInDb()

      const titles = blogs.map((r) => r.title)

      expect(titles).toContain(modifiedBlog.title)
    })
    describe('addition of a new blog', () => {
      test('succeeds with a valid id and token', async () => {
        const newBlog = {
          title: 'I want to die',
          author: 'Seviche',
          url: 'http://seviche.cc',
          likes: 3,
        }

        await api
          .post('/api/blogs')
          .set(headers)
          .send(newBlog)
          .expect(201)
          .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await blogsInDb()
        expect(blogsAtEnd).toHaveLength(initialBlogs.length + 1)

        const title = blogsAtEnd.map((blog) => blog.title)
        expect(title).toContain('I want to die')
      })

      test('failed with statu code 401 Unauthorized if a token is not provided', async () => {
        const newBlog = {
          title: 'I want to die',
          author: 'Seviche',
          url: 'http://seviche.cc',
          likes: 3,
        }

        await api.post('/api/blogs').send(newBlog).expect(401)

        const blogsAtEnd = await blogsInDb()
        expect(blogsAtEnd).toHaveLength(initialBlogs.length)
      })

      test('blog missing likes will set to default value as 0', async () => {
        const newBlog = {
          title: 'I want to die',
          author: 'Seviche',
          url: 'http://seviche.cc',
        }

        const response = await api
          .post('/api/blogs')
          .set(headers)
          .send(newBlog)
          .expect(201)

        expect(response.body.likes).toBe(0)

        const blogsAtEnd = await blogsInDb()
        expect(blogsAtEnd).toHaveLength(initialBlogs.length + 1)
      })

      test('blog without title or url is not be added', async () => {
        const noTitleBlog = {
          author: 'Seviche',
          url: 'http://seviche.cc',
          likes: 3,
        }

        await api
          .post('/api/blogs')
          .set(headers)
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
          .set(headers)
          .send(noUrlBlog)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await blogsInDb()
        expect(blogsAtEnd).toHaveLength(initialBlogs.length)
      })
    })
  })
  describe('a blog', () => {
    let id

    beforeEach(async () => {
      await Blog.deleteMany({})
      const blog = {
        title: 'React patterns',
        author: 'Michael Chan',
        url: 'https://reactpatterns.com/',
        likes: 7,
      }
      const response = await api.post('/api/blogs').set(headers).send(blog)
      id = response.body.id
    })

    test('can be deleted by the creator', async () => {
      const blogsBefore = await blogsInDb()
      await api.delete(`/api/blogs/${id}`).set(headers).expect(204)
      const blogsAfter = await blogsInDb()
      expect(blogsAfter).toHaveLength(blogsBefore.length - 1)
    })

    test('can not be deleted without valid auth header', async () => {
      const blogsBefore = await blogsInDb()

      await api.delete(`/api/blogs/${id}`).expect(401)

      const blogsAfter = await blogsInDb()

      expect(blogsAfter).toHaveLength(blogsBefore.length)
    })
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
    const userAtStart = await usersInDb()

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

    const userAtEnd = await usersInDb()
    expect(userAtEnd).toHaveLength(userAtStart.length + 1)

    const username = userAtEnd.map((u) => u.username)
    expect(username).toContain(newUser.username)
  })

  test('creation fails with proper status code and message if username already taken', async () => {
    const userAtStart = await usersInDb()

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

    const userAtEnd = await usersInDb()
    expect(userAtEnd).toHaveLength(userAtStart.length)
  })

  test('password and username must be at least 3 characters long', async () => {
    const usersAtStart = await usersInDb()

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

    const usersAtEnd = await usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('password is required', async () => {
    const usersAtStart = await usersInDb()
    const newUser = {
      username: 'juui',
      name: 'Superuser',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('password is required')

    const usersAtEnd = await usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

afterAll(async () => await mongoose.connection.close())
