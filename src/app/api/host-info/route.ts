import { NextResponse } from "next/server";
import os from "node:os";

export async function GET() {
  try {
    const interfaces = os.networkInterfaces();
    let lanIp: string | null = null;
    let tailscaleIp: string | null = null;

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      for (const addr of addrs) {
        if (addr.family === "IPv4" && !addr.internal) {
          if (name.toLowerCase().includes("tailscale")) {
            tailscaleIp = addr.address;
          } else if (!lanIp) {
            lanIp = addr.address;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      lanIp,
      tailscaleIp,
      preferredIp: lanIp || tailscaleIp || "localhost"
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to detect host IP" },
      { status: 500 }
    );
  }
}
