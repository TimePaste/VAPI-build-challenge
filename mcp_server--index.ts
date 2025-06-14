import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export interface Env {
	brave_search_api_key: string;
}

// Define our MCP agent with tools
export class MyMCP extends McpAgent<Env, {}> {
	server = new McpServer({
		name: "MCP4VAPI",
		version: "1.0.0",
	});

	async init() {
		// Current Time tool
		this.server.tool(
			"getcurrenttime",
			"Get the current time in a specified timezone (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo')",
			{ timezone: z.string().optional().default("UTC") },
			async ({ timezone }) => {
				try {
					const now = new Date();
					const formatter = new Intl.DateTimeFormat('en-US', {
						timeZone: timezone,
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
						hour12: true,
						timeZoneName: 'short'
					});

					const formattedTime = formatter.format(now);

					return {
						content: [{ type: "text", text: formattedTime }],
					};
				} catch (error: unknown) {
					// Properly handle the unknown error type
					let errorMessage = "Unknown error occurred";
					if (error instanceof Error) {
						errorMessage = error.message;
					}
					return {
						content: [{
							type: "text",
							text: `Error: ${errorMessage}. Please provide a valid timezone identifier (e.g., "America/New_York", "Europe/London", "Asia/Tokyo").`
						}],
					};
				}
			}
		);

		// Random number generator tool
		this.server.tool(
			"getrandomnumber",
			"Generate a random number",
			{ x: z.number(), y: z.number() },
			async ({ x, y }) => ({
				content: [{ type: "text", text: String(Math.floor(Math.random() * (y - x + 1)) + x) }],
			})
		);

		// Web search tool
		this.server.tool(
			"web_search",
			"Search the internet",
			{
				query: z.string().describe("Search query"),
				freshness: z.enum(["pd", "pw", "pm", "py"]).optional().describe("Freshness filter (pd=past day, pw=past week, pm=past month, py=past year)"),
			},
			async (params) => {
				try {
					// Build request body with only q and freshness properties
					const requestBody: { q: string; freshness?: string } = {
						q: params.query,
						freshness: params.freshness
					};

					// Add freshness if provided
					if (params.freshness) {
						requestBody.freshness = params.freshness;
					}

					const response = await fetch("https://webhook.latenode.com/........", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(requestBody)
					});

					if (!response.ok) {
						throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
					}

					const data = await response.json();

					// Create a comprehensive response
					let responseText = `Search Results:\n\n`;
					responseText += JSON.stringify(data);

					return {
						content: [
							{
								type: "text",
								text: responseText
							}
						],
						isError: false
					};

				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
					return {
						content: [
							{
								type: "text",
								text: `Error performing search: ${errorMessage}`
							}
						],
						isError: true
					};
				}
			}
		);

		// News search tool
		this.server.tool(
			"news_search",
			"Get the news",
			{
				query: z.string().describe("Search query"),
				freshness: z.enum(["pd", "pw", "pm", "py"]).optional().describe("Freshness filter (pd=past day, pw=past week, pm=past month, py=past year)"),
			},
			async (params) => {
				try {
					// Build request body with only q and freshness properties
					const requestBody: { q: string; freshness?: string } = {
						q: params.query,
						freshness: params.freshness
					};

					// Add freshness if provided
					if (params.freshness) {
						requestBody.freshness = params.freshness;
					}

					const response = await fetch("https://webhook.latenode.com/........", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(requestBody)
					});

					if (!response.ok) {
						throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
					}

					const data = await response.json();

					// Create a comprehensive response
					let responseText = `News Results:\n\n`;
					responseText += JSON.stringify(data);

					return {
						content: [
							{
								type: "text",
								text: responseText
							}
						],
						isError: false
					};

				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
					return {
						content: [
							{
								type: "text",
								text: `Error performing search: ${errorMessage}`
							}
						],
						isError: true
					};
				}
			}
		);

		// Weather lookup tool
		this.server.tool(
			"weather_lookup",
			"Find current and future weather information",
			{
				location: z.string().describe("Location, for example city, airport code, zip code, or GPS coordinates"),
				options: z.string().optional().describe("'m' for metric, 'u' for USCS fareinheit, '0' for current weather, '1' for current weather and today's forecast, '2' for current weather and today's forecast and tomorrow's forecast. Concatenate values such as 1m for the forecast today in metric."),
			},
			async (params) => {
				try {
					// Build request body with only q and freshness properties
					const requestBody: { location: string; options?: string } = {
						location: params.location,
						options: params.options
					};

					const response = await fetch("https://webhook.latenode.com/........", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(requestBody)
					});

					if (!response.ok) {
						throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
					}

					const data = await response.json();

					// Create a comprehensive response
					let responseText = ``;
					responseText += JSON.stringify(data);

					return {
						content: [
							{
								type: "text",
								text: responseText
							}
						],
						isError: false
					};

				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
					return {
						content: [
							{
								type: "text",
								text: `Error performing search: ${errorMessage}`
							}
						],
						isError: true
					};
				}
			}
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
