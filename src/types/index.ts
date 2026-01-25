export type UserRole = "ADMIN" | "REVIEWER" | "USER" | "GUEST";
export type PostStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";

export interface User {
  id: string;
  email: string;
  password_hash?: string; // Don't expose in client
  role: UserRole;
  created_at: Date;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  author_id: string;
  category_id?: number;
  status: PostStatus;
  reviewer_id?: string;
  featured_image_url?: string;
  created_at: Date;
  updated_at: Date;
  author?: User;
  category?: Category;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  created_at: Date;
  updated_at: Date;
  author?: User;
}

export interface SessionUser extends User {
  role: UserRole;
}
