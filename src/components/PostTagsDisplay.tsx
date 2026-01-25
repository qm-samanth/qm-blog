"use client";

import Link from "next/link";

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface PostTagsDisplayProps {
  tags: Tag[];
  layout?: "inline" | "grid";
}

export function PostTagsDisplay({ tags, layout = "grid" }: PostTagsDisplayProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  if (layout === "inline") {
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="inline-block px-3 py-1.5 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 rounded-full text-xs font-semibold hover:from-teal-100 hover:to-teal-200 transition-colors border border-teal-200 shadow-sm"
          >
            <span>#</span> {tag.name}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/tags/${tag.slug}`}
          className="block w-full px-3 py-2 bg-gray-50 text-gray-800 rounded border border-gray-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition-colors text-sm font-medium text-center"
        >
          #{tag.name}
        </Link>
      ))}
    </div>
  );
}
