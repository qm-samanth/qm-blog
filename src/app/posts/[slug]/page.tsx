export const dynamic = "force-dynamic";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { posts, postTags, tags } from "@/db/schema";
import { eq, and, inArray, ne, desc } from "drizzle-orm";
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
  excerpt?: string;
  created_at: Date;
  updated_at: Date;
  author?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
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
  let latestPosts: Post[] = [];

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
      with: {
        author: true,
      },
    });

    // If not found by slug, try by id (UUID)
    if (!result && slug.includes('-') && slug.length === 36) {
      result = await db.query.posts.findFirst({
        where: eq(posts.id, slug),
        with: {
          author: true,
        },
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
            with: {
              author: true,
            },
          });
          relatedPosts = relatedPostsData as Post[];
        }
      }
      
      // Fetch latest published posts (excluding current post)
      const latestPostsData = await db.query.posts.findMany({
        where: and(
          ne(posts.id, post.id),
          eq(posts.status, "PUBLISHED")
        ),
        orderBy: [desc(posts.created_at)],
        limit: 3,
        with: {
          author: true,
        },
      });
      latestPosts = latestPostsData as Post[];
      
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
      <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition" style={{ color: "#690031" }}>
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>
          <div className="bg-white rounded-lg p-8">
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
    <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
      <Navbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8">
          <Link href="/" className="flex items-center gap-2 mb-10 hover:opacity-80 transition" style={{ color: "#690031" }}>
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - 3 columns */}
            <div className="lg:col-span-3">
              <article className="bg-white rounded-lg overflow-hidden">
                {session?.user && (
                  <>
                    {/* Feedback Section - Full Width */}
                    {(post.status === "REJECTED" || post.status === "PUBLISHED") && post.reviewer_comments && (
                      <div className="w-full p-4" style={{ backgroundColor: "#f0e6eb", borderBottom: "4px solid #690031" }}>
                        <p className="text-sm" style={{ color: "#690031" }}>
                          <span className="font-bold">{post.status === "PUBLISHED" ? "✓ Approval Feedback" : "✗ Rejection Feedback"}:</span> {post.reviewer_comments}
                        </p>
                      </div>
                    )}

                    {/* Meta Info with Edit/Delete Buttons */}
                    <div className="px-8 lg:px-10 pt-6 pb-4 flex flex-wrap items-center justify-between gap-4 text-sm">
                      <div className="flex flex-wrap items-center gap-4">
                        <span style={{ color: "#690031" }}>Created {format(new Date(post.created_at), "MMM dd, yyyy")}</span>
                        {post.updated_at && post.updated_at !== post.created_at && (
                          <span style={{ color: "#690031" }}>Updated {format(new Date(post.updated_at), "MMM dd, yyyy")}</span>
                        )}
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#690031", color: "white" }}>
                          {post.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {(post.status === "DRAFT" || post.status === "REJECTED") && session?.user?.id === post.author_id && (
                          <SubmitForReviewButton postId={post.id} />
                        )}
                        {canEdit && (
                          <>
                            <Link href={`/posts/${post.slug}/edit`}>
                              <Button variant="outline" size="lg" className="border-2 px-6 py-3" style={{ borderColor: "#690031", color: "#690031" }}>
                                <Edit2 className="h-5 w-5 mr-2" />
                                Edit
                              </Button>
                            </Link>
                            <DeletePostButton postId={post.id} />
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Featured Image with Title Overlay */}
                <div className="relative">
                  {post.featured_image_url && (
                    <div className="w-full bg-gray-200" style={{ height: "500px" }}>
                      <img 
                        src={post.featured_image_url} 
                        alt="Featured image" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6" style={{ background: "linear-gradient(to top, rgba(107, 0, 49, 1), rgba(107, 0, 49, 0.3))" }}>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{post.title}</h1>
                    <div className="flex justify-between items-end text-white text-sm">
                      <div>
                        <p className="opacity-90">By {post.author?.first_name && post.author?.last_name 
                          ? `${post.author.first_name} ${post.author.last_name}` 
                          : post.author?.email || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="opacity-90">{format(new Date(post.created_at), "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 lg:p-10">

                {/* Post Content */}
                <style>{`
                  .post-content blockquote {
                    border-left-color: #690031 !important;
                    background-color: #f0e6eb !important;
                  }
                  .post-content a {
                    color: #690031 !important;
                  }
                  .post-content a:hover {
                    color: #5a002a !important;
                  }
                `}</style>
                <div className="post-content prose prose-sm md:prose-base lg:prose-lg max-w-none 
                  prose-h1:text-4xl prose-h1:font-bold prose-h1:my-6 prose-h1:text-gray-900
                  prose-h2:text-3xl prose-h2:font-bold prose-h2:my-4 prose-h2:text-gray-900
                  prose-h3:text-2xl prose-h3:font-bold prose-h3:my-3 prose-h3:text-gray-900
                  prose-p:my-4 prose-p:leading-7 prose-p:text-gray-800
                  prose-ul:list-disc prose-ul:list-inside prose-ul:my-4 prose-ul:space-y-2 prose-ul:text-gray-800
                  prose-ol:list-decimal prose-ol:list-inside prose-ol:my-4 prose-ol:space-y-2 prose-ol:text-gray-800
                  prose-li:text-gray-800
                  prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:my-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:rounded
                  prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-red-600
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4
                  prose-img:my-4 prose-img:rounded-lg prose-img:max-w-full prose-img:h-auto
                  prose-strong:font-bold prose-strong:text-gray-900
                  prose-em:italic
                ">
                  <div dangerouslySetInnerHTML={{ __html: displayContent }} />
                </div>
                </div>
              </article>
            </div>

            {/* Sidebar - 1 column */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Post Info Widget */}
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4 pb-3 border-b-2" style={{ color: "#690031", borderBottomColor: "#690031" }}>
                    Post Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-gray-500 uppercase text-xs font-semibold">Author</p>
                        <p className="text-gray-900 font-medium mt-1">
                          {post.author?.first_name && post.author?.last_name 
                            ? `${post.author.first_name} ${post.author.last_name}` 
                            : post.author?.email || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 uppercase text-xs font-semibold">Published</p>
                        <p className="text-gray-900 font-medium mt-1">{format(new Date(post.created_at), "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags Sidebar */}
                {allTags.length > 0 && (
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4 pb-3 border-b-2" style={{ color: "#690031", borderBottomColor: "#690031" }}>
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
                                ? "text-white border border-2" 
                                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                            }`}
                            style={isCurrentPostTag ? { backgroundColor: "#690031", borderColor: "#690031" } : {}}
                          >
                            #{tag.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Latest Posts Section */}
                {latestPosts.length > 0 && (
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4 pb-3 border-b-2" style={{ color: "#690031", borderBottomColor: "#690031" }}>
                      Latest Posts
                    </h3>
                    <div className="space-y-8">
                      {latestPosts.map((latestPost) => {
                        const preview = (latestPost as any).excerpt || latestPost.content.replace(/<[^>]*>/g, '').substring(0, 80) + '...';
                        return (
                          <Link key={latestPost.id} href={`/posts/${latestPost.slug}`}>
                            <div className="flex gap-3 p-3 rounded-lg hover:opacity-80 transition cursor-pointer mb-6" style={{ backgroundColor: "#fbf7f4" }}>
                              {latestPost.featured_image_url && (
                                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                                  <img 
                                    src={latestPost.featured_image_url} 
                                    alt={latestPost.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-grow min-w-0">
                                <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm">
                                  {latestPost.title}
                                </h4>
                                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                  {preview}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Posts Section */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-12 border-t border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedPosts.map((relatedPost) => {
                  const preview = (relatedPost as any).excerpt || relatedPost.content.replace(/<[^>]*>/g, '').substring(0, 140) + '...';
                  return (
                    <article key={relatedPost.id} className="rounded-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full bg-white">
                      {/* Featured Image */}
                      {relatedPost.featured_image_url && (
                        <Link href={`/posts/${relatedPost.slug}`}>
                          <div className="relative h-48 bg-gray-200 overflow-hidden group">
                            <img
                              src={relatedPost.featured_image_url}
                              alt={relatedPost.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {/* Glossy Effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                          </div>
                        </Link>
                      )}

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-grow">
                        {/* Title */}
                        <Link href={`/posts/${relatedPost.slug}`}>
                          <h3 className="text-lg font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors line-clamp-3">
                            {relatedPost.title}
                          </h3>
                        </Link>

                        {/* Preview Text */}
                        {preview && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">
                            {preview}
                          </p>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-3 border-t border-gray-100 pt-3">
                          <span>
                            By <span className="font-medium text-gray-700">{relatedPost.author?.first_name && relatedPost.author?.last_name ? `${relatedPost.author.first_name} ${relatedPost.author.last_name}` : relatedPost.author?.email || "Author"}</span>
                          </span>
                          <span>
                            {format(new Date(relatedPost.created_at), "MMM dd, yyyy")}
                          </span>
                        </div>

                        {/* Read Button */}
                        <Link href={`/posts/${relatedPost.slug}`}>
                          <Button className="w-full gap-2 text-white rounded-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-95 hover:opacity-90" style={{ backgroundColor: "#690031" }}>
                            Read
                          </Button>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
