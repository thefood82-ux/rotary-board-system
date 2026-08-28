import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">R</span>
          <span className="brand-text">
            새송탄로타리클럽
            <strong>26-27년도 이사회</strong>
          </span>
        </Link>
      </div>
    </header>
  );
}
