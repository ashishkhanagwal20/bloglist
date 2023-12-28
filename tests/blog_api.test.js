const supertest = require("supertest");
const mongoose = require("mongoose");

const helper = require("./test_helper");
const app = require("../app");
const api = supertest(app);
const Blog = require("../models/blog");

beforeEach(async () => {
  await Blog.deleteMany({});
  const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog));
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

test("Blogs are returned as json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
}, 10000);

test("all blogs are returned", async () => {
  const response = await api.get("/api/blogs");
  expect(response.body).toHaveLength(helper.initialBlogs.length);
});

test("a specific blog is within the returned blogs", async () => {
  const response = await api.get("/api/blogs");
  const contents = response.body.map((b) => b.title);
  expect(contents).toContain("Canonical string reduction");
});

// test("a valid blog can be added", async () => {
//   const newBlog = {
//     title: "My Second blog",
//     author: "Ashish",
//     url: "www.mySecondBlog.com",
//     likes: 199,
//   };

// });

test("blogs includes id property", async () => {
  const blogPost = {
    title: "My Test blog",
    author: "ashishtest",
    url: "www.testblog.com",
    likes: 10,
  };

  const response = await api.post("/api/blogs").send(blogPost);

  // Ensure that the 'id' property is defined in the JSON representation
  expect(response.body.id).toBeDefined();
});

test("a valid blog can be added", async () => {
  const blogPost = {
    title: "My Test blog",
    author: "ashishtest",
    url: "www.testblog.com",
    likes: 10,
  };

  await api
    .post("/api/blogs")
    .send(blogPost)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const blogsAtEnd = await helper.blogsInDb();
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

  const title = blogsAtEnd.map((t) => t.title);
  expect(title).toContain("My Test blog");
});

test("blog without title or url is not added", async () => {
  const newBlog = {
    author: "Ashish",
    likes: 45,
  };

  await api.post("/api/blogs").send(newBlog).expect(400);

  const blogsAtEnd = await helper.blogsInDb();

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
}, 5000);

describe("deletion of a blog", () => {
  test("succeeds with status code 204 if id is valid", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1);

    const contents = blogsAtEnd.map((r) => r.title);

    expect(contents).not.toContain(blogToDelete.title);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
