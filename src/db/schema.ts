import { pgTable, text, timestamp, uuid, varchar, pgEnum, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["ADMIN", "REVIEWER", "USER"]);
export const postStatusEnum = pgEnum("post_status", ["DRAFT", "PENDING", "PUBLISHED", "REJECTED"]);

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("USER"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull(),
});

// Categories Table
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

// Posts Table
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  content: text("content").notNull(),
  author_id: uuid("author_id").notNull(),
  category_id: integer("category_id"),
  status: postStatusEnum("status").notNull().default("DRAFT"),
  reviewer_id: uuid("reviewer_id"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// Comments Table
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey(),
  content: text("content").notNull(),
  author_id: uuid("author_id").notNull(),
  post_id: uuid("post_id").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
});

// Relations
export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.author_id], references: [users.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, { fields: [comments.author_id], references: [users.id] }),
  post: one(posts, { fields: [comments.post_id], references: [posts.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}));
