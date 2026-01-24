"use client";

import Link from "next/link";

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface PostTagsDisplayProps {
  tags: Tag[];
}

export function PostTagsDisplay({ tags }: PostTagsDisplayProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/tags/${tag.slug}`}
          className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition"
        >
          #{tag.name}
        </Link>
      ))}
    </div>
  );
}
