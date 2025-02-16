export interface Video{
    title: string;
    duration: string;
}

export interface Duration{
    hours: number;
    minutes: number;
    seconds: number;
}

export interface SpeedAjustedDuration{
    speed: number;
    duration: Duration;
}

export interface PlaylistAnalyzerConfig{
    youtubeApiKey: string;
    port: number;
}

export interface PlaylistDetails {
    title: string;
    totalVideos: number;
    totalDuration: Duration;
    videos: Video[];
}