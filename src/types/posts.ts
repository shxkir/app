export type FeedPost = {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
  comments: FeedPostComment[];
  author: {
    id: string;
    username: string;
    displayName: string | null;
  };
};

export type FeedPostComment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
  };
};
