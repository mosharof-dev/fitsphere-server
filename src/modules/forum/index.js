const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collections
const forumCollection = db.collection("forum");
const forumVotesCollection = db.collection("forumVotes");
const usersCollection = db.collection("user");

// Create a new forum post
router.post("/", async (req, res) => {
  try {
    const { title, image, description, authorId, authorName, authorEmail, authorImage, authorRole } = req.body;

    if (!title || !description || !authorId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user is blocked
    const user = await usersCollection.findOne({ _id: new ObjectId(authorId) });
    if (user && user.status === "blocked") {
      return res.status(403).json({ error: "Action restricted by Admin. You are blocked." });
    }

    const newPost = {
      title,
      image: image || "",
      description,
      authorId: new ObjectId(authorId),
      authorName,
      authorEmail,
      authorImage: authorImage || "",
      authorRole,
      likeCount: 0,
      dislikeCount: 0,
      commentCount: 0,
      createdAt: new Date(),
    };

    const result = await forumCollection.insertOne(newPost);
    res.status(201).json({ ...newPost, _id: result.insertedId });
  } catch (error) {
    console.error("Error creating forum post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all forum posts (with pagination)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const posts = await forumCollection
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPosts = await forumCollection.countDocuments({});

    res.status(200).json({
      posts,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching forum posts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get posts for a specific user (My Posts)
// Note: In production, the userId should come from the decoded JWT token.
// For now, we will pass it as a query parameter or extract it if provided.
router.get("/my-posts", async (req, res) => {
  try {
    const { userId } = req.query; // Fallback, normally from req.user
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const posts = await forumCollection
      .find({ authorId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching user's forum posts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a single post by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const post = await forumCollection.findOne({ _id: new ObjectId(id) });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a post
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const result = await forumCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Also delete associated comments and votes
    await db.collection("forumComments").deleteMany({ postId: new ObjectId(id) });
    await db.collection("forumVotes").deleteMany({ postId: new ObjectId(id) });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Upvote / Downvote a post
router.patch("/:id/vote", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, type } = req.body; // type = 'upvote' or 'downvote'

    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid IDs provided" });
    }

    // Check if user is blocked
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (user && user.status === "blocked") {
      return res.status(403).json({ error: "Action restricted by Admin. You are blocked." });
    }

    const postObjId = new ObjectId(id);
    const userObjId = new ObjectId(userId);

    // Check if the user already voted
    const existingVote = await forumVotesCollection.findOne({
      postId: postObjId,
      userId: userObjId,
    });

    if (existingVote) {
      // If the user is trying to vote the same way again, toggle it off
      if (existingVote.type === type) {
        await forumVotesCollection.deleteOne({ _id: existingVote._id });
        const decField = type === "upvote" ? "likeCount" : "dislikeCount";
        await forumCollection.updateOne({ _id: postObjId }, { $inc: { [decField]: -1 } });
        return res.status(200).json({ message: "Vote removed", action: "removed" });
      }

      // If the user is changing their vote
      await forumVotesCollection.updateOne(
        { _id: existingVote._id },
        { $set: { type } }
      );

      // Adjust counts on the post
      const updateDoc = { $inc: {} };
      if (type === "upvote") {
        updateDoc.$inc.likeCount = 1;
        updateDoc.$inc.dislikeCount = -1;
      } else {
        updateDoc.$inc.likeCount = -1;
        updateDoc.$inc.dislikeCount = 1;
      }
      
      await forumCollection.updateOne({ _id: postObjId }, updateDoc);
      return res.status(200).json({ message: `Vote changed to ${type}` });
    }

    // New vote
    await forumVotesCollection.insertOne({
      postId: postObjId,
      userId: userObjId,
      type,
    });

    // Update count on post
    const incField = type === "upvote" ? "likeCount" : "dislikeCount";
    await forumCollection.updateOne(
      { _id: postObjId },
      { $inc: { [incField]: 1 } }
    );

    res.status(200).json({ message: `Successfully ${type}d the post` });
  } catch (error) {
    console.error("Error voting on post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Check user's vote status for a post
router.get("/:id/vote-status", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid IDs provided" });
    }

    const existingVote = await forumVotesCollection.findOne({
      postId: new ObjectId(id),
      userId: new ObjectId(userId),
    });

    res.status(200).json({ vote: existingVote ? existingVote.type : null });
  } catch (error) {
    console.error("Error fetching vote status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
