import { NextApiRequest } from "next";
import { NextApiResponseWithSocket, initSocketServer } from "@/lib/socket-server";

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (req.method === "GET") {
    initSocketServer(res);
    res.end();
  } else {
    res.status(405).end();
  }
}
