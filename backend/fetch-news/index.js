import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import https from 'https';

const client = new DynamoDBClient({ region: 'ap-south-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const TABLE_NAME = 'NewsArticles';

export const handler = async (event) => {
    try {
        const newsData = await fetchNewsFromAPI();

        // Log the full API response
        console.log('News API response:', newsData);

        // Validate NewsAPI response
        if (newsData.status !== 'ok' || !Array.isArray(newsData.articles)) {
            throw new Error(`News API error: ${newsData.status} - ${newsData.message || 'Unknown error'}`);
        }

        const processedArticles = await processAndStoreArticles(newsData.articles);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully processed ${processedArticles.length} articles`
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to fetch news',
                details: error.message
            })
        };
    }
};

function fetchNewsFromAPI() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'newsapi.org',
            path: `/v2/top-headlines?country=us&pageSize=20&apiKey=${NEWS_API_KEY}`,
            method: 'GET',
            headers: {
                'User-Agent': 'NewsAggregatorAWSLambda/1.0 (your-email@example.com)'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function processAndStoreArticles(articles) {
    const processedArticles = [];

    for (const article of articles) {
        if (!article.title || !article.publishedAt) continue;

        // Generate a unique id based on title
        const id = Buffer.from(article.title).toString('base64').substring(0, 50);
        const publishedAt = new Date(article.publishedAt).toISOString();

        const item = {
            id: id,
            publishedAt: publishedAt,
            title: article.title,
            description: article.description || '',
            url: article.url,
            urlToImage: article.urlToImage || '',
            source: article.source?.name || 'Unknown',
            author: article.author || 'Unknown',
            content: article.content || '',
            createdAt: new Date().toISOString()
        };

        try {
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: item,
                ConditionExpression: 'attribute_not_exists(id)'
            });

            await dynamodb.send(command);
            processedArticles.push(item);
        } catch (error) {
            if (error.name !== 'ConditionalCheckFailedException') {
                console.error('Error storing article:', error);
            }
            // Skip duplicate errors (ConditionalCheckFailedException)
        }
    }

    console.log(`Inserted ${processedArticles.length} new articles.`);
    return processedArticles;
}