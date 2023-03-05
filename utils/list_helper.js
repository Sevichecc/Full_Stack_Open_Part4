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

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
};
