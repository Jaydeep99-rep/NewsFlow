# 📰 NewsFlow — Automated News Aggregation Platform (AWS)

A serverless news aggregator built entirely on AWS using Lambda, DynamoDB, API Gateway, EventBridge, and S3.

NewsFlow automatically fetches the latest news every 2 hours from [NewsAPI.org](https://newsapi.org), stores them in DynamoDB, exposes the data via a REST API, and serves a frontend using an S3-hosted static website — all within AWS Free Tier limits.

![image](https://github.com/user-attachments/assets/64be76b0-1e79-4409-93ee-8488dbdc784a)


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
- **HTML + CSS (dark mode UI) + JavaScript**

## 📌 Overview

Build a serverless news aggregator using AWS Console that:

- Fetches news from **NewsAPI**
- Stores news articles in **DynamoDB**
- Serves the data via **API Gateway**
- Hosts a modern **frontend on S3**

→ All within **AWS Free Tier**.

---

## ✅ Prerequisites

- 🗂️ AWS Account (Free Tier)
- 📰 NewsAPI.org account (Free)
- 💻 VS Code for frontend development
- 🧠 Basic understanding of AWS services

---

# 🚀 Setup Guide

---

## 🏁 Phase 1: Initial Setup

### Step 1️⃣ — Get NewsAPI Key

- Visit [https://newsapi.org](https://newsapi.org)
- Click **Get API Key**
- Sign up for a free account
- Copy your **API key** (you’ll need this later)

👉 **Note:** Free tier gives you **1000 requests/day**

---

### Step 2️⃣ — AWS Account Setup

- Sign in to **AWS Console**
- Make sure you are in region: **US East (N. Virginia)** → `us-east-1`  
✅ *Important for Free Tier and consistency*

---

## 🗄️ Phase 2: DynamoDB Setup

### Step 3️⃣ — Create DynamoDB Table

- Go to AWS Console → Search **"DynamoDB"** → Click **DynamoDB**
- Click **Create table**
- Fill in details:
  - Table name: `NewsArticles`
  - Partition key: `id` (String)
  - Sort key: `publishedAt` (String)
- Under **Settings** → Select **On-demand** (Free Tier friendly)
- Leave other settings as default
- Click **Create table**
- Wait for table status to become **Active**

---

## 🔐 Phase 3: IAM Role Setup

### Step 4️⃣ — Create Lambda Execution Role

- Go to AWS Console → Search **"IAM"** → Click **IAM**
- Click **Roles** in left sidebar
- Click **Create role**
- Select:
  - Trusted entity type: **AWS service**
  - Service: **Lambda**
- Click **Next**
- Search and select this policy:
  - **AWSLambdaBasicExecutionRole**
- Click **Next**
- Role name: `lambda-execution-role`
- Click **Create role**

---

### Step 5️⃣ — Add DynamoDB Permissions

- Find your newly created role: `lambda-execution-role`
- Click on role name
- Click **Add permissions** → **Create inline policy**
- Click **JSON** tab
- Paste this policy:

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
            ],
            "Resource": "arn:aws:dynamodb:us-east-1:*:table/NewsArticles"
        }
    ]
}

- Click **Next**
- Policy name: `lambda-dynamodb-policy`
- Click **Create policy**

---

## 🖥️ Phase 4: Lambda Functions

### Step 6️⃣ — Create News Fetcher Lambda Function

#### 6.1 — Create the Function

- Go to AWS Console → Search **"Lambda"** → Click **Lambda**
- Click **Create function**
- Select **Author from scratch**
- Fill details:
  - Function name: `fetch-news`
  - Runtime: `Node.js 18.x`
  - Architecture: `x86_64`
- Under **Permissions**:
  - Select **Use an existing role**
  - Choose: `lambda-execution-role`
- Click **Create function**

---

#### 6.2 — Add the Code

- Scroll to **Code source**
- Delete existing code in `index.js`
- Paste your working `fetch-news` Lambda code (from your guide).
- Click **Deploy**

---

#### 6.3 — Add Environment Variable

- Go to **Configuration** tab
- Click **Environment variables** in left sidebar
- Click **Edit**
- Click **Add environment variable**:
  - Key: `NEWS_API_KEY`
  - Value: Your NewsAPI key from **Step 1**
- Click **Save**

---

#### 6.4 — Adjust Settings

- Go to **Configuration** → **General configuration**
- Click **Edit**
- Timeout: `30 seconds`
- Memory: `128 MB`
- Click **Save**

---

### Step 7️⃣ — Create API Handler Lambda Function

#### 7.1 — Create the Function

- In Lambda console → Click **Create function**
- Select **Author from scratch**
- Fill details:
  - Function name: `news-api-handler`
  - Runtime: `Node.js 18.x`
  - Architecture: `x86_64`
- Under **Permissions**:
  - Select **Use an existing role**
  - Choose: `lambda-execution-role`
- Click **Create function**

---

#### 7.2 — Add the Code

- Delete existing code in `index.js`
- Paste your working `news-api-handler` Lambda code (from your guide).
- Click **Deploy**

---

#### 7.3 — Adjust Settings

- Go to **Configuration** → **General configuration**
- Click **Edit**
- Timeout: `10 seconds`
- Memory: `128 MB`
- Click **Save**

---

## 🌐 Phase 5: API Gateway Setup

### Step 8️⃣ — Create REST API

