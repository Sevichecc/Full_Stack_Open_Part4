const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const { body } = request

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
  })

  const saveBlog = await blog.save()
  response.status(201).json(saveBlog)
})

blogsRouter.delete('/:id', async (requset, response) => {
  await Blog.findByIdAndRemove(requset.params.id)
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const { body } = request

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  }

  Blog.findOneAndUpdate(request.params.id, blog, { new: true })
    .then((updatedBlog) => response.json(updatedBlog))
    .catch((error) => next(error))
})

module.exports = blogsRouter
