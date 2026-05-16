from googleapiclient.discovery import build
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("YOUTUBE_API_KEY")

youtube = build(
    "youtube",
    "v3",
    developerKey=API_KEY
)

def search_youtube(topic):

    request = youtube.search().list(
        q=topic,
        part="snippet",
        type="video",
        maxResults=5
    )

    response = request.execute()

    videos = []

    for item in response["items"]:

        video_data = {
            "title": item["snippet"]["title"],
            "channel": item["snippet"]["channelTitle"],
            "description": item["snippet"]["description"],
            "video_id": item["id"]["videoId"]
        }

        videos.append(video_data)

    return videos