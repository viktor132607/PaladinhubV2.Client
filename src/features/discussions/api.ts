import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";

export type DiscussionListItem = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdOn: string;
  commentsCount: number;
  likes: number;
  canDelete: boolean;
};

export type DiscussionComment = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdOn: string;
  likes: number;
  likedByCurrentUser: boolean;
};

export type DiscussionDetails = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdOn: string;
  editedOn: string | null;
  likes: number;
  likedByCurrentUser: boolean;
  canDelete: boolean;
  comments: DiscussionComment[];
};

export type CreateDiscussionInput = {
  title: string;
  content: string;
};

export async function getDiscussions(
  signal?: AbortSignal,
): Promise<DiscussionListItem[]> {
  const response = await fetchBackend(
    backendEndpoints.discussions.index,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );

  return readApiJson<DiscussionListItem[]>(response);
}

export async function getDiscussion(
  id: string,
  signal?: AbortSignal,
): Promise<DiscussionDetails> {
  const response = await fetchBackend(
    backendEndpoints.discussions.details(id),
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );

  return readApiJson<DiscussionDetails>(response);
}

export async function createDiscussion(
  input: CreateDiscussionInput,
): Promise<DiscussionDetails> {
  const response = await fetchBackend(
    backendEndpoints.discussions.create,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  return readApiJson<DiscussionDetails>(response);
}

export async function deleteDiscussion(
  id: string,
): Promise<void> {
  const response = await fetchBackend(
    backendEndpoints.discussions.delete(id),
    {
      method: "DELETE",
      cache: "no-store",
    },
  );

  await readApiJson<null>(response);
}

export async function toggleDiscussionLike(
  id: string,
): Promise<DiscussionDetails> {
  const response = await fetchBackend(
    backendEndpoints.discussions.like(id),
    {
      method: "POST",
      cache: "no-store",
    },
  );

  return readApiJson<DiscussionDetails>(response);
}

export async function addDiscussionComment(
  id: string,
  content: string,
): Promise<DiscussionDetails> {
  const response = await fetchBackend(
    backendEndpoints.discussions.addComment(id),
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    },
  );

  return readApiJson<DiscussionDetails>(response);
}

export async function toggleDiscussionCommentLike(
  postId: string,
  commentId: string,
): Promise<DiscussionDetails> {
  const response = await fetchBackend(
    backendEndpoints.discussions.likeComment(
      postId,
      commentId,
    ),
    {
      method: "POST",
      cache: "no-store",
    },
  );

  return readApiJson<DiscussionDetails>(response);
}
