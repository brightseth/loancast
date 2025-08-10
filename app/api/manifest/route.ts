import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    version: "1",
    name: "LoanCast",
    iconUrl: `${process.env.NEXT_PUBLIC_APP_URL}/brand/LoanCast_Icon_Square.png`,
    splashImageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/brand/LoanCast_Social_Preview.png`,
    splashBackgroundColor: "#6936F5",
    homeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/miniapp`,
    description: "Borrow from friends. No banks, no credit checks, no collateral. Fixed 2% monthly rate on USDC.",
    shortName: "LoanCast",
    colors: {
      primary: "#6936F5",
      primaryText: "#FFFFFF",
      secondary: "#F3F4F6",
      secondaryText: "#1F2937"
    },
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/miniapp`,
    categories: ["finance", "social"],
    author: {
      name: "LoanCast",
      url: process.env.NEXT_PUBLIC_APP_URL
    },
    accountAssociation: {
      header: "eyJmaWQiOjUwNDYsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg1MDFhYzdFMzJDOUVhNUE4ZjA2ODRjZTJBMTdFOTkwZDgzMzVGQjY0In0",
      payload: "eyJkb21haW4iOiJsb2FuY2FzdC5hcHAifQ",
      signature: "MHgyNmIwNDFmMzkyYWQwYjdkMDU5NzBkY2UwMmY0YTFhZTU2ZGZhYWZjZWI3YWE3ODM5YjM3ZGQ2OTQ3NmU3YjcyM2ZjNTM3NDI0MWU5NWM3MjE3ODk5YTE3NTc0MjE4YWE4MjZkM2NjY2VkYTQ3OWQ5NTU1NWY5NzM0YjAzOTJlZjFj"
    }
  }

  return NextResponse.json(manifest)
}