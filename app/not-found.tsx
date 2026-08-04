import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "70vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "6rem", fontWeight: "bold", color: "#23A6F0", marginBottom: "1rem" }}>
        404
      </h1>
      <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
        الصفحة غير موجودة
      </h2>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
      </p>
      <Link 
        href="/" 
        style={{
          backgroundColor: "#23A6F0",
          color: "white",
          padding: "0.5rem 1.5rem",
          borderRadius: "0.375rem",
          textDecoration: "none"
        }}
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}