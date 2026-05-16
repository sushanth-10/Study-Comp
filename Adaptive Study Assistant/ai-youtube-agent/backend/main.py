from fastapi import FastAPI
from youtube_api import search_youtube
from query_generator import generate_search_queries

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AI YouTube Agent Running"}

@app.get("/search")
def search(topic: str):

    queries = generate_search_queries(topic)

    all_results = []

    for query in queries:

        videos = search_youtube(query)

        all_results.append({
            "query": query,
            "videos": videos
        })

    return {
        "topic": topic,
        "generated_queries": queries,
        "results": all_results
    }