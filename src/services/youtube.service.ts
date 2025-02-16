// src/services/youtube.service.ts
import { google, youtube_v3 } from 'googleapis';
import { PlaylistDetails, Video } from '../types';
import { parseDuration, formatDuration } from '../utils/duration';
import logger from '../utils/logger';

export class YouTubeService {
  private youtube: youtube_v3.Youtube;

  constructor(apiKey: string) {
    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
  }

  async getPlaylistDetails(playlistId: string): Promise<PlaylistDetails> {
    try {
      const playlistData = await this.youtube.playlists.list({
        part: ['snippet'],
        id: [playlistId]
      });

      const videos: Video[] = [];
      let totalDurationSeconds = 0;
      let nextPageToken: string | undefined | null = undefined;

      do {
        const playlistItemsResponse: youtube_v3.Schema$PlaylistItemListResponse = (
          await this.youtube.playlistItems.list({
            part: ['contentDetails'],
            playlistId: playlistId,
            maxResults: 50,
            pageToken: nextPageToken || undefined
          })
        ).data;

        const videoIds = playlistItemsResponse.items
          ?.map(item => item.contentDetails?.videoId)
          .filter((id): id is string => !!id) || [];

        if (videoIds.length > 0) {
          const videoDetailsResponse: youtube_v3.Schema$VideoListResponse = (
            await this.youtube.videos.list({
              part: ['contentDetails', 'snippet'],
              id: videoIds
            })
          ).data;

          videoDetailsResponse.items?.forEach(video => {
            if (video.contentDetails?.duration) {
              const durationSeconds = parseDuration(video.contentDetails.duration);
              totalDurationSeconds += durationSeconds;
              videos.push({
                title: video.snippet?.title || 'Unknown',
                duration: video.contentDetails.duration
              });
            }
          });
        }

        nextPageToken = playlistItemsResponse.nextPageToken || null;
      } while (nextPageToken);

      return {
        title: playlistData.data.items?.[0]?.snippet?.title || 'Unknown Playlist',
        totalVideos: videos.length,
        totalDuration: formatDuration(totalDurationSeconds),
        videos
      };
    } catch (error) {
      logger.error('Failed to fetch playlist details', { playlistId, error });
      throw new Error('Failed to fetch playlist details');
    }
  }
}