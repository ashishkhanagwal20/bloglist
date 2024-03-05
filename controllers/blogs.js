const blogsRouter = require("express").Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Blog = require("../models/blog");
const User = require("../models/user");
const { isValidObjectId } = require("mongoose");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  response.json(blogs);
});

blogsRouter.delete("/:id", async (request, response) => {
  const blog = await Blog.findByIdAndDelete(request.params.id);
  const user = request.user;
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (blog.user.toString() !== decodedToken.id) {
    return response
      .status(403)
      .json({ error: "Permission denied: You can only delete your own blogs" });
  }
  await Blog.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

blogsRouter.post("/", async (request, response) => {
  const body = request.body;
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: "token invalid" });
  }
  const user = request.user;

  const blog = new Blog({
    title: body.title,
    content: body.content,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user.id,
  });
  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();
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

blogsRouter.put("/:id/like", async (request, response) => {
  try {
    const blogId = request.params.id;

    // Validate if blogId is a valid ObjectId
    if (!isValidObjectId(blogId)) {
      return response.status(400).json({ error: "Invalid blog ID" });
    }

    // Find the blog by ID and increment the likes field
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      { $inc: { likes: 1 } }, // Increment the likes by 1
      { new: true } // Return the updated document
    );

    if (!updatedBlog) {
      return response.status(404).json({ error: "Blog not found" });
    }

    response.json(updatedBlog);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = blogsRouter;
