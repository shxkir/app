import { randomUUID } from "crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "./prisma";

type PrismaPostClient = Prisma.PostDelegate<false> | undefined;
type PrismaLikeClient = Prisma.PostLikeDelegate<false> | undefined;
type PrismaCommentClient = Prisma.PostCommentDelegate<false> | undefined;

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
} as const;

type RawPostRow = {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: Date;
  authorId: string;
  username: string;
  displayName: string | null;
};

type RawInteractionCount = {
  postId: string;
  count: bigint;
};

type RawViewerLike = {
  postId: string;
};

type RawCommentRow = {
  id: string;
  postId: string;
  content: string;
  createdAt: Date;
  userId: string;
  username: string;
  displayName: string | null;
};

export type PostCommentWithAuthor = {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
  };
};

export type PostWithAuthor = {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
  recentComments: PostCommentWithAuthor[];
  author: {
    id: string;
    username: string;
    displayName: string | null;
  };
};

const DEFAULT_COMMENT_LIMIT = 3;

let postSchemaEnsured = false;
let ensuringPromise: Promise<void> | null = null;

async function ensurePostInfrastructure() {
  if (postSchemaEnsured) {
    return;
  }
  if (ensuringPromise) {
    return ensuringPromise;
  }
  ensuringPromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Post" (
          "id" TEXT PRIMARY KEY,
          "imageUrl" TEXT NOT NULL,
          "caption" VARCHAR(1024),
          "authorId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
          CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Post_authorId_createdAt_idx" ON "Post" ("authorId", "createdAt")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PostLike" (
          "id" TEXT PRIMARY KEY,
          "postId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
          CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE,
          CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "PostLike_postId_userId_key" ON "PostLike" ("postId", "userId")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PostComment" (
          "id" TEXT PRIMARY KEY,
          "postId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "content" VARCHAR(500) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
          CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE,
          CONSTRAINT "PostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PostComment_postId_createdAt_idx" ON "PostComment" ("postId", "createdAt")
      `);
      postSchemaEnsured = true;
    } catch (error) {
      console.error("[posts] unable to ensure Post schema exists", error);
      throw error;
    } finally {
      ensuringPromise = null;
    }
  })();
  return ensuringPromise;
}

function getPostClient(): PrismaPostClient {
  return (prisma as typeof prisma & { post?: Prisma.PostDelegate<false> }).post;
}

function getLikeClient(): PrismaLikeClient {
  return (prisma as typeof prisma & { postLike?: Prisma.PostLikeDelegate<false> }).postLike;
}

function getCommentClient(): PrismaCommentClient {
  return (prisma as typeof prisma & { postComment?: Prisma.PostCommentDelegate<false> }).postComment;
}

function mapRawRowToPost(row: RawPostRow): PostWithAuthor {
  return {
    id: row.id,
    imageUrl: row.imageUrl,
    caption: row.caption,
    createdAt: row.createdAt,
    likeCount: 0,
    commentCount: 0,
    viewerHasLiked: false,
    recentComments: [],
    author: {
      id: row.authorId,
      username: row.username,
      displayName: row.displayName,
    },
  };
}

type FetchOptions = {
  authorId?: string;
  viewerId?: string;
  commentLimit?: number;
};

export async function fetchRecentPosts(limit = 20, options?: FetchOptions): Promise<PostWithAuthor[]> {
  const commentLimit = options?.commentLimit ?? DEFAULT_COMMENT_LIMIT;
  const postClient = getPostClient();
  if (postClient) {
    try {
      const posts = await postClient.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        where: options?.authorId ? { authorId: options.authorId } : undefined,
        include: {
          author: { select: authorSelect },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          likes: options?.viewerId
            ? {
                where: { userId: options.viewerId },
                select: { id: true },
              }
            : undefined,
          comments: {
            orderBy: { createdAt: "desc" },
            take: commentLimit,
            include: {
              user: {
                select: authorSelect,
              },
            },
          },
        },
      });

      return posts.map((post) => ({
        id: post.id,
        imageUrl: post.imageUrl,
        caption: post.caption,
        createdAt: post.createdAt,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        viewerHasLiked: options?.viewerId ? (post.likes ?? []).length > 0 : false,
        recentComments: post.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          author: {
            id: comment.user.id,
            username: comment.user.username,
            displayName: comment.user.displayName,
          },
        })),
        author: {
          id: post.author.id,
          username: post.author.username,
          displayName: post.author.displayName,
        },
      }));
    } catch (error) {
      console.warn("[posts] prisma client missing relations, falling back to raw query", error);
    }
  }

  await ensurePostInfrastructure();

  const rows =
    options?.authorId
      ? await prisma.$queryRaw<RawPostRow[]>`
          SELECT p.id,
                 p."imageUrl",
                 p.caption,
                 p."createdAt",
                 p."authorId",
                 u.username,
                 u."displayName"
          FROM "Post" AS p
          INNER JOIN "User" AS u ON u.id = p."authorId"
          WHERE p."authorId" = ${options.authorId}
          ORDER BY p."createdAt" DESC
          LIMIT ${limit}
        `
      : await prisma.$queryRaw<RawPostRow[]>`
          SELECT p.id,
                 p."imageUrl",
                 p.caption,
                 p."createdAt",
                 p."authorId",
                 u.username,
                 u."displayName"
          FROM "Post" AS p
          INNER JOIN "User" AS u ON u.id = p."authorId"
          ORDER BY p."createdAt" DESC
          LIMIT ${limit}
        `;

  if (rows.length === 0) {
    return [];
  }

  const postIdList = rows.map((row) => row.id);
  const postIdSql = Prisma.join(postIdList.map((id) => Prisma.sql`${id}`));

  const [likeCounts, commentCounts, viewerLikesRows, commentRows] = await Promise.all([
    prisma.$queryRaw<RawInteractionCount[]>`
      SELECT "postId", COUNT(*)::bigint AS count
      FROM "PostLike"
      WHERE "postId" IN (${postIdSql})
      GROUP BY "postId"
    `,
    prisma.$queryRaw<RawInteractionCount[]>`
      SELECT "postId", COUNT(*)::bigint AS count
      FROM "PostComment"
      WHERE "postId" IN (${postIdSql})
      GROUP BY "postId"
    `,
    options?.viewerId
      ? prisma.$queryRaw<RawViewerLike[]>`
          SELECT "postId"
          FROM "PostLike"
          WHERE "userId" = ${options.viewerId} AND "postId" IN (${postIdSql})
        `
      : Promise.resolve([]),
    prisma.$queryRaw<RawCommentRow[]>`
      SELECT * FROM (
        SELECT c.id,
               c."postId",
               c.content,
               c."createdAt",
               u.id        AS "userId",
               u.username,
               u."displayName",
               ROW_NUMBER() OVER (PARTITION BY c."postId" ORDER BY c."createdAt" DESC) AS row_num
        FROM "PostComment" AS c
        INNER JOIN "User" AS u ON u.id = c."userId"
        WHERE c."postId" IN (${postIdSql})
      ) ranked
      WHERE ranked.row_num <= ${commentLimit}
      ORDER BY ranked."createdAt" DESC
    `,
  ]);

  const likeCountMap = new Map(likeCounts.map((item) => [item.postId, Number(item.count)]));
  const commentCountMap = new Map(commentCounts.map((item) => [item.postId, Number(item.count)]));
  const viewerLikedSet = new Set(viewerLikesRows.map((row) => row.postId));

  const commentsByPost = new Map<string, PostCommentWithAuthor[]>();
  for (const comment of commentRows) {
    const array = commentsByPost.get(comment.postId) ?? [];
    array.push({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.userId,
        username: comment.username,
        displayName: comment.displayName,
      },
    });
    commentsByPost.set(comment.postId, array);
  }

  return rows.map((row) => {
    const base = mapRawRowToPost(row);
    return {
      ...base,
      likeCount: likeCountMap.get(row.id) ?? 0,
      commentCount: commentCountMap.get(row.id) ?? 0,
      viewerHasLiked: options?.viewerId ? viewerLikedSet.has(row.id) : false,
      recentComments: commentsByPost.get(row.id) ?? [],
    };
  });
}

export async function createPostRecord(params: {
  authorId: string;
  imageUrl: string;
  caption: string | null;
}): Promise<PostWithAuthor> {
  const postClient = getPostClient();
  if (postClient) {
    const post = await postClient.create({
      data: {
        authorId: params.authorId,
        imageUrl: params.imageUrl,
        caption: params.caption,
      },
      include: {
        author: { select: authorSelect },
      },
    });
    return {
      id: post.id,
      imageUrl: post.imageUrl,
      caption: post.caption,
      createdAt: post.createdAt,
      likeCount: 0,
      commentCount: 0,
      viewerHasLiked: false,
      recentComments: [],
      author: {
        id: post.author.id,
        username: post.author.username,
        displayName: post.author.displayName,
      },
    };
  }

  await ensurePostInfrastructure();

  const fallbackId = randomUUID();
  const rows = await prisma.$queryRaw<RawPostRow[]>`
    WITH inserted AS (
      INSERT INTO "Post" ("id", "authorId", "imageUrl", "caption")
      VALUES (${fallbackId}, ${params.authorId}, ${params.imageUrl}, ${params.caption})
      RETURNING "id", "imageUrl", "caption", "createdAt", "authorId"
    )
    SELECT inserted.id,
           inserted."imageUrl",
           inserted.caption,
           inserted."createdAt",
           inserted."authorId",
           u.username,
           u."displayName"
    FROM inserted
    INNER JOIN "User" AS u ON u.id = inserted."authorId"
  `;

  if (!rows.length) {
    throw new Error("Unable to create post.");
  }

  const base = mapRawRowToPost(rows[0]);
  return {
    ...base,
    likeCount: 0,
    commentCount: 0,
    viewerHasLiked: false,
    recentComments: [],
  };
}

export async function countPostsByAuthor(authorId: string): Promise<number> {
  const postClient = getPostClient();
  if (postClient) {
    return postClient.count({ where: { authorId } });
  }

  await ensurePostInfrastructure();
  const rows = await prisma.$queryRaw<RawInteractionCount[]>`
    SELECT COUNT(*)::bigint AS count FROM "Post" WHERE "authorId" = ${authorId}
  `;
  if (!rows.length) {
    return 0;
  }
  return Number(rows[0].count);
}

export async function togglePostLike(postId: string, userId: string) {
  const likeClient = getLikeClient();
  if (likeClient) {
    const existing = await likeClient.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      await likeClient.delete({ where: { id: existing.id } });
    } else {
      await likeClient.create({ data: { postId, userId } });
    }
    const likeCount = await likeClient.count({ where: { postId } });
    return { liked: !existing, likeCount };
  }

  await ensurePostInfrastructure();

  const existingRows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "PostLike" WHERE "postId" = ${postId} AND "userId" = ${userId} LIMIT 1
  `;
  if (existingRows.length) {
    await prisma.$executeRaw`
      DELETE FROM "PostLike" WHERE id = ${existingRows[0].id}
    `;
    const likeCountRows = await prisma.$queryRaw<RawInteractionCount[]>`
      SELECT COUNT(*)::bigint AS count FROM "PostLike" WHERE "postId" = ${postId}
    `;
    return { liked: false, likeCount: likeCountRows[0] ? Number(likeCountRows[0].count) : 0 };
  }

  await prisma.$executeRaw`
    INSERT INTO "PostLike" ("id", "postId", "userId") VALUES (${randomUUID()}, ${postId}, ${userId})
  `;
  const likeCountRows = await prisma.$queryRaw<RawInteractionCount[]>`
    SELECT COUNT(*)::bigint AS count FROM "PostLike" WHERE "postId" = ${postId}
  `;
  return { liked: true, likeCount: likeCountRows[0] ? Number(likeCountRows[0].count) : 0 };
}

export async function createPostComment(postId: string, userId: string, content: string) {
  const sanitized = content.trim();
  if (!sanitized) {
    throw new Error("Comment cannot be empty.");
  }
  const truncated = sanitized.slice(0, 500);

  const commentClient = getCommentClient();
  if (commentClient) {
    const comment = await commentClient.create({
      data: {
        postId,
        userId,
        content: truncated,
      },
      include: {
        user: { select: authorSelect },
      },
    });
    const count = await commentClient.count({ where: { postId } });
    return {
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          id: comment.user.id,
          username: comment.user.username,
          displayName: comment.user.displayName,
        },
      },
      commentCount: count,
    };
  }

  await ensurePostInfrastructure();

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "PostComment" ("id", "postId", "userId", "content")
    VALUES (${id}, ${postId}, ${userId}, ${truncated})
  `;
  const rows = await prisma.$queryRaw<RawCommentRow[]>`
    SELECT c.id,
           c."postId",
           c.content,
           c."createdAt",
           u.id        AS "userId",
           u.username,
           u."displayName"
    FROM "PostComment" AS c
    INNER JOIN "User" AS u ON u.id = c."userId"
    WHERE c.id = ${id}
  `;
  const countRows = await prisma.$queryRaw<RawInteractionCount[]>`
    SELECT COUNT(*)::bigint AS count FROM "PostComment" WHERE "postId" = ${postId}
  `;
  if (!rows.length) {
    throw new Error("Unable to create comment.");
  }
  return {
    comment: {
      id: rows[0].id,
      content: rows[0].content,
      createdAt: rows[0].createdAt,
      author: {
        id: rows[0].userId,
        username: rows[0].username,
        displayName: rows[0].displayName,
      },
    },
    commentCount: countRows[0] ? Number(countRows[0].count) : 0,
  };
}

export function serializePost(post: PostWithAuthor) {
  return {
    id: post.id,
    imageUrl: post.imageUrl,
    caption: post.caption,
    createdAt: post.createdAt.toISOString(),
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    viewerHasLiked: post.viewerHasLiked,
    comments: post.recentComments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.author.id,
        username: comment.author.username,
        displayName: comment.author.displayName,
      },
    })),
    author: {
      id: post.author.id,
      username: post.author.username,
      displayName: post.author.displayName,
    },
  };
}
