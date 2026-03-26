import Image from "next/image";

// TODO: Convert SeverlLogo.png to SVG for better performance and scalability.
export default function SeverlLogo() {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 12,
        background: "rgba(0,0,0,0.6)",
        border: "1px solid rgba(110,231,183,0.20)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image src="/SeverlLogo.png" alt="Severl" width={28} height={28} priority />
    </div>
  );
}
