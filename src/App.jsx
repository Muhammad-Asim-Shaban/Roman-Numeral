import { useState, useRef, useCallback } from "react";

const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
  "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC", "C", "D", "M"];

export default function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    setError(null);
    setPrediction(null);
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handlePredict = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const formData = new FormData();
      formData.append("file", image);
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setPrediction(data);
    } catch {
      setError("Could not connect to the prediction server. Make sure FastAPI is running on port 8000.");
    }
    setLoading(false);
  };

  const infoItems = [
    { icon: "🏛", label: "Architecture", val: "CNN" },
    { icon: "🎯", label: "Task", val: "Classification" },
    { icon: "🖼", label: "Input Size", val: "50 × 50 px" },
    { icon: "⚡", label: "Backend", val: "FastAPI" },
  ];

  return (
    <div style={s.root}>
      {/* Floating background numerals */}
      <div style={s.bgLayer}>
        {romanNumerals.map((r, i) => (
          <span key={i} style={{
            ...s.floatingNumeral,
            left: `${(i * 37) % 95}%`,
            top: `${(i * 53) % 90}%`,
            animationDelay: `${(i * 0.7) % 8}s`,
            fontSize: `${1.2 + (i % 3) * 0.8}rem`,
            opacity: 0.04 + (i % 4) * 0.02,
          }}>{r}</span>
        ))}
      </div>

      {/* ── FULL WIDTH LAYOUT ── */}
      <div style={s.page}>

        {/* Header Section */}
        <div style={s.header}>
          <div style={s.chip}>CNN · Image Recognition</div>
          <h1 style={s.title}>
            <span style={s.titleAccent}>ROMAN</span>{" "}
            NUMERAL{" "}
            {/* <span style={s.titleMuted}>ORACLE</span> */}
          </h1>
          <p style={s.subtitle}>
            Upload an image of a Roman numeral — the model will read the ancient script.
          </p>
        </div>

        {/* Info Cards — full width */}
        <div style={s.infoGrid}>
          {infoItems.map((item) => (
            <div key={item.label} style={s.infoCard}>
              <span style={s.infoIcon}>{item.icon}</span>
              <span style={s.infoLabel}>{item.label}</span>
              <span style={s.infoVal}>{item.val}</span>
            </div>
          ))}
        </div>

        {/* Main two-column area: drop zone + result */}
        <div style={s.mainRow}>
          {/* Left: upload + button + error */}
          <div style={s.leftCol}>
            {/* Drop Zone */}
            <div
              style={{
                ...s.dropzone,
                ...(dragging ? s.dropzoneActive : {}),
                ...(preview ? s.dropzoneWithImage : {}),
              }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
            >
              <input ref={fileRef} type="file" accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])} />

              {preview ? (
                <div style={s.previewWrapper}>
                  <img src={preview} alt="preview" style={s.previewImg} />
                  <div style={s.previewHint}>Click to change image</div>
                </div>
              ) : (
                <div style={s.dropContent}>
                  <div style={s.uploadIconWrap}>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.3"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p style={s.dropText}>{dragging ? "Release to upload" : "Drop image here"}</p>
                  <p style={s.dropSubText}>or click to browse · PNG, JPG, WEBP</p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={s.errorBox}>
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Predict Button */}
            <button
              style={{
                ...s.btn,
                ...(loading ? s.btnLoading : {}),
                ...(!image ? s.btnDisabled : {}),
              }}
              onClick={handlePredict}
              disabled={!image || loading}
            >
              {loading ? (
                <span style={s.btnInner}>
                  <span style={s.spinner} />
                  Analyzing...
                </span>
              ) : (
                <span style={s.btnInner}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Predict Numeral
                </span>
              )}
            </button>
          </div>

          {/* Right: Result (always visible, shows placeholder when no prediction) */}
          <div style={s.rightCol}>
            {prediction
              ? <ResultCard prediction={prediction} />
              : <EmptyResult />
            }
          </div>
        </div>

        <footer style={s.footer}>
          Roman Numeral CNN · FastAPI + React · Trained on custom dataset
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Raleway:wght@300;400;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { min-height: 100%; width: 100%; }
        body { background: #0a0a0f; }

        @keyframes floatDrift {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-22px) rotate(5deg); }
        }
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 28px rgba(196,160,100,.25); }
          50%      { box-shadow: 0 0 56px rgba(196,160,100,.55); }
        }
        @keyframes resultReveal {
          from { opacity:0; transform:scale(.94) translateY(16px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes fillBar { from { width: 0%; } }
        @keyframes gradientShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes emptyPulse {
          0%,100% { opacity: 0.3; }
          50%      { opacity: 0.6; }
        }

        @media (max-width: 900px) {
          .main-row { flex-direction: column !important; }
          .info-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

function EmptyResult() {
  return (
    <div style={s.emptyCard}>
      <div style={s.emptyGlyph}>?</div>
      <p style={s.emptyText}>Your prediction will appear here</p>
      <p style={s.emptySubText}>Upload an image and click Predict</p>
    </div>
  );
}

function ResultCard({ prediction }) {
  return (
    <div style={s.resultCard}>
      <div style={s.resultGlow} />
      <div style={s.resultTopRow}>
        <span style={s.resultLabel}>Prediction</span>
        <span style={s.confBadge}>{prediction.confidence}% confident</span>
      </div>
      <div style={s.resultNumeral}>{prediction.prediction}</div>
      <div style={s.confBar}>
        <div style={{ ...s.confFill, width: `${prediction.confidence}%` }} />
      </div>
      <div style={s.top3Title}>Top Predictions</div>
      <div style={s.top3List}>
        {prediction.top3.map((item, i) => (
          <div key={i} style={{ ...s.top3Row, ...(i === 0 ? s.top3RowFirst : {}) }}>
            <span style={s.top3Rank}>#{i + 1}</span>
            <span style={s.top3Label}>{item.label}</span>
            <div style={s.top3BarWrap}>
              <div style={{ ...s.top3BarFill, width: `${item.confidence}%` }} />
            </div>
            <span style={s.top3Pct}>{item.confidence}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const gold = (a = 1) => `rgba(196,160,100,${a})`;

const s = {
  root: {
    minHeight: "100vh",
    width: "100vw",
    background: "linear-gradient(135deg,#0a0a0f 0%,#0f0f1a 50%,#0a0a0f 100%)",
    fontFamily: "'Raleway',sans-serif",
    color: "#e8dcc8",
    overflowX: "hidden",
    position: "relative",
  },
  bgLayer: {
    position: "fixed", inset: 0,
    pointerEvents: "none", zIndex: 0, overflow: "hidden",
  },
  floatingNumeral: {
    position: "absolute",
    fontFamily: "'Cinzel',serif",
    color: "#c4a064",
    animation: "floatDrift 12s ease-in-out infinite",
    userSelect: "none",
  },

  /* Full-width page — no maxWidth, full 100vw */
  page: {
    position: "relative", zIndex: 1,
    width: "100%",
    padding: "56px 60px 72px",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "32px",
    animation: "pageIn 0.75s ease both",
  },

  /* Centered header block */
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    textAlign: "center",
  },

  chip: {
    border: `1px solid ${gold(0.4)}`,
    borderRadius: "100px",
    padding: "5px 20px",
    fontSize: "0.7rem",
    letterSpacing: "0.16em",
    color: "#c4a064",
    textTransform: "uppercase",
    alignSelf: "center",
  },

  title: {
    fontFamily: "'Cinzel',serif",
    fontSize: "clamp(2rem, 6vw, 4rem)",
    fontWeight: 900,
    lineHeight: 1.15,
    letterSpacing: "0.05em",
    textAlign: "center",
    color: "#e8dcc8",
  },
  titleAccent: {
    background: "linear-gradient(90deg,#c4a064,#f0d090,#c4a064)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    animation: "gradientShift 4s ease infinite",
  },
  titleMuted: { color: "rgba(232,220,200,0.5)" },

  subtitle: {
    fontSize: "0.95rem",
    color: "rgba(232,220,200,.5)",
    lineHeight: 1.8,
    fontWeight: 300,
    textAlign: "center",
  },

  /* Info grid — stretches full width */
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    width: "100%",
  },
  infoCard: {
    background: gold(0.05),
    border: `1px solid ${gold(0.14)}`,
    borderRadius: "16px",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    textAlign: "center",
  },
  infoIcon: { fontSize: "1.8rem" },
  infoLabel: {
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: gold(0.5),
    fontWeight: 600,
  },
  infoVal: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#e8dcc8",
    fontFamily: "'Cinzel',serif",
  },

  /* Two-column main row */
  mainRow: {
    display: "flex",
    gap: "28px",
    width: "100%",
    alignItems: "stretch",
  },

  leftCol: {
    flex: "1 1 0",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    minWidth: 0,
  },

  rightCol: {
    flex: "1 1 0",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },

  /* drop zone */
  dropzone: {
    width: "100%",
    flex: 1,
    border: `1.5px dashed ${gold(0.3)}`,
    borderRadius: "18px",
    background: gold(0.03),
    minHeight: "280px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    overflow: "hidden",
    position: "relative",
  },
  dropzoneActive: {
    borderColor: gold(0.85),
    background: gold(0.08),
    transform: "scale(1.01)",
  },
  dropzoneWithImage: {
    border: `1.5px solid ${gold(0.4)}`,
    minHeight: "340px",
  },
  dropContent: { textAlign: "center", padding: "36px 24px" },
  uploadIconWrap: {
    color: gold(0.5), marginBottom: "14px",
    display: "flex", justifyContent: "center",
  },
  dropText: {
    fontSize: "1rem", fontWeight: 600,
    color: "rgba(232,220,200,.8)", marginBottom: "6px",
  },
  dropSubText: {
    fontSize: "0.78rem", color: "rgba(232,220,200,.35)", letterSpacing: "0.05em",
  },
  previewWrapper: { position: "relative", width: "100%", height: "340px" },
  previewImg: { width: "100%", height: "100%", objectFit: "contain", borderRadius: "16px" },
  previewHint: {
    position: "absolute", bottom: "12px",
    left: "50%", transform: "translateX(-50%)",
    fontSize: "0.75rem", color: gold(0.6),
    background: "rgba(10,10,15,.7)", padding: "4px 16px",
    borderRadius: "100px", backdropFilter: "blur(6px)", whiteSpace: "nowrap",
  },

  errorBox: {
    width: "100%",
    background: "rgba(255,80,80,.1)",
    border: "1px solid rgba(255,80,80,.3)",
    borderRadius: "12px", padding: "12px 18px",
    fontSize: "0.85rem", color: "#ff9090",
    display: "flex", gap: "10px", alignItems: "center",
  },

  /* button — full width of left col */
  btn: {
    width: "100%",
    background: "linear-gradient(135deg,#c4a064 0%,#e8c878 50%,#c4a064 100%)",
    backgroundSize: "200% auto",
    border: "none", borderRadius: "14px",
    padding: "17px 32px",
    fontSize: "0.92rem", fontFamily: "'Raleway',sans-serif",
    fontWeight: 700, letterSpacing: "0.12em",
    color: "#0a0a0f", cursor: "pointer",
    transition: "all 0.3s ease",
    animation: "pulseGlow 3s ease infinite",
    textTransform: "uppercase",
  },
  btnLoading: { background: gold(0.4), animation: "none", cursor: "wait" },
  btnDisabled: { opacity: 0.38, cursor: "not-allowed", animation: "none" },
  btnInner: {
    display: "flex", alignItems: "center",
    justifyContent: "center", gap: "10px",
  },
  spinner: {
    width: "16px", height: "16px",
    border: "2px solid rgba(10,10,15,.3)",
    borderTop: "2px solid #0a0a0f",
    borderRadius: "50%", display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },

  /* empty state */
  emptyCard: {
    flex: 1,
    border: `1.5px dashed ${gold(0.15)}`,
    borderRadius: "22px",
    background: gold(0.02),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    padding: "48px 24px",
    minHeight: "360px",
  },
  emptyGlyph: {
    fontFamily: "'Cinzel',serif",
    fontSize: "5rem",
    fontWeight: 900,
    color: gold(0.15),
    animation: "emptyPulse 3s ease infinite",
    lineHeight: 1,
  },
  emptyText: {
    fontSize: "0.95rem",
    color: "rgba(232,220,200,.4)",
    fontWeight: 600,
    letterSpacing: "0.04em",
  },
  emptySubText: {
    fontSize: "0.78rem",
    color: "rgba(232,220,200,.2)",
  },

  /* result */
  resultCard: {
    flex: 1,
    background: "linear-gradient(160deg,rgba(196,160,100,.08) 0%,rgba(196,160,100,.03) 100%)",
    border: `1px solid ${gold(0.25)}`,
    borderRadius: "22px", padding: "36px 40px",
    position: "relative", overflow: "hidden",
    animation: "resultReveal 0.55s cubic-bezier(.34,1.56,.64,1) both",
    display: "flex",
    flexDirection: "column",
  },
  resultGlow: {
    position: "absolute", top: "-50px", right: "-50px",
    width: "200px", height: "200px",
    background: "radial-gradient(circle,rgba(196,160,100,.14) 0%,transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  resultTopRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "14px",
  },
  resultLabel: {
    fontSize: "0.7rem", letterSpacing: "0.2em",
    textTransform: "uppercase", color: gold(0.65), fontWeight: 600,
  },
  confBadge: {
    background: gold(0.14), border: `1px solid ${gold(0.3)}`,
    borderRadius: "100px", padding: "3px 14px",
    fontSize: "0.72rem", color: "#c4a064", fontWeight: 600,
  },
  resultNumeral: {
    fontFamily: "'Cinzel',serif",
    fontSize: "clamp(3rem, 7vw, 6rem)",
    fontWeight: 900,
    background: "linear-gradient(135deg,#c4a064,#f0d090,#c4a064)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    animation: "gradientShift 3s ease infinite",
    letterSpacing: "0.06em", marginBottom: "20px",
    lineHeight: 1, textAlign: "center",
  },
  confBar: {
    height: "4px", background: gold(0.15),
    borderRadius: "100px", overflow: "hidden", marginBottom: "28px",
  },
  confFill: {
    height: "100%",
    background: "linear-gradient(90deg,#c4a064,#f0d090)",
    borderRadius: "100px", animation: "fillBar 1s ease both",
  },
  top3Title: {
    fontSize: "0.68rem", letterSpacing: "0.16em",
    textTransform: "uppercase", color: gold(0.45),
    marginBottom: "14px", fontWeight: 600,
  },
  top3List: { display: "flex", flexDirection: "column", gap: "10px" },
  top3Row: {
    display: "grid",
    gridTemplateColumns: "32px 80px 1fr 60px",
    alignItems: "center", gap: "12px",
    padding: "12px 18px",
    background: gold(0.05), borderRadius: "10px",
    border: `1px solid ${gold(0.1)}`,
  },
  top3RowFirst: { background: gold(0.1), border: `1px solid ${gold(0.25)}` },
  top3Rank: { fontSize: "0.7rem", color: gold(0.5), fontWeight: 700 },
  top3Label: { fontFamily: "'Cinzel',serif", fontSize: "1rem", fontWeight: 700, color: "#e8dcc8" },
  top3BarWrap: { height: "3px", background: gold(0.15), borderRadius: "100px", overflow: "hidden" },
  top3BarFill: {
    height: "100%", background: "linear-gradient(90deg,#c4a064,#f0d090)",
    borderRadius: "100px", animation: "fillBar 1.2s ease both",
  },
  top3Pct: { fontSize: "0.75rem", color: "#c4a064", fontWeight: 600, textAlign: "right" },

  footer: {
    fontSize: "0.7rem", color: "rgba(232,220,200,.18)",
    letterSpacing: "0.08em", textAlign: "center", marginTop: "8px",
  },
};