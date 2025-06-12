# 📰 NewsFlow — Automated News Aggregation Platform (AWS)

A serverless news aggregator built entirely on AWS using Lambda, DynamoDB, API Gateway, EventBridge, and S3.

NewsFlow automatically fetches the latest news every 2 hours from [NewsAPI.org](https://newsapi.org), stores them in DynamoDB, exposes the data via a REST API, and serves a frontend using an S3-hosted static website — all within AWS Free Tier limits.

---

## 🚀 Features

- Automated news fetching every 2 hours (EventBridge → Lambda)
- Persistent news storage in DynamoDB (deduplication logic applied)
- REST API to serve news articles with filtering and sorting options
- Static frontend hosted via S3
- 100% serverless — no servers to manage

---

## 🗺️ Architecture

EventBridge --> Lambda (fetch-news) --> NewsAPI.org --> DynamoDB
↑
Frontend (HTML/CSS/JS) <-- API Gateway <-- Lambda (news-api-handler)

---

## ⚙️ Tech Stack

- **AWS Lambda** (Node.js 18.x)
- **DynamoDB** (NoSQL persistent storage)
- **API Gateway** (REST API)
- **EventBridge** (scheduled news fetching)
- **S3** (static frontend hosting)
- **NewsAPI.org** (news source)
- **HTML + CSS (dark mode UI) +  JavaScript**
