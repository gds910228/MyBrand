// 评论类型定义
export interface CommentType {
  id: string;
  postId: string;
  parentId: string | null; // null表示顶级评论，非null表示回复
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  replies?: CommentType[];
}

// 示例评论数据
export const comments: CommentType[] = [
  {
    id: 'comment-1',
    postId: 'post-getting-started-with-nextjs-14',
    parentId: null,
    author: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80'
    },
    content: 'Great article! I\'ve been trying to learn Next.js and this was very helpful.',
    createdAt: '2023-10-26T08:30:00Z',
    replies: [
      {
        id: 'comment-2',
        postId: 'post-getting-started-with-nextjs-14',
        parentId: 'comment-1',
        author: {
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80'
        },
        content: 'Thanks Alice! I\'m glad you found it useful. Let me know if you have any questions.',
        createdAt: '2023-10-26T09:15:00Z',
      }
    ]
  },
  {
    id: 'comment-3',
    postId: 'post-getting-started-with-nextjs-14',
    parentId: null,
    author: {
      name: 'Robert Smith',
      email: 'robert@example.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80'
    },
    content: 'I\'m still confused about the App Router. Could you explain more about how it differs from the Pages Router?',
    createdAt: '2023-10-27T10:45:00Z',
  },
  {
    id: 'comment-4',
    postId: 'post-2',
    parentId: null,
    author: {
      name: 'Emily Chen',
      email: 'emily@example.com',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=761&q=80'
    },
    content: 'Tailwind CSS has been a game-changer for my workflow. Your article covers all the key points!',
    createdAt: '2023-10-16T14:20:00Z'
  }
];

// 获取指定文章的评论
export function getCommentsByPostId(postId: string): CommentType[] {
  return comments.filter(comment => comment.postId === postId);
}

// 添加评论
export function addComment(comment: Omit<CommentType, 'id' | 'createdAt'>): CommentType {
  const newComment: CommentType = {
    ...comment,
    id: `comment-${comments.length + 1}`,
    createdAt: new Date().toISOString()
  };
  
  comments.push(newComment);
  return newComment;
}

// 添加回复
export function addReply(reply: Omit<CommentType, 'id' | 'createdAt'>): CommentType {
  const newReply: CommentType = {
    ...reply,
    id: `comment-${comments.length + 1}`,
    createdAt: new Date().toISOString()
  };
  
  // 找到父评论并添加回复
  const parentComment = comments.find(c => c.id === reply.parentId);
  if (parentComment) {
    if (!parentComment.replies) {
      parentComment.replies = [];
    }
    // 避免重复添加
    const replyExists = parentComment.replies.some(r => 
      r.author && r.author.name === newReply.author?.name && 
      r.content === newReply.content
    );
    if (!replyExists) {
      parentComment.replies.push(newReply);
    }
  } else {
    // 如果父评论是回复，则需要递归查找
    for (const comment of comments) {
      if (comment.replies) {
        const parent = comment.replies.find(r => r.id === reply.parentId);
        if (parent) {
          if (!parent.replies) {
            parent.replies = [];
          }
          // 避免重复添加
          const replyExists = parent.replies.some(r => 
            r.author && r.author.name === newReply.author?.name && 
            r.content === newReply.content
          );
          if (!replyExists) {
            parent.replies.push(newReply);
          }
          break;
        }
      }
    }
  }
  
  return newReply;
} 