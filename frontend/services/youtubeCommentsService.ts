import { ErrorHandler } from '../utils/errorHandler';
import { CacheService } from '../utils/cacheService';

export interface YouTubeComment {
  id: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  textDisplay: string;
  textOriginal: string;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
  parentId?: string;
  replies?: YouTubeComment[];
  canReply: boolean;
  canRate: boolean;
  viewerRating?: 'like' | 'dislike' | 'none';
  totalReplyCount: number;
}

export interface CommentThread {
  id: string;
  snippet: {
    videoId: string;
    topLevelComment: {
      id: string;
      snippet: YouTubeComment;
    };
    totalReplyCount: number;
    canReply: boolean;
    isPublic: boolean;
  };
}

export interface CommentsResponse {
  comments: YouTubeComment[];
  nextPageToken?: string;
  totalResults: number;
}

export class YouTubeCommentsService {
  private static cache = new CacheService('youtube-comments');
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async getComments(videoId: string, pageToken?: string): Promise<CommentsResponse> {
    try {
      const cacheKey = `comments-${videoId}-${pageToken || 'first'}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      const tokenData = this.getStoredTokenData();
      if (!tokenData?.accessToken) {
        throw new Error('Authentication required');
      }

      // Get comment threads
      const threadsResponse = await this.fetchCommentThreads(videoId, pageToken);
      
      // Get replies for each thread
      const comments: YouTubeComment[] = [];
      for (const thread of threadsResponse.items) {
        const topComment = this.transformComment(thread.snippet.topLevelComment.snippet);
        topComment.id = thread.snippet.topLevelComment.id;
        topComment.parentId = undefined;
        topComment.totalReplyCount = thread.snippet.totalReplyCount;
        topComment.canReply = thread.snippet.canReply;
        
        // Get replies if any
        if (thread.snippet.totalReplyCount > 0) {
          const replies = await this.fetchReplies(thread.id);
          topComment.replies = replies;
        }
        
        comments.push(topComment);
      }

      const result: CommentsResponse = {
        comments,
        nextPageToken: threadsResponse.nextPageToken,
        totalResults: threadsResponse.pageInfo.totalResults,
      };

      await this.cache.set(cacheKey, result, this.CACHE_DURATION);
      return result;
    } catch (error) {
      console.error('Failed to fetch YouTube comments:', error);
      ErrorHandler.logError('youtube-comments-fetch', error, { videoId, pageToken });
      throw error;
    }
  }

  static async addComment(videoId: string, text: string, parentId?: string): Promise<YouTubeComment> {
    try {
      const tokenData = this.getStoredTokenData();
      if (!tokenData?.accessToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch('https://www.googleapis.com/youtube/v3/commentThreads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            videoId: videoId,
            topLevelComment: {
              snippet: {
                textOriginal: text,
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add comment: ${errorText}`);
      }

      const result = await response.json();
      const comment = this.transformComment(result.snippet.topLevelComment.snippet);
      comment.id = result.snippet.topLevelComment.id;
      comment.parentId = parentId;
      comment.totalReplyCount = 0;
      comment.canReply = true;

      // Clear cache for this video
      await this.cache.delete(`comments-${videoId}-first`);

      return comment;
    } catch (error) {
      console.error('Failed to add comment:', error);
      ErrorHandler.logError('youtube-comment-add', error, { videoId, text, parentId });
      throw error;
    }
  }

  static async likeComment(commentId: string): Promise<void> {
    try {
      const tokenData = this.getStoredTokenData();
      if (!tokenData?.accessToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch('https://www.googleapis.com/youtube/v3/comments/rate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: commentId,
          rating: 'like',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to like comment: ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
      ErrorHandler.logError('youtube-comment-like', error, { commentId });
      throw error;
    }
  }

  private static async fetchCommentThreads(videoId: string, pageToken?: string) {
    const tokenData = this.getStoredTokenData();
    
    const params = new URLSearchParams({
      part: 'snippet,replies',
      videoId: videoId,
      maxResults: '20',
      order: 'time',
      textFormat: 'plainText',
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch comment threads: ${errorText}`);
    }

    return await response.json();
  }

  private static async fetchReplies(parentId: string): Promise<YouTubeComment[]> {
    const tokenData = this.getStoredTokenData();
    
    const params = new URLSearchParams({
      part: 'snippet',
      parentId: parentId,
      maxResults: '10',
      textFormat: 'plainText',
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/comments?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch replies: ${errorText}`);
    }

    const result = await response.json();
    return result.items.map((item: any) => ({
      ...this.transformComment(item.snippet),
      id: item.id,
      parentId: parentId,
    }));
  }

  private static transformComment(snippet: any): YouTubeComment {
    return {
      id: '',
      authorDisplayName: snippet.authorDisplayName || 'Unknown',
      authorProfileImageUrl: snippet.authorProfileImageUrl || '',
      textDisplay: snippet.textDisplay || '',
      textOriginal: snippet.textOriginal || '',
      likeCount: parseInt(snippet.likeCount) || 0,
      publishedAt: snippet.publishedAt || new Date().toISOString(),
      updatedAt: snippet.updatedAt || new Date().toISOString(),
      canReply: snippet.canReply || false,
      canRate: snippet.canRate || false,
      viewerRating: snippet.viewerRating || 'none',
      totalReplyCount: 0,
    };
  }

  private static getStoredTokenData(): { accessToken: string } | null {
    try {
      const accessToken = localStorage.getItem('recordlane-access-token');
      if (!accessToken) return null;

      return { accessToken };
    } catch (error) {
      console.error('Failed to get stored token data:', error);
      return null;
    }
  }
}
