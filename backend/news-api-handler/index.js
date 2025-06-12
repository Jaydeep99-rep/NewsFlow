import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: 'ap-south-1' }); // your region
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'NewsArticles';

export const handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    try {
        if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        if (event.httpMethod === 'GET' && event.path === '/news') {
            return await getNews(event, headers);
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Not Found' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};

async function getNews(event, headers) {
    const queryParams = event.queryStringParameters || {};
    const limit = Math.min(parseInt(queryParams.limit) || 20, 50);
    const source = queryParams.source;

    const scanParams = {
        TableName: TABLE_NAME
    };

    if (source) {
        scanParams.FilterExpression = '#source = :source';
        scanParams.ExpressionAttributeNames = { '#source': 'source' };
        scanParams.ExpressionAttributeValues = { ':source': source };
    }

    try {
        const command = new ScanCommand(scanParams);
        const result = await dynamodb.send(command);

        const sortedItems = (result.Items || []).sort((a, b) =>
            new Date(b.publishedAt) - new Date(a.publishedAt)
        );

        console.log(`Returning ${sortedItems.length} articles`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                articles: sortedItems.slice(0, limit),
                count: sortedItems.length,
                lastUpdated: new Date().toISOString()
            })
        };
    } catch (error) {
        console.error('Error fetching news from DynamoDB:', error);
        throw error;
    }
}
