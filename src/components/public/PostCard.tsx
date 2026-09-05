import React from 'react';
import { Eye, Heart, Calendar, ArrowLeft } from 'lucide-react';
import type { Post } from '../../types/index.js';

interface PostCardProps {
  post: Post;
  onClick: (id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString('ar-EG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      id={`post-card-${post.id}`}
      onClick={() => onClick(post.id)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.06] hover:shadow-[0_0_35px_rgba(34,211,238,0.15)] cursor-pointer"
    >
      {/* Subtle top glow line on hover */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/0 to-transparent group-hover:via-cyan-400/60 transition-all duration-500" />

      <div>
        {/* Category & Date */}
        <div className="flex items-center justify-between gap-2 mb-3 text-xs">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-0.5 font-medium text-cyan-300 text-[11px] tracking-wider uppercase">
            {post.category}
          </span>
          <span className="flex items-center gap-1.5 text-white/50 text-[11px]">
            <Calendar className="h-3 w-3 text-white/40" />
            {formattedDate}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-xl font-bold leading-relaxed text-white group-hover:text-cyan-200 transition-colors duration-200 line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="mt-3 text-sm leading-relaxed text-white/70 font-light line-clamp-3">
          {post.excerpt}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] text-white/40 group-hover:text-white/60 transition"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Views, Likes, Read More */}
      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-white/50">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 hover:text-white/80 transition">
            <Eye className="h-3.5 w-3.5 text-white/40" />
            <span>{post.viewsCount}</span>
          </span>
          <span className="flex items-center gap-1 hover:text-rose-400 transition">
            <Heart className="h-3.5 w-3.5 text-rose-400/80" />
            <span>{post.likesCount}</span>
          </span>
        </div>

        <span className="flex items-center gap-1 text-cyan-400 font-medium group-hover:translate-x-[-2px] transition-transform">
          <span>اقرأ التدوينة</span>
          <ArrowLeft className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  );
};
