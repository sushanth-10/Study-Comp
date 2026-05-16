from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

def generate_search_queries(topic):

    prompt = f"""
    Generate 3 high-quality YouTube search queries
    for learning this topic:

    Topic: {topic}

    Return ONLY a Python list.

    Example:
    ["query1", "query2", "query3"]
    """

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    content = response.choices[0].message.content

    queries = eval(content)

    return queries