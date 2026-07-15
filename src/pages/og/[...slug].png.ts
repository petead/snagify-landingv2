import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getPublishedBlogPosts, type BlogPost } from '../../lib/blog';

export const prerender = true;

const poppinsExtraBold = fs.readFileSync(
  path.join(process.cwd(), 'src/assets/fonts/Poppins-ExtraBold.ttf'),
);
const dmSansRegular = fs.readFileSync(
  path.join(process.cwd(), 'src/assets/fonts/DMSans-Regular.ttf'),
);

function formatOgDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function getStaticPaths() {
  const posts = await getPublishedBlogPosts();
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: BlogPost };
  const { title, pubDate } = post.data;
  const titleSize = title.length > 60 ? 52 : 64;

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          background: '#0A0810',
          padding: '56px 64px',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'flex-start',
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(202,254,135,0.12)',
                    borderRadius: '999px',
                    padding: '10px 20px',
                    color: '#CAFE87',
                    fontFamily: 'DM Sans',
                    fontSize: 28,
                    fontWeight: 400,
                  },
                  children: 'Snagify · Dubai Rentals Guide',
                },
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                justifyContent: 'center',
                paddingTop: '24px',
                paddingBottom: '24px',
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    color: '#FFFFFF',
                    fontFamily: 'Poppins',
                    fontSize: titleSize,
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: '-1.5px',
                    maxHeight: `${Math.round(titleSize * 1.15 * 3)}px`,
                    overflow: 'hidden',
                  },
                  children: title,
                },
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                color: '#8B86A3',
                fontFamily: 'DM Sans',
                fontSize: 28,
                fontWeight: 400,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex' },
                    children: formatOgDate(pubDate),
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex' },
                    children: 'snagify.net',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Poppins',
          data: poppinsExtraBold,
          weight: 800,
          style: 'normal',
        },
        {
          name: 'DM Sans',
          data: dmSansRegular,
          weight: 400,
          style: 'normal',
        },
      ],
    },
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
