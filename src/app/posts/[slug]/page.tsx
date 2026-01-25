export const dynamic = "force-dynamic";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { posts, postTags, tags } from "@/db/schema";
import { eq, and, inArray, ne } from "drizzle-orm";
import { format } from "date-fns";
import { auth } from "@/auth";
import { DeletePostButton } from "@/components/DeletePostButton";
import { SubmitForReviewButton } from "@/components/SubmitForReviewButton";
import { PostTagsDisplay } from "@/components/PostTagsDisplay";
import { decodeHTML } from "@/lib/utils/html";

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
  let allTags: Tag[] = [];
  let relatedPosts: Post[] = [];

  try {
    console.log("=== PostPage Debug ===");
    console.log("Session object:", JSON.stringify(session, null, 2));
    console.log("Session user:", session?.user);
    console.log("Session user id:", session?.user?.id);
    console.log("Session user email:", session?.user?.email);
    console.log("Looking for post with slug or id:", slug);

    // Fetch all tags
    const allTagsData = await db.select().from(tags).orderBy(tags.name);
    allTags = allTagsData as Tag[];
    
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

      // Fetch related posts (posts with same tags, excluding current post)
      if (postTagsList.length > 0) {
        // Get tag IDs
        const tagIds = postTagsList.map((t) => t.id);
        
        // Find all posts that have any of these tags
        const relatedPostsWithTags = await db
          .selectDistinct({ postId: postTags.post_id })
          .from(postTags)
          .where(inArray(postTags.tag_id, tagIds));

        const relatedPostIds = relatedPostsWithTags.map((r) => r.postId);

        // Fetch the actual posts, excluding current post
        if (relatedPostIds.length > 0) {
          const relatedPostsData = await db.query.posts.findMany({
            where: and(
              inArray(posts.id, relatedPostIds),
              ne(posts.id, post.id),
              eq(posts.status, "PUBLISHED")
            ),
            limit: 4,
          });
          relatedPosts = relatedPostsData as Post[];
        }
      }
      
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

  // Decode HTML entities if the content is escaped
  const displayContent = decodeHTML(post.content);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8">
          <Link href="/" className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - 3 columns */}
            <div className="lg:col-span-3">
              <article className="bg-white rounded-lg border border-gray-200 p-8 lg:p-10">
                {/* Header Section */}
                <div className="mb-8">
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">{post.title}</h1>
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                    <span>Created {format(new Date(post.created_at), "MMM dd, yyyy")}</span>
                    {post.updated_at && post.updated_at !== post.created_at && (
                      <span>Updated {format(new Date(post.updated_at), "MMM dd, yyyy")}</span>
                    )}
                    <span className="inline-block px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold">
                      {post.status}
                    </span>
                  </div>

                  {/* Edit/Delete Buttons */}
                  {canEdit && (
                    <div className="flex gap-2 mb-6">
                      <Link href={`/posts/${post.slug}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <DeletePostButton postId={post.id} />
                    </div>
                  )}
                  
                  {(post.status === "DRAFT" || post.status === "REJECTED") && session?.user?.id === post.author_id && (
                    <SubmitForReviewButton postId={post.id} />
                  )}
                </div>

                {/* Featured Image */}
                {post.featured_image_url && (
                  <div className="my-8 -mx-8 lg:-mx-10">
                    <img 
                      src={post.featured_image_url} 
                      alt="Featured image" 
                      className="w-full h-96 object-cover"
                    />
                  </div>
                )}

                {/* Feedback Section */}
                {(post.status === "REJECTED" || post.status === "PUBLISHED") && post.reviewer_comments && (
                  <div className={`my-6 p-4 rounded-lg border-l-4 ${
                    post.status === "PUBLISHED"
                      ? "bg-green-50 border-green-500"
                      : "bg-red-50 border-red-500"
                  }`}>
                    <h3 className={`font-bold mb-2 ${
                      post.status === "PUBLISHED"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}>
                      {post.status === "PUBLISHED" ? "✓ Approval Feedback" : "✗ Rejection Feedback"}
                    </h3>
                    <p className={`text-sm ${
                      post.status === "PUBLISHED"
                        ? "text-green-700"
                        : "text-red-700"
                    } whitespace-pre-wrap`}>
                      {post.reviewer_comments}
                    </p>
                  </div>
                )}

                {/* Post Content */}
                <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none 
                  prose-h1:text-4xl prose-h1:font-bold prose-h1:my-6 prose-h1:text-gray-900
                  prose-h2:text-3xl prose-h2:font-bold prose-h2:my-4 prose-h2:text-gray-900
                  prose-h3:text-2xl prose-h3:font-bold prose-h3:my-3 prose-h3:text-gray-900
                  prose-p:my-4 prose-p:leading-7 prose-p:text-gray-800
                  prose-ul:list-disc prose-ul:list-inside prose-ul:my-4 prose-ul:space-y-2 prose-ul:text-gray-800
                  prose-ol:list-decimal prose-ol:list-inside prose-ol:my-4 prose-ol:space-y-2 prose-ol:text-gray-800
                  prose-li:text-gray-800
                  prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:pl-4 prose-blockquote:my-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:bg-teal-50
                  prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-red-600
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4
                  prose-a:text-teal-600 prose-a:hover:text-teal-800 prose-a:underline
                  prose-img:my-4 prose-img:rounded-lg prose-img:max-w-full prose-img:h-auto
                  prose-strong:font-bold prose-strong:text-gray-900
                  prose-em:italic
                ">
                  <div dangerouslySetInnerHTML={{ __html: displayContent }} />
                </div>
              </article>
            </div>

            {/* Sidebar - 1 column */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Tags Sidebar */}
                {allTags.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-teal-500">
                      All Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => {
                        const isCurrentPostTag = postTagsList.some((t) => t.id === tag.id);
                        return (
                          <Link
                            key={tag.id}
                            href={`/tags/${tag.slug}`}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                              isCurrentPostTag
                                ? "bg-teal-600 text-white border border-teal-600 hover:bg-teal-700"
                                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            #{tag.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Related Info Widget */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-teal-500">
                    Post Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-500 uppercase text-xs font-semibold">Status</p>
                      <p className="text-gray-900 font-medium mt-1">
                        <span className="inline-block px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs font-semibold">
                          {post.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase text-xs font-semibold">Published</p>
                      <p className="text-gray-900 font-medium mt-1">{format(new Date(post.created_at), "MMM dd, yyyy")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Posts Section */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-12 border-t border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/posts/${relatedPost.slug}`}>
                    <article className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      {relatedPost.featured_image_url && (
                        <div className="relative h-40 bg-gray-200 overflow-hidden">
                          <img
                            src={relatedPost.featured_image_url}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2 mb-3">
                          {relatedPost.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {format(new Date(relatedPost.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
