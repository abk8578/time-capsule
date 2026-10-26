import { ImageResponse } from "next/og";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    // Validate token format
    if (!token || typeof token !== "string" || token.length < 16) {
      return new Response("Not found", { status: 404 });
    }

    // Rate limiting by IP
    const ip = getClientIp(req.headers);
    const rateCheck = checkRateLimit(`og_share:${ip}`, 60, 60 * 1000);
    if (!rateCheck.success) {
      return new Response("Too Many Requests", { status: 429 });
    }

    await connectToDatabase();

    // Strict whitelist: NEVER select content!
    const capsule = await Capsule.findOne({ shareToken: token })
      .select("title unlockAt openedEarlyAt createdAt shareIncludeTitle")
      .lean();

    if (!capsule) {
      return new Response("Not found", { status: 404 });
    }

    const now = new Date();
    const isUnlocked = capsule.unlockAt <= now || !!capsule.openedEarlyAt;
    if (!isUnlocked) {
      return new Response("Not found", { status: 404 });
    }

    // Compute time travelled
    const createdDate = new Date(capsule.createdAt);
    const openedDate = capsule.openedEarlyAt
      ? new Date(capsule.openedEarlyAt)
      : new Date(capsule.unlockAt);

    const diffMs = Math.max(0, openedDate.getTime() - createdDate.getTime());
    const totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const totalYears = Math.floor(totalDays / 365);
    const totalMonths = Math.floor(totalDays / 30);

    let timePhrase = "Maine kuch samay pehle yeh likha tha";
    if (totalYears >= 1) {
      timePhrase = `Maine ${totalYears} saal pehle yeh likha tha`;
    } else if (totalMonths >= 1) {
      timePhrase = `Maine ${totalMonths} mahine pehle yeh likha tha`;
    } else {
      timePhrase = `Maine ${Math.max(1, totalDays)} din pehle yeh likha tha`;
    }

    const createdFormatted = createdDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const openedFormatted = openedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const displayTitle =
      capsule.shareIncludeTitle && capsule.title ? capsule.title : null;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0B0F14",
            padding: "60px 80px",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          {/* Subtle celestial starlight ambient gradient */}
          <div
            style={{
              position: "absolute",
              top: "-120px",
              left: "20%",
              width: "600px",
              height: "400px",
              background:
                "radial-gradient(circle, rgba(242, 184, 75, 0.15) 0%, rgba(11, 15, 20, 0) 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-100px",
              right: "15%",
              width: "500px",
              height: "400px",
              background:
                "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(11, 15, 20, 0) 70%)",
            }}
          />

          {/* Top Brand Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  backgroundColor: "#F2B84B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0B0F14",
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                ⏳
              </div>
              <span
                style={{
                  color: "#F3EBDD",
                  fontSize: "22px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                Time Capsule
              </span>
            </div>

            <div
              style={{
                padding: "8px 18px",
                borderRadius: "9999px",
                border: "1px solid rgba(242, 184, 75, 0.35)",
                backgroundColor: "rgba(242, 184, 75, 0.1)",
                color: "#F2B84B",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Unsealed Star
            </div>
          </div>

          {/* Center Main Message */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              maxWidth: "960px",
              zIndex: 10,
              gap: "20px",
            }}
          >
            <span
              style={{
                color: "#94A3B8",
                fontSize: "20px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              A Memory Returned From Orbit
            </span>

            <h1
              style={{
                color: "#F3EBDD",
                fontSize: "56px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              &ldquo;{timePhrase}&rdquo;
            </h1>

            {displayTitle && (
              <div
                style={{
                  color: "#F2B84B",
                  fontSize: "26px",
                  fontWeight: 600,
                  fontStyle: "italic",
                  maxWidth: "800px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                &mdash; {displayTitle} &mdash;
              </div>
            )}
          </div>

          {/* Bottom Coordinates & Spacetime Line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              paddingTop: "24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              zIndex: 10,
              color: "#94A3B8",
              fontSize: "16px",
            }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
              <span>Sealed on </span>
              <strong style={{ color: "#F3EBDD" }}>{createdFormatted}</strong>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#F2B84B",
                fontWeight: 600,
              }}
            >
              <span>Traveled {totalDays} days in spacetime</span>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <span>Arrived on </span>
              <strong style={{ color: "#F3EBDD" }}>{openedFormatted}</strong>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, s-maxage=60",
        },
      }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[OG Image Generation Error]:", msg);
    return new Response("Not found", { status: 404 });
  }
}
