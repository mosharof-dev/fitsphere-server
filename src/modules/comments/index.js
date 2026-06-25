const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");
const { ObjectId } = require("mongodb");

const forumCommentsCollection = db.collection("forumComments");
const forumCollection = db.collection("forum");
const usersCollection = db.collection("user");

// Create a new comment or reply
router.post("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { parentCommentId, text, authorId, authorName, authorImage } =
      req.body;

    if (!ObjectId.isValid(postId) || !ObjectId.isValid(authorId) || !text) {
      return res.status(400).json({ error: "Invalid data provided" });
    }

    // Check if user is blocked
    const user = await usersCollection.findOne({ _id: new ObjectId(authorId) });
    if (user && user.status === "blocked") {
      return res
        .status(403)
        .json({ error: "Action restricted by Admin. You are blocked." });
    }

    const newComment = {
      postId: new ObjectId(postId),
      parentCommentId: parentCommentId ? new ObjectId(parentCommentId) : null,
      text,
      authorId: new ObjectId(authorId),
      authorName,
      authorImage: authorImage || "",
      createdAt: new Date(),
    };

    const result = await forumCommentsCollection.insertOne(newComment);

    // Increment comment count on the post
    await forumCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { commentCount: 1 } },
    );

    res.status(201).json({ ...newComment, _id: result.insertedId });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all comments for a post
router.get("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    if (!ObjectId.isValid(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const comments = await forumCommentsCollection
      .find({ postId: new ObjectId(postId) })
      .sort({ createdAt: 1 }) // Older comments first
      .toArray();

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Edit a comment
router.patch("/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text, authorId } = req.body; // authorId to verify ownership

    if (!ObjectId.isValid(commentId) || !ObjectId.isValid(authorId)) {
      return res.status(400).json({ error: "Invalid IDs provided" });
    }

    // Check if user is blocked
    const user = await usersCollection.findOne({ _id: new ObjectId(authorId) });
    if (user && user.status === "blocked") {
      return res
        .status(403)
        .json({ error: "Action restricted by Admin. You are blocked." });
    }

    const comment = await forumCommentsCollection.findOne({
      _id: new ObjectId(commentId),
    });
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.authorId.toString() !== authorId) {
      return res
        .status(403)
        .json({ error: "You can only edit your own comments" });
    }

    await forumCommentsCollection.updateOne(
      { _id: new ObjectId(commentId) },
      { $set: { text, updatedAt: new Date() } },
    );

    res.status(200).json({ message: "Comment updated successfully" });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a comment
router.delete("/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { authorId } = req.body; // In real app, from JWT

    if (!ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: "Invalid comment ID" });
    }

    // Check if user is blocked (using authorId if provided)
    if (authorId && ObjectId.isValid(authorId)) {
      const user = await usersCollection.findOne({
        _id: new ObjectId(authorId),
      });
      if (user && user.status === "blocked") {
        return res
          .status(403)
          .json({ error: "Action restricted by Admin. You are blocked." });
      }
    }

    const comment = await forumCommentsCollection.findOne({
      _id: new ObjectId(commentId),
    });
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Optional: Admin could delete any comment, but here we check owner
    // if (comment.authorId.toString() !== authorId) {
    //   return res.status(403).json({ error: "You can only delete your own comments" });
    // }

    // If it's a top-level comment, we should probably delete its replies too.
    const deletedReplies = await forumCommentsCollection.deleteMany({
      parentCommentId: new ObjectId(commentId),
    });
    const result = await forumCommentsCollection.deleteOne({
      _id: new ObjectId(commentId),
    });

    // Decrement count on post by 1 (for the main comment) + number of replies deleted
    const totalDeleted = 1 + (deletedReplies.deletedCount || 0);

    await forumCollection.updateOne(
      { _id: comment.postId },
      { $inc: { commentCount: -totalDeleted } },
    );

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