- Go to AWS Console → Search **"API Gateway"** → Click **API Gateway**
- Click **Create API**
- Choose **REST API** (not private)
- Click **Build**
- Fill details:
  - API name: `news-aggregator-api`
  - Description: `News Aggregator REST API`
  - Endpoint Type: `Regional`
- Click **Create API**

---

### Step 9️⃣ — Create Resource and Methods

#### 9.1 — Create `/news` Resource

- Click **Actions** → **Create Resource**
- Resource Name: `news`
- Resource Path: `/news`
- Leave **Enable API Gateway CORS** unchecked → (handled manually in Lambda)
- Click **Create Resource**

---

#### 9.2 — Create GET Method

- Select `/news` resource
- Click **Actions** → **Create Method**
- Select **GET** from dropdown → Click ✓
- Fill integration details:
  - Integration type: **Lambda Function**
  - Use Lambda Proxy integration: ✅ Check this
  - Lambda Region: `us-east-1`
  - Lambda Function: `news-api-handler`
- Click **Save**
- Click **OK** to grant permission

---

#### 9.3 — Create OPTIONS Method (for CORS)

- Select `/news` resource
- Click **Actions** → **Create Method**
- Select **OPTIONS** from dropdown → Click ✓
- Fill integration details:
  - Integration type: **Lambda Function**
  - Use Lambda Proxy integration: ✅ Check this
  - Lambda Region: `us-east-1`
  - Lambda Function: `news-api-handler`
- Click **Save**
- Click **OK** to grant permission

---

### Step 🔟 — Deploy API

- Click **Actions** → **Deploy API**
- Deployment stage: `[New Stage]`
- Stage name: `prod`
- Click **Deploy**

📌 **IMPORTANT:** Copy your Invoke URL — you’ll need it for frontend:

https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/news

markdown
Copy
Edit

---

## 🕑 Phase 6: EventBridge Scheduler

### Step 1️⃣1️⃣ — Create Scheduled Rule

- Go to AWS Console → Search **"EventBridge"** → Click **Amazon EventBridge**
- Click **Rules** in left sidebar
- Click **Create rule**
- Fill details:
  - Name: `fetch-news-schedule`
  - Description: `Fetch news every 2 hours`
  - Event bus: `default`
  - Rule type: `Schedule`
- Click **Next**
- Schedule pattern: **Rate-based schedule**
  - Rate expression: `rate(2 hours)`
- Click **Next**
- Target type: **AWS service**
- Select a target: **Lambda function**
  - Function: `fetch-news`
- Click **Next**
- Review → Click **Create rule**

---

---

🖥️ Phase 7: Frontend Hosting on S3 (Static Website)
Now that your backend is ready and the API is live, let’s host the frontend on an S3 bucket as a static website.

Step 1️⃣ — Prepare Frontend Files
Prepare a simple frontend (you can use HTML, CSS, JS):

index.html

style.css (optional)

app.js (calls your REST API and renders news)

In your app.js, make sure to point API requests to:

javascript
Copy
Edit
const API_URL = 'https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/news';
👉 Replace YOUR-API-ID with your real API Gateway ID.

Step 2️⃣ — Create an S3 Bucket
Go to AWS Console → Search "S3" → Click S3

Click Create bucket

Fill in details:

Bucket name: Example → newsflow-frontend-YOURNAME (must be globally unique)

AWS Region: us-east-1

Under Object Ownership:

Select: ACLs disabled (default)

Under Block Public Access settings:

Uncheck Block all public access

Confirm you want to allow public access (checkbox)

Click Create bucket

Step 3️⃣ — Upload Frontend Files
Click your newly created bucket name

Click Upload

Upload:

index.html

style.css

app.js

Click Upload

Step 4️⃣ — Enable Static Website Hosting
Go to your S3 bucket → Click Properties tab

Scroll down to Static website hosting

Click Edit

Enable Static website hosting

Hosting type: Host a static website

Index document: index.html

(Optional) Error document: index.html or error.html

Click Save changes

Step 5️⃣ — Set Bucket Policy for Public Access
You need to allow public read access to your bucket.

Go to your S3 bucket → Permissions tab

Under Bucket policy → Click Edit

Paste the following policy:

json
Copy
Edit
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
👉 Replace YOUR-BUCKET-NAME with your actual bucket name.

Click Save changes

Step 6️⃣ — Access Your Frontend
Go to your bucket → Properties tab

Scroll to Static website hosting

Copy the Bucket website endpoint URL → Example:

arduino
Copy
Edit
http://newsflow-frontend-YOURNAME.s3-website-us-east-1.amazonaws.com
Paste this URL into your browser → You should see your NewsFlow frontend running and fetching data from the API. 🎉

## 🧪 Phase 8: Testing and Initial Data

### Step 1️⃣8️⃣ — Test Lambda Manually

- Go to Lambda → `fetch-news` function
- Click **Test** tab
- Create new test event:
  - Event name: `test-fetch`
  - Use default event template
- Click **Save**
- Click **Test**
- ✅ Check response → should show success message

---

### Step 1️⃣9️⃣ — Verify DynamoDB Data

- Go to AWS Console → Search **"DynamoDB"** → Click **DynamoDB**
- Click your table: `NewsArticles`
- Click **Explore table items** (or **Items** tab)
- You should see articles with columns:
  - `id`
  - `publishedAt`
  - `title`
  - `description`
  - `url`
  - `source`
  - `author`
  - `content`
  - `createdAt`

✅ If you see rows populated — **your system is working!**

---

# 🎉 Congratulations!

You have successfully built a **fully serverless news aggregator** with AWS. 🚀

---
