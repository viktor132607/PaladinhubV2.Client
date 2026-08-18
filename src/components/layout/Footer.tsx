import { Link } from "@/router/nextCompat";

export default function Footer() {
  return (
    <footer className="mt-20 w-full border-t border-[#e5e5e5] py-3 text-center text-[#6c757d]">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-center gap-2 px-5">
        <p className="m-0 whitespace-nowrap leading-[60px]">
          © {new Date().getFullYear()} - PaladinHub | Made with 💛 for WoW Paladins
        </p>

        <nav
          aria-label="Footer navigation"
          className="flex items-center justify-center gap-5"
        >
          <Link
            to="/Home/Privacy"
            className="text-[#FFD700] no-underline transition-colors duration-300 hover:text-[#FFC300]"
          >
            Privacy
          </Link>

          <Link
            to="/Discussions/Index"
            className="text-[#FFD700] no-underline transition-colors duration-300 hover:text-[#FFC300]"
          >
            Discussion
          </Link>

          <Link
            to="/Merchandise/Merchandise"
            className="text-[#FFD700] no-underline transition-colors duration-300 hover:text-[#FFC300]"
          >
            Merchandise
          </Link>
        </nav>
      </div>
    </footer>
  );
}