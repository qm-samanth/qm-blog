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
  first_name: varchar("first_name", { length: 100 }),
  last_name: varchar("last_name", { length: 100 }),
  role: userRoleEnum("role").notNull().default("USER"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull(),
});

// Categories Table
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

// Folders Table
export const folders = pgTable("folders", {
  id: uuid("id").primaryKey(),
  user_id: uuid("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// Images Table
export const images = pgTable("images", {
  id: uuid("id").primaryKey(),
  user_id: uuid("user_id").notNull(),
  folder_id: uuid("folder_id"),
  cloudinary_public_id: varchar("cloudinary_public_id", { length: 255 }).notNull().unique(),
  cloudinary_url: text("cloudinary_url").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  file_size: integer("file_size"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull(),
});

// Posts Table
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  author_id: uuid("author_id").notNull(),
  category_id: integer("category_id"),
  featured_image_url: text("featured_image_url"),
  status: postStatusEnum("status").notNull().default("DRAFT"),
  reviewer_id: uuid("reviewer_id"),
  reviewer_comments: text("reviewer_comments"),
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

// Tags Table
export const tags = pgTable("tags", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// Post Tags Junction Table (Many-to-Many)
export const postTags = pgTable("post_tags", {
  post_id: uuid("post_id").notNull(),
  tag_id: integer("tag_id").notNull(),
}, (table) => ({
  pk: { primaryKey: [table.post_id, table.tag_id] },
}));

// Relations
export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.author_id], references: [users.id] }),
  comments: many(comments),
  tags: many(postTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  posts: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.post_id], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tag_id], references: [tags.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, { fields: [comments.author_id], references: [users.id] }),
  post: one(posts, { fields: [comments.post_id], references: [posts.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  folders: many(folders),
  images: many(images),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.user_id], references: [users.id] }),
  images: many(images),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  user: one(users, { fields: [images.user_id], references: [users.id] }),
  folder: one(folders, { fields: [images.folder_id], references: [folders.id] }),
}));
