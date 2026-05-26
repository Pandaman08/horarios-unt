import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = (req: any, res: any) => {
  try {
    return NextAuth(authOptions)(req, res);
  } catch (error) {
    console.error("[NextAuth Route Error]:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export { handler as GET, handler as POST };
