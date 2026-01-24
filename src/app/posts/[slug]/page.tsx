export const dynamic = "force-dynamic";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { posts, postTags, tags } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { format } from "date-fns";
import { auth } from "@/auth";
import { DeletePostButton } from "@/components/DeletePostButton";
import { SubmitForReviewButton } from "@/components/SubmitForReviewButton";
import { PostTagsDisplay } from "@/components/PostTagsDisplay";

interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  author_id: string;
  status: string;
  featured_image_url?: string;
  created_at: Date;
  updated_at: Date;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  let post: Post | null = null;
  let error: string | null = null;
  let postTagsList: Tag[] = [];

  try {
    console.log("=== PostPage Debug ===");
    console.log("Session object:", JSON.stringify(session, null, 2));
    console.log("Session user:", session?.user);
    console.log("Session user id:", session?.user?.id);
    console.log("Session user email:", session?.user?.email);
    console.log("Looking for post with slug or id:", slug);
    
    // Try to find by slug first, then by id (in case it's an old UUID link)
    let result = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
    });

    // If not found by slug, try by id (UUID)
    if (!result && slug.includes('-') && slug.length === 36) {
      result = await db.query.posts.findFirst({
        where: eq(posts.id, slug),
      });
    }

    console.log("Query result:", result);

    if (!result) {
      error = "Post not found";
      console.log("Post not found for slug or id:", slug);
    } else {
      post = result as Post;
      
      // Fetch tags for this post
      const postTagsData = await db
        .select({
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
        })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tag_id, tags.id))
        .where(eq(postTags.post_id, post.id));
      
      console.log("Post tags fetched:", postTagsData);
      postTagsList = postTagsData as Tag[];
      
      // Check permissions
      const isAuthor = session?.user?.id === post.author_id;
      const isAdmin = session?.user?.role === "ADMIN";
      const isReviewer = session?.user?.role === "REVIEWER";
      const isPublished = post.status === "PUBLISHED";
      
      console.log("Permission check:", {
        postStatus: post.status,
        isPublished,
        userId: session?.user?.id,
        postAuthor: post.author_id,
        isAuthor,
        userRole: session?.user?.role,
        isAdmin,
        isReviewer,
      });
      
      // Allow viewing if:
      // - Post is published (anyone can see)
      // - User is the author (can see own posts)
      // - User is admin or reviewer (can see all posts)
      if (!isPublished && !isAuthor && !isAdmin && !isReviewer) {
        error = "You don't have permission to view this post";
        post = null;
      }
    }
  } catch (err) {
    error = "Failed to load post";
    console.error(err);
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <p className="text-red-600">{error || "Post not found"}</p>
          </div>
        </main>
      </div>
    );
  }

  const canEdit = session?.user?.id === post.author_id || session?.user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>

          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span>Created {format(new Date(post.created_at), "MMM dd, yyyy")}</span>
                  {post.updated_at && post.updated_at !== post.created_at && (
                    <span>Updated {format(new Date(post.updated_at), "MMM dd, yyyy")}</span>
                  )}
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    {post.status}
                  </span>
                </div>
                {postTags.length > 0 && (
                  <div className="mt-4">
                    <PostTagsDisplay tags={postTagsList} />
                  </div>
                )}
              </div>

              {canEdit && (
                <div className="flex gap-2">
                  <Link href={`/posts/${post.slug}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <DeletePostButton postId={post.id} />
                </div>
              )}
              
              {post.status === "DRAFT" && session?.user?.id === post.author_id && (
                <SubmitForReviewButton postId={post.id} />
              )}
            </div>

            {post.featured_image_url && (
              <div className="my-8">
                <img 
                  src={post.featured_image_url} 
                  alt="Featured image" 
                  className="w-full h-96 object-cover rounded-lg"
                />
              </div>
            )}

            <div className="prose prose-sm max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap text-gray-800">
                {post.content}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
