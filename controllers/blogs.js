const blogsRouter = require("express").Router();
const { response } = require("../app");
const Blog = require("../models/blog");

// blogsRouter.get("/", (request, response) => {
//   Blog.find({}).then((blogs) => {
//     response.json(blogs);
//   });
// });

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({});
  response.json(blogs);
});

// blogsRouter.post("/", (request, response, next) => {
//   const blog = new Blog(request.body);

//   blog
//     .save()
//     .then((result) => {
//       response.status(201).json(result);
//     })
//     .catch((error) => next(error));
// });

blogsRouter.delete("/:id", async (request, response) => {
  await Blog.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

blogsRouter.post("/", async (request, response) => {
  const body = request.body;
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
  });
  const savedBlog = await blog.save();
  response.status(201).json(savedBlog);
});

blogsRouter.put("/:id", async (request, response) => {
  const body = request.body;

  // Create an object with the fields to be updated
  const blogUpdate = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id,
    blogUpdate,
    { new: true }
  );

  if (updatedBlog) {
    response.json(updatedBlog);
  } else {
    // Handle the case where the blog with the given id was not found
    response.status(404).end();
  }
});

module.exports = blogsRouter;
