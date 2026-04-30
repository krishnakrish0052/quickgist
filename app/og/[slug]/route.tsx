import { ImageResponse } from "next/og";
import { getArticleBySlug } from "@/lib/repositories/platformRepository";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug);
  const title = article?.title ?? "QuickGist";
  const category = article?.category ?? "News";
  const dek = article?.dek ?? "Source-grounded news, explained clearly.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          padding: "60px",
          fontFamily: "system-ui, sans-serif"
        }}
      >
        {/* Category pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "24px"
          }}
        >
          <span
            style={{
              background: "#3b82f6",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "6px 14px",
              borderRadius: "100px"
            }}
          >
            {category}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            color: "#f8fafc",
            fontSize: title.length > 60 ? "42px" : "52px",
            fontWeight: 800,
            lineHeight: 1.15,
            flex: 1,
            display: "flex",
            alignItems: "flex-start"
          }}
        >
          {title}
        </div>

        {/* Dek */}
        <div
          style={{
            color: "#94a3b8",
            fontSize: "22px",
            lineHeight: 1.5,
            marginBottom: "36px",
            maxWidth: "900px"
          }}
        >
          {dek.length > 120 ? `${dek.slice(0, 117)}…` : dek}
        </div>

        {/* Footer bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "24px"
          }}
        >
          <span style={{ color: "#60a5fa", fontSize: "26px", fontWeight: 800 }}>QuickGist</span>
          <span style={{ color: "#475569", fontSize: "16px" }}>quickgist.app</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
