import type { Metadata } from "next";
import Link from "next/link";
import { copy } from "@/content/it";
import { sortedPosts } from "@/content/posts";
import { routes } from "@/config/navigation";
import { formatDate } from "@/lib/format";
import { Container, SectionHeading } from "@/components/site/section";

const t = copy.blog;

export const metadata: Metadata = {
  title: t.title,
  description: t.description,
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = sortedPosts();
  return (
    <Container className="animate-page-in py-16 sm:py-20">
      <SectionHeading as="h1" title={t.title} description={t.description} />
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6">
              <p className="text-[13px] font-medium text-accent-text">{post.category}</p>
              <h2 className="mt-2 text-lg font-semibold text-fg">
                <Link href={routes.post(post.slug)} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 flex-1 text-sm text-fg-muted">{post.excerpt}</p>
              <p className="mt-4 text-[13px] text-fg-muted">
                <time dateTime={post.date}>{formatDate(`${post.date}T12:00:00`, "long")}</time> ·{" "}
                {copy.common.minutes(post.minutes)}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </Container>
  );
}
