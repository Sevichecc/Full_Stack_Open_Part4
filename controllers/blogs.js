const blogsRouter = require('express').Router()

const { response } = require('../app')
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
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

module.exports = blogsRouter
