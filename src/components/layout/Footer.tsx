export default function Footer() {
  return (
    <footer className="border-top footer text-muted text-center mt-5 py-3 ph-v1-footer">
      <div className="container">
        © {new Date().getFullYear()} - PaladinHub | Made with 💛 for WoW Paladins
      </div>
    </footer>
  );
}
