import type { Metadata } from "next";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { copy } from "@/content/it";
import { findPost, posts, sortedPosts, type Block } from "@/content/posts";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { JsonLd } from "@/components/site/json-ld";
import { Container } from "@/components/site/section";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: routes.post(post.slug) },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

function render(block: Block, i: number) {
  switch (block.type) {
    case "h2":
      return <h2 key={i}>{block.text}</h2>;
    case "ul":
      return (
        <ul key={i}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "note":
      return (
        <p key={i} className="flex gap-2 rounded-lg bg-info-soft p-3 text-[14px] text-fg">
          <Info aria-hidden className="mt-1 size-4 shrink-0 text-info" />
          {block.text}
        </p>
      );
    default:
      return <p key={i}>{block.text}</p>;
  }
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();
  const others = sortedPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);
  return (
    <>
      <JsonLd data={articleJsonLd(post, env.siteUrl)} />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Blog", path: routes.blog },
            { name: post.title, path: routes.post(post.slug) },
          ],
          env.siteUrl,
        )}
      />
      <Container className="max-w-2xl animate-page-in py-12 sm:py-16">
        <Link
          href={routes.blog}
          className="inline-flex min-h-6 items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {copy.blog.back}
        </Link>
        <article className="mt-6">
          <p className="text-[13px] font-medium text-accent-text">{post.category}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance text-fg">
            {post.title}
          </h1>
          <p className="mt-4 text-[13px] text-fg-muted">
            {copy.blog.by(post.author)} ·{" "}
            <time dateTime={post.date}>{formatDate(`${post.date}T12:00:00`, "long")}</time> ·{" "}
            {copy.common.minutes(post.minutes)}
          </p>
          <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-fg [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">
            {post.body.map(render)}
          </div>
        </article>
        <aside aria-labelledby="altri-articoli" className="mt-14 border-t border-line pt-8">
          <h2 id="altri-articoli" className="text-lg font-semibold text-fg">
            {copy.blog.related}
          </h2>
          <ul className="mt-4 grid gap-3">
            {others.map((p) => (
              <li key={p.slug}>
                <Link
                  href={routes.post(p.slug)}
                  className="font-medium text-accent-text hover:underline"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </Container>
    </>
  );
}
