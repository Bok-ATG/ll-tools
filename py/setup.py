#!/usr/bin/env python3

from setuptools import setup, find_packages

setup(
    name="ll-tools",
    version="1.0.0",
    description="Simple tools for the ll",
    author="mk",
    packages=find_packages(),
    install_requires=[
        "youtube-transcript-api",
    ],
    entry_points={
        "console_scripts": [
            "get-yt-transcript=scripts.get_yt_transcript:main",
        ],
    },
    python_requires=">=3.7",
)