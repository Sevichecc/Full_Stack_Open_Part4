const _ = require('lodash');

const dummy = (blogs) => 1;

const totalLikes = (blogs) => blogs.reduce((sum, blog) => sum + blog.likes, 0);

const favoriteBlog = (blogs) => {
  const mostLiked = blogs.reduce((tmp, blog) => {
    return tmp.likes > blog.likes ? tmp : blog;
  }, blogs[0].likes);

  return {
    title: mostLiked.title,
    author: mostLiked.author,
    likes: mostLiked.likes,
  };
};

const mostBlogs = (blogs) => {
  const authorCount = _(blogs)
    .groupBy('author')
    .mapValues((v) => v.length)
    .value();

  const topAuthor = _.maxBy(
    _.keys(authorCount),
    (author) => authorCount[author]
  );
  return {
    author: topAuthor,
    blogs: authorCount[topAuthor],
  };
};

const mostLikes = (blogs) => {
  const likesByAuthor = _.reduce(
    blogs,
    (result, value) => {
      result[value.author] = (result[value.author] || 0) + value.likes;
      return result;
    },
    {}
  );

  const topAuthor = _.maxBy(
    _.keys(likesByAuthor),
    (author) => likesByAuthor[author]
  );

  return {
    author: topAuthor,
    likes: likesByAuthor[topAuthor],
  };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
